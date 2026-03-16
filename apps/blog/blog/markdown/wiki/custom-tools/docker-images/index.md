---
title: "Docker Images"
summary: "Custom Docker images on Docker Hub: security toolkit, agent runtime, lint toolkit, and agent controller."
keywords:
  - docker
  - containers
related:
  - wiki/custom-tools/index.html
scope: "Index of custom Docker images published to Docker Hub under kpericak/."
last_verified: 2026-03-15
---

Custom Docker images published to Docker Hub under `kpericak/`.
Each bundles related tools into a single Alpine-based container.

## Images

| Image | Tag | Base | Purpose |
|-------|-----|------|---------|
| [ai-security-toolkit-1](/wiki/custom-tools/docker-images/ai-security-toolkit.html) | 0.2 | Alpine Python 3.12 | semgrep, trivy, gitleaks |
| [ai-agent-runtime](/wiki/custom-tools/docker-images/ai-agent-runtime.html) | 0.1 | Node 22 Alpine | Claude Code CLI, OpenCode |
| [ai-lint-toolkit](/wiki/custom-tools/docker-images/ai-lint-toolkit.html) | 0.1 | Alpine 3.21 | hadolint, tflint, ruff, biome |
| [agent-controller](/wiki/custom-tools/docker-images/agent-controller.html) | 0.1 | Alpine 3.21 | K8s controller for AgentTask CRDs |

## Versioning

Images use explicit semver tags (`0.1`, `0.2`). No `latest` tag.
Bump the tag when updating tool versions.
