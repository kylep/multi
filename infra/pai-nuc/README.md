# pai-nuc

Single-node k3s on the pai Intel NUC (Ubuntu Server 26.04, WiFi-attached at
`pai` / 192.168.2.240).

- `k3s-config.yaml` — the k3s server config, synced to `/etc/rancher/k3s/config.yaml`
- `manifests/` — workloads, synced to the k3s auto-deploy dir
- `bin/bootstrap.sh` — installs/updates everything over SSH; idempotent
- `bin/kubeconfig.sh` — pulls a local kubeconfig to `~/.kube/pai-nuc.yaml`

Full documentation: [pai NUC k3s wiki page](../../apps/blog/blog/markdown/wiki/devops/pai-nuc-k3s.md).
