---
title: "Evaluation Rubric"
summary: "Scoring rubric for autolearn tool evaluations. Five criteria, 1-5 scale."
keywords:
  - rubric
  - evaluation
  - autolearn
  - scoring
related:
  - wiki/evaluations
  - wiki/stack-contract
  - wiki/research/autolearn-v1
scope: "Defines the criteria and scoring scale used by the autolearn agent to assess tools. Based on cross-source consensus from the autolearn-v1 research."
last_verified: 2026-04-01
---

## Criteria

### 1. K8s Native (weight: 0.25)

Does the tool deploy as native Kubernetes resources manageable by ArgoCD?

| Score | Description |
|-------|-------------|
| 5 | Helm chart or plain manifests, deploys cleanly with ArgoCD |
| 4 | Helm chart available but needs minor customization |
| 3 | Has k8s support but requires an operator or CRDs |
| 2 | Can run in k8s but not designed for it (Docker only) |
| 1 | No k8s support, requires a VM or bare metal |

### 2. Stack Overlap (weight: 0.20)

Does it replace, complement, or conflict with existing stack components?

| Score | Description |
|-------|-------------|
| 5 | Fills a clear gap with no overlap |
| 4 | Complements existing tools, minor overlap |
| 3 | Overlaps with something in the stack but adds new capabilities |
| 2 | Mostly duplicates existing functionality |
| 1 | Direct conflict with current stack choices |

### 3. Operational Complexity (weight: 0.20)

What is the operational burden to run and maintain this tool?

| Score | Description |
|-------|-------------|
| 5 | Zero-config, runs as a sidecar or static binary |
| 4 | Simple config, minimal resource usage, no persistent state |
| 3 | Needs a database or persistent volume, moderate config |
| 2 | Multiple components, complex config, significant resources |
| 1 | Requires dedicated infra team, heavy resource usage |

### 4. Value Add (weight: 0.20)

What capability does it add that the current stack lacks?

| Score | Description |
|-------|-------------|
| 5 | Solves a painful, recurring problem with no current solution |
| 4 | Significant improvement over current manual process |
| 3 | Nice to have, moderate improvement |
| 2 | Marginal improvement, could live without it |
| 1 | No clear value over current stack |

### 5. Community Health (weight: 0.15)

Is the project actively maintained with a healthy community?

| Score | Description |
|-------|-------------|
| 5 | Major org backing, >5k stars, active releases, responsive issues |
| 4 | Active maintainers, regular releases, good docs |
| 3 | Maintained but slow-moving, adequate docs |
| 2 | Sporadic maintenance, stale issues, minimal docs |
| 1 | Abandoned or single-maintainer with no recent activity |

## Scoring

Weighted score = (k8s_native * 0.25) + (stack_overlap * 0.20) +
(operational_complexity * 0.20) + (value_add * 0.20) +
(community_health * 0.15)

| Weighted Score | Verdict |
|----------------|---------|
| >= 3.5 | **adopt** — Integrate into the stack |
| 2.5 - 3.4 | **watch** — Promising, re-evaluate later |
| < 2.5 | **skip** — Doesn't fit |

These thresholds are initial estimates. Adjust after 5+ evaluations
based on which scores actually predicted useful tools.
