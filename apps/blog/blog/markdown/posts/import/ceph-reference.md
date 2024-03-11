summary: Ceph reference page
title: Ceph Reference Page
slug: ceph-reference
tags: Ceph
category: reference pages
date: 2020-03-05
modified: 2020-03-05
status: published
image: ceph.png
thumbnail: ceph-thumb.png


---

[TOC]

---


# Commands

##  Modify Pool Replica Count

Show and modify the replica count (size) in a given pool.

You can do the same with `min_size` if needed.

```bash
# Show the current replica count
#   ceph osd pool get <pool name> size
ceph osd pool get images size

# Set the replica count for a given pool
#   ceph osd pool set <pool name> size <number of replicas>
ceph osd pool set images size 2
```


## Show current space used

```bash
ceph df
```

## Show status
```bash
# Show the status right now
ceph -s

# Show the status and watch it
ceph -w
```


## List, create and delete volumes

```bash
# LIST
# rbd ls -p <pool name>
rbd ls -p volumes

# CREATE
#   rbd create --size <size in gb> <pool>/<volume id>
rbd create --size 10 volumes/myVolume

# DELETE
#   rbd rm <pool>/<volume id>
rbd rm volumes/myVolume
```


## Presenting a volume to this host

```bash
# PRESENT TO HOST
#   rbd map <pool>/<volume id>
rbd map volumes/myVolume

# LIST MAPPED
rbd showmapped

# REMOVE FROM HOST
#   rbd unmap <pool>/<volume id>
rbd unmap volumes/myVolume
```

Once you've presented the volume you can use it like this:

```bash
mkfs.ext4 /dev/rbd0
mkdir /data
mount /dev/rbd0 /data
```


## Snapshots

```bash
# LIST SNAPSHOTS
#   rbd snap ls <pool>/<volume id>
rbd snap ls volumes/myVolume

# REVERT TO SNAPSHOT
# rbd snap rollback <pool>/<volume id>@<snapshot id>
rbd snap rollback volumes/myVolume@sampleSnapshot

# DELETE SNAPSHOT
#   rbd snap rm <pool>/<volume id>@<snap id>
rbd snap rm volumes/myVolume@sampleSnapshot
```

## Save RBD as file

```bash
#   rbd export <pool>/<volume> <filename>
rbd export volumes/myVolume myVolume.raw
```
