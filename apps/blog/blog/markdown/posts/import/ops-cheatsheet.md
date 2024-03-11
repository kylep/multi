title: Operations Reference Page
summary: Mini-posts and notes that are generally related to operations
slug: ops
category: reference pages
tags: Mac OS, Ubuntu, Vim, Docker, Ansible, Bash
date: 2019-09-11
modified: 2020-11-09
status: published
image: gear.png
thumbnail: gear-thumb.png


**This is a Reference Page:** Reference pages are collections of short bits
of information that are useful to look up but not long or interesting enough to
justify having their own dedicated post.

This reference page contains operations-related mini-guides and minor posts.

---

[TOC]

---

# Find which active-passive bond member is active

```
cat /proc/net/bonding/bond0
```

---
# Convert p7b certificate to pem format

```bash
openssl pkcs7 -print_certs -in certnew.p7b -out cert.pem
```

---

# Journalctl commands

Watch the logs as they come in:

```bash
journalctl -f
```

When journalctl logs too much and you need to pair it down:

```bash
# to 30 days
journalctl --vacuum-time=30d

# to 500MB
journalctl --vacuum-size=500M
```

Show for a specific service

```bash
journalctl ceph*
```

---


# Get real RAM use of processes

You can always use top or htop or whatever. I use this to specifically get the
info about those processes.

## of ceph

```
ps aux | grep ceph | grep -v -e grep -e qemu -e "\[" | while read line; do bin=$(echo $line | awk '{print $11}'); pid=$(echo $line | awk '{print $2}'); id=$(echo $line | awk '{print $16}'); size=$(grep 'VmSize' /proc/$pid/status); echo -e "pid: $pid, \tbin: $bin, \tid: $id,    \tRAM: ($size)"; done
```

## of VMs

for KVM

```
ps aux | grep qemu | grep -v -e grep| while read line; do bin=$(echo $line | awk '{print $11}'); pid=$(echo $line | awk '{print $2}'); guest=$(echo $line | awk '{print $13}'); size=$(grep 'VmSize' /proc/$pid/status); echo -e "pid: $pid, \tbin: $bin, \tguest: $guest,   \t\tRAM: ($size)" ; done
```

# Bypass Chrome's self-signed cert warning

As of Mac Catalina, developing a site using self-signed certs is a bigger pain
than before. Yeah you can go get the key and add it, but that's a nuisance.
It looks like the Chrome team built something they call an
"interstitial bypass keyword" to deal with that. That's one cool feature name.

**Obvious disclaimer** If you're not a developer doing this to access your own
site, don't do this.

To bypass the warning, type

```
thisisunsafe
```

Apparently it used to be `badidea` but they rotated it since it got too well
known. They'll probably do it again someday. I suspect people are using this
on sites they "trust" without really knowing any better and getting hurt by
it.

---

# Create a virtual loopback volume on Ubuntu

Useful for simulating a real drive when building a test environment. I use this to test OpenStack in a VM as a Ceph or LVM back-end.

```bash
# create empty file of all zeros
sudo dd if=/dev/zero of=/root/virtual-disk bs=1M count=512
# show list of loopback devices. Note its not there
losetup --list
# create the loopback device
losetup /dev/loop0 /root/virtual-disk
# confirm it worked
losetup --list
```

You can now treat it like a normal volume. Mount it, put a filesystem on it, whatever. Example:

```bash
pvcreate /dev/loop0
vgcreate cinder-volumes /dev/loop0
```

## Use Systemd to re-map loopback on reboot

I found [this useful systemd unit example](https://unix.stackexchange.com/questions/418322/persistent-lvm-device-with-loopback-devices-by-fstab) that didn't quite work for me, but was close. Here's mine:

`vi /etc/systemd/system/loops-setup.service`

```text
[Unit]
Description=Setup loopback devices

DefaultDependencies=no
Conflicts=umount.target

Requires=lvm2-lvmetad.service mnt-host.mount
Before=local-fs.target umount.target
After=lvm2-lvmetad.service mnt-host.mount

[Service]
ExecStart=/sbin/losetup /dev/loop0 /root/virtual-disk
ExecStop=/sbin/losetup -d /dev/loop0

RemainAfterExit=yes
Type=oneshot

[Install]
WantedBy=local-fs-pre.target
```

Then enable it

```bash
systemctl enable loops-setup
```

Reboot, then check `vgdisplay` (if that's your use case). It'll be there.

---

# Test MTU from Ubuntu

You would not believe the strange problems that an MTU issue can be the root cause of.

```bash
ping -M do -s 1472 <remote server>
ping -M do -s 8900 <remote server>
```

---

# Find big files on Mac OS

My SSD is always almost full. Here are useful commands for cleaning up:

```bash
# Find all the files over 1G
sudo find / -type f -size +1G -exec ls -lh {} \; | awk '{ print $9 ": " $5 }' 2>/dev/null

# List files in Downloads directory by size
ls -lhS ~/Downloads
```


# Renew NTP Lease Ubuntu

```bash
service ntp stop
ntpd -gq
service ntp start
```


---

# Create AWS ECR Registry If Not Found

```bash
aws ecr describe-repositories --repository-names $repo_name \
    || aws ecr create-repository --repository-name $repo_name
```


---


# Passwordless sudo on Ubuntu Server

Run `visudo` as root.

```bash
# as root
export EDITOR=vim
visudo
```

Add the user (replace `exampleUser`) at the end.

```text
exampleUser ALL=(ALL) NOPASSWD: ALL
```

For those who don't use vim, a quick reminder:
`i` enter to insert mode , `[esc]` to exit insert mode, `:wq` to save and quit.


---


# VIM Tasks

## Find & Replace

```bash
# replace findThis with ReplaceWithThis
:%s/findThis/ReplaceWithThis/g
```

## Spell-Check commands

```text
# enable/disable
:set spell spelllang=en_ca
:setlocal spell spelllang=en_ca
:set nospell

# next/last
]s
[s

# suggest change
z=

# add/remove word from dictionary
zg
zw`
```


---


# Use an Insecure Docker Registry
To use a registry with no HTTP cert:

`vi /etc/docker/daemon.json`

```json
{
    "insecure-registries" : ["myregistrydomain.com:5000"]
}
```


---


# Ansible ignore errors

The command is `ignore_errors: yes`

Just throw this into the task that's failing. It will still fail, but the play
won't stop.

Example:

```yml
- name: Ensure the docker service is running
  script: ../tools/validate-docker-execute.sh
    ignore_errors: yes
```


---


# How to tail -f on dmesg

```bash
dmesg -wH
```


---


# Ubuntu Downgrade a package

```bash
# Find the available versions under Versions:
apt-cache showpkg <package>

# Install one of those
apt-get install <package>=<version>
```


---


# Make Ansible run Python 3 on target nodes

Useful for OS that ship with python3 but not python2.
Edit the inventory, find a group of the groups and apply this var.

```ini
[baremetal:vars]
ansible_python_interpreter=/usr/bin/python3
```


---


# Bash: Print all but first line

Use `tail -n +2`.
This was unintuitive to me because +1 seems like it should do it.

```bash
# Example
docker images | awk '{print $3}' | tail -n +2
```


---


# Bash: Run code whenever a script exits

Use trap.
- [This is a nice post covering lots of examples](http://redsymbol.net/articles/bash-exit-traps/).
- [Here's where I first saw it used](https://github.com/GoogleCloudPlatform/endpoints-quickstart/blob/master/scripts/deploy_api.sh)

```bash
temp_file=$(mktemp)

cleanup() {
  rm "$temp_file"
}

trap cleanup EXIT
```
