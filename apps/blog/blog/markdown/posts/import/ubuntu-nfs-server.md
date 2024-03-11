title: Ubuntu NFS Server Setup
summary: Installing, configuring, and testing NFS server on Ubuntu 18.04
slug: ubuntu-nfs-server
category: systems administration
tags: ubuntu, NFS
date: 2020-03-09
modified: 2020-03-09
status: published
image: ubuntu.png
thumbnail: ubuntu-thumb.png


# Install & Configure NFS Server

These steps were tested on Ubuntu 18.04.

```bash
# Install the NFS server package
apt-get install nfs-kernel-server

# Make a directory to publish
mkdir /nfs

# Set permissions
chown nobody:nogroup /nfs
chmod 777 /nfs
```

Configure NFS by writing `/etc/exports`. In this example I'm allowing access
from anyone on the `10.10.0.0/16` subnet. This is only secure if you trust that
entire subnet and any systems which might be routed to it.

```text
/nfs 10.10.0.0/16(rw,sync,no_subtree_check)
```

Apply the changes

```bash
exportfs -a
systemctl restart nfs-kernel-server
```


# NFS client setup

```bash
# Install client software
apt-get install nfs-common

# Create mount point
mkdir /nfs

# Mount the NFS share manually
mount 10.10.10.9:/nfs /nfs
```
