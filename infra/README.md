# Infrastructure

Everything here runs on or supports the Rancher Desktop cluster on the
Mac laptop, except pai-nuc which is its own machine.

## [pai-nuc](pai-nuc/)
Single-node k3s on the pai Intel NUC (SSH bootstrap, auto-deploy manifests).

## [local-k8s](local-k8s/)
Bootstrap for the local cluster (Vault etc.).

## [ai-agents](ai-agents/)
Agent workloads: the `ai-agent-runtime` image, cronjob Helm charts
(journalist, pai-morning), and the Go agent-controller.

## [ai-security-toolkit-1](ai-security-toolkit-1/)
semgrep + trivy + gitleaks scan image used by this repo's pre-PR checks.

Retired infra (aws, mac-setup, openclaw-k8s, ai-lint-toolkit,
containers) moved to
[kylep/multi-sandbox](https://github.com/kylep/multi-sandbox).
