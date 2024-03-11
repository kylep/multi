title: Error Messages, Codes, & Stack Traces
summary: Error's I've seen and how I fixed them, if I fixed them.
slug: errors
category: reference pages
tags: AWS, Pure Storage, Mac OS
date: 2019-09-11
modified: 2020-08-13
status: published
image: error.png
thumbnail: error-thumb.png


**This is a Reference Page:** Reference pages are collections of short bits
of information that are useful to look up but not long or interesting enough to
justify having their own dedicated post.

This reference page lists some of the errors that I've personally encountered,
and how I fixed them. I might also include errors I never fixed in case anyone
wants to talk about it.

---

[TOC]

---


# Docker Login Fails

```
Error saving credentials: error storing credentials - err: exit status 1, out: `Cannot autolaunch D-Bus without X11 $DISPLAY`
```

I had this happen after running both Ceph-Ansible then Kolla-Ansible on an Ubuntu server, so it could be either of those that set up the conditions for this to happen. [this solution](https://github.com/docker/cli/issues/1136) worked for me:

```bash
apt-get install -y gnupg2 pass
```

---

# Runaway memory usage in Ceph OSD process

It looked like a memory leak. Each OSD process was using around 30GB of RAM.

It turns out that Ceph-Ansible has the following logic when generating its
`ceph.conf` file:

```
# this math
roles/ceph-config/templates/ceph.conf.j2:{% set _osd_memory_target = (ansible_memtotal_mb * 1048576 * hci_safety_factor / _num_osds) | int %}
# sets osd memory target
roles/ceph-config/templates/ceph.conf.j2:osd memory target = {{ _osd_memory_target | default(osd_memory_target) }}
```

In my case, this set the value WAY too high. In one of my deployments, it was
set to `37853425827`, which is like 35GB (PER OSD SERVICE!).

The 4GB default is much more sane, `4294967296`.

```
# ceph.conf
[osd]
osd memory target = 4294967296
```


---


# Chrome blocks https://127.0.0.1 with NET::ERR_CERT_REVOKED

This comes up when I reverse tunnel to a remove web server, forwarding it to my workstation. Chrome has decided to not let you do that. They give this errror:

```text
Your connection is not private
Attackers might be trying to steal your information from 127.0.0.1 (for example, passwords, messages, or credit cards). Learn more
NET::ERR_CERT_REVOKED
```

To bypass that, open `chrome://flags/#allow-insecure-localhost` and set allow-insecure-localhost to enabled. Click relaunch. This will nuke your current browser…

Once it relaunches you'll be able to open the site.

---

# Failed command: aws ecr get-login

This error was caused by a bad NTP config. Renew the NTP lease to fix it.

```
An error occurred (InvalidSignatureException) when calling the GetAuthorizationToken operation: Signature expired: 20190911T174538Z is now earlier than 20190912T004835Z (20190912T010335Z - 15 min.)
```


---


# Pure Storage iSCSI with Kolla OpenStack - fdisk freezes
This was a weird one. When using the Kolla containers project to make a
Cinder-volume container that has the `purecinder` plugin, I was able to get
OpenStack to create the volumes in Pure but it couldn't mount them to the hosts
for things like creating a volume with the `--image` argument. That made the
volumes I could create basically useless.

These errors were in the logs:
```text
# Lots of these in cinder's log
Trying to connect to iSCSI portal

# also from cinder's log, also recurring:
iscsiadm stderr output when getting sessions: iscsiadm: No active sessions

# in DMESG
FAILED Result: hostbyte=DID_NO_CONNECT driverbyte=DRIVER_OK
```

The weirdest part was that the `fdisk -l` command would totally lock up and
the process running it couldn't be killed even with `kill -9`. The iSCSI volume
never got properly mounted but Pure support said they could see some data
coming into it.

**Root cause**: MTU mismatch. Of course. I had set MTU 9000 on the iSCSI ports,
my host ports, and the switchports heading to the Pure Storage iSCSI
interfaces. I had forgotten to set it on the switch heading to the Dell servers
being used for OpenStack.


---


# Weird chars when pasting on Mac OS

When you paste sometimes you get `^[[200~` at the start and `^[[201~` at the
end of the pasted content. Or maybe `0~` and `1~`.

To resolve, run:
```bash
printf "\e[?2004l"^C
```


