---
title: "Lint Toolkit"
summary: "Docker image bundling ruff, biome, hadolint, and tflint for AI-agent-accessible code linting across Python, JavaScript, Dockerfiles, and Terraform."
keywords:
  - linting
  - ruff
  - biome
  - hadolint
  - tflint
  - docker
  - code-quality
related:
  - wiki/devops/security-toolkit
  - ai-lint-toolkit
scope: "Covers the lint toolkit Docker image and bundled linters. Does not cover linter configuration or rule customization."
last_verified: 2026-03-10
---

# Lint Toolkit

Docker image bundling multiple linters for AI agent use. Provides
consistent code quality checking without installing tools locally.

## Bundled Linters

| Tool | Language/Format |
|------|----------------|
| ruff | Python |
| biome | JavaScript/TypeScript/JSON |
| hadolint | Dockerfiles |
| tflint | Terraform |

## Usage

```bash
docker run --rm -v "$(pwd):/workspace:ro" \
  kpericak/ai-lint-toolkit:latest \
  -c "ruff check /workspace"
```

## Related Blog Posts

- [Lint Toolkit for AI Agents](/ai-lint-toolkit.html): build and usage
