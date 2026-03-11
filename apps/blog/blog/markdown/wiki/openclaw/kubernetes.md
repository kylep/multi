---
title: "OpenClaw Kubernetes Security"
summary: "Six-layer security hardening for OpenClaw on K3s: network policies, RBAC, seccomp, read-only filesystem, resource limits, and pod security standards."
keywords:
  - openclaw
  - kubernetes
  - k3s
  - security
  - network-policy
  - rbac
  - seccomp
related:
  - wiki/openclaw
  - wiki/devops/security-toolkit
  - openclaw-k8s
scope: "Covers Kubernetes security configuration for OpenClaw. Does not cover OpenClaw application logic or general K8s administration."
last_verified: 2026-03-10
---


Security hardening for running OpenClaw on a K3s cluster. Six layers
of defense-in-depth applied to the deployment.

## Security Layers

1. **Network Policies**: restrict ingress/egress to required endpoints only
2. **RBAC**: minimal service account permissions
3. **Seccomp profiles**: syscall filtering
4. **Read-only root filesystem**: tmpfs for writable paths only
5. **Resource limits**: CPU and memory caps to prevent resource exhaustion
6. **Pod Security Standards**: restricted PSS profile

## Challenges

- K3s uses Traefik by default, which complicates network policy enforcement
- Seccomp profiles need to be deployed to each node
- Read-only filesystem requires identifying all writable paths upfront

## Related Blog Posts

- [Trying to Secure OpenClaw using Kubernetes](/openclaw-k8s.html):
  full implementation walkthrough
