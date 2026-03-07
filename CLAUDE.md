

<!-- Source: .ruler/blog-dev.md -->

# Blog Development Workflow

## Project location
All blog work happens under `apps/blog/`. Scripts must be run from that directory.

## Starting the dev server

Start the Next.js dev server in the background so Playwright can verify against it:

```bash
cd apps/blog/blog && npm run dev &
BLOG_DEV_PID=$!
# Wait for the server to be ready
sleep 5
```

The dev server listens on **http://localhost:3000**.

To kill it when done:
```bash
bin/kill-dev.sh
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

```bash
git checkout -b <branch-name>
# make changes
git push -u origin <branch-name>
gh pr create --base main
```



<!-- Source: .ruler/monorepo.md -->

# Monorepo rules

This git repo is a monorepo. It contains multiple sub-projects.
Do not look for context or cross-reference calls between sub-projects.
Each directory within apps/ and games/ is a sub-project. They shouldn't share code.



<!-- Source: .ruler/security.md -->

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
