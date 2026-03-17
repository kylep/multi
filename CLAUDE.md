

<!-- Agent definitions in .claude/agents/*.md -->

# Agent Team

This repo has 9 Claude Code agents defined in `.claude/agents/`.
Use them instead of doing everything yourself.

## When to use which agent

| Agent | When to use | Invocation |
|-------|------------|------------|
| Publisher | Writing or editing blog posts (full pipeline) | `claude --agent publisher` |
| Analyst | Ingesting external research, proposing system improvements | `claude --agent analyst` |
| Synthesizer | Comparing/contrasting multiple Deep Research reports | `claude --agent synthesizer` |
| PRD Writer | Scoping a product idea into a well-defined PRD | `claude --agent prd-writer` |
| Design Doc Writer | Taking an approved PRD and producing a technical design doc | `claude --agent design-doc-writer` |
| Researcher | Gathering sourced facts for blog posts or validating claims | Subagent (auto-delegated) |
| Reviewer | Checking style, substance, frontmatter, sourcing | Subagent (auto-delegated) |
| QA | Verifying a blog post is production-ready | Subagent (auto-delegated) |
| Security Auditor | Scanning for confidential data, prompt injection, OWASP | Subagent (auto-delegated) |

## How delegation works

Agent definitions live in `.claude/agents/*.md`. Each has a `description`
field with trigger phrases that tell you when to invoke it. When a task
matches an agent's description, delegate to it as a subagent rather than
doing the work yourself.

Publisher, Analyst, Synthesizer, PRD Writer, and Design Doc Writer are top-level agents (run
via `claude --agent <name>`). Researcher, Reviewer, QA, and Security Auditor
are subagents that Publisher calls during its pipeline.



<!-- Source: .ruler/blog-dev.md -->

# Blog Development Workflow

## Project location
All blog work happens under `apps/blog/`. Scripts must be run from that directory.

## Starting the dev server

Start the Next.js dev server in the background so Playwright can verify against it:

```bash
cd apps/blog && bin/start-dev-bg.sh
```

The dev server listens on **http://localhost:3000**.

To kill it when done:
```bash
cd apps/blog && bin/kill-dev.sh
```

If you need to build static files first (e.g. to regenerate markdown → JSON):
```bash
cd apps/blog && bin/build-blog-files.sh
```

## Test/verify loop with Playwright MCP

After starting the dev server, use the Playwright MCP tools to visually verify the blog post renders correctly. The loop is:

1. **Navigate** to the post: `mcp__playwright__browser_navigate` → `http://localhost:3000`
2. **Take a screenshot** with `mcp__playwright__browser_take_screenshot` to see the full rendered page
3. **Inspect** with `mcp__playwright__browser_snapshot` to read the accessibility tree if you need to check text/structure
4. **Fix** any rendering issues in the markdown or blog source
5. **Rebuild** if needed (`bin/build-blog-files.sh`) and repeat

When done verifying, close the Playwright browser with `mcp__playwright__browser_close`,
then kill the dev server with `kill $BLOG_DEV_PID` or `pkill -f "next dev"`.

## Pre-PR checklist

If the change includes JavaScript (anything under `apps/blog/blog/` except
`markdown/posts/`), run a CodeRabbit review before opening the PR:

```bash
coderabbit review --plain
```

No review needed for markdown-only blog post changes.

## Blog post format
- Markdown posts live at `apps/blog/blog/markdown/posts/*.md`
- The build step compiles them to JSON; the dev server hot-reloads



<!-- Source: .ruler/branching.md -->

# Repo Guidelines

## Branching

Never commit directly to `main`. Always create a new branch and open a PR against
`main` for review instead.

## Branch naming

If the work relates to a Linear issue, the branch name **must** use Linear's
format so the PR auto-links to the issue:

```
kyle/<ISSUE-ID>-short-description
```

Example: `kyle/per-39-blog-building-an-ai-agent-org-chart`

To get the correct branch name, check the Linear issue's `gitBranchName` field
or use `git checkout -b $(linear issue PER-XX --branch)`.

If there is no Linear issue, use a descriptive kebab-case name.

```bash
git checkout -b kyle/per-39-blog-agent-org-chart
# make changes
git push -u origin kyle/per-39-blog-agent-org-chart
gh pr create --base main
```



<!-- Source: .ruler/monorepo.md -->

# Monorepo rules

This git repo is a monorepo. It contains multiple sub-projects.
Do not look for context or cross-reference calls between sub-projects.
Each directory within apps/ and games/ is a sub-project. They shouldn't share code.



<!-- Source: .ruler/security.md -->

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
