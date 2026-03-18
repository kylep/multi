---
title: "Autonomous Publisher Pipeline"
summary: "Run the full publisher pipeline autonomously in K8s using Claude Max tokens, with self-verification and network isolation."
status: done
owner: kyle
date: 2026-03-16
related:
  - wiki/devops/agent-controller
  - wiki/agent-team/publisher
  - wiki/agent-team/org-chart
---

## Problem

The publisher pipeline (research, write, review, QA, security audit) only
runs interactively on Kyle's MacBook. This creates two bottlenecks:

1. **Token waste.** The K8s agent controller uses OpenRouter API credits
   for autonomous agent runs. Meanwhile, Kyle's Claude Max subscription
   has ~70% unused weekly capacity. The Max plan is prepaid; unused
   tokens are lost each week.

2. **Human-in-the-loop bottleneck.** The publisher pipeline requires
   Kyle to sit at the keyboard for the entire run. The journalist agent
   proves that K8s-based autonomous execution works, but only the
   journalist runs there today. The publisher — which produces the
   primary blog content — has never run in a container.

The result: blog content production is limited to Kyle's available
hours, and prepaid compute capacity goes unused.

## Goal

The publisher pipeline runs autonomously in K8s, uses Claude Max tokens
instead of OpenRouter, self-verifies its output (build, render, review),
and produces drafts that pass Kyle's review without changes 80% of the
time.

## Success Metrics

1. **First-pass acceptance rate**: 80%+ of autonomously produced drafts
   are merged without Kyle requesting changes.
2. **Token source**: 100% of autonomous publisher runs bill against the
   Claude Max subscription, not OpenRouter.
3. **Hands-off execution**: publisher pipeline completes end-to-end
   (research through security audit) without human intervention.

## Non-Goals

- **Auto-push to main.** Agents commit locally. Kyle reviews and pushes.
  No autonomous merges or deployments.
- **Auto-topic selection.** Kyle picks topics manually for v1. Agents
  pulling from a backlog or discovering topics from journal entries is
  a future feature.
- **Multi-agent concurrency.** Running multiple publisher pipelines in
  parallel is out of scope. The existing write-serialization model
  (one write-agent at a time) remains.
- **Code improvement loop.** Agents improving their own definitions,
  infrastructure, or tooling is out of scope for v1. This is content
  production only.
- **Replacing OpenRouter entirely.** The journalist and other agents
  may continue using OpenRouter. This PRD only covers routing the
  publisher pipeline through Max tokens.
- **Production deployment automation.** Only Kyle deploys to prod.
  This does not change.

## User Stories

### Story: Trigger an autonomous publisher run

As Kyle, I want to submit a topic to the agent controller and have the
full publisher pipeline run autonomously so that I get a review-ready
draft without sitting at the keyboard.

**Acceptance criteria:**
- [ ] Submitting a topic via the agent controller triggers the full
      publisher pipeline (research, write, review loop, QA, security
      audit) without manual steps
- [ ] The run commits the draft to a workspace branch, not main
- [ ] Kyle can review the draft after the run completes (e.g., via
      diff or PR)
- [ ] The run completes without human interaction — no permission
      prompts, no browser windows, no interactive auth

### Story: Use Claude Max tokens for autonomous runs

As Kyle, I want autonomous agent runs to use my Claude Max subscription
so that I stop paying OpenRouter for work my prepaid plan already covers.

**Acceptance criteria:**
- [ ] Autonomous publisher runs authenticate against the Max
      subscription, not OpenRouter API keys
- [ ] Publisher runs bill against the Max subscription, confirmed by
      checking the Claude.ai usage dashboard after a run
- [ ] There is a documented procedure to regenerate credentials if
      they expire between runs

### Story: Self-verifying output

As Kyle, I want the autonomous publisher to verify its own output
(builds, renders, passes review) so that what it hands back works on
the first try.

**Acceptance criteria:**
- [ ] The blog build step succeeds before the draft is committed; if
      the build fails, the pipeline fails
- [ ] The post renders correctly in a browser — verified by automated
      screenshot or accessibility-tree checks
- [ ] The adversarial review loop (reviewer subagent, max 3 passes)
      runs as part of the autonomous pipeline, same as interactive
- [ ] If any pipeline stage fails, the run exits with a failure status
      visible to Kyle

### Story: Sandboxed execution

As Kyle, I want autonomous agent runs to be sandboxed so that a
misbehaving agent cannot exfiltrate data or access files outside the
workspace.

**Acceptance criteria:**
- [ ] The agent cannot write to files outside its designated workspace
- [ ] Network egress is restricted to only the services required for
      operation (LLM API, git remote, package registries, configured
      MCP endpoints)
- [ ] The agent has no access to Kyle's personal files, SSH keys,
      browser state, or credentials beyond what is explicitly provided

## Scope

### In v1

- Claude Max subscription auth for autonomous agent runs
- Runtime environment capable of running the full publisher pipeline
  (blog build, dev server, browser-based verification)
- Publisher task definition for the agent controller (manual trigger)
- Network egress restriction to required services only
- Filesystem isolation — agent cannot access host files outside workspace
- Documented credential generation and rotation procedure

### Deferred

- Scheduled/cron publisher runs (v1 is manual trigger only)
- Cloud K8s migration (v1 runs on local Rancher Desktop; cloud
  provider evaluation is an open question)
- Topic queue integration (Linear, Discord, journal-based discovery)
- Multi-pipeline concurrency
- Automated token refresh (v1 uses manual `claude setup-token` rotation)

## Open Questions

1. **`claude setup-token` scope regression.** Issue #23703 reports that
   `setup-token` now requests only the `user interface` scope, producing
   an error about restricted tokens. The root issue (#8052) may or may
   not be resolved. This must be tested before implementation begins.

2. **Token lifetime and refresh.** The `CLAUDE_CODE_OAUTH_TOKEN` is
   reported to last ~1 year, but OAuth refresh token rotation could
   invalidate it sooner. What's the actual observed lifetime? Is manual
   re-generation acceptable, or do we need automated refresh?

3. **Runtime image size.** Adding Playwright + Chromium to the agent
   runtime image will significantly increase its size (Chromium alone
   is ~400MB). Is a separate publisher-specific image preferable to
   bloating the shared runtime?

4. **Onboarding flag.** Headless Claude Code requires
   `~/.claude.json` with `"hasCompletedOnboarding": true`. The current
   runtime image may not set this. Needs verification.

5. **Cloud K8s provider selection.** Three viable options exist under
   $50 CAD/month with Toronto regions: DigitalOcean DOKS (~$16 CAD),
   Vultr VKE (~$14 CAD, pending Toronto VKE confirmation), Akamai/Linode
   LKE (~$16 CAD). Selection criteria and migration path need a
   separate design doc if Kyle decides to move off local Rancher Desktop.

6. **Network policy granularity.** The allowlist needs to include
   api.anthropic.com, github.com, registry.npmjs.org, and MCP server
   endpoints. Are there other domains the publisher needs (e.g.,
   WebSearch/WebFetch targets during research)? WebFetch would require
   broad egress or a proxy.

## Risks

1. **Auth instability.** `CLAUDE_CODE_OAUTH_TOKEN` is a community
   workaround, not an officially supported auth method. Anthropic closed
   the M2M auth request as NOT_PLANNED. A future Claude Code update
   could break this flow without warning.

2. **Promotion timing.** The March 2026 doubled off-peak limits
   promotion ends March 28. If implementation takes longer than 12
   days, the extra capacity window is missed. The project remains
   valuable without the promotion, but urgency is real.

3. **Playwright in containers.** Running Chromium headless in a K8s pod
   requires specific flags, shared memory configuration (`/dev/shm`),
   and possibly elevated seccomp profiles. This is a known pain point
   that could block the QA verification step.

4. **Token expiry mid-run.** If the OAuth token expires during a
   long-running publisher pipeline (which could take 30+ minutes),
   the run fails partway through. There is no documented graceful
   handling for this in Claude Code.

5. **WebFetch vs. network isolation.** The researcher subagent uses
   WebFetch to access arbitrary URLs during research. Strict network
   egress policies would block this. The design must decide between
   broad research egress (weaker isolation) or a proxy/allowlist
   approach (more complex).
