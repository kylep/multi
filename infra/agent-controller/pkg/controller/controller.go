package controller

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/kylep/multi/infra/agent-controller/pkg/crd"
	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/robfig/cron/v3"
)

// writeAgents are agents that modify the repo and must be serialized.
var writeAgents = map[string]bool{
	"publisher":  true,
	"qa":         true,
	"journalist": true,
}

// Controller watches AgentTask CRDs and creates Jobs.
type Controller struct {
	clientset    kubernetes.Interface
	crdClient    rest.Interface
	namespace    string
	runtimeImage string
}

// New creates a new Controller.
func New(clientset kubernetes.Interface, crdClient rest.Interface, namespace, runtimeImage string) *Controller {
	return &Controller{
		clientset:    clientset,
		crdClient:    crdClient,
		namespace:    namespace,
		runtimeImage: runtimeImage,
	}
}

// Run starts the reconcile loop. It runs until ctx is cancelled.
func (c *Controller) Run(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	// Run once immediately
	c.reconcileAll(ctx)

	for {
		select {
		case <-ctx.Done():
			log.Println("Controller shutting down")
			return
		case <-ticker.C:
			c.reconcileAll(ctx)
		}
	}
}

func (c *Controller) reconcileAll(ctx context.Context) {
	taskList := &crd.AgentTaskList{}
	err := c.crdClient.Get().
		Namespace(c.namespace).
		Resource("agenttasks").
		Do(ctx).
		Into(taskList)
	if err != nil {
		log.Printf("Failed to list AgentTasks: %v", err)
		return
	}

	for i := range taskList.Items {
		c.reconcile(ctx, &taskList.Items[i])
	}
}

func (c *Controller) reconcile(ctx context.Context, task *crd.AgentTask) {
	switch {
	case task.Spec.Trigger == "scheduled" && task.Spec.Schedule != "":
		c.reconcileScheduled(ctx, task)
	case task.Status.Phase == "" || task.Status.Phase == "Pending":
		c.reconcileManual(ctx, task)
	case task.Status.Phase == "Running":
		c.reconcileRunning(ctx, task)
	}
}

func (c *Controller) reconcileManual(ctx context.Context, task *crd.AgentTask) {
	if !c.canRunWrite(ctx, task) {
		log.Printf("Write agent %s blocked, another write job is running", task.Name)
		return
	}

	if err := c.createJob(ctx, task); err != nil {
		log.Printf("Failed to create job for %s: %v", task.Name, err)
		c.updateStatus(ctx, task, "Failed", "")
		return
	}
}

func (c *Controller) reconcileScheduled(ctx context.Context, task *crd.AgentTask) {
	parser := cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow)
	sched, err := parser.Parse(task.Spec.Schedule)
	if err != nil {
		log.Printf("Invalid cron expression for %s: %v", task.Name, err)
		return
	}

	// If currently running, check job status instead
	if task.Status.Phase == "Running" {
		c.reconcileRunning(ctx, task)
		return
	}

	var lastRun time.Time
	if task.Status.LastRunTime != nil {
		lastRun = task.Status.LastRunTime.Time
	} else {
		lastRun = task.CreationTimestamp.Time
	}

	nextRun := sched.Next(lastRun)
	if time.Now().Before(nextRun) {
		return
	}

	if !c.canRunWrite(ctx, task) {
		log.Printf("Scheduled write agent %s blocked, requeuing", task.Name)
		return
	}

	log.Printf("Schedule triggered for %s (next was %s)", task.Name, nextRun)
	if err := c.createJob(ctx, task); err != nil {
		log.Printf("Failed to create scheduled job for %s: %v", task.Name, err)
	}
}

func (c *Controller) reconcileRunning(ctx context.Context, task *crd.AgentTask) {
	if task.Status.JobName == "" {
		return
	}

	job, err := c.clientset.BatchV1().Jobs(c.namespace).Get(ctx, task.Status.JobName, metav1.GetOptions{})
	if err != nil {
		log.Printf("Failed to get job %s: %v", task.Status.JobName, err)
		return
	}

	for _, cond := range job.Status.Conditions {
		if cond.Type == batchv1.JobComplete && cond.Status == corev1.ConditionTrue {
			log.Printf("Job %s completed for %s", task.Status.JobName, task.Name)
			c.updateStatus(ctx, task, "Succeeded", task.Status.JobName)
			return
		}
		if cond.Type == batchv1.JobFailed && cond.Status == corev1.ConditionTrue {
			log.Printf("Job %s failed for %s", task.Status.JobName, task.Name)
			c.updateStatus(ctx, task, "Failed", task.Status.JobName)
			return
		}
	}
}

// canRunWrite checks if a write agent can run (no other write jobs active).
func (c *Controller) canRunWrite(ctx context.Context, task *crd.AgentTask) bool {
	if task.Spec.ReadOnly || !writeAgents[task.Spec.Agent] {
		return true
	}

	taskList := &crd.AgentTaskList{}
	err := c.crdClient.Get().
		Namespace(c.namespace).
		Resource("agenttasks").
		Do(ctx).
		Into(taskList)
	if err != nil {
		return false
	}

	for _, other := range taskList.Items {
		if other.Name == task.Name {
			continue
		}
		if other.Status.Phase == "Running" && writeAgents[other.Spec.Agent] && !other.Spec.ReadOnly {
			return false
		}
	}
	return true
}

func (c *Controller) createJob(ctx context.Context, task *crd.AgentTask) error {
	jobName := fmt.Sprintf("%s-%d", task.Name, time.Now().Unix())

	cmd := c.buildCommand(task)

	backoffLimit := int32(0)
	ttl := int32(3600)
	job := &batchv1.Job{
		ObjectMeta: metav1.ObjectMeta{
			Name:      jobName,
			Namespace: c.namespace,
			Labels: map[string]string{
				"app.kubernetes.io/managed-by": "agent-controller",
				"agents.kyle.pericak.com/task": task.Name,
				"agents.kyle.pericak.com/agent": task.Spec.Agent,
			},
			OwnerReferences: []metav1.OwnerReference{
				{
					APIVersion: crd.Group + "/" + crd.Version,
					Kind:       "AgentTask",
					Name:       task.Name,
					UID:        task.UID,
				},
			},
		},
		Spec: batchv1.JobSpec{
			BackoffLimit:            &backoffLimit,
			TTLSecondsAfterFinished: &ttl,
			Template: corev1.PodTemplateSpec{
				Spec: corev1.PodSpec{
					RestartPolicy: corev1.RestartPolicyNever,
					InitContainers: []corev1.Container{
						{
							Name:    "git-sync",
							Image:   "alpine/git:latest",
							Command: []string{"sh", "-c"},
							Args:    []string{"cd /workspace/repo && git pull --ff-only || git clone $REPO_URL /workspace/repo"},
							EnvFrom: []corev1.EnvFromSource{
								{
									SecretRef: &corev1.SecretEnvSource{
										LocalObjectReference: corev1.LocalObjectReference{
											Name: "agent-secrets",
										},
									},
								},
							},
							VolumeMounts: []corev1.VolumeMount{
								{Name: "workspace", MountPath: "/workspace"},
							},
						},
					},
					Containers: []corev1.Container{
						{
							Name:    "agent",
							Image:   c.runtimeImage,
							Command: []string{"sh", "-c"},
							Args:    []string{cmd},
							EnvFrom: []corev1.EnvFromSource{
								{
									SecretRef: &corev1.SecretEnvSource{
										LocalObjectReference: corev1.LocalObjectReference{
											Name: "agent-secrets",
										},
									},
								},
							},
							VolumeMounts: []corev1.VolumeMount{
								{Name: "workspace", MountPath: "/workspace"},
							},
							WorkingDir: "/workspace/repo",
						},
					},
					Volumes: []corev1.Volume{
						{
							Name: "workspace",
							VolumeSource: corev1.VolumeSource{
								PersistentVolumeClaim: &corev1.PersistentVolumeClaimVolumeSource{
									ClaimName: "agent-workspace",
								},
							},
						},
					},
				},
			},
		},
	}

	_, err := c.clientset.BatchV1().Jobs(c.namespace).Create(ctx, job, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("creating job: %w", err)
	}

	log.Printf("Created job %s for task %s (agent=%s, runtime=%s)",
		jobName, task.Name, task.Spec.Agent, task.Spec.Runtime)
	c.updateStatus(ctx, task, "Running", jobName)
	return nil
}

func (c *Controller) buildCommand(task *crd.AgentTask) string {
	runtime := task.Spec.Runtime
	if runtime == "" {
		runtime = "claude"
	}

	switch runtime {
	case "opencode":
		return fmt.Sprintf(`opencode -a %s -p "%s"`, task.Spec.Agent, task.Spec.Prompt)
	default:
		cmd := fmt.Sprintf(`claude --agent %s -p "%s" --output-format text`, task.Spec.Agent, task.Spec.Prompt)
		if task.Spec.AllowedTools != "" {
			// --allowedTools takes space-separated quoted tool patterns
			tools := strings.Split(task.Spec.AllowedTools, ",")
			for _, tool := range tools {
				cmd += fmt.Sprintf(` --allowedTools '%s'`, strings.TrimSpace(tool))
			}
		}
		return cmd
	}
}

func (c *Controller) updateStatus(ctx context.Context, task *crd.AgentTask, phase, jobName string) {
	now := metav1.Now()
	task.Status.Phase = phase
	task.Status.LastRunTime = &now
	if jobName != "" {
		task.Status.JobName = jobName
	}

	err := c.crdClient.Put().
		Namespace(c.namespace).
		Resource("agenttasks").
		Name(task.Name).
		SubResource("status").
		Body(task).
		Do(ctx).
		Error()
	if err != nil {
		log.Printf("Failed to update status for %s: %v", task.Name, err)
	}
}
