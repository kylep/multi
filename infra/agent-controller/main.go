package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/kylep/multi/infra/agent-controller/pkg/controller"
	"github.com/kylep/multi/infra/agent-controller/pkg/crd"
	"github.com/kylep/multi/infra/agent-controller/pkg/discord"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

func main() {
	namespace := os.Getenv("NAMESPACE")
	if namespace == "" {
		namespace = "ai-agents"
	}

	config, err := rest.InClusterConfig()
	if err != nil {
		kubeconfig := os.Getenv("KUBECONFIG")
		if kubeconfig == "" {
			kubeconfig = os.Getenv("HOME") + "/.kube/config"
		}
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			log.Fatalf("Failed to get kubeconfig: %v", err)
		}
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Fatalf("Failed to create clientset: %v", err)
	}

	scheme := runtime.NewScheme()
	if err := crd.AddToScheme(scheme); err != nil {
		log.Fatalf("Failed to add CRD scheme: %v", err)
	}

	crdConfig := *config
	crdConfig.ContentConfig.GroupVersion = &crd.SchemeGroupVersion
	crdConfig.APIPath = "/apis"
	crdConfig.NegotiatedSerializer = serializer.NewCodecFactory(scheme)

	crdClient, err := rest.RESTClientFor(&crdConfig)
	if err != nil {
		log.Fatalf("Failed to create CRD client: %v", err)
	}

	runtimeImage := os.Getenv("RUNTIME_IMAGE")
	if runtimeImage == "" {
		runtimeImage = "kpericak/ai-agent-runtime:0.4"
	}

	disc := discord.New(os.Getenv("DISCORD_BOT_TOKEN"), os.Getenv("DISCORD_LOG_CHANNEL_ID"))
	if disc.Enabled() {
		log.Println("Discord logging enabled")
	}

	branchHostPath := os.Getenv("BRANCH_HOSTPATH_BASE")
	if branchHostPath == "" {
		branchHostPath = "/tmp/agent-workspace/branches"
	}
	branchPVCSize := os.Getenv("BRANCH_PVC_SIZE")
	if branchPVCSize == "" {
		branchPVCSize = "5Gi"
	}

	githubAppID := os.Getenv("GITHUB_APP_ID")
	githubInstallID := os.Getenv("GITHUB_INSTALL_ID")
	githubAppKey := []byte(os.Getenv("GITHUB_APP_PRIVATE_KEY"))

	ctrl := controller.New(clientset, crdClient, namespace, runtimeImage, disc, branchHostPath, branchPVCSize, githubAppID, githubInstallID, githubAppKey)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle shutdown signals
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGTERM, syscall.SIGINT)
	go func() {
		<-sigCh
		log.Println("Received shutdown signal")
		cancel()
	}()

	// Start webhook server
	webhookToken := os.Getenv("AI_WEBHOOK_TOKEN")
	if webhookToken == "" {
		log.Println("WARNING: AI_WEBHOOK_TOKEN not set — webhook auth disabled")
	}
	go startWebhookServer(crdClient, namespace, webhookToken)

	// Run controller loop
	log.Printf("Starting agent controller in namespace %s", namespace)
	ctrl.Run(ctx)
}

type webhookRequest struct {
	Agent        string `json:"agent"`
	Prompt       string `json:"prompt"`
	Runtime      string `json:"runtime,omitempty"`
	AllowedTools string `json:"allowedTools,omitempty"`
}

func startWebhookServer(crdClient rest.Interface, namespace string, webhookToken string) {
	mux := http.NewServeMux()
	mux.HandleFunc("/webhook", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "POST only", http.StatusMethodNotAllowed)
			return
		}

		if webhookToken == "" {
			http.Error(w, "webhook auth not configured", http.StatusServiceUnavailable)
			return
		}
		auth := r.Header.Get("Authorization")
		if auth != "Bearer "+webhookToken {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1 MB limit
		var req webhookRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
			return
		}
		if req.Agent == "" || req.Prompt == "" {
			http.Error(w, "agent and prompt are required", http.StatusBadRequest)
			return
		}
		if req.Runtime == "" {
			req.Runtime = "claude"
		}

		task := &crd.AgentTask{
			TypeMeta: metav1.TypeMeta{
				APIVersion: crd.Group + "/" + crd.Version,
				Kind:       "AgentTask",
			},
			ObjectMeta: metav1.ObjectMeta{
				GenerateName: "webhook-" + req.Agent + "-",
				Namespace:    namespace,
			},
			Spec: crd.AgentTaskSpec{
				Agent:        req.Agent,
				Runtime:      req.Runtime,
				Prompt:       req.Prompt,
				Trigger:      "webhook",
				AllowedTools: req.AllowedTools,
			},
		}

		result := &crd.AgentTask{}
		err := crdClient.Post().
			Namespace(namespace).
			Resource("agenttasks").
			Body(task).
			Do(context.Background()).
			Into(result)
		if err != nil {
			http.Error(w, "failed to create AgentTask: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{
			"name":    result.Name,
			"message": fmt.Sprintf("AgentTask %s created", result.Name),
		})
	})

	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	server := &http.Server{
		Addr:              ":8080",
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	log.Println("Webhook server listening on :8080")
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Webhook server failed: %v", err)
	}
}
