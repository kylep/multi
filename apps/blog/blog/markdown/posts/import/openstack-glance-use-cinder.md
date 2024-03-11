title: Using Cinder for OpenStack Glance Images
summary: Backing Glance images with Cinder volumes
slug: openstack-glance-use-cinder
category: cloud
date: 2019-09-25
modified: 2019-09-25
tags: OpenStack
status: draft


In order to use remote storage providers (like iSCSI Pure Storage) with Glance,
you need to back the Glance Images with Cinder volumes. This isn't the case
when you're using Ceph since Glance knows how to interact with it, and with LVM
you might as well just use the local file storage that Glance defaults to.


# Glance Configuration

Add this to your glance-api.conf files.

```ini
[glance_store]
default_store = cinder
filesystem_store_datadir = /var/lib/glance/images/
stores = file,http,cinder
cinder_store_auth_address = http://10.61.0.254:5000/v3
cinder_catalog_info = volumev3::internalURL
```

# Errors:

## HTTPS Error

This one was from as self-signed cert.
`cinder_catalog_info` was using publicURL. Changing it to internal fixed it.

```
Max retries exceeded with url: /v2/b36f80044d984071bfb46b1d143052a2/volumes (Caused by SSLError(SSLError("bad handshake: Error([('SSL routines', 'tls_process_server_certificate', 'certificate verify failed')],)",)
```

## Privsep-Helper Error

It looks like [this bug](https://bugs.launchpad.net/kolla/+bug/1683890), which
was reported in 2017 and comments suggest is fixed but it clearly isn't.

It doesn't end there, though. Once you enable sudo, you also have to install
the privsep package. Then you need to convince Glance to use it.

It looks like the Zun project ran into this too and fixed it [diff](https://review.opendev.org/#/c/606854/1/docker/zun/zun-base/Dockerfile.j2).

```
# The initial error:
Failed to upload image data due to internal error: FailedToDropPrivileges: privsep helper command exited non-zero

# After glance can run sudo, next error:
/var/lib/kolla/venv/bin/glance-rootwrap: Executable not found: privsep-helper (filter match = privsep-helper)
```

It's trying to run this `glance-rootwrap` command in the `glance_api`
container and failing.

I've split the command into multiple lines to make it easier to read.

```bash
sudo glance-rootwrap /etc/glance/rootwrap.conf privsep-helper \
  --config-file /etc/glance/glance-api.conf \
  --privsep_context os_brick.privileged.default \
  --privsep_sock_path /tmp/tmpQERdoh/privsep.sock
```

To fix this I made a custom glance-api container.

I've written a post that covers
[how to modify OpenStack Kolla container images](/openstack-kolla-custom-plugin).
Those steps are needed here too.

In the glance-api template, you need to do a few things to resolve this:
- let glance run passwordless sudo
- install the privsep command
- Add it to the glance rootwrap `exec_dirs`

```jinja2
{% block glance_api_ubuntu_setup %}
RUN echo 'glance ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers \
  && pip install oslo.privsep \
  &&  sed -i 's|^exec_dirs.*|exec_dirs=/var/lib/kolla/venv/bin,/sbin,/usr/sbin,/bin,/usr/bin,/usr/local/bin,/usr/local/sbin|g' /etc/glance/rootwrap.conf
{% endblock %}
```
