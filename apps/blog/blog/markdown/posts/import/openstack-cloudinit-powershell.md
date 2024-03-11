title: OpenStack: Execute Powershell from Cloud-Init
summary: Running startup scripts on Windows instances deployed by OpenStack
slug: openstack-cloudinit-powershell
category: cloud
tags: OpenStack, Windows, Powershell
date: 2020-01-25
modified: 2020-01-25
status: published
image: openstack.png
thumbnail: openstack-thumb.png


**This post is linked to from the [OpenStack Deep Dive Project](/openstack.html)**


---


When you launch an instance in OpenStack, you can provide a script to
cloud-init that will be executed at startup time. The glance template needs to
have [cloud-init](https://cloudinit.readthedocs.io/en/latest/) installed
(linux) or [Cloudbase-init](https://cloudbase.it/cloudbase-init/) (windows).


# Write your Powershell Script

You need to define the script ahead of time. Here's a super simple script
to add a local administrator:

```powershell
#ps1
$name = "MyUser"
$password = "MyPassword"
$password_secure_string = ConvertTo-SecureString -AsPlainText -Force $password
$new_user = New-LocalUser -Name $name -Password $password_secure_string -AccountNeverExpires
Add-LocalGroupMember -Group "Administrators" -Member $new_user
```

---


# Create the Instance

There's more than one way to do just about everything, but here's how I do it.

```bash
# source openrc file
source my-openrc.sh

# Collect environment details
openstack flavor list
openstack network list
openstack image list

# Set the VM specs
flavor=""
network=""
image=""
name="CloudInitDemo"
size=60
vol_name="$name-boot"

# Create a boot volume
openstack volume create --image $image --bootable --size $size $vol_name

# create server and specify cloud-init script
script_file="/home/kyle/localAdmin.ps1"
openstack server create \
  --volume $vol_name \
  --flavor $flavor \
  --network $network \
  --user-data $script_file \
  $name
```


