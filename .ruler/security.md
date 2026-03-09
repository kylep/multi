# Security Scanning

The Docker image `kpericak/ai-security-toolkit-1:0.2` bundles
semgrep, trivy, and gitleaks in one Alpine container.

Run from the repo root. Mount the project directory as /workspace.

## Static analysis (semgrep)
```bash
docker run --rm -v "$(pwd):/workspace:ro" \
  kpericak/ai-security-toolkit-1:0.2 \
  -c "semgrep scan --config auto /workspace"
```

## Vulnerability scanning (trivy)
```bash
docker run --rm -v "$(pwd):/workspace:ro" \
  kpericak/ai-security-toolkit-1:0.2 \
  -c "trivy fs --scanners vuln,secret,misconfig --skip-dirs samples,apps/kytrade,infra/aws,infra/local-k8s /workspace"
```

## Container image scanning (trivy)
```bash
docker run --rm --user root \
  -v "$(pwd):/workspace:ro" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  kpericak/ai-security-toolkit-1:0.2 \
  -c "trivy image --ignorefile /workspace/.trivyignore --severity HIGH,CRITICAL <image:tag>"
```

## Secret scanning (gitleaks)
```bash
docker run --rm -v "$(pwd):/workspace:ro" \
  kpericak/ai-security-toolkit-1:0.2 \
  -c "cd /workspace && gitleaks detect --source ."
```

## When to scan
Run security scans before opening PRs that touch dependencies,
infrastructure, or authentication code. Use these to review
third-party repos before forking or installing them.

## Zero-vuln policy
Keep SCA vulnerabilities at 0 in active projects. Major package
upgrades are acceptable to achieve this. Run Playwright tests
after dependency upgrades to catch regressions.
