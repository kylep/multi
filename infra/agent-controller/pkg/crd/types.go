package crd

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

const (
	Group   = "agents.kyle.pericak.com"
	Version = "v1alpha1"
)

var SchemeGroupVersion = schema.GroupVersion{Group: Group, Version: Version}

// AgentTaskSpec defines the desired state of an AgentTask.
type AgentTaskSpec struct {
	// Agent name: "publisher", "analyst", "researcher", etc.
	Agent string `json:"agent"`
	// Runtime: "claude" or "opencode". Default: "claude".
	Runtime string `json:"runtime,omitempty"`
	// Prompt is the -p argument passed to the agent CLI.
	Prompt string `json:"prompt"`
	// Schedule is a cron expression. Empty means one-shot.
	Schedule string `json:"schedule,omitempty"`
	// Trigger: "manual", "scheduled", or "webhook".
	Trigger string `json:"trigger,omitempty"`
	// ReadOnly indicates this agent only reads the repo (no git commits).
	ReadOnly bool `json:"readOnly,omitempty"`
	// AllowedTools is the comma-separated list for --allowedTools.
	AllowedTools string `json:"allowedTools,omitempty"`
}

// AgentTaskStatus defines the observed state of an AgentTask.
type AgentTaskStatus struct {
	// Phase: Pending, Running, Succeeded, Failed.
	Phase string `json:"phase,omitempty"`
	// LastRunTime is the timestamp of the last job creation.
	LastRunTime *metav1.Time `json:"lastRunTime,omitempty"`
	// JobName is the name of the most recent Job.
	JobName string `json:"jobName,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// AgentTask is the Schema for the agenttasks API.
type AgentTask struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   AgentTaskSpec   `json:"spec,omitempty"`
	Status AgentTaskStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
// AgentTaskList contains a list of AgentTask.
type AgentTaskList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []AgentTask `json:"items"`
}

// DeepCopyObject implements runtime.Object for AgentTask.
func (in *AgentTask) DeepCopyObject() runtime.Object {
	out := new(AgentTask)
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	out.TypeMeta = in.TypeMeta
	out.Spec = in.Spec
	out.Status = in.Status
	if in.Status.LastRunTime != nil {
		t := *in.Status.LastRunTime
		out.Status.LastRunTime = &t
	}
	return out
}

// DeepCopyObject implements runtime.Object for AgentTaskList.
func (in *AgentTaskList) DeepCopyObject() runtime.Object {
	out := new(AgentTaskList)
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		out.Items = make([]AgentTask, len(in.Items))
		for i := range in.Items {
			out.Items[i] = *in.Items[i].DeepCopyObject().(*AgentTask)
		}
	}
	return out
}

// SchemeBuilder registers the types with the scheme.
var (
	SchemeBuilder = runtime.NewSchemeBuilder(addKnownTypes)
	AddToScheme   = SchemeBuilder.AddToScheme
)

func addKnownTypes(scheme *runtime.Scheme) error {
	scheme.AddKnownTypes(SchemeGroupVersion,
		&AgentTask{},
		&AgentTaskList{},
	)
	metav1.AddToGroupVersion(scheme, SchemeGroupVersion)
	return nil
}
