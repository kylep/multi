---
title: "Security Toolkit for AI Agents"
summary: A Docker image bundling semgrep, trivy, and gitleaks so
  AI coding agents can run security scans as part of their workflow.
slug: ai-security-toolkit
category: dev
tags: docker, security, semgrep, trivy, gitleaks, claude-code
date: 2026-03-07
modified: 2026-03-07
status: published
image: ai-security-toolkit.png
thumbnail: ai-security-toolkit-thumb.png
imgprompt: The Docker whale wearing a black fedora hat like a hacker
keywords:
  - docker security scanning toolkit
  - semgrep trivy gitleaks
  - ai agent security scanning
  - pre-commit security hooks
  - container vulnerability scanning
  - secret detection git history
---


AI coding agents can write code, review PRs, and run tests. They
can't run security scans unless you give them the tools. I built a
Docker image that bundles three scanners into one container, then
wired it into my repo so any AI tool can use them.


# What's in the image

The image `kpericak/ai-security-toolkit-1` has 3 tools:

| Category | Tool |
|----------|------|
| SAST (static analysis) | [semgrep](https://semgrep.dev/) |
| SCA (dependency vulns) | [trivy](https://trivy.dev/) |
| Secrets (files on disk) | [trivy](https://trivy.dev/) |
| Secrets (git history) | [gitleaks](https://gitleaks.io/) |
| Misconfig (Dockerfile, Terraform) | [trivy](https://trivy.dev/) |
| Container image scanning | [trivy](https://trivy.dev/) |


# The Dockerfile

Multi-stage build. Copy the Go binaries from the official images,
install semgrep via pip on Alpine.

```dockerfile
FROM aquasec/trivy:0.69.3 AS trivy
FROM zricethezav/gitleaks:v8.30.0 AS gitleaks

FROM python:3.12.13-alpine

RUN apk upgrade --no-cache && apk add --no-cache nodejs git gcc musl-dev

COPY --from=trivy /usr/local/bin/trivy /usr/local/bin/trivy
COPY --from=gitleaks /usr/bin/gitleaks /usr/local/bin/gitleaks

RUN pip install --no-cache-dir semgrep

COPY .trivyignore /workspace/.trivyignore

RUN addgroup -S scanner && adduser -S scanner -G scanner
RUN mkdir -p /workspace && chown scanner:scanner /workspace

WORKDIR /workspace
USER scanner
ENTRYPOINT ["/bin/sh"]
```

Trivy and gitleaks are single Go binaries, so the COPY stages are all they need.
Semgrep needs Python and a C compiler for its native
extensions, which is why `gcc` and `musl-dev` are there. The base
images are pinned to specific versions for reproducible builds. A
non-root `scanner` user runs the tools so the container doesn't
operate as root. The image ends up around 800MB. Not small, but
it's a tooling image, not a production service.

Source:
[GitHub](https://github.com/kylep/multi/tree/main/infra/ai-security-toolkit-1)


# Teaching AI agents to scan

The scans are just shell commands. The objective is getting robot to run them.
I use [Ruler](/ruler-cross-tool-ai-rules.html) to maintain a single
`.ruler/security.md` file that gets injected into CLAUDE.md,
AGENTS.md, and any other tool-specific config.

Here's the ruler file:

```markdown
# Security Scanning

The Docker image `kpericak/ai-security-toolkit-1:0.2` bundles
semgrep, trivy, and gitleaks in one Alpine container.

Run from the repo root. Mount the project directory as /workspace.

## Static analysis (semgrep)
docker run --rm -v "$(pwd):/workspace:ro" \
  kpericak/ai-security-toolkit-1:0.2 \
  -c "semgrep scan --config auto /workspace"

## Vulnerability scanning (trivy)
docker run --rm -v "$(pwd):/workspace:ro" \
  kpericak/ai-security-toolkit-1:0.2 \
  -c "trivy fs --scanners vuln,secret,misconfig /workspace"

## Container image scanning (trivy)
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  kpericak/ai-security-toolkit-1:0.2 \
  -c "trivy image <image:tag>"

## Secret scanning (gitleaks)
docker run --rm -v "$(pwd):/workspace:ro" \
  kpericak/ai-security-toolkit-1:0.2 \
  -c "cd /workspace && gitleaks detect --source ."
```

After running `ruler apply`, every AI tool in the repo knows how to
run security scans. I can tell Claude Code "scan this repo for
vulnerabilities" and it has the commands ready.

# Pre-commit hooks

Both semgrep and gitleaks run as
[pre-commit](https://pre-commit.com/) hooks. Every commit gets
a static analysis scan and a secret scan before it lands.

## Installing pre-commit

You need [pre-commit](https://pre-commit.com/) installed, plus
Docker for the scanner container.

```bash
# macOS
brew install pre-commit

# Linux (pip)
pip install pre-commit

# Then activate hooks in the repo
cd your-repo
pre-commit install
```

That wires `.pre-commit-config.yaml` into `.git/hooks/pre-commit`
so the hooks run automatically on every commit.

## The hook config

```yaml
- id: semgrep
  name: Semgrep
  description: Static analysis scan using the security toolkit image.
  entry: bash -c 'docker run -v "$(pwd):/workspace:ro" --rm
    kpericak/ai-security-toolkit-1:0.2
    -c "semgrep scan --config auto --error /workspace"'
  language: system
  stages: ["pre-commit", "pre-push"]
- repo: https://github.com/gitleaks/gitleaks
  rev: v8.30.0
  hooks:
    - id: gitleaks
      stages: ["pre-commit", "pre-push"]
```

The `--error` flag on semgrep makes it exit non-zero on findings,
which blocks the commit. Gitleaks uses its official pre-commit
hook, which pre-commit installs via Go. It scans staged files
directly. Use `gitleaks detect` for full repo scans.


# Running the scans

Here's what each scanner produces when pointed at this monorepo.

## semgrep

The first scan found 43 findings. Most were false positives:
`dangerouslySetInnerHTML` in the blog's SSG rendering (the HTML
comes from my own markdown), `path.join` with internal filenames,
K8s manifests in old sample projects, and vendored Prism.js.

Two changes got it to zero:

1. A `.semgrepignore` file to skip directories that aren't active
   code: `samples/`, old infra, vendored JS, and a legacy project.
2. Inline `// nosemgrep` comments on the few remaining lines where
   the finding is a known false positive, like the SSG innerHTML.

```
┌──────────────┐
│ Scan Summary │
└──────────────┘
Ran 717 rules on 485 files: 0 findings.
```

Zero findings means semgrep can run as a pre-commit hook with
`--error` and block on any new issue. No triage fatigue.

## trivy

Trivy's default scanners are `vuln` and `secret`. It also has
`misconfig` and `license` scanners. Adding `--scanners
vuln,secret,misconfig` enables Dockerfile and Terraform
misconfiguration checks on top of the dependency and secret
scanning.

The first scan found 7 npm vulnerabilities. 3 HIGH in Next.js
14 (DoS in server components), plus medium/low hits in
dompurify, lodash-es, and diff. I bumped Next.js from 14 to 15
and ran `npm audit fix` for the transitive deps. The upgrade
required no code changes. Pages Router, `output: 'export'`, and
React 18 all still work on Next.js 15.

With misconfig enabled, trivy also flagged Dockerfile issues:
no non-root USER, `cd` instead of `WORKDIR`, missing
HEALTHCHECK. The kind of things you'd catch in a code review
but might miss if nobody's looking.

```
Report Summary
┌────────────────────────────────────────┬────────────┬───────┬─────────┬───────────────────┐
│                 Target                 │    Type    │ Vulns │ Secrets │ Misconfigurations │
├────────────────────────────────────────┼────────────┼───────┼─────────┼───────────────────┤
│ apps/blog/blog/package-lock.json       │    npm     │   0   │    -    │         -         │
├────────────────────────────────────────┼────────────┼───────┼─────────┼───────────────────┤
│ apps/blog/Dockerfile                   │ dockerfile │   -   │    -    │         3         │
├────────────────────────────────────────┼────────────┼───────┼─────────┼───────────────────┤
│ apps/blog/tf                           │ terraform  │   -   │    -    │         0         │
├────────────────────────────────────────┼────────────┼───────┼─────────┼───────────────────┤
│ infra/ai-security-toolkit-1/Dockerfile │ dockerfile │   -   │    -    │         1         │
└────────────────────────────────────────┴────────────┴───────┴─────────┴───────────────────┘
```

Zero dependency vulns. The Dockerfile misconfigs are real
findings to fix next. The policy going forward: keep SCA vulns
at 0 in active projects. Major package upgrades are acceptable
to get there. Playwright tests catch regressions from the
upgrades.

## trivy image

`trivy fs` scans source code and lock files. `trivy image`
scans a built Docker image, catching OS-level CVEs in the base
image and vulnerabilities in installed packages that don't show
up in any lock file.

Running it against the first version of the toolkit image found
25 vulnerabilities that `trivy fs` never saw: Alpine OS
packages, Python dependencies, and Go stdlib CVEs baked into
the trivy and gitleaks binaries.

Fixes for v0.2:

1. Pinned `python:3.12.13-alpine` and added `apk upgrade` to
   get the latest Alpine packages. Fixed the CRITICAL zlib CVE.
2. The Go stdlib CVEs live inside the gitleaks binary, compiled
   with Go 1.25.4. No newer gitleaks release exists. Added a
   `.trivyignore` with comments explaining each suppression.

The policy: no HIGH or CRITICAL findings. MEDIUM and below from
upstream binaries we don't compile are accepted and documented.

## gitleaks

```
144 commits scanned.
no leaks found.
```

Clean. Gitleaks scans git history by default, so it catches
secrets that were committed and later deleted. Trivy also has
a secret scanner, but it only checks files on disk. If someone
committed an API key and removed it in the next commit, trivy
wouldn't see it. Gitleaks would, because the key is still in
the git log.

That's why both are in the image. Trivy covers dependency vulns
and current-file secrets. Gitleaks covers the git history angle.
I originally had `npm audit` in the image too, but dropped it
since trivy already scans `package-lock.json` for the same CVEs.


# The workflow

With all this wired up, security scanning happens at three levels:

1. **Every commit**: semgrep and gitleaks run as pre-commit hooks.
   Any new static analysis finding or leaked secret blocks the
   commit.
2. **Scheduled**: a security agent runs `trivy image` against
   built container images on a schedule, triages the results,
   and files issues in
   [Linear](/linear-mcp.html) for anything that needs attention.
   Image scanning is too slow for pre-commit hooks but catches
   OS-level CVEs that filesystem scans miss.
3. **On demand**: I tell the AI agent "run security scans" or
   include it in task instructions. The agent runs the docker
   commands from its CLAUDE.md context and triages the output.

The AI agent is good at triaging scan results. It can reason about
which dependency vulnerabilities actually matter for a static
export vs a running server. That's the real value of combining
scanners with AI agents: the agent reads the output instead of
just dumping a report.
