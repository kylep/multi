---
title: "TASK-009: Build, Deploy, and End-to-End Test"
status: in-progress
date: 2026-03-17
---

# TASK-009: Build, Deploy, and End-to-End Test

Status: **In progress** — publisher running with full observability

## What was deployed

| Component | Version | Status |
|-----------|---------|--------|
| ai-agent-runtime | 0.4 | Pushed, includes hooks + Playwright + jq |
| agent-controller | 0.6 | Pushed, Discord #log + RUN_ID + stream-json |
| Helm revision | 33 | Deployed |

## Issues found and fixed during deployment

### 1. Workspace file ownership (UID mismatch)

**Problem:** Previous runtime (0.2) ran as UID 1000. New Playwright
base runs as UID 1001 (pwuser). `npm ci` failed with EACCES on
`node_modules` owned by the old UID.

**Fix:** Controller now chowns to 1001 for all agents, not just
publisher.

### 2. Helm field manager conflicts

**Problem:** `kubectl patch` and Helm both claim ownership of secret
fields. `helm upgrade` fails with "conflicts with kubectl-patch".

**Fix:** Delete secret, let helm recreate it, then re-patch values.
Documented in agent-controller wiki.

### 3. Secrets wiped by helm upgrade

**Problem:** `helm upgrade -f values.yaml` resets secrets to empty
defaults. The `lookup` pattern only preserves existing values when the
secret already exists — but after a delete-and-recreate, everything
starts empty.

**Fix:** Always re-patch secrets after helm operations. OAuth token
lives in `apps/blog/exports.sh`.

### 4. `--allowedTools` required for headless mode

**Problem:** Claude Code in headless mode (`-p` flag) blocks all tool
use unless `--allowedTools` is explicitly passed or the agent
definition has `tools:` in frontmatter. The journalist agent has both
but was missing WebSearch/WebFetch in the CRD. The publisher agent's
frontmatter grants tools directly.

**Fix:** Journalist CRD updated with WebSearch/WebFetch. Runtime image
now includes `settings.json` with wide permissions to prevent prompts.

### 5. Zero output during subagent calls

**Problem:** `--output-format stream-json` does not include subagent
events by default. Publisher subagent calls (researcher, reviewer, QA)
produced 5-10 minutes of complete silence.

**Fix:** Added `--include-partial-messages` flag. Subagent events now
appear in the parent stream with `parent_tool_use_id` populated. Full
real-time visibility via `kubectl logs -f`.

### 6. `stream-json` requires `--verbose` with `-p`

**Problem:** `--output-format stream-json` exits with error
"stream-json requires --verbose" when used with `-p` (print mode).

**Fix:** Added `--verbose` flag to all claude invocations.

### 7. google-news MCP removed

**Problem:** `npm ci` for google-news MCP server failed due to
UID mismatch on cached `node_modules`. The journalist agent doesn't
need it — WebSearch works.

**Fix:** Removed google-news MCP from controller command building.
Journalist uses WebSearch/WebFetch.

### 8. Discord webhook URL not needed

**Problem:** Design doc specified Discord webhook URL for publisher
notifications.

**Fix:** Publisher notifications handled by Discord MCP bot (same as
journalist). Removed DISCORD_WEBHOOK_URL, GITHUB_TOKEN, and git
push/PR from run-publisher.sh. Agent writes to local PVC branch.

### 9. QA subagent OOMKill — next dev too heavy

**Problem:** The QA subagent starts `next dev` to verify blog post
rendering. In a K8s pod (4GB node, ~1.5GB available), Next.js page
compilation on first request either hangs indefinitely or triggers an
OOMKill. The first publisher run ended in OOMKilled status after 37
minutes, during the QA phase.

**Diagnosis:** Debug pod tests confirmed:
- `next dev`: TCP connects but HTTP response never arrives (compilation hangs)
- `python3 -m http.server` on static files: HTTP 200 in 0.005s
- Networking is fine; the issue is purely Next.js resource consumption

**Fix:** Added `apps/blog/bin/start-static-server.sh` — builds static
files with `bin/build-blog-files.sh`, then serves `out/` with
`python3 -m http.server 3000`. Updated `qa.md` to use this in container
environments.

### 10. Case-sensitive import breaks Linux build

**Problem:** `MarkdownService.js` imports `./RemarkMermaid.js` but the
file on disk is `remarkMermaid.js` (lowercase r). macOS is
case-insensitive so this works locally, but Linux containers are
case-sensitive and the build fails with "Module not found."

**Fix:** Changed import to `./remarkMermaid.js`.

## Observability stack (added during deployment)

1. **Controller → Discord #log:** Posts job start (UUID, agent, prompt)
   and completion/failure
2. **stream-json + --include-partial-messages:** Streams all events
   (parent + subagent) to pod logs
3. **PostToolUse hook:** Baked into runtime image, posts tool calls
   to Discord #log (Write, Edit, Bash, Agent, MCP)
4. **30-min activeDeadlineSeconds:** Hard ceiling on all jobs

## Verification checklist

- [x] Runtime image 0.4 built and pushed
- [x] Controller 0.6 built and pushed
- [x] Helm upgraded (revision 33)
- [x] Journalist regression test — ran, created wiki file, no crash
- [x] Discord #log messages — start/stop messages confirmed
- [x] Subagent events in stream — confirmed via --include-partial-messages
- [ ] Publisher run completes end-to-end
- [ ] Blog post written on branch
- [ ] Claude.ai usage dashboard shows Max billing
- [ ] Network policy verified
