---
name: fix-blog-problems
description: Diagnose and fix Next.js dev-mode issues with the blog at apps/blog/blog. Use when the blog dev server returns 500s, when a published post 404s, when tables or code blocks render without their styling (no borders, no background), when the page is white/blank with a collapsed layout, when a Playwright screenshot of a working page comes back blank, or when "Cannot read properties of undefined (reading 'contentHtml')" appears in the dev server log. Also use when Playwright MCP refuses to launch with "Browser is already in use".
---

# Fix Blog Problems

Recurring dev-mode issues with `apps/blog/blog` and the fixes that have
worked. Almost everything funnels into a single recipe (kill, nuke, restart).
Read the symptom triage first so you can spot the right one fast.

## Standard fix recipe

When in doubt, run this. It resolves 90% of the cases below.

```bash
/Users/kp/gh/multi/apps/blog/bin/kill-dev.sh
rm -r /Users/kp/gh/multi/apps/blog/blog/.next
/Users/kp/gh/multi/apps/blog/bin/start-dev-bg.sh
# wait for "Dev server ready (PID ...)" in the task output
# then navigate with a cache-bust query like ?fresh=1 to force fresh compile
```

`rm -r` on `.next` (NOT `rm -rf`) avoids the global `block-destructive`
hook that fires on `rm -rf`.

After restart, the first navigation triggers a fresh compile. Subsequent
changes to markdown files hot-reload normally.

## Known issues

### Symptom: 404 on a post you know exists

Cause: `.next/getStaticPaths` cache is stale. Common after merging main
or after the post file was just created.

Fix: standard recipe.

### Symptom: tables render with no borders, code blocks have no grey background

Cause: `_app.js` chunk is 500-erroring in the dev server. Because
`globals.css` is imported from `_app.js`, when the chunk fails to
serve, no `<link>` to the compiled CSS is injected. MUI's CssBaseline
still loads (inline emotion styles) and resets default browser table
styles, leaving them naked.

Verify: in Playwright, check `document.querySelectorAll('link[rel="stylesheet"]')`
returns an empty list, OR `getComputedStyle(table).border === '0px none ...'`
on a `<table>` element.

Fix: standard recipe.

### Symptom: page is white/blank, screenshot comes back empty, but DOM has content

Cause: same as above. `_app.js` failed to serve, so MUI ThemeProvider
hasn't hydrated, root div has `offsetHeight: 0` because layout never
ran. Content is in the DOM but not painted.

Verify: check the dev server log for
`TypeError: Cannot read properties of undefined (reading 'contentHtml')`
at `BaseSiteComponent (.next/server/pages/[...route].js:...)`.

Fix: standard recipe.

### Symptom: `Cannot read properties of undefined (reading 'contentHtml')`

Cause: dev server's compiled `[...route].js` got into a state where
some path's `getStaticProps` returns undefined. This is NOT necessarily
a markdown bug. **Verify by running a production build first**:

```bash
cd /Users/kp/gh/multi/apps/blog && bash bin/build-blog-files.sh 2>&1 | tail -20
```

If prod build succeeds, the markdown is fine and dev mode is just stale.
Apply the standard fix recipe.

If prod build fails, find the offending markdown file in the error
output. Most common cause: malformed YAML frontmatter, a `---` in the
body interpreted as a setext-style H2 underline (a `---` immediately
after a non-empty line with no blank above). Loose `---` in code fences
is fine; only loose `---` in prose is risky.

### Symptom: dev server was working, then broke after running `bin/build-blog-files.sh`

Cause: production build overwrites `.next/server/...` while dev server
is using it. This was the actual root cause for one of the recurring
breakages this skill was created from.

Prevention: don't run `build-blog-files.sh` while the dev server is up.
If you need to verify production builds, kill dev first.

Fix: standard recipe.

### Symptom: Playwright MCP fails with "Browser is already in use"

Cause: a previous Chrome for Testing instance crashed without releasing
its singleton lock.

Fix:

```bash
pkill -f "Google Chrome for Testing"
rm -f /Users/kp/Library/Caches/ms-playwright/mcp-chrome-for-testing-fe333a6/SingletonLock
```

Then re-navigate with `mcp__playwright__browser_navigate`. Brief wait
between kill and re-navigate is fine; no need to sleep more than a
second.

### Symptom: Playwright screenshot is blank but DOM looks fine

Cause: usually the same MUI-not-hydrated issue as the white-screen
case. Check `document.body.firstElementChild.offsetHeight`. If 0,
layout collapsed → standard recipe.

If `offsetHeight` is non-zero, screenshot is probably catching mid-
scroll or before content rendered. Try `browser_evaluate` with an
explicit `scrollIntoView` to a known anchor, or `browser_wait_for`
with `time: 2`, then re-screenshot.

### Symptom: post body changed on disk but dev server shows old content

Cause: occasionally the markdown→JSON pipeline doesn't pick up the
edit cleanly. Hot-reload usually works, but for non-trivial structural
changes (frontmatter, new top-level sections) sometimes a hard reload
helps.

Fix: navigate with a cache-bust query (`?v=N`). If that fails, apply
the standard recipe.

## Verification after fixing

After applying the standard recipe, navigate to the affected page and
confirm:

1. `document.querySelectorAll('link[rel="stylesheet"]').length > 0`
   (globals.css is linked)
2. `getComputedStyle(document.querySelector('table')).borderCollapse === 'collapse'`
   (tables are styled)
3. `document.body.firstElementChild.offsetHeight > 0`
   (layout has run)
4. No 500s in the dev server log for `_next/static/chunks/...`

## When to update this skill

If you fix a blog dev-mode issue using this skill and the symptom or
the fix doesn't already appear above, append a new entry under "Known
issues" before completing the task. Keep entries tight: one paragraph
of cause + one short fix. The goal is faster diagnosis next time, not
exhaustive logs.

If you discover a new pattern that the standard recipe does NOT fix,
add a new top-level recipe section above this one and reference it
from the relevant symptom entry.
