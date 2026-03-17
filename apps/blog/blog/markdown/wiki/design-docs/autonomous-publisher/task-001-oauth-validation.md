---
title: "TASK-001: OAuth Token Validation"
status: complete
date: 2026-03-16
---

## Summary

Validated that Claude Max OAuth tokens work for headless autonomous execution.
All acceptance criteria passed.

## Results

### Token generation

`claude setup-token` succeeded on MacBook. No scope regression (GitHub issue
#23703 did not manifest). Token is long-lived (~1 year).

### Headless auth

```bash
CLAUDE_CODE_OAUTH_TOKEN=<token> claude -p "echo hello" --output-format text
```

Returned `hello`. No interactive prompts, no browser auth flow.

### Minimal `.claude.json`

```json
{"hasCompletedOnboarding": true}
```

This is the only field required. Tested by replacing `~/.claude.json` with
just this content -- headless auth still succeeded. This is what gets baked
into the runtime image (TASK-002).

### Conflicting env vars

```bash
CLAUDE_CODE_OAUTH_TOKEN=<token> ANTHROPIC_BASE_URL=https://openrouter.ai/api claude -p "echo hello" --output-format text
```

**Failure mode:** Process hangs, resists Ctrl-C, eventually prints:
```
Failed to authenticate. API Error: 401 {"error":{"message":"Missing Authentication header","code":401}}
```

**Implication for TASK-003:** The entrypoint script (`bin/run-publisher.sh`)
MUST unset these env vars before invoking Claude Code:

```bash
unset ANTHROPIC_API_KEY
unset ANTHROPIC_AUTH_TOKEN
unset ANTHROPIC_BASE_URL
```

The failure mode is particularly bad -- the hang + Ctrl-C resistance means
a stuck K8s job that only terminates on pod timeout.

## Acceptance Criteria

- [x] Run `claude setup-token`, obtain token
- [x] Headless `claude -p` succeeds with `CLAUDE_CODE_OAUTH_TOKEN`
- [x] `hasCompletedOnboarding: true` allows headless execution
- [x] Minimal `.claude.json` documented
- [x] Conflicting env var behavior confirmed

## Open item

- [ ] Verify the test run billed against Max subscription (check claude.ai
  usage dashboard) -- soft verification, auth clearly works
