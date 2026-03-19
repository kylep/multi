---
title: "Mac Setup Learnings"
summary: "Gotchas, decisions, and patterns discovered while building the Ansible-managed Mac workstation setup."
keywords:
  - ansible
  - mac-setup
  - idempotency
  - mcp
  - hooks
related:
  - wiki/devops/bootstrap
  - wiki/devops/mac-setup-run-log
scope: "Documents recurring patterns, pitfalls, and design decisions in the mac-setup playbook. Not a run log — see mac-setup-run-log for per-run details."
last_verified: 2026-03-18
---


## Ansible on macOS

### `hosts: localhost` requires implicit inventory

Using `hosts: all` breaks the implicit localhost that Ansible provides when no inventory file exists. Stick with `hosts: localhost` and `connection: local`. The `--start-at-task` flag works fine with this setup when run as `ansible-playbook playbook.yml`.

### `homebrew/cask` tap is deprecated

Modern Homebrew no longer requires tapping `homebrew/cask`. The `community.general.homebrew_tap` module will fail if you try to add it. Just list casks directly in `homebrew_casks` — Homebrew resolves them automatically.

### Taps must be added before packages

If a Homebrew package is from a third-party tap (e.g. `hashicorp/tap/vault`), the tap must be added in a separate task before the `Install Homebrew packages` task. The `homebrew` module does not auto-tap.

### `community.general.git_config` rejects empty values

Setting `credential.helper` to `""` via the git_config module fails validation. Use `ansible.builtin.command: git config --global credential.helper ''` instead.

### `failed_when: false` is easy to lose

When restructuring tasks, `failed_when: false` on check-commands (like `pgrep`) can get accidentally dropped. This causes the playbook to abort when the checked service isn't running. Always verify check-tasks retain their `failed_when: false` after refactors.

### Python 3.14 + hatchling editable installs

Python 3.14 (from `brew install python@3`) can break `pip install -e .` with hatchling if the project layout is a single file (e.g. `server.py`) instead of a package directory. Workaround: install dependencies directly (`pip install "dep1" "dep2"`) instead of installing the project.


## Playbook design patterns

### Phase 1 / Phase 2 structure

Group all tasks requiring human interaction (permissions, auth, service starts) at the top. Check each condition, collect results, and print a single consolidated action summary. All automated tasks go in Phase 2. This way:
- Users see everything they need to do in one message
- A mid-run restart (e.g. after granting screen recording) just means re-running the playbook
- Phase 2 is fully idempotent — safe to re-run unlimited times

### Secrets via `lookup('env', ...)`

MCP server configs need API keys. Rather than hardcoding them, the playbook reads them from the shell environment using `lookup('env', 'VAR_NAME')`. This requires `source exports.sh` before running the playbook. The keys get baked into `.mcp.json` at write time.

### osxkeychain credential helper

macOS Git defaults to `credential.helper=osxkeychain`, which will use stored personal GitHub credentials. On a machine that should only authenticate via GitHub App tokens (`GH_TOKEN`), disable it: `git config --global credential.helper ''`.


## MCP server setup

### Custom MCP servers live in `apps/mcp-servers/`

Each server is a self-contained project (Node.js with TypeScript, or Python with pyproject.toml). The playbook handles:
- npm install + tsc build for Node servers
- venv creation + pip install for Python servers
- Writing `.mcp.json` with all server configs

### Playwright MCP installs globally

`@playwright/mcp` is installed as a global npm package, not in the repo. Chromium is installed separately via `npx playwright install chromium`. The `.mcp.json` entry uses `npx @playwright/mcp` to launch it.

### Screenshot MCP for desktop capture

A custom MCP server wrapping macOS `screencapture -x` gives Claude the ability to see the desktop. Requires screen recording permission for iTerm2 (System Settings > Privacy & Security > Screen Recording). This cannot be granted programmatically due to SIP.

### analytics-mcp (GA4) via pipx

The `analytics-mcp` package is installed via `pipx` (not pip) to keep it isolated. It needs `GOOGLE_APPLICATION_CREDENTIALS` pointing to gcloud application default credentials, which require an interactive browser login.


## Safety hooks

### Hooks go in global settings, not per-repo

Per-repo `.claude/settings.json` hooks are a security risk — a malicious repo can override your protections. Safety hooks belong in `~/.claude/settings.json` (global, user-level) where only Ansible controls them.

### Three-hook pattern

1. **block-destructive** (PreToolUse, Bash) — blocks `rm -rf /`, force push, `curl | bash`, fork bombs, etc.
2. **protect-sensitive** (PreToolUse, Read|Edit|Write|Bash) — blocks access to `.env`, SSH keys, AWS creds, kubeconfig
3. **audit-log** (PostToolUse, async) — JSONL log of every tool call to `logs/claude-audit.jsonl`

The audit hook runs `async: true` so it doesn't slow down Claude.

### Hooks don't freeze Claude

When a hook blocks (exit 2), Claude sees the stderr message and adapts. It will rephrase the command or try a different approach. This is by design — hooks are guardrails, not walls.


## Identity separation

### PericakAI (Pai) identity

This machine uses `PericakAI (Pai)` / `pericakai@gmail.com` for git commits, not the personal `kylep` / `kyle@pericak.com` identity. The bootstrap script fails hard if GitHub App credentials aren't available — no fallback to interactive `gh auth login` which would authenticate as the personal account.

### System CLAUDE.md is Ansible-managed

`~/CLAUDE.md` is written by the playbook and must be updated there. It contains the identity rules, security posture (bypass permissions warning, no `curl | bash`), and the self-referential instruction to always update the playbook when changing it.


## Dock management

### dockutil for idempotent Dock config

`dockutil` (brew package) provides CLI control over macOS Dock items. The playbook checks current Dock state and only modifies it if it doesn't match the desired list. This avoids unnecessary Dock restarts on re-runs.

### `dockutil --remove all` fails on empty Dock

If the Dock is already empty, `dockutil --remove all` returns an error. The idempotency check prevents this by skipping the remove/add cycle when the Dock already matches.
