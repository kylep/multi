package controller

import (
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kylep/multi/infra/ai-agents/agent-controller/pkg/crd"
	"github.com/kylep/multi/infra/ai-agents/agent-controller/pkg/discord"
	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/robfig/cron/v3"
)

// writeAgents are agents that modify the repo and get per-branch PVCs.
var writeAgents = map[string]bool{
	"publisher":  true,
	"qa":         true,
	"journalist": true,
}

// Controller watches AgentTask CRDs and creates Jobs.
type Controller struct {
	clientset        kubernetes.Interface
	crdClient        rest.Interface
	namespace        string
	runtimeImage     string
	discord          *discord.Notifier
	branchHostPath   string
	branchPVCSize    string
	githubAppID      string
	githubAppKey     []byte
	githubInstallID  string
}

// New creates a new Controller.
func New(clientset kubernetes.Interface, crdClient rest.Interface, namespace, runtimeImage string, disc *discord.Notifier, branchHostPath, branchPVCSize, githubAppID, githubInstallID string, githubAppKey []byte) *Controller {
	return &Controller{
		clientset:       clientset,
		crdClient:       crdClient,
		namespace:       namespace,
		runtimeImage:    runtimeImage,
		discord:         disc,
		branchHostPath:  branchHostPath,
		branchPVCSize:   branchPVCSize,
		githubAppID:     githubAppID,
		githubAppKey:    githubAppKey,
		githubInstallID: githubInstallID,
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

	c.cleanupBranchPVCs(ctx)
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
		if errors.IsNotFound(err) {
			log.Printf("Job %s no longer exists for %s, marking as Failed", task.Status.JobName, task.Name)
			c.updateStatus(ctx, task, "Failed", task.Status.JobName)
			return
		}
		log.Printf("Failed to get job %s: %v", task.Status.JobName, err)
		return
	}

	runID := job.Annotations["agents.kyle.pericak.com/run-id"]

	for _, cond := range job.Status.Conditions {
		if cond.Type == batchv1.JobComplete && cond.Status == corev1.ConditionTrue {
			log.Printf("Job %s completed for %s", task.Status.JobName, task.Name)
			if err := c.discord.Send(fmt.Sprintf("✓ `%s` | agent=**%s** | **completed**", runID, task.Spec.Agent)); err != nil {
				log.Printf("Discord log failed: %v", err)
			}
			c.updateStatus(ctx, task, "Succeeded", task.Status.JobName)
			return
		}
		if cond.Type == batchv1.JobFailed && cond.Status == corev1.ConditionTrue {
			log.Printf("Job %s failed for %s", task.Status.JobName, task.Name)
			if err := c.discord.Send(fmt.Sprintf("✗ `%s` | agent=**%s** | **failed**", runID, task.Spec.Agent)); err != nil {
				log.Printf("Discord log failed: %v", err)
			}
			c.updateStatus(ctx, task, "Failed", task.Status.JobName)
			return
		}
	}
}

func boolPtr(b bool) *bool { return &b }
func int64Ptr(i int64) *int64  { return &i }

// createBranchPVC creates a dedicated PV + PVC for a write job.
func (c *Controller) createBranchPVC(ctx context.Context, jobName string) (string, error) {
	pvName := "agent-ws-" + jobName
	pvcName := pvName
	size := resource.MustParse(c.branchPVCSize)
	hostPath := c.branchHostPath + "/" + jobName

	pv := &corev1.PersistentVolume{
		ObjectMeta: metav1.ObjectMeta{
			Name: pvName,
			Labels: map[string]string{
				"agents.kyle.pericak.com/workspace-type": "branch",
				"agents.kyle.pericak.com/job":            jobName,
			},
		},
		Spec: corev1.PersistentVolumeSpec{
			Capacity: corev1.ResourceList{
				corev1.ResourceStorage: size,
			},
			AccessModes: []corev1.PersistentVolumeAccessMode{corev1.ReadWriteOnce},
			PersistentVolumeSource: corev1.PersistentVolumeSource{
				HostPath: &corev1.HostPathVolumeSource{
					Path: hostPath,
					Type: hostPathTypePtr(corev1.HostPathDirectoryOrCreate),
				},
			},
			StorageClassName:              "",
			PersistentVolumeReclaimPolicy: corev1.PersistentVolumeReclaimRetain,
		},
	}

	_, err := c.clientset.CoreV1().PersistentVolumes().Create(ctx, pv, metav1.CreateOptions{})
	if err != nil {
		return "", fmt.Errorf("creating PV %s: %w", pvName, err)
	}

	pvc := &corev1.PersistentVolumeClaim{
		ObjectMeta: metav1.ObjectMeta{
			Name:      pvcName,
			Namespace: c.namespace,
			Labels: map[string]string{
				"agents.kyle.pericak.com/workspace-type": "branch",
				"agents.kyle.pericak.com/job":            jobName,
			},
		},
		Spec: corev1.PersistentVolumeClaimSpec{
			AccessModes: []corev1.PersistentVolumeAccessMode{corev1.ReadWriteOnce},
			Resources: corev1.VolumeResourceRequirements{
				Requests: corev1.ResourceList{
					corev1.ResourceStorage: size,
				},
			},
			StorageClassName: strPtr(""),
			VolumeName:       pvName,
		},
	}

	_, err = c.clientset.CoreV1().PersistentVolumeClaims(c.namespace).Create(ctx, pvc, metav1.CreateOptions{})
	if err != nil {
		// Clean up PV if PVC creation fails
		_ = c.clientset.CoreV1().PersistentVolumes().Delete(ctx, pvName, metav1.DeleteOptions{})
		return "", fmt.Errorf("creating PVC %s: %w", pvcName, err)
	}

	log.Printf("Created branch PV/PVC %s for job %s", pvName, jobName)
	return pvcName, nil
}

func hostPathTypePtr(t corev1.HostPathType) *corev1.HostPathType { return &t }
func strPtr(s string) *string                                     { return &s }

// cleanupBranchPVCs deletes PV/PVC pairs for completed or failed jobs.
func (c *Controller) cleanupBranchPVCs(ctx context.Context) {
	selector := labels.Set{"agents.kyle.pericak.com/workspace-type": "branch"}.AsSelector()
	pvcList, err := c.clientset.CoreV1().PersistentVolumeClaims(c.namespace).List(ctx, metav1.ListOptions{
		LabelSelector: selector.String(),
	})
	if err != nil {
		log.Printf("Failed to list branch PVCs: %v", err)
		return
	}

	for _, pvc := range pvcList.Items {
		jobName := pvc.Labels["agents.kyle.pericak.com/job"]
		if jobName == "" {
			continue
		}

		job, err := c.clientset.BatchV1().Jobs(c.namespace).Get(ctx, jobName, metav1.GetOptions{})
		if errors.IsNotFound(err) {
			c.deleteBranchPVC(ctx, pvc.Name)
			continue
		}
		if err != nil {
			continue
		}

		for _, cond := range job.Status.Conditions {
			if (cond.Type == batchv1.JobComplete || cond.Type == batchv1.JobFailed) && cond.Status == corev1.ConditionTrue {
				c.deleteBranchPVC(ctx, pvc.Name)
				break
			}
		}
	}
}

// deleteBranchPVC deletes a PVC and its backing PV.
func (c *Controller) deleteBranchPVC(ctx context.Context, name string) {
	err := c.clientset.CoreV1().PersistentVolumeClaims(c.namespace).Delete(ctx, name, metav1.DeleteOptions{})
	if err != nil && !errors.IsNotFound(err) {
		log.Printf("Failed to delete PVC %s: %v", name, err)
	}

	err = c.clientset.CoreV1().PersistentVolumes().Delete(ctx, name, metav1.DeleteOptions{})
	if err != nil && !errors.IsNotFound(err) {
		log.Printf("Failed to delete PV %s: %v", name, err)
	}

	log.Printf("Cleaned up branch PV/PVC %s", name)
}

// getInstallationToken generates a GitHub App installation token.
func (c *Controller) getInstallationToken() (string, error) {
	if len(c.githubAppKey) == 0 || c.githubAppID == "" || c.githubInstallID == "" {
		return "", fmt.Errorf("GitHub App credentials not configured")
	}

	// Parse PEM private key
	block, _ := pem.Decode(c.githubAppKey)
	if block == nil {
		return "", fmt.Errorf("failed to decode PEM block")
	}

	var key *rsa.PrivateKey
	if k, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		key = k
	} else if k, err := x509.ParsePKCS8PrivateKey(block.Bytes); err == nil {
		var ok bool
		key, ok = k.(*rsa.PrivateKey)
		if !ok {
			return "", fmt.Errorf("PKCS8 key is not RSA")
		}
	} else {
		return "", fmt.Errorf("parsing private key: not PKCS1 or PKCS8")
	}

	// Build JWT
	now := time.Now()
	header := base64URLEncode([]byte(`{"alg":"RS256","typ":"JWT"}`))
	claims := fmt.Sprintf(`{"iat":%d,"exp":%d,"iss":"%s"}`, now.Add(-60*time.Second).Unix(), now.Add(10*time.Minute).Unix(), c.githubAppID)
	payload := base64URLEncode([]byte(claims))
	signingInput := header + "." + payload

	hashed := sha256.Sum256([]byte(signingInput))
	sig, err := rsa.SignPKCS1v15(rand.Reader, key, crypto.SHA256, hashed[:])
	if err != nil {
		return "", fmt.Errorf("signing JWT: %w", err)
	}
	jwt := signingInput + "." + base64URLEncode(sig)

	// Request installation token
	url := fmt.Sprintf("https://api.github.com/app/installations/%s/access_tokens", c.githubInstallID)
	req, _ := http.NewRequest("POST", url, nil)
	req.Header.Set("Authorization", "Bearer "+jwt)
	req.Header.Set("Accept", "application/vnd.github+json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("requesting installation token: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 201 {
		return "", fmt.Errorf("GitHub API returned %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("parsing token response: %w", err)
	}

	return result.Token, nil
}

// base64URLEncode encodes bytes to base64url without padding.
func base64URLEncode(data []byte) string {
	return base64.RawURLEncoding.EncodeToString(data)
}

const vaultTemplate = `{{- with secret "secret/ai-agents/anthropic" }}
export CLAUDE_CODE_OAUTH_TOKEN="{{ .Data.data.claude_oauth_token }}"
{{ end -}}
{{- with secret "secret/ai-agents/discord" }}
export DISCORD_BOT_TOKEN="{{ .Data.data.discord_bot_token }}"
export DISCORD_GUILD_ID="{{ .Data.data.discord_guild_id }}"
export DISCORD_LOG_CHANNEL_ID="{{ .Data.data.discord_log_channel_id }}"
{{ end -}}
{{- with secret "secret/ai-agents/pai" }}
export PAI_DISCORD_BOT_TOKEN="{{ .Data.data.discord_bot_token }}"
{{ end -}}
{{- with secret "secret/ai-agents/webhook" }}
export AI_WEBHOOK_TOKEN="{{ .Data.data.webhook_token }}"
{{ end -}}`

func (c *Controller) createJob(ctx context.Context, task *crd.AgentTask) error {
	jobName := fmt.Sprintf("%s-%d", task.Name, time.Now().Unix())
	runID := uuid.New().String()[:8]
	isPublisher := task.Spec.Agent == "publisher"
	isWriteAgent := writeAgents[task.Spec.Agent] && !task.Spec.ReadOnly

	cmd := c.buildCommand(task)

	// Log to Discord #log
	promptPreview := task.Spec.Prompt
	if len(promptPreview) > 100 {
		promptPreview = promptPreview[:100] + "..."
	}
	if err := c.discord.Send(fmt.Sprintf("▶ `%s` | agent=**%s** | job=`%s`\n> %s", runID, task.Spec.Agent, jobName, promptPreview)); err != nil {
		log.Printf("Discord log failed: %v", err)
	}

	// Determine workspace volume: emptyDir for write agents (fresh per-pod, writable by UID 1001),
	// shared PVC for read-only agents (persistent across runs).
	// Write agents push their work to GitHub before the pod terminates, so workspace loss is safe.
	pvcName := "agent-workspace"
	var workspaceVolume corev1.Volume
	if isWriteAgent {
		workspaceVolume = corev1.Volume{
			Name: "workspace",
			VolumeSource: corev1.VolumeSource{
				EmptyDir: &corev1.EmptyDirVolumeSource{},
			},
		}
	} else {
		workspaceVolume = corev1.Volume{
			Name: "workspace",
			VolumeSource: corev1.VolumeSource{
				PersistentVolumeClaim: &corev1.PersistentVolumeClaimVolumeSource{
					ClaimName: pvcName,
				},
			},
		}
	}

	// Generate GitHub App installation token for write agents
	var githubToken string
	if isWriteAgent && len(c.githubAppKey) > 0 {
		var err error
		githubToken, err = c.getInstallationToken()
		if err != nil {
			log.Printf("WARNING: Failed to get GitHub installation token: %v", err)
		}
	}

	// UID: ai-agent-runtime:0.4 uses pwuser (1001) from the Playwright base image
	chownUID := "1001"

	// Build git-sync args: write agents clone fresh into emptyDir workspace;
	// read-only agents fetch/reset on the shared PVC.
	// Note: git-sync runs as an init container BEFORE vault-agent-init,
	// so it cannot source /vault/secrets/config. Use hardcoded public URL
	// for read-only agents; write agents get a GitHub App token URL.
	var gitSyncArgs string
	cloneURL := "https://github.com/kylep/multi.git"
	if githubToken != "" {
		cloneURL = fmt.Sprintf("https://x-access-token:%s@github.com/kylep/multi.git", githubToken)
	}
	if isWriteAgent {
		// Fresh clone into writable emptyDir workspace
		gitSyncArgs = fmt.Sprintf(
			"git clone -b ${REPO_BRANCH:-main} %s /workspace/repo; chown -R %s:%s /workspace/repo",
			cloneURL, chownUID, chownUID,
		)
	} else {
		// Shared PVC: fetch and reset (owned by UID 1001, no safe.directory needed)
		gitSyncArgs = fmt.Sprintf(
			"{ cd /workspace/repo && git fetch origin && git checkout ${REPO_BRANCH:-main} && git reset --hard origin/${REPO_BRANCH:-main} || git clone -b ${REPO_BRANCH:-main} %s /workspace/repo; }; chown -R %s:%s /workspace/repo",
			cloneURL, chownUID, chownUID,
		)
	}

	volumes := []corev1.Volume{workspaceVolume}
	volumeMounts := []corev1.VolumeMount{
		{Name: "workspace", MountPath: "/workspace"},
	}

	// Publisher needs /dev/shm for Chromium
	if isPublisher {
		shmSize := resource.MustParse("1Gi")
		volumes = append(volumes, corev1.Volume{
			Name: "dshm",
			VolumeSource: corev1.VolumeSource{
				EmptyDir: &corev1.EmptyDirVolumeSource{
					Medium:    corev1.StorageMediumMemory,
					SizeLimit: &shmSize,
				},
			},
		})
		volumeMounts = append(volumeMounts, corev1.VolumeMount{
			Name: "dshm", MountPath: "/dev/shm",
		})
	}

	// Build env vars for the agent container
	envVars := []corev1.EnvVar{
		{Name: "RUN_ID", Value: runID},
	}
	if githubToken != "" {
		envVars = append(envVars, corev1.EnvVar{Name: "GITHUB_TOKEN", Value: githubToken})
	}

	backoffLimit := int32(0)
	ttl := int32(3600)
	activeDeadline := int64(1800) // 30 min hard ceiling
	job := &batchv1.Job{
		ObjectMeta: metav1.ObjectMeta{
			Name:      jobName,
			Namespace: c.namespace,
			Labels: map[string]string{
				"app.kubernetes.io/managed-by":  "agent-controller",
				"agents.kyle.pericak.com/task":  task.Name,
				"agents.kyle.pericak.com/agent": task.Spec.Agent,
			},
			Annotations: map[string]string{
				"agents.kyle.pericak.com/run-id": runID,
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
			ActiveDeadlineSeconds:   &activeDeadline,
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Annotations: map[string]string{
						"vault.hashicorp.com/agent-inject":                 "true",
						"vault.hashicorp.com/agent-pre-populate-only":      "true",
						"vault.hashicorp.com/role":                         "ai-agents",
						"vault.hashicorp.com/agent-inject-secret-config":   "secret/ai-agents/anthropic",
						"vault.hashicorp.com/agent-inject-template-config": vaultTemplate,
					},
				},
				Spec: corev1.PodSpec{
					RestartPolicy:         corev1.RestartPolicyNever,
					ServiceAccountName:    "agent-controller",
					ShareProcessNamespace: boolPtr(isPublisher),
					SecurityContext: &corev1.PodSecurityContext{
						RunAsNonRoot: boolPtr(true),
						RunAsUser:    int64Ptr(1001),
						FSGroup:      int64Ptr(1001),
						SeccompProfile: &corev1.SeccompProfile{
							Type: corev1.SeccompProfileTypeRuntimeDefault,
						},
					},
					InitContainers: []corev1.Container{
						{
							Name:    "git-sync",
							Image:   "alpine/git:v2.52.0",
							Command: []string{"sh", "-c"},
							Args:    []string{gitSyncArgs},
							VolumeMounts: []corev1.VolumeMount{
								{Name: "workspace", MountPath: "/workspace"},
							},
							SecurityContext: &corev1.SecurityContext{
								AllowPrivilegeEscalation: boolPtr(false),
								Capabilities: &corev1.Capabilities{
									Drop: []corev1.Capability{"ALL"},
								},
							},
							Resources: corev1.ResourceRequirements{
								Requests: corev1.ResourceList{
									corev1.ResourceCPU:    resource.MustParse("50m"),
									corev1.ResourceMemory: resource.MustParse("64Mi"),
								},
								Limits: corev1.ResourceList{
									corev1.ResourceCPU:    resource.MustParse("100m"),
									corev1.ResourceMemory: resource.MustParse("128Mi"),
								},
							},
						},
					},
					Containers: []corev1.Container{
						{
							Name:            "agent",
							Image:           c.runtimeImage,
							ImagePullPolicy: corev1.PullAlways,
							Command:         []string{"sh", "-c"},
							Args:            []string{cmd},
							Env:             envVars,
							VolumeMounts: volumeMounts,
							WorkingDir:   "/workspace/repo",
							SecurityContext: &corev1.SecurityContext{
								AllowPrivilegeEscalation: boolPtr(false),
								Capabilities: &corev1.Capabilities{
									Drop: []corev1.Capability{"ALL"},
								},
							},
							Resources: corev1.ResourceRequirements{
								Requests: corev1.ResourceList{
									corev1.ResourceCPU:    resource.MustParse("250m"),
									corev1.ResourceMemory: resource.MustParse("512Mi"),
								},
								Limits: corev1.ResourceList{
									corev1.ResourceCPU:    resource.MustParse("1000m"),
									corev1.ResourceMemory: resource.MustParse("2Gi"),
								},
							},
						},
					},
					Volumes: volumes,
				},
			},
		},
	}

	_, err := c.clientset.BatchV1().Jobs(c.namespace).Create(ctx, job, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("creating job: %w", err)
	}

	workspace := "emptyDir"
	if !isWriteAgent {
		workspace = "pvc:" + pvcName
	}
	log.Printf("Created job %s for task %s (agent=%s, runtime=%s, workspace=%s)",
		jobName, task.Name, task.Spec.Agent, task.Spec.Runtime, workspace)
	c.updateStatus(ctx, task, "Running", jobName)
	return nil
}

func (c *Controller) buildCommand(task *crd.AgentTask) string {
	runtime := task.Spec.Runtime
	if runtime == "" {
		runtime = "claude"
	}

	escapeShellArg := func(s string) string {
		return strings.ReplaceAll(s, "'", "'\\''")
	}
	escapedAgent := escapeShellArg(task.Spec.Agent)

	switch runtime {
	case "opencode":
		escapedPrompt := escapeShellArg(task.Spec.Prompt)
		return fmt.Sprintf(`. /vault/secrets/config && opencode -a '%s' -p '%s'`, escapedAgent, escapedPrompt)
	default:
		// Write MCP config and run Claude Code.
		// Env vars (DISCORD_BOT_TOKEN etc.) are sourced from /vault/secrets/config.
		escapedPrompt := escapeShellArg(task.Spec.Prompt)

		if task.Spec.Agent == "publisher" {
			// Publisher uses entrypoint script for branch lifecycle, git push, PR, Discord.
			// MCP config includes Playwright for QA subagent browser verification.
			mcpConfig := `printf '{"mcpServers":{"discord":{"type":"stdio","command":"python3","args":["apps/mcp-servers/discord/server.py"]},"playwright":{"type":"stdio","command":"npx","args":["-y","@playwright/mcp@latest","--headless"]}}}' > /tmp/mcp.json`
			return fmt.Sprintf(`. /vault/secrets/config && %s && apps/blog/bin/run-publisher.sh '%s'`, mcpConfig, escapedPrompt)
		}

		if task.Spec.Agent == "pai" {
			// Pai uses its own Discord bot identity (pai-discord MCP server).
			// Override DISCORD_BOT_TOKEN with PAI_DISCORD_BOT_TOKEN so the
			// MCP subprocess uses Pai's token instead of Journalist's.
			mcpConfig := `export DISCORD_BOT_TOKEN="$PAI_DISCORD_BOT_TOKEN" && printf '{"mcpServers":{"pai-discord":{"type":"stdio","command":"python3","args":["apps/mcp-servers/discord/server.py"]}}}' > /tmp/mcp.json`
			cmd := fmt.Sprintf(`. /vault/secrets/config && %s && claude --mcp-config /tmp/mcp.json --agent '%s' -p '%s' --output-format stream-json --verbose --include-partial-messages`, mcpConfig, escapedAgent, escapedPrompt)
			if task.Spec.AllowedTools != "" {
				tools := strings.Split(task.Spec.AllowedTools, ",")
				for _, tool := range tools {
					cmd += fmt.Sprintf(` --allowedTools '%s'`, escapeShellArg(strings.TrimSpace(tool)))
				}
			}
			return cmd
		}

		// Default: journalist and other agents
		// Discord MCP for posting notifications; agents use WebSearch for news lookup.
		mcpConfig := `printf '{"mcpServers":{"discord":{"type":"stdio","command":"python3","args":["apps/mcp-servers/discord/server.py"]}}}' > /tmp/mcp.json`
		cmd := fmt.Sprintf(`. /vault/secrets/config && %s && claude --mcp-config /tmp/mcp.json --agent '%s' -p '%s' --output-format stream-json --verbose --include-partial-messages`, mcpConfig, escapedAgent, escapedPrompt)
		if task.Spec.AllowedTools != "" {
			tools := strings.Split(task.Spec.AllowedTools, ",")
			for _, tool := range tools {
				cmd += fmt.Sprintf(` --allowedTools '%s'`, escapeShellArg(strings.TrimSpace(tool)))
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
