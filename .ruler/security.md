# Security Scanning

The Docker image `kpericak/ai-security-toolkit-1:0.1` bundles
semgrep, trivy, gitleaks, and npm in one Alpine container.

Run from the repo root. Mount the project directory as /workspace.

## Static analysis (semgrep)
```bash
PATH="/Users/kp/.rd/bin:$PATH" docker run --rm -v "$(pwd):/workspace" \
  kpericak/ai-security-toolkit-1:0.1 \
  -c "semgrep scan --config auto /workspace"
```

## Vulnerability scanning (trivy)
```bash
PATH="/Users/kp/.rd/bin:$PATH" docker run --rm -v "$(pwd):/workspace" \
  kpericak/ai-security-toolkit-1:0.1 \
  -c "trivy fs /workspace"
```

## Secret scanning (gitleaks)
```bash
PATH="/Users/kp/.rd/bin:$PATH" docker run --rm -v "$(pwd):/workspace" \
  kpericak/ai-security-toolkit-1:0.1 \
  -c "gitleaks detect --source /workspace --no-git"
```

## Dependency audit (npm)
```bash
PATH="/Users/kp/.rd/bin:$PATH" docker run --rm -v "$(pwd):/workspace" \
  kpericak/ai-security-toolkit-1:0.1 \
  -c "cd /workspace && npm audit"
```

## When to scan
Run security scans before opening PRs that touch dependencies,
infrastructure, or authentication code. Use these to review
third-party repos before forking or installing them.
