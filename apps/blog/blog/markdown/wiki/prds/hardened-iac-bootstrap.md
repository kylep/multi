---
title: "Hardened IaC Bootstrap"
summary: "Reproducible, Vault-integrated, PSS-enforced infrastructure-as-code for the AI agent K8s stack, bootstrappable from a single script on any K3s cluster."
status: approved
owner: kyle
date: 2026-03-17
related:
  - wiki/prds/autonomous-publisher
  - wiki/devops/agent-controller
  - wiki/security
---

## Problem

The AI agent infrastructure (controller, publisher pipeline, journalist)
runs on Rancher Desktop but cannot be reliably reproduced from scratch.
Three specific gaps exist:

1. **No reproducibility guarantee.** If Kyle resets Rancher Desktop to
   factory defaults or moves to a different machine, there is no single
   process to stand the agent stack back up. The current setup was built
   incrementally with manual `helm install` and `kubectl apply` commands.
   There is no documented, tested bootstrap path.

2. **Inconsistent security posture.** The OpenClaw deployment uses Vault
   for secrets, PSS restricted enforcement, and resource quotas. The
   agent controller — which runs AI agents that execute arbitrary code —
   stores 13 secrets in plain K8s Secrets, has no namespace-level PSS
   enforcement, and no resource quotas. The agent workloads are less
   hardened than the third-party tool they're replacing.

3. **Two secrets patterns.** OpenClaw uses Vault Agent Injector; the
   agent controller uses K8s Secrets with `env.valueFrom.secretKeyRef`.
   Maintaining two approaches increases cognitive load and makes security
   auditing harder. AI agent pods are a higher exfiltration risk than
   static workloads because they execute LLM-generated code at runtime.

This matters because the agent stack is becoming Kyle's primary
productivity tool. Fragile, inconsistently hardened infrastructure under
autonomous AI agents is an increasing risk as the system grows.

## Goal

Tear down Rancher Desktop to a bare K3s cluster, run a single bootstrap
process, and have the full AI agent stack (Vault, agent controller,
supporting infra) running with production-grade security hardening —
all from declarative config checked into the monorepo.

## Success Metrics

1. **Tear-down test passes.** Reset Rancher Desktop to base K3s, run
   the bootstrap, and the agent controller + journalist cron + publisher
   manual task are all operational. Verified by triggering a journalist
   run and a publisher run after bootstrap.
2. **Zero plain-text K8s Secrets for agent workloads.** All secrets
   consumed by agent pods come from Vault, not from K8s Secret objects.
3. **PSS restricted enforcement.** The `ai-agents` namespace has
   `pod-security.kubernetes.io/enforce: restricted` and all pods
   schedule successfully under it.

## Non-Goals

- **Cloud K8s migration.** This PRD targets Rancher Desktop / local K3s
  only. Cloud provider selection (DigitalOcean, Vultr, Linode) is a
  future project. The IaC should be portable, but verifying on cloud
  is out of scope.
- **GitOps reconciliation.** No Argo CD, Flux, or continuous drift
  detection. The bootstrap is an imperative `helm install` / script
  process, not a reconciliation loop. GitOps is overkill for a
  single-operator local cluster.
- **Automated Vault unsealing.** Manual unseal after reboot is
  acceptable. Auto-unseal requires either cloud KMS (contradicts
  no-cloud constraint) or storing unseal keys in a file (reduces
  security). A post-reboot unseal script is in scope; auto-unseal
  is not.
- **OpenClaw.** The OpenClaw workload is being replaced by the custom
  agent system. This PRD does not include migrating or maintaining
  OpenClaw infrastructure.
- **MetalLB or NUC-specific infra.** Only the AI agent stack is in
  scope. Home lab networking is a separate concern.
- **IaC linting or CI validation.** No helm lint, kubeval, or
  policy-as-code tools. The tear-down-and-rebuild test is the
  validation method (see Success Metrics).

## User Stories

### Story: Bootstrap from scratch

As Kyle, I want to run a single bootstrap process on a bare K3s cluster
so that I get the full AI agent stack running without remembering manual
steps.

**Acceptance criteria:**
- [ ] A documented entry point (script or Helm-based) bootstraps Vault,
      the agent controller, CRDs, and agent task definitions in the
      correct dependency order
- [ ] The bootstrap process is idempotent — running it twice does not
      produce errors or duplicate resources
- [ ] The bootstrap completes successfully on a fresh Rancher Desktop
      K3s cluster with no pre-existing state beyond default K3s
      components
- [ ] A person with K8s experience can execute the bootstrap on a fresh
      cluster using only the wiki guide, with no verbal instructions or
      prior knowledge of this system

### Story: Vault-managed secrets for agent workloads

As Kyle, I want all agent pod secrets to come from Vault so that
secrets are audited, scoped by role, and never stored as plain K8s
Secret objects.

**Acceptance criteria:**
- [ ] Agent pods receive secrets from Vault at runtime, not from K8s
      Secret objects or environment variables sourced from K8s Secrets
- [ ] Vault authenticates agent pods via K8s auth bound to the agent
      ServiceAccount in the `ai-agents` namespace
- [ ] A Vault policy scopes agent secret access to only the paths
      they need (not a blanket read on all secrets)
- [ ] Vault audit logging is enabled so secret access is traceable

### Story: PSS-enforced namespace with resource quotas

As Kyle, I want the agent namespace to enforce the PSS restricted
profile and resource quotas so that a misbehaving agent cannot escalate
privileges or consume unbounded resources.

**Acceptance criteria:**
- [ ] The `ai-agents` namespace has `pod-security.kubernetes.io/enforce:
      restricted` and `pod-security.kubernetes.io/warn: restricted`
      labels
- [ ] All agent controller and agent job pods schedule successfully
      under the restricted profile (no PSS violations)
- [ ] A ResourceQuota limits total CPU, memory, and pod count in the
      `ai-agents` namespace

### Story: Portable across K8s environments

As Kyle, I want the IaC to work on any standard K8s cluster so that
I can eventually deploy to a second machine or a cloud provider without
rewriting the infrastructure.

**Acceptance criteria:**
- [ ] No Rancher Desktop-specific or K3s-specific APIs are used in
      Helm charts or manifests (standard K8s APIs only)
- [ ] Storage uses PVCs with a configurable StorageClass (defaults to
      `local-path` but overridable in values)
- [ ] Environment-specific values (storage class, domain names, resource
      limits) are separated into a values override file, not hardcoded

### Story: Post-reboot recovery

As Kyle, I want a documented process to recover the agent stack after
a machine reboot so that I don't lose time debugging why things aren't
working.

**Acceptance criteria:**
- [ ] A post-reboot script or documented commands unseal Vault and
      verify the agent stack is healthy
- [ ] The wiki guide includes a troubleshooting section for common
      post-reboot issues (Vault sealed, pods pending, webhook timeout)
- [ ] Scheduled agent tasks (journalist cron) fire at their next
      scheduled time once Vault is unsealed — no manual re-triggering
      required

## Scope

### In v1

- Bootstrap script/process that installs: Vault, agent controller
  (Helm), CRD, agent task definitions (journalist cron, publisher
  manual)
- Vault integration: K8s auth, agent-scoped policy, secret injection
  into agent pods, audit logging
- PSS restricted enforcement on `ai-agents` namespace
- ResourceQuota for `ai-agents` namespace
- Namespace manifest with security labels (replaces implicit namespace
  creation from `helm install --create-namespace`)
- PVC-based storage with configurable StorageClass (replacing raw
  hostPath where applicable)
- Environment-specific values file (storage class, resource limits)
- Wiki guide: bootstrap steps, prerequisites, post-reboot recovery,
  troubleshooting
- Post-reboot unseal script

### Deferred

- Auto-unseal (cloud KMS or local transit)
- Cloud K8s deployment and verification
- Argo CD / Flux GitOps reconciliation
- Helm umbrella chart (evaluate in design doc; may use helmfile or
  K3s HelmChart CRD instead)
- Per-agent-type Vault policies (v1 uses one shared policy for all
  agent types)
- IaC linting or policy-as-code in CI

## Open Questions

1. **Vault Agent Injector vs. PSS restricted compatibility.** The
   Vault Agent Injector init container does not set a container-level
   `seccompProfile`, which PSS restricted requires. HashiCorp closed
   the feature request as NOT_PLANNED (vault-k8s #377). The
   workaround is pod-level `seccompProfile` or the
   `vault.hashicorp.com/agent-json-patch` annotation. This needs
   testing to confirm it works on the current Vault Helm chart version
   before committing to Agent Injector + PSS restricted.

2. **Vault namespace PSS level.** The Vault server itself may not
   comply with PSS restricted. The Vault namespace likely needs
   `baseline` enforcement, not `restricted`. The design doc should
   determine what PSS level Vault's own namespace gets.

3. **Controller webhook NetworkPolicy.** The agent controller accepts
   webhooks on port 8080 but has no ingress NetworkPolicy. Should the
   bootstrap include an ingress rule allowing only specific sources,
   or is deny-all-ingress acceptable since webhooks are only used from
   kubectl port-forward?

4. **Bootstrap orchestration approach.** Three options exist: K3s's
   built-in HelmChart CRD (zero-dependency but K3s-specific), helmfile
   (portable but adds a dependency), or a shell script (simplest but
   least declarative). The design doc should evaluate these against
   the portability constraint.

5. **Vault secret delivery mechanism.** Agent Injector writes secrets
   to in-memory tmpfs (never touches etcd) but has PSS compatibility
   issues. Vault Secrets Operator is lighter-weight but syncs to K8s
   Secrets (stored in etcd). CSI Provider avoids etcd but doesn't
   support auto-renewal. The design doc should select the mechanism
   based on PSS compatibility testing results.

6. **Vault storage backend.** The current setup uses file storage. Raft
   (integrated storage) is forward-compatible if the cluster ever goes
   multi-node. Is Raft worth the complexity for a single-node setup,
   or is file storage sufficient?

## Risks

1. **Vault Agent Injector + PSS restricted incompatibility.** If the
   `agent-json-patch` workaround doesn't resolve the PSS violation,
   the alternatives are: (a) drop to PSS `baseline` for the agent
   namespace, (b) switch to Vault Secrets Operator (which syncs to K8s
   Secrets, partially defeating the purpose), or (c) use the Vault CSI
   Provider. Each alternative has tradeoffs documented in the research.

2. **Bootstrap order sensitivity.** Vault must be running and unsealed
   before agent pods can start (they depend on Vault Agent Injector).
   If the bootstrap script doesn't handle this ordering correctly,
   pods will crash-loop waiting for Vault. The script must wait for
   Vault readiness, not just Helm install completion.

3. **Vault webhook timeout on K3s.** K3s runs the API server as a
   binary, not a pod, which can cause webhook timeouts if the Vault
   Injector service isn't reachable yet. This is a known K3s gotcha
   that could cause intermittent pod scheduling failures during
   bootstrap.

4. **Scope creep into GitOps.** The non-goal of GitOps reconciliation
   means drift is possible — someone could `kubectl edit` a resource
   and diverge from the repo. This is acceptable for a single-operator
   setup but should be acknowledged.

5. **Increased operational complexity.** Adding Vault means an
   additional component to manage, unseal after reboots, and debug
   when things go wrong. The wiki guide and post-reboot script
   mitigate this, but Vault failures will block all agent workloads
   until resolved.
