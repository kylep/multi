---
title: "Installing k3s on Ubuntu Server on my Intel NUC"
summary: A single-node Kubernetes homelab with the install itself as code. Ubuntu
  autoinstall, k3s from a config file, and Wi-Fi that actually works.
slug: k3s-ubuntu-intel-nuc
category: kubernetes
tags: k3s, Kubernetes, Ubuntu, Intel-NUC, homelab, autoinstall
date: 2026-07-09
modified: 2026-07-09
status: published
image: k3s-ubuntu-intel-nuc.png
thumbnail: k3s-ubuntu-intel-nuc-thumb.png
imgprompt: A simple flat vector mini-PC box with the Kubernetes helm wheel
  floating above it, minimal lines, solid pastel colors, no shading, clean
  geometric shapes on a plain background
keywords:
  - k3s ubuntu server install
  - single node k3s homelab
  - ubuntu autoinstall example
  - k3s config.yaml
  - kubernetes intel nuc wifi
---


Time to rebuild the homelab. Keeping it simple and best-practice, I was feeling Talos
but my Nuc uses Wifi and Talos doesn't support it. Keeping it simple with K3s on
Ubuntu server.

# The declarative stack on a mutable OS

Declarative infra is good infra. A few considerations that help avoid imperative
configs.

- **The OS install**: Ubuntu's autoinstall. A YAML file on the install USB
  answers every installer question, so the OS install is unattended and
  reproducible: user, SSH key, disk layout, and the Wi-Fi config.
- **The k3s config**: `/etc/rancher/k3s/config.yaml`. Every flag the server
  would take on the CLI lives in a YAML file instead.
- **The workloads**: k3s watches `/var/lib/rancher/k3s/server/manifests` and
  applies whatever lands there, on startup and on file change.


# The versions I'm building against

- [Ubuntu Server 26.04 LTS](https://documentation.ubuntu.com/release-notes/26.04/)
  (Resolute Raccoon), the current LTS. The 26.04.1 point release is due
  within weeks of this post; a first `apt upgrade` picks up the same fixes.
- [k3s v1.36.2+k3s1](https://github.com/k3s-io/k3s/releases), current stable,
  which ships Kubernetes v1.36.2. Same Kubernetes minor the Talos plan would
  have given me.

Commands are verified against the
[autoinstall reference](https://canonical-subiquity.readthedocs-hosted.com/en/latest/reference/autoinstall-reference.html)
and the [k3s docs](https://docs.k3s.io/installation/configuration).


# The autoinstall file

Grab `ubuntu-26.04-live-server-amd64.iso` from
[releases.ubuntu.com/26.04/ubuntu-26.04-live-server-amd64.iso](https://releases.ubuntu.com/26.04/ubuntu-26.04-live-server-amd64.iso).

You need a SHA-512 hash of your login password first. macOS ships a real
OpenSSL these days, so this works locally. Run it with no password argument
so the plaintext never lands in your shell history:

```bash
openssl passwd -6 | pbcopy   # prompts twice, hash goes to the clipboard
```

Then the config. Two files, `user-data` and `meta-data`. The `meta-data`
file is empty but required. Here's my `user-data`, secrets swapped for
placeholders:

```yaml
# user-data -- cloud-init NoCloud + Ubuntu autoinstall
#cloud-config
autoinstall:
  version: 1
  identity:
    realname: 'Kyle'
    username: kyle
    hostname: nuc
    # from: openssl passwd -6   (interactive prompt)
    password: '<your-sha512-crypt-hash>'
  ssh:
    install-server: true
    authorized-keys:
      # your public key, so you never type that password
      - ssh-ed25519 AAAA<your-key> kyle@macbook
    allow-pw: false
  storage:
    layout:
      name: direct        # plain partitions, no LVM
      match:
        path: /dev/nvme0n1  # the NUC's NVMe; check yours
  network:
    version: 2
    wifis:
      wlp2s0:              # my NUC's wireless interface; yours may differ
        dhcp4: true
        access-points:
          "your-ssid":
            password: "your-wifi-password"
  packages:
    - curl
  late-commands:
    - echo 'autoinstall done' > /target/var/log/autoinstall-marker
```

```yaml
# meta-data -- must exist, empty is fine
```

Things worth knowing about this file:

- The `network:` section is plain netplan, and the autoinstall docs say it's
  "applied during installation as well as in the installed system." One
  Wi-Fi config, declared once, used by both. `wlp2s0` is the interface name
  from when this NUC ran [Ubuntu 18.04 on Wi-Fi](/ubuntu-bionic-wifi.html);
  I'm trusting it hasn't changed and will correct inline if the hardware
  disagrees.
- `storage.layout.match.path` pins the install to the NVMe drive so the
  installer can't pick the second disk. `match: {ssd: true, size: largest}`
  is the generic alternative.
- The Wi-Fi PSK sits in plaintext in this file, same as it would in any
  netplan config. Treat `user-data` like a secret: it holds your password
  hash and your Wi-Fi credentials. Mine stays out of git.
- `allow-pw: false` plus an authorized key means SSH is key-only from the
  first boot.

Note: the docs don't explicitly call out `wifis:` support in the installer
environment, only that the network section is netplan applied in both
places. The server ISO has shipped `wpasupplicant` for years, so I expect
this to work. If it doesn't, the fallback is a temporary Ethernet cable for
the install (my [MacBook bridge](/macbook-ethernet-bridge.html) also covers
the no-switch-nearby case), with the `wifis:` stanza still landing in the
installed system. I'll confirm which path reality takes.


# Writing the ISO to a USB stick from macOS

Same `diskutil` and `dd` routine as always. Find the USB disk:

```bash
diskutil list
```

Read the output carefully and identify the USB stick by its size and name. It
will be something like `/dev/disk4`.

**Get this number right.** `dd` writes to whatever device you point it at,
with no confirmation. Point it at your internal drive and you will destroy
it. There is no undo.

Unmount the disk (this keeps the device node visible, unlike ejecting), then
write the image to the raw device:

```bash
# Replace disk4 with YOUR usb disk from the diskutil list output
diskutil unmountDisk /dev/disk4

# Note: rdisk4, not disk4. The raw device is much faster.
sudo dd if=ubuntu-26.04-live-server-amd64.iso of=/dev/rdisk4 bs=4m status=progress

diskutil eject /dev/disk4
```

The `r` in `/dev/rdisk4` is the raw character device. It bypasses the buffer
cache and writes block-aligned, which is meaningfully faster than the
buffered `/dev/disk4`. `bs=4m` sets a sane block size and `status=progress`
prints a live byte count so you know it's alive.

The autoinstall file rides on a second, tiny USB stick. The installer looks
for a volume labeled `CIDATA` containing `user-data` and `meta-data` (this
is cloud-init's NoCloud datasource). Any old stick works:

```bash
# Replace disk5 with the SECOND stick. Same warning as above.
diskutil eraseDisk FAT32 CIDATA MBRFormat /dev/disk5

cp user-data meta-data /Volumes/CIDATA/
diskutil eject /dev/disk5
```

Two sticks total: the Ubuntu installer and the answers to its questions.


# Booting the NUC

Plug both USB sticks in, power on, and press **F10** for the one-time boot
menu. (F2 is BIOS setup if you need to change the boot order.) Boot the
Ubuntu stick.

Note: F10 is the near-universal Intel NUC convention, but boot-menu keys
have drifted across NUC generations. If F10 does nothing, check your
specific model's page on Intel's site. I'll confirm the exact key for mine
once it's booting.

The installer finds the `CIDATA` volume, confirms you want the automated
install (one keypress, it's destructive), and should run to completion
without another question: partition the NVMe, join the Wi-Fi, create the
user, install the SSH key, reboot. "Should" because this is the run that
tests the Wi-Fi question from earlier; if the installer environment balks
at the `wifis:` stanza, this is where the temporary cable comes in. Either
way the target system gets the netplan config.

When it's done, find the NUC and get in:

```bash
# from the Mac; or check your router's DHCP leases
ping nuc.local

ssh kyle@nuc.local   # your username from user-data
```


# Installing k3s: config file first

The k3s install script accepts flags, but flags on a curl-pipe are exactly
the kind of unrecorded state this build avoids. k3s reads
`/etc/rancher/k3s/config.yaml` at startup, and the install script does not
manage that file, so it's safe to lay down first and own in git:

```bash
# on the NUC
sudo mkdir -p /etc/rancher/k3s
sudo tee /etc/rancher/k3s/config.yaml > /dev/null <<'EOF'
# k3s server config -- every key is a CLI flag with dashes kept, e.g.
# --write-kubeconfig-mode becomes write-kubeconfig-mode
write-kubeconfig-mode: "0644"
node-name: nuc
EOF
```

Short on purpose. k3s's defaults are the right call on a single node:
sqlite instead of etcd, and the packaged components (coredns, traefik,
servicelb, local-path storage, metrics-server) are the batteries a one-box
cluster wants. Traefik gives you ingress and servicelb gives LoadBalancer
services on the node's IP, both of which you'd otherwise install yourself
anyway. Disable them (`disable: [traefik]` in the same file) only when you
have a replacement in hand.

Then install, pinned to the version I researched rather than whatever
stable means next month:

```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="v1.36.2+k3s1" sh -
```

Yes, that's a curl-pipe. The script is
[open](https://get.k3s.io) and short, and the version pin plus the config
file keep the result reproducible. If your threat model says download it,
read it, then run it: do that.

Check it:

```bash
sudo k3s kubectl get nodes
# NAME   STATUS   ROLES                  AGE   VERSION
# expect Ready and control-plane,master roles
```


# kubectl from the Mac

The kubeconfig lands at `/etc/rancher/k3s/k3s.yaml` on the NUC, pointing at
`127.0.0.1`. Copy it over and point it at the node:

```bash
# on the Mac
scp kyle@nuc.local:/etc/rancher/k3s/k3s.yaml ~/.kube/nuc.yaml
sed -i '' 's/127.0.0.1/nuc.local/' ~/.kube/nuc.yaml

export KUBECONFIG=~/.kube/nuc.yaml
kubectl get nodes
```

That `write-kubeconfig-mode: "0644"` from the config file is what makes the
`scp` work without sudo gymnastics. It also means any local user on the NUC
can read cluster-admin credentials, which is an acceptable trade on a
one-human homelab box and a wrong one anywhere else.


# Declarative workloads: the manifests directory

The third layer. Anything in `/var/lib/rancher/k3s/server/manifests` gets
applied like `kubectl apply`, on startup and again whenever the file
changes. Drop a test in:

```bash
# on the NUC
sudo tee /var/lib/rancher/k3s/server/manifests/whoami.yaml > /dev/null <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: whoami
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels: {app: whoami}
  template:
    metadata:
      labels: {app: whoami}
    spec:
      containers:
        - name: whoami
          image: traefik/whoami:latest
EOF

kubectl get pods -w   # watch it arrive without running kubectl apply
```

This directory is where the k3s packaged components themselves live, and it
accepts HelmChart custom resources too, so a single YAML file can install a
chart. For a homelab this is a poor man's GitOps: point a git checkout or a
sync job at that directory and the cluster state follows the repo. Argo CD
or Flux is the grown-up version; that's a later post.

Upgrades follow the same philosophy: re-run the install script with a new
`INSTALL_K3S_VERSION`, or hand the job to the
[system-upgrade-controller](https://docs.k3s.io/upgrades/automated) and
declare target versions with a Plan CRD inside the cluster itself.

The node reports Ready, workloads deploy from files, and every choice made
above exists in a file I can diff. That's as close to Talos as Ubuntu gets,
and the Wi-Fi works.
