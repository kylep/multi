---
title: "TASK-003: Create Entrypoint Script"
status: complete
date: 2026-03-16
---

# TASK-003: Create Entrypoint Script `bin/run-publisher.sh`

**Status:** Complete
**Date:** 2026-03-16
**File:** `apps/blog/bin/run-publisher.sh`

## Summary

Created the entrypoint script that the K8s controller invokes to run the
autonomous publisher pipeline. Handles branch lifecycle, auth setup, Claude
invocation, git push, PR creation, and Discord notification.

## Script flow

1. Validate `CLAUDE_CODE_OAUTH_TOKEN` (required); `GITHUB_TOKEN` is optional — skips push and PR if unset
2. Set git identity (`publisher-agent`) if not already configured
3. Create branch `agent/publisher-$(date +%s)`
4. Unset `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`
   (prevents auth conflict discovered in TASK-001)
5. Run `claude --mcp-config /tmp/mcp.json --agent publisher -p "$1" --output-format text`
6. On success: `git push`, `gh pr create`, Discord webhook notification
7. On failure: Discord webhook with last 20 lines of output, exit 1

## Key decisions

### Discord: webhook curl (not MCP)

The script runs outside Claude Code context so MCP isn't available.
A simple `curl` POST to `DISCORD_WEBHOOK_URL` is used. The env var is
optional -- if unset, notifications are skipped (the run doesn't fail
over it).

### Error capture

Claude Code output is captured via `tee` to a temp file. On failure,
`tail -20` of that file is included in the Discord notification. This
gives enough context to debug without logging into the pod.

### PIPESTATUS for exit code

Because `set -o pipefail` is active, the pipe `claude ... | tee` would
exit with the first failing command's code. We use `|| true` on the
pipeline and then check `${PIPESTATUS[0]}` to get Claude's actual exit
code separately from tee's.

## Verification

- `bash -n` syntax check: passed
- `chmod +x`: done
- shellcheck: not available locally (deferred)
- End-to-end testing deferred to TASK-009

## Acceptance criteria

- [x] Script creates branch `agent/publisher-$(date +%s)` from current HEAD
- [x] Script unsets `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`
- [x] Script invokes `claude --mcp-config /tmp/mcp.json --agent publisher -p "$1" --output-format text`
- [x] On success: `git push`, `gh pr create`
- [x] On success: posts PR link to Discord via curl webhook
- [x] On failure: posts error context to Discord, preserves branch, exits non-zero
- [x] Script is executable
- [ ] Script works end-to-end in container (TASK-009)
