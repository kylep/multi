title: Python Ceph Examples
summary: Some examples of using Ceph from Python with the rbd library
slug: python-ceph
category: development
tags: Python, Ceph
date: 2020-02-03
modified: 2020-02-03
status: published
image: ceph.png
thumbnail: ceph-thumb.png


This post covers some of the ways you can use Ceph from Python

The two libraries used here:

- [rados](https://docs.ceph.com/docs/master/rados/api/python/)
- [rbd](https://docs.ceph.com/docs/giant/rbd/librbdpy/)


---

# Setup

## Deploy ceph.conf

Grab the ceph.conf file from your cluster or make a new valid one and place
it on the filesystem of the server which will execute the Python code.

Also copy the keyring over. Check [here](https://docs.ceph.com/docs/master/rados/api/python/)
if you want to use anything other than the admin keyring.


## Install Dependencies

Ceph doesn't distribute a pure python library. Instead it seems to rely on some
C stuff that needs to be installed, so you need to use apt instead of pip.
This is a pain, since so far as I can tell you can't isolate these dependencies
inside a virtual environment.

```bash
apt-get install python-rados
```


---

# Examples

Be sure that the rados and rbd libraries, and `ceph.conf` are deployed first.

## Instantiate rados and rbd instances

The `cluster` and `rbd_inst` variables will be used through these examples.
The `rbd_inst` methods will expect `ioctx` as their first argument.

```python
import rbd
import rados

cluster = rados.Rados(conffile='/etc/ceph/ceph.conf')
cluster.connect()

pool_name = 'volumes'
ioctx = cluster.open_ioctx(pool_name)
rbd_inst = rbd.RBD()
```

# Usage examples

```python
# Get cluster stats
# Returns dict with kb, num_objects, kb_avail, and kb_used
cluster.get_cluster_stats()

# Get cluster health by issuing a command to ceph's monitor
cmd = {"prefix":"status", "format":"json"}
## mon_command returns a tuple of (return code, data/buffer, errors)
command_result = cluster.mon_command(json.dumps(cmd), b'', timeout=5)
status = json.loads(command_result[1])

# Get Pool usage stats
# Returns num_objects_degraded, num_kb, num_wr, num_rd, num_objects_unfound,
#   num_objects_missing_on_primary, num_object_clones, num_objects,
#   num_object_copies, num_bytes, num_rd_kb, num_wr_kb
ioctx.get_stats()

# List pools
cluster.list_pools()

# Create pool
pool_name = 'test_pool'
cluster.create_pool(pool_name)

# Delete pool
cluster.delete_pool(pool_name)


# List rados block devices
rbd_inst.list(ioctx)

# Create block device
rbd_name = 'sample-device'
size_gb = 10
rbd_inst.create(ioctx, rbd_name, size_gb)

# Query a block device (image)
image = rbd.Image(ioctx, rbd_name)

# Resize image
new_size=20
image.resize(new_size)

# Create a snapshot
snap_name = 'sample-snap'
image.create_snap(snap_name)

# List snaps of image
image.list_snaps()

# Revert to snapshot
snap_name = 'sample-snap'
image.rollback_to_snap(snap_name)

# Delete a snapshot
image.remove_snap(snap_name)

# Close an open image (when you're done working with it)
image.close()

# Delete an image/volume. Must not have snapshots. Must be closed.
rbd_inst.remove(ioctx, rbd_name)
```

