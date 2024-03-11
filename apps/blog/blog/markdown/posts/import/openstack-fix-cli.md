title: OpenStack: Fixing the CLI (python2) error: No module named queue
summary: pip install python-openstack does not work without this fix
slug: openstack-fix-cli
category: cloud
tags: OpenStack
date: 2020-06-25
modified: 2020-06-25
status: published
image: openstack.png
thumbnail: openstack-thumb.png


# TL;DR

```
# replace "import queue" with:
from multiprocessing import Queue as queue
```

---

# Steps to fix

In Ubuntu 18.04 you'd typically install the openstack CLI client like this:

```bash
pip install python-openstackclient
```

Sadly, this installs a broken version of the client. If you try and run any command you get a stack trace:

```bash
Traceback (most recent call last):
  File "/usr/local/bin/openstack", line 6, in <module>
    from openstackclient.shell import main
  File "/usr/local/lib/python2.7/dist-packages/openstackclient/shell.py", line 24, in <module>
    from osc_lib import shell
  File "/usr/local/lib/python2.7/dist-packages/osc_lib/shell.py", line 33, in <module>
    from osc_lib.cli import client_config as cloud_config
  File "/usr/local/lib/python2.7/dist-packages/osc_lib/cli/client_config.py", line 18, in <module>
    from openstack.config import exceptions as sdk_exceptions
  File "/usr/local/lib/python2.7/dist-packages/openstack/__init__.py", line 16, in <module>
    import openstack.config
  File "/usr/local/lib/python2.7/dist-packages/openstack/config/__init__.py", line 17, in <module>
    from openstack.config.loader import OpenStackConfig  # noqa
  File "/usr/local/lib/python2.7/dist-packages/openstack/config/loader.py", line 33, in <module>
    from openstack.config import cloud_region
  File "/usr/local/lib/python2.7/dist-packages/openstack/config/cloud_region.py", line 44, in <module>
    from openstack import proxy
  File "/usr/local/lib/python2.7/dist-packages/openstack/proxy.py", line 24, in <module>
    from openstack import resource
  File "/usr/local/lib/python2.7/dist-packages/openstack/resource.py", line 49, in <module>
    from openstack import utils
  File "/usr/local/lib/python2.7/dist-packages/openstack/utils.py", line 13, in <module>
    import queue
ImportError: No module named queue
```

To fix it, replace `import queue` with `from multiprocessing import Queue as queue` everywhere that it's called.

In my case:

- `usr/local/lib/python2.7/dist-packages/openstack/utils.py` - line 13
- `/usr/local/lib/python2.7/dist-packages/openstack/cloud/openstackcloud.py` - line 14
