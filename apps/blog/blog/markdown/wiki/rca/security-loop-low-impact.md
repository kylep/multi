---
title: "RCA — Security Loop: Lower Impact Than Expected"
summary: "The autonomous security improvement loop ran for ~3 days and ~60 iterations but produced fewer substantive security improvements than expected."
keywords:
  - rca
  - security
  - autonomous-loop
  - post-mortem
scope: "Root cause analysis of why the security improvement loop underperformed relative to its runtime."
last_verified: 2026-03-22
---

## Incident

The autonomous security improvement loop ran from 2026-03-18 to 2026-03-22 (~3 days, ~60
iterations, 68 commits). Expected: comprehensive hardening of the Mac workstation. Actual:
a handful of real findings buried in significant wasted effort, one major component removed
as architecturally incompatible, and several findings re-discovered 8+ times without lasting
resolution.

---

## Root Cause

**The loop was capable and fast but aimed at the wrong target.**

68 commits in 3 days reflects genuine execution velocity. The problem was what those commits
were doing: iterating on `protect-sensitive.sh` (ultimately removed), re-fixing the same
`.mcp.json` permission repeatedly, and improving loop mechanics — not finding and fixing real
security gaps.

The underlying cause: **LLM intuition is a weak security discovery mechanism.** The loop
discovered what the model happened to notice by reading config files and thinking about what
was missing. This is biased, unscored, and blind to anything the model doesn't know to look
for. A security scanner (Lynis, CIS benchmark) produces a complete, prioritized, scored
finding list in minutes. The loop's job should be executing remediations from that list, not
improvising the list itself.

---

## Failure Chain

Most wasted effort traces to a single chain that compounded across ~30 iterations:

**1. Sudo removed** (correct finding, ~iteration 25) — but this broke Ansible's `become:
true` tasks permanently for the rest of the run.

**2. Deployment fell back to ad-hoc shell bypasses** — `chflags nouchg` tricks, heredoc
writes, manual `cp` — because the authoritative deployment mechanism no longer worked.

**3. Ad-hoc fixes updated live state but not playbook source.**

**4. Next iteration found source still wrong and "re-fixed" it** — `.mcp.json` mode 0644
discovered and fixed 8+ times in one evening. Each fix landed in the deployed file; the
playbook source regressed back each time.

**5. Diversity enforcement couldn't catch it** — the loop saw different filenames and tool
calls each time, so the semantic duplicate wasn't detected.

**Fix:** Add a deployment verification gate. After each fix, run `ansible-playbook --check`
and confirm zero drift. Finding is not closed until the playbook enforces it durably.

---

## Contributing Factors

### Hook-based access controls on an autonomous agent are self-defeating

`protect-sensitive.sh` consumed multiple days across the entire run — fixing fnmatch
argument order, adding Grep/Glob matchers, closing shell quoting bypasses, managing
source/deployed divergence. It was removed on day 4 as "fundamentally incompatible with
agent autonomy."

This failure mode is architectural, not implementation. The agent needs to bypass the hook
to deploy the hook. Every bypass pattern written to deploy it is a pattern that could be
exploited to circumvent it. The controls that are robust on an AI workstation are OS-level:
filesystem permissions, firewall rules, sudo policy. These don't require the agent's
cooperation to enforce.

**For future loops: evaluate the architecture of a proposed control in iteration 1. If it
requires the agent to bypass itself to deploy itself, that's a disqualifying flaw.**

### No finding severity tier

The loop had no P0/P1/P2 concept. `AutomaticallyInstallMacOSUpdates missing from playbook`
(zero live risk — the live machine already had it set) competed for iteration budget with
`firewall completely off` (live exposure, immediately exploitable).

"Playbook drift" — settings applied live but not encoded in the playbook — dominated later
iterations. These are real but low urgency: the machine is already protected; only a rebuild
would be affected. They should be a separate, batched pass, not interleaved with live-gap
finding.

### ~20% of commits were loop mechanics

14+ of 68 commits were on the loop itself. The Python rewrite was correct — bash was
genuinely untestable under the pace of iteration — but it consumed most of day 2. A
more stable initial implementation would have recovered this time for actual findings.

---

## What Worked

- **Real findings with real impact.** Application Firewall completely off, passwordless sudo
  grant, world-readable API keys (`exports.sh` 0644, `.mcp.json` 0644), screen lock
  unconfigured. These were worth finding and are fixed.

- **Fully autonomous for 3 days.** No human intervention required beyond Discord steering.
  The operator directives channel proved the steering mechanism works.

- **The audit log.** Net-new capability that survived the loop. The JSONL record is what
  made this RCA possible.

- **Python rewrite quality.** 35 unit tests, clean structure. The loop is now maintainable
  for future runs.

---

## Action Items

| # | Action | Why |
|---|--------|-----|
| 1 | **Lead with a scanner.** Run Lynis or equivalent before any LLM-driven iteration. Loop works the scored finding list top-down. | Replaces intuition-based discovery with ground truth |
| 2 | **Add deployment verification gate.** After each fix: `ansible-playbook --check`. Finding not closed until playbook enforces it with zero drift. | Breaks the re-finding loop caused by ad-hoc deployments |
| 3 | **Separate playbook-drift pass.** Tag and defer "live but not in playbook" findings. Run them as a batched cleanup, not interleaved with live-gap work. | Eliminates low-urgency noise from the core loop |
| 4 | **Tier findings before acting.** P0 = live exploitable now, P1 = exploitable on rebuild, P2 = defense-in-depth. Address in order. | Prevents low-impact work crowding out high-impact work |
| 5 | **Architecture review in iteration 1.** If a proposed control requires the agent to bypass itself to deploy, reject it before iterating. | Avoids the protect-sensitive.sh sunk cost |
| 6 | **Cap meta-work.** Loop mechanics improvements are scheduled, not reactive. One meta-commit per 10 finding commits maximum. | Protects finding time from loop self-improvement |
