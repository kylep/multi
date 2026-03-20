# Autonomous Security Improvement Loop

Long-running Python script that spawns Claude Code every 10 minutes to
iteratively discover and fix security gaps on the Mac workstation,
with adversarial verification and cost controls.

Originally written in bash (`loop.sh`), rewritten in Python after the
script outgrew bash — JSON parsing, JWT generation, integer arithmetic
on token counts, and Discord API calls were all fighting bash's type
system. The final straw was a cost gate crash caused by bash arithmetic
choking on a multi-line string that Python would have handled as a
simple `int()` call.

Design doc: `apps/blog/blog/markdown/wiki/design-docs/security-improvement-loop.md`

## Usage

```bash
cd ~/gh/multi
python3 apps/agent-loops/macbook-security-loop/loop.py
```

One iteration without commits or Discord:

```bash
python3 apps/agent-loops/macbook-security-loop/loop.py --dry-run
```

One full iteration (commits + push) then exit:

```bash
python3 apps/agent-loops/macbook-security-loop/loop.py --one-shot
```

Follow the log:

```bash
tail -f /tmp/sec-loop.log
```

### Long-running (tmux)

```bash
tmux new -s sec-loop
cd ~/gh/multi
python3 apps/agent-loops/macbook-security-loop/loop.py
# Ctrl-b d to detach
```

## Tests

```bash
cd apps/agent-loops/macbook-security-loop
python3 -m pytest test_loop.py -v
```

## Required env vars

All parsed from `apps/blog/exports.sh` (no need to source it first):

| Variable | Purpose |
|----------|---------|
| `DISCORD_BOT_TOKEN` | Discord bot authentication |
| `DISCORD_STATUS_CHANNEL_ID` | Milestones (iteration complete, termination, budget) |
| `DISCORD_LOG_CHANNEL_ID` | Operational logs (failures, warnings) |
| `GITHUB_APP_ID` | GitHub App for git push |
| `GITHUB_APP_PRIVATE_KEY_B64` | Base64-encoded PEM key |
| `GITHUB_INSTALL_ID` | GitHub App installation ID |

Discord and push are optional — the script no-ops if credentials are unset.

## How it works

Each iteration:

1. **Cost gate** — sums today's token usage from `~/.claude/projects/` JSONL
   logs. Stops if over $200/day.
2. **Improvement** — `claude -p prompt.md` finds and fixes one security gap
   ($5 cap, 30 turns).
3. **Verification** — `claude -p verify-prompt.md` adversarially tests the
   fix ($2 cap, 15 turns).
4. **Commit or revert** — passes get committed and pushed, failures get
   `git restore`'d.
5. **Sleep 10 minutes**, repeat.

The loop self-terminates when the improvement agent reports no gaps remain.

Retries escalate: attempt 2 asks for a different approach, attempt 3
suggests abandoning, attempt 4+ strongly recommends pivoting to a
different area entirely.

## Steering the loop

The operator can steer the loop remotely by editing `prompt.md`,
`verify-prompt.md`, or `run-notes.md` — these are re-read fresh each
iteration. No restart needed. See "Operator Steering Log" in
`run-notes.md` for the full history.

## Files

| File | Purpose |
|------|---------|
| `loop.py` | Main loop (Python) |
| `loop.sh` | Original bash version (preserved for reference) |
| `test_loop.py` | Unit tests (pytest) |
| `prompt.md` | Improvement iteration prompt for Claude Code |
| `verify-prompt.md` | Adversarial verification prompt for Claude Code |
| `run-notes.md` | Shared scratchpad between agents and operator |
