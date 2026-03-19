---
title: "Security Improvement Log"
summary: "Structured log of autonomous security improvements to the Mac workstation."
keywords:
  - security
  - hooks
  - improvements
  - autonomous
related:
  - wiki/design-docs/security-improvement-loop
  - wiki/prds/security-improvement-loop
scope: "Tracks each security improvement iteration: what was found, what was changed, whether it passed adversarial verification, and the commit hash."
last_verified: 2026-03-18
---

Structured log of autonomous security improvements made by the
[Autonomous Security Improvement Loop](security-improvement-loop.html).

Each row represents one iteration of the improvement loop.

| Timestamp | Finding | Change | Verification | Result | Commit |
|-----------|---------|--------|--------------|--------|--------|
| 2026-03-19T00:00:00Z | `protect-sensitive.sh` did not protect `exports.sh` (holds GITHUB_APP_PRIVATE_KEY_B64, DISCORD_BOT_TOKEN, OPENROUTER_API_KEY) or the `secrets/` directory. Both were fully readable via Read/Edit/Write tools and common bash commands. | Added `*/exports.sh` and `*/secrets/*` patterns to `check_path()`. Added bash-command regex detection for `exports.sh` (cat/less/head/tail/base64/strings/xxd/grep) and `secrets/` directory access. | Adversarial agent should attempt: (1) `Read` tool on `~/gh/multi/apps/blog/exports.sh`, (2) `Bash` `cat exports.sh`, (3) `Read` on any file under a `secrets/` path — all three must be blocked. | pending | pending |
| 2026-03-19T09:08:00Z | `Grep` and `Glob` tools were absent from the hook matcher in both `playbook.yml` and the deployed `~/.claude/settings.json`. The deployed matcher was `Read|Edit|Write|Bash` — hook was never called for Grep/Glob tool use, so all protect-sensitive.sh logic was irrelevant for those tools. Simultaneously, the else branch only extracted `.tool_input.file_path`, missing Grep's `path`/`glob` fields and Glob's `pattern` field entirely. | (1) Updated `playbook.yml` matcher from `Read|Edit|Write|Bash` to `Read|Edit|Write|Bash|Grep|Glob`. (2) Rewrote `protect-sensitive.sh` else branch with: `norm_path()` via `python3 os.path.realpath().lower()` (handles `..`, symlinks, case-insensitivity); `check_glob_filter()` using bash native glob engine; `check_glob_in_root()` via `find` filesystem expansion (no maxdepth). (3) Ran `ansible-playbook` to deploy both changes — deployed `~/.claude/settings.json` and `~/.claude/hooks/protect-sensitive.sh` confirmed updated. | Adversarial agent should attempt: (1) `Grep(path=".../apps/blog", glob="exports.sh")`, (2) `Grep(path=".../apps/blog", glob="e?ports.sh")`, (3) `Grep(path=".../apps", glob="exports.sh")` (grandparent dir), (4) `Grep(path=".../apps/blog/../blog", glob="exports.sh")` (`..` traversal), (5) `Grep(path="/Users/PAI/gh/multi/apps/blog", glob="exports.sh")` (uppercase path) — all must be blocked. Normal `Read(/README.md)` must still pass. | pending | pending |
