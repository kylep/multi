---
title: "Autonomous Security Improvement Loop"
summary: "A long-running loop that invokes Claude Code every 30 minutes to iteratively harden the Mac workstation's security posture, with cost controls, coordination, and structured logging."
status: draft
owner: kyle
date: 2026-03-18
hidden: false
related:
  - wiki/security
  - wiki/custom-tools/cc-usage-mcp
---

## Problem

The Mac workstation (`pai-m1`) runs Claude Code in bypass-permissions mode
as an always-on AI workstation. Existing security controls (hook scripts,
pre-commit hooks, security-auditor agent) are detection-oriented: they
flag issues but do not remediate them. The scanning tools (semgrep, trivy,
gitleaks) run manually before PRs, not continuously.

Three specific gaps exist:

1. **No remediation loop.** The `block-destructive.sh` and
   `protect-sensitive.sh` hooks block known-bad patterns, but no
   process exists to discover new patterns, tighten existing rules,
   or apply best practices that no single scanner covers. Security
   improvements happen only when Kyle thinks of them.

2. **Detection gaps in existing hooks.** The `protect-sensitive.sh`
   hook blocks `cat`, `less`, `head`, `tail`, `curl -d @`, `base64`,
   and `scp` access to sensitive files, but does not block `cp`, `mv`,
   `vim`, or other read methods. The `block-destructive.sh` hook uses
   glob matching that multi-line commands or variable indirection could
   bypass. These gaps are known but unfixed.

3. **No continuous posture assessment.** The workstation's security
   posture is a snapshot from whenever the Ansible playbook was last
   updated. There is no process to evaluate whether new attack vectors,
   configuration drift, or evolving best practices warrant changes.

This matters because the workstation runs AI agents with unrestricted
tool access. The security posture directly determines the blast radius
of any agent misbehavior or prompt injection attack.

## Goal

An autonomous process iteratively discovers, implements, verifies, and
commits security improvements to the Mac workstation every 30 minutes,
with cost controls, run coordination, Discord status updates, and a
structured wiki log — until there is nothing meaningful left to improve.

## Success Metrics

1. **Meaningful improvements committed.** The wiki improvement log
   contains entries that Kyle judges as real security improvements
   (not busywork) when he reviews the log.
2. **No autonomy regressions.** At no point does a committed change
   break Claude Code's ability to operate autonomously on the
   workstation. The Ansible playbook remains the source of truth and
   all changes are made through it.
3. **Self-termination.** The loop reaches a "nothing worth doing"
   state and exits cleanly, rather than running indefinitely making
   trivial changes.

## Non-Goals

- **Autonomy reduction.** The loop must never reduce the system's
  autonomous capabilities. It hardens security while preserving full
  bypass-permissions operation. If a security improvement would
  restrict Claude Code's ability to function, it is out of scope.
- **K8s infrastructure changes.** The Hardened IaC Bootstrap PRD covers
  K8s security. This loop focuses exclusively on the Mac workstation.
- **Blog content security.** The security-auditor agent handles blog
  content scanning. This loop does not scan or modify blog posts.
- **New security tooling.** The loop does not build new scanning
  tools, MCP servers, or security frameworks. It works with what
  already exists on the workstation.
- **Ongoing production service.** This is a time-boxed improvement
  effort (days, not permanent). It is not a permanent daemon or
  monitoring system.
- **Scanner-only remediation.** The loop is not a wrapper that runs
  scanners and fixes their output. It reasons broadly about security
  posture and decides what to improve. Scanners are one possible
  input among many.

## User Stories

### Story: Iterative security hardening

As Kyle, I want an autonomous loop to continuously discover and
implement security improvements on my Mac workstation so that the
security posture improves over time without my direct involvement.

**Acceptance criteria:**
- [ ] Each iteration produces at least one git commit containing a
      security improvement to the Ansible playbook, with a commit
      message describing what was hardened and why
- [ ] Changes persist across machine rebuilds — the Ansible playbook
      is the mechanism of change, not direct file edits
- [ ] Each iteration appends a structured entry to the wiki
      improvement log with: timestamp, finding, change made,
      verification method, and verification result (pass/fail)
- [ ] After each change, the loop verifies that Claude Code can still
      operate (e.g., run a tool call, read a file) before committing
- [ ] The loop exits when it cannot identify a change that would
      materially reduce attack surface or blast radius

### Story: Cost-controlled execution

As Kyle, I want the loop to stop if daily spend exceeds $150 USD so
that costs stay bounded even if the loop runs for days.

**Acceptance criteria:**
- [ ] Before each iteration, the loop checks the current calendar
      day's total Claude Code spend
- [ ] If daily spend exceeds $150 USD, the loop logs the reason and
      exits without starting the iteration
- [ ] The cost check accounts for all Claude Code usage on the
      workstation, including the loop's own spend

### Story: Run coordination

As Kyle, I want the wrapper script to handle concurrent invocations
gracefully so that overlapping runs do not corrupt state or waste
resources.

**Acceptance criteria:**
- [ ] A new invocation detects if a previous iteration is still
      active
- [ ] If an iteration is active, the new invocation chooses one of
      three actions: terminate the running iteration and take over,
      wait 1 minute and re-check (max once), or skip this cycle
      entirely (max once)
- [ ] Active-run detection does not produce false positives after a
      crash — stale state is detected and cleaned up

### Story: Discord status updates

As Kyle, I want the loop to post short status updates to
Discord #status-updates so that I can monitor progress without
checking the wiki.

**Acceptance criteria:**
- [ ] Each iteration posts a short summary (what was found, what
      was changed, pass/fail) to #status-updates via the Discord MCP
- [ ] Self-termination posts a final summary with total iterations
      and total improvements committed
- [ ] Cost-limit exits post a message explaining why the loop stopped

## Scope

### In v1

- Wrapper process that triggers a security improvement iteration
  every 30 minutes using a cost-effective model (Sonnet)
- Coordination logic for handling concurrent invocations
  (kill/wait/skip)
- Cost gate: daily spend cap of $150 USD, checked before each
  iteration
- Structured wiki improvement log
- Discord #status-updates notifications on each iteration and on
  exit
- Per-iteration prompt scoped to Mac workstation security
- Self-termination when no material improvements remain
- All security changes persisted through the Ansible playbook

### Deferred

- Scheduled execution via launchd or cron (v1 uses a manually
  started wrapper script)
- K8s infrastructure hardening (covered by Hardened IaC Bootstrap PRD)
- Automated rollback (Ansible playbook re-run is the manual rollback)
- Multi-workstation support
- Persistent daemon mode with restart-on-crash
- Alerting on security regressions (vs. improvements)

## Open Questions

1. **cc-usage MCP availability in this worktree.** The cc-usage MCP
   exists on the `kyle/cc-usage-mcp` branch and the main working tree,
   but is not present in the `sec-improvement-loop` worktree. The
   branch needs to be rebased onto main or the MCP code pulled in
   before the cost gate can work.

2. **Discord channel ID for #status-updates.** No channel ID for
   #status-updates is currently configured in `exports.sh`. The
   implementation needs to either use the existing
   `DISCORD_LOG_CHANNEL_ID` or add a new env var for the
   status-updates channel.

3. **Coordination decision logic.** The PRD says the new Claude Code
   instance decides whether to kill, wait, or skip based on the
   running instance's log output. The exact heuristic is an
   implementation detail, but the wrapper script needs to surface
   enough context (last log lines, runtime duration) for the model
   to make a reasonable decision.

4. **Verification depth.** The loop creates its own verification
   plans per improvement. There is no prescribed verification method.
   The appropriate depth per change is left to the model's judgment,
   but the autonomy smoke test (AC #4 on the hardening story) is
   mandatory.

## Risks

1. **Autonomy regression.** The loop's primary constraint is "never
   impact autonomy." But security improvements inherently restrict
   capabilities. A hook that blocks a new command pattern could break
   a workflow the model doesn't anticipate. Mitigation: the model
   tests each change before committing, and Ansible is the rollback.

2. **Ansible playbook corruption.** Every change goes through the
   playbook. A bad edit could break the entire Mac restore process.
   Mitigation: frequent commits mean `git revert` is always available;
   the model should run `ansible-playbook --check` (dry-run) before
   applying.

3. **Cost overrun between checks.** The cost check happens before
   each iteration, but a single iteration could be expensive if the
   model does extensive research or makes many tool calls. The $150
   limit could be exceeded within a single iteration. Mitigation:
   Sonnet is significantly cheaper than Opus; a single iteration is
   unlikely to cost more than $5-10.

4. **Diminishing returns before self-termination.** The model might
   not recognize when improvements become trivial and continue making
   low-value changes. Mitigation: Kyle reviews the wiki log and can
   manually stop the loop; Discord updates provide visibility.

5. **Lock file stale state.** If the wrapper script crashes without
   cleanup (kill -9, power loss), the lock file persists and blocks
   future runs. Mitigation: trap-based cleanup and PID validation
   (check if the PID in the lock file is still running).
