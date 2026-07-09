---
title: "Installing Talos and Kubernetes on my Intel NUC"
summary: How I installed Talos Linux from .iso for K8s on my homelab NUC
slug: talos-kubernetes-intel-nuc
category: kubernetes
tags: Talos, Kubernetes, Intel-NUC, homelab, bare-metal
date: 2026-07-08
modified: 2026-07-08
status: published
image: talos-kubernetes-intel-nuc.png
thumbnail: talos-kubernetes-intel-nuc-thumb.png
imgprompt: A simple flat vector mini-PC box with the Kubernetes helm wheel
  floating above it, minimal lines, solid pastel colors, no shading, clean
  geometric shapes on a plain background
keywords:
  - talos linux intel nuc
  - single node talos kubernetes cluster
  - talos image factory metal iso
  - talosctl bootstrap single node
  - install talos from macos usb
---


I have one Intel NUC and I want Kubernetes on it. I went with Talos for fun, k8s would
have worked too. These are the 'works on my machine' (today) steps.


# Why Talos and not k3s or kubeadm

Talos Linux is an immutable, API-managed OS that exists to run Kubernetes and
nothing else. There is no SSH, no shell, no package manager, no `/bin/bash` to
drop into. You manage the machine through a single gRPC API (`apid`, mTLS, client
cert required) using `talosctl`. The entire node is described by one machine
config file, which is the declarative source of truth for the box.

That last part is the reason I care. On a k3s or kubeadm host you still have a
Linux system underneath with its own lifecycle: SSH keys, a package manager,
config files you edited at 2am and forgot about, drift. Talos deletes that whole
category of problem. There is no host to drift because there is no host you can
log into. The node is whatever the config says it is, and changing it means
changing the config and re-applying.

The tradeoff is real. When something breaks you debug it through the API, not by
SSHing in and poking around. If your instinct is "I'll just log in and check,"
Talos will frustrate you. That constraint is the point: it forces every change to
go through the declarative config instead of an untracked live edit.

Sidero Labs (who make Talos) publish [a comparison against
K3s](https://www.siderolabs.com/blog/talos-linux-vs-k3s) and
[resource benchmarks against kubeadm](https://www.siderolabs.com/blog/which-kubernetes-is-the-smallest).
Those are vendor numbers, so weight them accordingly. The design argument stands
on its own without the benchmarks.


# The versions I'm building against

Current stable Talos as of today is
[v1.13.5](https://github.com/siderolabs/talos/releases/tag/v1.13.5), released
2026-06-22. It ships Kubernetes v1.36.2. The v1.13 line supports Kubernetes 1.31
through 1.36, so the pairing is not something you have to fight. Every command
below is against the
[v1.13 docs](https://docs.siderolabs.com/talos/v1.13/getting-started/getting-started).


# Getting the ISO from the Image Factory

I already downloaded the metal amd64 ISO from the
[Talos Image Factory](https://factory.talos.dev/?platform=metal&target=metal).
That's the one deliberate choice worth explaining before going further.

You can grab a plain ISO straight from the GitHub releases page. It boots and it
works. But the Factory lets you bake in system extensions, and for an Intel box
I want `siderolabs/intel-ucode`, the Intel microcode extension. Microcode gets
loaded before CPU init, so baking it into the image is the clean way to ship it
on an immutable OS where you can't `apt install` it later.

The Factory works off a schematic: a small YAML file listing your extensions and
kernel args. For a NUC the schematic is this short:

```yaml
# schematic.yaml
customization:
  systemExtensions:
    officialExtensions:
      - siderolabs/intel-ucode
```

The Factory hashes that content into a **schematic ID**, a deterministic string
derived from the schematic itself. Same schematic content, same ID, every time.
Your custom image then lives at a predictable URL:

```
https://factory.talos.dev/image/<schematic-id>/v1.13.5/metal-amd64.iso
```

The schematic ID is the part that pays off later. It's preserved across upgrades,
so when I upgrade the node the installer keeps the same extension set instead of
silently dropping my microcode. The UI at
[factory.talos.dev](https://factory.talos.dev/?platform=metal&target=metal) walks
you through the extension picker and hands you the ID and download link. Pick
"Bare-metal Machine" and amd64.


# Writing the ISO to a USB stick from macOS

I'm doing this from a MacBook with `diskutil` and `dd`. First, find the USB
disk:

```bash
diskutil list
```

Read the output carefully and identify the USB stick by its size and name. It
will be something like `/dev/disk4`.

**Get this number right.** `dd` writes to whatever device you point it at, with
no confirmation. Point it at your internal drive and you will destroy it. There is
no undo.

Unmount the disk (this keeps the device node visible, unlike ejecting), then
write the image to the raw device:

```bash
# Replace disk4 with YOUR usb disk from the diskutil list output
diskutil unmountDisk /dev/disk4

# Note: rdisk4, not disk4. The raw device is much faster.
sudo dd if=metal-amd64.iso of=/dev/rdisk4 bs=4m status=progress

diskutil eject /dev/disk4
```

The `r` in `/dev/rdisk4` is the raw character device. It bypasses the buffer
cache and writes block-aligned, which is meaningfully faster than the buffered
`/dev/disk4`. `bs=4m` sets a sane block size and `status=progress` prints a live
byte count so you know it's alive.


# Booting the NUC and finding it in maintenance mode

Plug the USB into the NUC, power on, and press **F10** to get the one-time boot
menu. (F2 is BIOS setup if you need to change boot order or disable secure boot
first.) Select the USB device.

Note: F10 is the near-universal Intel NUC convention, but boot-menu keys have
drifted across NUC generations. If F10 does nothing, check your specific model's
page on Intel's site. I'll confirm the exact key for mine once it's booting.

Talos boots into **maintenance mode**. This is the part that feels different from
a normal install. Nothing gets written to disk. The node runs entirely in RAM,
prints its IP address on the console, and sits there waiting for a machine config
over the API. There's no installer to click through and no login prompt, because
there's nothing to log into yet.

Two ways to get the NUC on the network for this:

- Plain DHCP on your LAN. Plug it into your switch and read the IP off the
  console.
- Share your MacBook's connection to the NUC over Ethernet. I wrote that up
  separately in [Using a MacBook as an Ethernet Bridge](/macbook-ethernet-bridge.html).

Either way, note the IP the console shows. Everything below targets it. I'll use
`192.168.1.50` as the placeholder.


# Installing talosctl

`talosctl` is the only way you'll talk to this node. Install it from the Sidero
Homebrew tap:

```bash
brew install siderolabs/tap/talosctl
```

If you'd rather not add a tap, the install script auto-detects your OS and arch:

```bash
curl -sL https://talos.dev/install | sh
```

Talos wants `talosctl` to match the Talos version running on the node, so check
it after install:

```bash
talosctl version --client   # expect Talos v1.13.5
```


# Generating the machine config

`talosctl gen config` takes a cluster name and the control plane endpoint (the
NUC's IP on port 6443) and writes three files:

```bash
talosctl gen config nuc https://192.168.1.50:6443
```

- `controlplane.yaml`: config for a control plane node
- `worker.yaml`: config for a worker node (unused on a single node, but generated)
- `talosconfig`: your client credentials for talking to the cluster

`controlplane.yaml` and `talosconfig` contain the cluster's PKI and secrets in
plaintext. Keep them out of git. If you want the config in version control, keep
only the non-secret patch files there and regenerate the full config from a
secrets bundle, or encrypt the secret files with something like SOPS before
committing. Don't `git add controlplane.yaml` and think about it later.


# The single-node tweaks

A default control plane node cordons itself off from workloads, which is correct
for a real cluster and wrong for one NUC that has to run everything. Two changes
fix it: let pods schedule on the control plane, and point the installer at the
right disk.

First, find the disk. Talos has to know where to install, and the device name on
a NUC is often an NVMe drive, not `/dev/sda`. Ask the node in maintenance mode:

```bash
talosctl get disks --insecure --nodes 192.168.1.50
```

The `--insecure` flag is required because the node has no PKI yet. Read the disk
name out of the output (something like `/dev/nvme0n1`).

Put both changes in a control-plane patch file:

```yaml
# cp.patch.yaml
cluster:
  allowSchedulingOnControlPlanes: true
machine:
  install:
    # Use the disk name from `talosctl get disks`; yours may differ
    disk: /dev/nvme0n1
```

Then regenerate the config with the patch applied to the control plane:

```bash
talosctl gen config nuc https://192.168.1.50:6443 \
  --config-patch-control-plane @cp.patch.yaml
```

The `@` tells `talosctl` to read the patch from a file. `--config-patch` applies
to all node types, and `--config-patch-worker` targets workers; here I only need
the control plane variant.


# Applying the config and bootstrapping

Push the control plane config to the maintenance-mode node:

```bash
talosctl apply-config --insecure --nodes 192.168.1.50 --file controlplane.yaml
```

Still `--insecure`, because PKI doesn't exist until this config lands. Once it
does, the node installs Talos to the disk you chose and reboots on its own. It
comes back up as a real control plane node instead of the RAM-only maintenance
image, and from here on `talosctl` authenticates with the `talosconfig` file
instead of `--insecure`.

Point your client at the node:

```bash
talosctl config endpoint 192.168.1.50
talosctl config node 192.168.1.50
```

Note: the getting-started walkthrough uses `config endpoints` (plural) in one
place. If `endpoint` errors, run `talosctl config endpoint --help` to confirm the
spelling on your version. I'll pin the exact form after I run it.

Now bootstrap etcd. This runs the one-time cluster initialization, and it must
run **exactly once, against exactly one node**. Run it twice, or against a second
node, and you risk splitting etcd:

```bash
talosctl bootstrap --nodes 192.168.1.50 --talosconfig=./talosconfig
```

Give it a minute, then pull the kubeconfig and check the node:

```bash
talosctl kubeconfig --nodes 192.168.1.50 --talosconfig=./talosconfig
kubectl get nodes
```

`talosctl kubeconfig` merges the cluster into your `~/.kube/config`. If the node
reports `Ready`, the single-node cluster is up and scheduling workloads on the
control plane.


# Living without SSH

This is where Talos earns the "no shell" constraint back. You still get full
observability, through the API instead of a login session.

```bash
# Full-screen TUI: node overview, logs, live CPU and memory
talosctl dashboard --nodes 192.168.1.50

# Kernel ring buffer, same as dmesg on a normal box
talosctl dmesg --nodes 192.168.1.50

# Containers running on the node; -k switches to the k8s.io namespace
talosctl containers --nodes 192.168.1.50 -k
```

Every one of those is a `talosctl` subcommand over the gRPC API. There's no SSH
session and no host shell behind them, which is exactly the property I wanted
from this build. The node is the config, and the config is in a file I control.

I'll update this post with the real disk name, the confirmed boot key, and any
hardware surprises once it's running on the NUC.
