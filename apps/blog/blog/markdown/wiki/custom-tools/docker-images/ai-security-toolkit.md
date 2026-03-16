---
title: "AI Security Toolkit"
summary: "Docker image bundling semgrep, trivy, and gitleaks for security scanning."
keywords:
  - docker
  - security
  - semgrep
  - trivy
  - gitleaks
related:
  - wiki/custom-tools/docker-images/index.html
  - wiki/security/index.html
scope: "ai-security-toolkit-1 Docker image: contents, versions, and usage examples."
last_verified: 2026-03-15
---

**Image:** `kpericak/ai-security-toolkit-1:0.2`
**Source:** `infra/ai-security-toolkit-1/`
**Base:** Alpine Python 3.12

Bundles three security scanners in one container.

## Tools

| Tool | Version | Purpose |
|------|---------|---------|
| semgrep | 1.154.0 | Static analysis (SAST) |
| trivy | 0.69.3 | Vulnerability + secret + misconfig scanning |
| gitleaks | 8.30.0 | Secret detection in git history |

Also includes: Node.js, git, gcc, musl-dev.
Runs as non-root `scanner` user.

## Usage

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

# Container image scan
docker run --rm --user root \
  -v "$(pwd):/workspace:ro" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  kpericak/ai-security-toolkit-1:0.2 \
  -c "trivy image --severity HIGH,CRITICAL <image:tag>"
```
