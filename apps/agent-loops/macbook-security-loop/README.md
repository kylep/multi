# Autonomous Security Improvement Loop

Long-running bash wrapper that spawns Claude Code every 30 minutes to
iteratively discover and fix security gaps in the Mac workstation's
safety hooks, with adversarial verification and cost controls.

Design doc: `apps/blog/blog/markdown/wiki/design-docs/security-improvement-loop.md`

## Usage

```bash
source apps/blog/exports.sh
apps/agent-loops/macbook-security-loop/loop.sh
```

For a single iteration without commits or Discord notifications:

```bash
source apps/blog/exports.sh
apps/agent-loops/macbook-security-loop/loop.sh --dry-run
```

Follow the log:

```bash
tail -f /tmp/sec-loop.log
```

### Long-running (tmux)

```bash
tmux new -s sec-loop
source apps/blog/exports.sh
apps/agent-loops/macbook-security-loop/loop.sh
# Ctrl-b d to detach
```

## Required env vars

All sourced from `apps/blog/exports.sh`:

| Variable | Purpose |
|----------|---------|
| `DISCORD_BOT_TOKEN` | Discord bot authentication |
| `DISCORD_STATUS_CHANNEL_ID` | Milestones (iteration complete, termination, budget) |
| `DISCORD_LOG_CHANNEL_ID` | Operational logs (failures, warnings) |

Discord notifications are optional -- the script is a no-op if these
are unset.

## How it works

Each iteration:

1. **Cost gate** -- estimates today's spend from `~/.claude/projects/` JSONL
   logs. Stops if over $150/day.
2. **Improvement** -- `claude -p prompt.md` finds and fixes one security gap
   ($5 cap, 30 turns).
3. **Verification** -- `claude -p verify-prompt.md` adversarially tests the
   fix ($2 cap, 15 turns).
4. **Commit or revert** -- passes get committed, failures get `git restore .`'d.
5. **Sleep 30 minutes**, repeat.

The loop self-terminates when the improvement agent reports no gaps remain.

## Files

| File | Purpose |
|------|---------|
| `loop.sh` | Wrapper script (loop, lock file, cost gate, Discord) |
| `prompt.md` | Improvement iteration prompt for Claude Code |
| `verify-prompt.md` | Adversarial verification prompt for Claude Code |
