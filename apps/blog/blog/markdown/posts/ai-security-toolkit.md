---
title: "Security Toolkit for AI Agents"
summary: A Docker image bundling semgrep, trivy, gitleaks, and npm
  audit so AI coding agents can run security scans as part of their
  workflow.
slug: ai-security-toolkit
category: dev
tags: Docker, security, semgrep, trivy, gitleaks, Claude-Code
date: 2026-03-07
modified: 2026-03-07
status: published
image: ai-security-toolkit.png
thumbnail: ai-security-toolkit-thumb.png
imgprompt: The Docker whale wearing a black fedora hat like a hacker
---


AI coding agents can write code, review PRs, and run tests. They
can't run security scans unless you give them the tools. I built a
Docker image that bundles four scanners into one container, then
wired it into my repo so any AI tool can use them.


# What's in the image

The image `kpericak/ai-security-toolkit-1:0.1` packs four tools
onto Alpine Linux:

| Tool | Purpose |
|------|---------|
| [semgrep](https://semgrep.dev/) | Static analysis, pattern matching |
| [trivy](https://trivy.dev/) | Dependency vulnerability scanning |
| [gitleaks](https://gitleaks.io/) | Secret detection |
| npm audit | Node.js dependency audit |

One `docker run` command, four scanners. No local installs needed.


# The Dockerfile

Multi-stage build. Copy the Go binaries from the official images,
install semgrep via pip on Alpine.

```dockerfile
FROM aquasec/trivy:latest AS trivy
FROM zricethezav/gitleaks:latest AS gitleaks

FROM python:3.12-alpine

RUN apk add --no-cache nodejs npm git gcc musl-dev

COPY --from=trivy /usr/local/bin/trivy /usr/local/bin/trivy
COPY --from=gitleaks /usr/bin/gitleaks /usr/local/bin/gitleaks

RUN pip install --no-cache-dir semgrep

WORKDIR /workspace
ENTRYPOINT ["/bin/sh"]
```

Trivy and gitleaks are single Go binaries, so the COPY stages are
clean. Semgrep needs Python and a C compiler for its native
extensions, which is why `gcc` and `musl-dev` are there. The image
ends up around 800MB. Not small, but it's a tooling image, not a
production runtime.

Source:
[GitHub](https://github.com/kylep/multi/tree/main/infra/ai-security-toolkit-1)


# Teaching AI agents to scan

The scans are just shell commands. The trick is getting them into
the AI agent's context. I use
[Ruler](/ruler-cross-tool-ai-rules.html) to maintain a single
`.ruler/security.md` file that gets injected into CLAUDE.md,
AGENTS.md, and any other tool-specific config.

Here's the ruler file:

```markdown
# Security Scanning

The Docker image `kpericak/ai-security-toolkit-1:0.1` bundles
semgrep, trivy, gitleaks, and npm in one Alpine container.

Run from the repo root. Mount the project directory as /workspace.

## Static analysis (semgrep)
docker run --rm -v "$(pwd):/workspace" \
  kpericak/ai-security-toolkit-1:0.1 \
  -c "semgrep scan --config auto /workspace"

## Vulnerability scanning (trivy)
docker run --rm -v "$(pwd):/workspace" \
  kpericak/ai-security-toolkit-1:0.1 \
  -c "trivy fs /workspace"

## Secret scanning (gitleaks)
docker run --rm -v "$(pwd):/workspace" \
  kpericak/ai-security-toolkit-1:0.1 \
  -c "cd /workspace && gitleaks detect --source ."

## Dependency audit (npm)
docker run --rm -v "$(pwd):/workspace" \
  kpericak/ai-security-toolkit-1:0.1 \
  -c "cd /workspace && npm audit"
```

After running `ruler apply`, every AI tool in the repo knows how to
run security scans. I can tell Claude Code "scan this repo for
vulnerabilities" and it has the commands ready.

Why Ruler instead of Claude Code skills? Ruler propagates to Claude,
Cursor, OpenCode, and Codex. Skills are Claude-only. The scan
commands are just bash. Any agent can run them from CLAUDE.md
context.


# Pre-commit hook

I also added gitleaks as a pre-commit hook alongside the existing
TruffleHog hook. This catches secrets before they hit the remote.

```yaml
- id: gitleaks
  name: Gitleaks
  description: Scan for leaked secrets using the security toolkit image.
  entry: bash -c 'docker run -v "$(pwd):/workspace" --rm
    kpericak/ai-security-toolkit-1:0.1
    -c "cd /workspace && gitleaks detect --source ."'
  language: system
  stages: ["commit", "push"]
```

TruffleHog checks verified secrets against live services. Gitleaks
catches patterns. Both run on commit and push.


# Running the scans

Here's what each scanner produces when pointed at this monorepo.

## semgrep

```
┌──────────────────┐
│ 44 Code Findings │
└──────────────────┘

  /workspace/apps/blog/blog/components/BlogPostContentPage.js
  > typescript.react.security.audit.react-dangerouslysetinnerhtml
        Detection of dangerouslySetInnerHTML from non-constant
        definition. This can inadvertently expose users to
        cross-site scripting (XSS) attacks...

         80| <Box dangerouslySetInnerHTML={{ __html: contentHtml }}>

┌──────────────┐
│ Scan Summary │
└──────────────┘
Ran 778 rules on 615 files: 44 findings.
```

44 findings across the monorepo. Most are `dangerouslySetInnerHTML`
hits in the blog's SSG rendering, which are expected. Semgrep
doesn't know the HTML comes from my own markdown files, not user
input. The value here is catching real issues in new code.

## trivy

```
Report Summary
┌───────────────────────────────────────────┬──────┬──────────┬─────────┐
│                  Target                   │ Type │   Vulns  │ Secrets │
├───────────────────────────────────────────┼──────┼──────────┼─────────┤
│ apps/blog/blog/package-lock.json          │ npm  │    7     │    -    │
└───────────────────────────────────────────┴──────┴──────────┴─────────┘
```

7 vulnerabilities in the blog's Next.js dependencies, all from
outdated Next.js versions. Mostly DoS vectors in server components
and image optimization. Good signal for when to bump dependencies.

## gitleaks

```
144 commits scanned.
no leaks found.
```

Clean. Gitleaks scans git history by default, so it respects
`.gitignore` and only checks committed content. No `--no-git`
needed when running inside a mounted repo.

## npm audit

npm audit runs against each `package-lock.json` it finds. It
overlaps with trivy's npm scanning but gives you the native npm
perspective on fix versions.


# The workflow

With all this wired up, the security scanning workflow for AI agents
is:

1. Agent writes or reviews code
2. I say "run security scans" (or it's in the task instructions)
3. Agent runs the docker commands from its CLAUDE.md context
4. Agent reads the output and flags real issues
5. Pre-commit hook catches any secrets before push

The AI agent is good at triaging scan output. It knows which
`dangerouslySetInnerHTML` findings are false positives in an SSG
blog and which dependency vulnerabilities actually matter for a
static export. That's the real value of combining scanners with AI
agents: the agent can reason about the results instead of just
dumping a report.
