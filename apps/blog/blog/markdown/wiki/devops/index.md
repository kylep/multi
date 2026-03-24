---
title: "DevOps"
summary: "Development operations tooling: cross-tool AI rule management, code review automation, and agent orchestration."
keywords:
  - devops
  - tooling
  - coderabbit
  - ruler
related:
  - wiki/blog-architecture
scope: "Covers DevOps tooling and infrastructure provisioning (bootstrap, Vault, Helm). Does not cover cloud services."
last_verified: 2026-03-15
---


Tooling for code quality, agent orchestration, and cross-tool
configuration management.

## Pages

- [Ruler](/wiki/devops/ruler.html) — Cross-tool AI rule inventory
- [CodeRabbit](/wiki/devops/coderabbit.html) — False positive patterns and path_instructions
- [AI Agents Infrastructure](/wiki/devops/ai-agents-infra.html) — Stack layout, ArgoCD GitOps, per-cluster config, bootstrap
- [Agent Controller](/wiki/devops/agent-controller.html) — K8s controller for autonomous AI agent runs via CRDs
- [Bootstrap & Recovery](/wiki/devops/bootstrap.html) — Single-command bootstrap, Vault secrets, post-reboot recovery
- [Mac Setup Learnings](/wiki/devops/mac-setup-learnings.html) — Gotchas and patterns from the Ansible-managed Mac setup
- [Mac Setup Run Log](/wiki/devops/mac-setup-run-log.html) — Per-run decision log from bootstrap execution
