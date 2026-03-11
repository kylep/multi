---
title: "Security Toolkit"
summary: "Docker image bundling semgrep, trivy, and gitleaks for AI-agent-accessible security scanning. Image: kpericak/ai-security-toolkit-1."
keywords:
  - security
  - semgrep
  - trivy
  - gitleaks
  - docker
  - sast
  - sca
  - secret-scanning
related:
  - wiki/devops/lint-toolkit
  - wiki/devops/ruler
  - ai-security-toolkit
scope: "Covers the security toolkit Docker image and its three bundled tools. Does not cover vulnerability remediation strategies."
last_verified: 2026-03-10
---


A single Docker image (`kpericak/ai-security-toolkit-1:0.2`) that
bundles three security scanning tools. Designed for AI agents to run
as part of development workflows.

## Bundled Tools

| Tool | Purpose | Type |
|------|---------|------|
| semgrep | Static analysis (SAST) | Code patterns |
| trivy | Vulnerability scanning (SCA) | Dependencies, containers, IaC |
| gitleaks | Secret detection | Git history |

## Usage

Mount the project directory as `/workspace`:

```bash
# Static analysis
docker run --rm -v "$(pwd):/workspace:ro" \
  kpericak/ai-security-toolkit-1:0.2 \
  -c "semgrep scan --config auto /workspace"

# Vulnerability scan
docker run --rm -v "$(pwd):/workspace:ro" \
  kpericak/ai-security-toolkit-1:0.2 \
  -c "trivy fs --scanners vuln,secret,misconfig /workspace"

# Secret scan
docker run --rm -v "$(pwd):/workspace:ro" \
  kpericak/ai-security-toolkit-1:0.2 \
  -c "cd /workspace && gitleaks detect --source ."
```

## Related Blog Posts

- [Security Toolkit for AI Agents](/ai-security-toolkit.html):
  build process and usage guide
