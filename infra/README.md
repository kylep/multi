# Infrastructure

Everything here runs on or supports the Rancher Desktop cluster on the
Mac laptop.

## [local-k8s](local-k8s/)
Bootstrap for the local cluster (Vault etc.).

## [ai-agents](ai-agents/)
Agent workloads: the `ai-agent-runtime` image, cronjob Helm charts
(journalist, pai-morning), and the Go agent-controller.

## [ai-security-toolkit-1](ai-security-toolkit-1/)
semgrep + trivy + gitleaks scan image used by this repo's pre-PR checks.

## [containers](containers/)
Shared base image. Currently unused — kytrade's 2022 Dockerfiles were
its last consumer. Demotion candidate.

Retired infra (aws, mac-setup, openclaw-k8s, ai-lint-toolkit) moved to
[kylep/multi-sandbox](https://github.com/kylep/multi-sandbox).
