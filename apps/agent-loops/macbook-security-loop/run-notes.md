# Security Loop Run Notes

Shared scratchpad between the improvement agent and adversarial verifier.
Updated each iteration with observations, strategies, and lessons learned.
Persists across runs so future iterations build on past experience.

## Observations

**Iteration 1 (2026-03-19):**
- `protect-sensitive.sh` `check_path()` only covered `.env`, `.ssh/id_*`, `.aws/credentials`, `.kube/config`.
- `exports.sh` at `~/gh/multi/apps/blog/exports.sh` holds `GITHUB_APP_PRIVATE_KEY_B64`, `DISCORD_BOT_TOKEN`, `OPENROUTER_API_KEY` — completely unprotected.
- `secrets/` directory also unprotected.
- The bash-command regex guards were similarly incomplete, only blocking `cat .env` and `cat .ssh/...`.
- **Fix applied:** Added `*/exports.sh` and `*/secrets/*` to `check_path()`, plus bash-command regex for `exports.sh` and `secrets/` covering cat/less/head/tail/base64/strings/xxd/grep.
- Other exfiltration vectors (python -c, node -e, vim) remain unblocked but are much harder to trigger via prompt injection.

## Strategy Notes

- Prioritize protecting named credential files and directories first (exports.sh, secrets/).
- The `check_path()` function covers the Read/Edit/Write tools cleanly — extend it when adding new patterns.
- Bash command detection is inherently incomplete (too many ways to read a file in bash). Focus on the highest-frequency read tools.

## Known Limitations

- Bash exfiltration via `python3 -c "open('exports.sh').read()"`, `node -e`, `vim`/`nano`, `awk`, `sed` etc. — these are not blocked. The bash regex only catches the most common shell read commands.
- `protect-sensitive.sh` bash detection uses substring grep rather than path-anchored matching, so it could have false positives (e.g., a file named `not-exports.sh`). Acceptable trade-off for now.
- The audit log hook uses Ansible `template` (not `copy`) so the `REPO_DIR` variable is templated in at deploy time — if the repo moves, the log path breaks silently.
