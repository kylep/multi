---
title: "pai NUC k3s Cluster"
summary: "Single-node k3s on the pai Intel NUC: Ubuntu 26.04 over WiFi, bootstrapped over SSH from infra/pai-nuc/, workloads via the k3s auto-deploy manifests dir."
keywords:
  - k3s
  - kubernetes
  - nuc
  - homelab
  - servicelb
  - local-path
  - ubuntu
  - autoinstall
  - bootstrap
related:
  - wiki/devops/ai-agents-infra
  - wiki/devops/bootstrap
scope: "Covers the pai NUC server setup, k3s install, networking, storage, and workload deployment. Does not cover the Mac clusters (pai-m1, kyle-m2) or the ai-agents stack."
last_verified: 2026-07-17
---

Single-node Kubernetes homelab on an Intel NUC, hostname `pai`, at
`192.168.2.240` on home WiFi. Everything about the machine is code in
`infra/pai-nuc/`; the only manual steps were flashing USB sticks and
pressing the power button.

## The server

- **Hardware**: Intel NUC, NVMe system disk, WiFi NIC (no ethernet run to it).
- **OS**: Ubuntu Server 26.04 LTS, installed unattended via Ubuntu
  autoinstall (cloud-init NoCloud: `user-data` on a `CIDATA` USB volume
  answers every installer question — user, SSH key, disk layout, WiFi).
  The autoinstall config holds the WiFi PSK and password hash, so it lives
  in the private env-config repo, not here.
- **Access**: `ssh pai` (key-only; password auth disabled). The `pai` user
  has passwordless sudo. GitHub access is set up on the box: git-over-SSH
  with its own ed25519 key plus an authenticated `gh` CLI.

## The cluster

k3s `v1.36.2+k3s1` (Kubernetes v1.36.2), installed by
`infra/pai-nuc/bin/bootstrap.sh` over SSH with the version pinned. The
server config is `infra/pai-nuc/k3s-config.yaml`, synced to
`/etc/rancher/k3s/config.yaml` before install so no flags ride the
curl-pipe.

k3s defaults do the heavy lifting on a single node:

- **Datastore**: sqlite (no etcd).
- **Ingress/NAT**: bundled servicelb (klipper-lb) exposes any
  `type: LoadBalancer` Service directly on the node's WiFi IP, with
  kube-proxy NATing into the pod network. Bundled Traefik is also running
  for HTTP ingress. No MetalLB — L2 announcement over WiFi is unreliable
  and unnecessary with one node.
- **Storage**: bundled local-path-provisioner backs PVCs with hostPath
  volumes under `/var/lib/rancher/k3s/storage` (StorageClass
  `local-path`, the default).

## Workloads

Manifests in `infra/pai-nuc/manifests/` are synced by the bootstrap script
into `/var/lib/rancher/k3s/server/manifests/`, the k3s auto-deploy dir:
k3s applies whatever lands there on startup and on file change. Removing a
file does not delete its resources — delete those with kubectl.

Current workloads:

- `nginx.yaml` — generic nginx Deployment in the `web` namespace with a
  LoadBalancer Service on port 8080: <http://pai:8080>.

## Operating it

```bash
# from the Mac, in multi/
infra/pai-nuc/bin/bootstrap.sh        # install/update k3s + sync manifests; idempotent
infra/pai-nuc/bin/kubeconfig.sh       # write ~/.kube/pai-nuc.yaml
export KUBECONFIG=~/.kube/pai-nuc.yaml
kubectl get pods -A
```

On the box itself, `sudo k3s kubectl ...` always works. The k3s systemd
unit (`k3s.service`) restarts the cluster on reboot with no extra steps.

## Growing it later

The ai-agents helmfile already supports per-cluster environments
(`helmfile -e <env> apply`); adding a `pai-nuc` environment file is the
path to running ArgoCD or agent workloads here. See
[AI Agents Infra](/wiki/devops/ai-agents-infra.html).
