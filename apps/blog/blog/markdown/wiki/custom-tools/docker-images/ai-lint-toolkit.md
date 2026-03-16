---
title: "AI Lint Toolkit"
summary: "Docker image bundling hadolint, tflint, ruff, and biome for multi-language linting."
keywords:
  - docker
  - linting
  - hadolint
  - tflint
  - ruff
  - biome
related:
  - wiki/custom-tools/docker-images/index.html
scope: "ai-lint-toolkit Docker image: contents, versions, and architecture support."
last_verified: 2026-03-15
---

**Image:** `kpericak/ai-lint-toolkit:0.1`
**Source:** `infra/ai-lint-toolkit/`
**Base:** Alpine 3.21

Multi-stage build bundling four linters.

## Tools

| Tool | Version | Purpose |
|------|---------|---------|
| hadolint | 2.14.0 | Dockerfile linting |
| tflint | 0.61.0 | Terraform linting |
| ruff | 0.15.5 | Python linting (Rust binary) |
| biome | 2.4.6 | JS/TS linting (Rust binary) |

Architecture-aware builds for ruff and biome (amd64/arm64).
Runs as non-root `linter` user.
