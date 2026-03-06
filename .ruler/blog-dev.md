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
