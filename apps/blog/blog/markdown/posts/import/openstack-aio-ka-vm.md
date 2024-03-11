title: Install OpenStack with Kolla-Ansible in a VM
summary: Installing OpenStack on a cloud VM with Kolla-Ansible for dev and testing
slug: openstack-aio-ka-vm
category: cloud
tags: OpenStack
date: 2019-08-11
modified: 2019-08-11
status: published
image: openstack-kolla.png
thumbnail: openstack-kolla-thumb.png


**This post is linked to from the [OpenStack Deep Dive Project](/openstack.html)**

---

[TOC]

---

This guide installs OpenStack inside a single VM.
To install OpenStack, I use [Kolla-Ansible](https://github.com/openstack/kolla-ansible)

OpenStack [Rocky](https://www.openstack.org/software/rocky/) will be installed,
configured with a [VLAN provider network](https://docs.openstack.org/ocata/networking-guide/intro-os-networking.html#intro-os-networking-provider)
for overcloud networking, and include the following OpenStack APIs:

- Keystone
- Cinder
- Nova
- Glance
- Neutron
- Heat
- Magnum


---


# Environment

These specs are what was used while writing this guide.
They are neither the minimum nor recommended requirements for a virtual
OpenStack cluster.

- VM hosted by [Breqwatr](https://breqwatr.com)'s on-prem OpenStack
    - AWS/GCP/Azure can also host suitable VMs
- Ubuntu 18.04
- 2 vSSD volumes: 200GB for the OS and 300GB for Cinder LVM
- 2 VLAN ports: API interface and neutron interface
- Docker images are the public Rocky images from Kolla on Docker Hub


## OpenStack-on-OpenStack Considerations

Skip this section if the installation is not on OpenStack.


### Disable Port Security

Turn off neutron port-security on each port.
Otherwise the unknown IPs will be blocked.

```bash
for x in \
    3f664e5e-dd67-4fe5-b2cc-86c2918b6a2f \
    c44da3d5-00e7-4e41-af39-7010d70ac6a5; do
  echo $x
  openstack port set --no-security-group $x
  openstack port set --disable-port-security $x
done
```


---


# Update the OS

It will never be less risky to run an update than right now!

```bash
apt-get update && apt-get upgrade -y
```


---


# Create Volume Group for Cinder

OpenStack Cinder supports a huge [list of back-end storage providers](https://docs.openstack.org/cinder/rocky/reference/support-matrix.html),
but the simplest to set up is just using an LVM volume group on the host.

Cinder will use LVM to carve out logical volumes for each cloud block storage
device. This isn't highly available, but that's OK for a dev cloud.

Create a volume group using a dedicated disk.
In this example, I'll use `/dev/vdb` for VMs.

The name of this volume group is defined in the globals.yml file as
`cinder_volume_group`, and can be changed as needed.

```bash
pvcreate /dev/vdb
vgcreate cinder-volumes /dev/vdb
```


---


# Install Ansible

Kolla-Ansible requires that Ansible be pre-installed. Apt can install it too,
but pip tends to install a newer version. Some old versions aren't compatible
with Kolla-Ansible.

```bash
apt-get -y install python python-pip
pip install ansible
```


---


# Install Kolla-Ansible

## Check out the Kolla-Ansible code

Git comes pre-installed on many Ubuntu 18.04, but install it otherwise.

```bash
apt-get install -y git
```

Clone a stable branch of Kolla-Ansible.
Check out the code and use pip to install it.

Make sure to use the stable branch associated with Rocky. Kolla-Ansible doesn't
work right when installing versions of OpenStack that don't match git stable
branch used.

```bash
cd ~
git clone https://github.com/openstack/kolla-ansible.git
cd ~/kolla-ansible
git checkout stable/rocky
pip install .
```

---


# Generate OpenStack Config Files

## OpenStack service config files

Create a directory to store the OpenStack config changes.

```bash
mkdir -p /etc/kolla/config
```


## Globals file

The globals file contains most of the important deployment settings for KA.

Check these two links for more info:
- [openstack.org KA advanced reference](https://docs.openstack.org/kolla-ansible/latest/admin/advanced-configuration.html)
- [GitHub page for globals file](https://github.com/openstack/kolla-ansible/blob/master/etc/kolla/globals.yml)

Any configs not defined are set by defaults.yml files in KA's Ansible roles.

The globals file can specify your OpenStack version, where it will pull its
containers from, and which containers will be deployed. Be sure to replace
`kolla_internal_vip_address`'s value with your VIP address.

The VIP can't be used by your existing network card, else HAproxy will throw a
fit and Kolla-Ansible will fail at the MariaDB step.

The networking in this example is as simple as it gets. You can really split
things up in this file if you want to. Note the network interface name too, it
may be different from yours.

`vi /etc/kolla/globals.yml`

```yaml
---
# APIs listen on this VIP
kolla_internal_vip_address: "10.100.202.254"

# Interface used for VXLANS and APIs. See docs to split this out into many nics
network_interface: "ens3"

# Used for the VLANS, give it the whole device
neutron_external_interface: "ens6"

# If you have more than one install in the broadcast domain, make this unique
keepalived_virtual_router_id: "77"

# Define the docker image names and tag (kolla/ubuntu-source-<name>:rocky)
kolla_base_distro: "ubuntu"
kolla_install_type: "source"
openstack_release: "rocky"

# Which containers will be deployed
enable_keepalived: "yes"
enable_mariadb: "yes"
enable_memcached: "yes"
enable_rabbitmq: "yes"
enable_chrony: "yes"
enable_fluentd: "yes"
enable_nova_ssh: "yes"
enable_ceph: "no"
enable_horizon: "yes"

# Use HAProxy load balancer but disable TLS certs
enable_haproxy: "yes"
kolla_enable_tls_external: "yes"

# Use qemu for nested hypervisors, kvm for metal
enable_nova: "yes"
nova_compute_virt_type: "qemu"

# The default username and project can be changed here
enable_keystone: "yes"
keystone_admin_user: "admin"
keystone_admin_project: "admin"

# Glance stores VM templates. Use a file backend with cinder's LVM backend
enable_glance: "yes"
glance_backend_file: "yes"

# Configure Cinder to use the 'cinder-volumes' vg for virtual block devices
enable_cinder: "yes"
enable_cinder_backup: "no"
enable_cinder_backend_lvm: "yes"
cinder_volume_group: "cinder-volumes"
cinder_backend_ceph: "no"

# Enable the DNS ml2 extension driver in neutron & lbaas
enable_neutron: "yes"
enable_neutron_lbaas: "yes"
neutron_extension_drivers:
  - name: "port_security"
    enabled: true
  - name: "dns"
    enabled: true

# Configure magnum to look for the 'local-lvm' cinder volume type
enable_magnum: "yes"
default_docker_volume_type: "local-lvm"
```


## Passwords file

The passwords file is empty initially, its just a template to be filled in with
random password from KA. The `kolla-genpwd` command populates it.

```bash
cp ~/kolla-ansible/etc/kolla/passwords.yml /etc/kolla
kolla-genpwd
```


## Ansible Inventory

The KA Ansible inventory defines which roles will be assigned to which hosts.
The all-in-one inventory file assigns all roles to localhost.

```bash
cp ~/kolla-ansible/ansible/inventory/all-in-one /etc/kolla/inventory
```


---


# Install OpenStack using Kolla-Ansible

First run the bootstrap command to install docker and tune the server. In older
branches it will add the wrong key for the apt repo, so do that yourself.

```bash
kolla-ansible certificates
kolla-ansible -i /etc/kolla/inventory bootstrap-servers
kolla-ansible -i /etc/kolla/inventory deploy
kolla-ansible -i /etc/kolla/inventory post-deploy
```

## Install the OpenStack Command Line

This will enable the `openstack` command.

```bash
pip install python-openstackclient python-neutronclient python-magnumclient
```

To configure the OpenStack CLI, source the openrc file that was created by KA's
post-deploy step.

```bash
source /etc/kolla/admin-openrc.sh
```


---



# Overcloud Cluster Configuration
Now that the undercloud is functional and the OpenStack services are running,
its time to configure the overcloud to be useful.

These commands are ran directly on the new virtual OpenStack host.

## Source the Admin OpenRC file
Kolla-Ansible's post-deploy task created an openrc file which can be used to
authenticate as the admin user it created. It's a good idea to make your own
user and openrc file, but for now this will do.

```bash
source /etc/kolla/admin-openrc.sh
```


## Create a Cinder Volume Type

If no cinder volume type has been created, one must be made. These is required
for Magnum and for other storage backends, and also good practice.

```bash
openstack volume type create --public local-lvm
```


## Create a Flat Provider Network
Since this is OpenStack on OpenStack, using VLANs for the provider network is
more trouble than its worth. Make a flat network that shares the hosts
interface to provide workloads external network connectivity.

```bash
openstack network create --share --external --disable-port-security \
  --provider-physical-network physnet1 --provider-network-type flat \
  infra-net

openstack subnet create \
  --no-dhcp --network infra-net \
  --allocation-pool start=10.100.202.180,end=10.100.202.199 \
  --subnet-range 10.100.202.0/24 \
  infra-subnet
```

## Up the interface

`physnet1` is bound to `ens6` in this example, but that interface is down. Start
the interface.
```bash
ip link set dev ens6 up
```

This is sort of a pain since it doesn't happen on reboot. There's a
[bug](https://bugs.launchpad.net/netplan/+bug/1763608) in netplan about it, so
you can't just make a netplan entry.

One solution would be to make a crontab entry for `@reboot`, but I won't be
covering that here.


## Create a VXLAN for workloads
Create a VXLAN for VMs to use and plug it into the host's network using the
flat provider network.

```bash
openstack network create vx1-net

openstack subnet create --network vx1-net --dhcp \
  --subnet-range 192.168.0.0/24 vx1-subnet

openstack router create --no-ha vx1-router
openstack router set --external-gateway infra-net vx1-router
openstack router add subnet vx1-router vx1-subnet
```

This flat provider network will now provide outbound internet access and the
ability to connect into workloads using floating IP addresses.

## Create a flavor
```bash
openstack flavor create tiny --disk 1 --vcpus 1 --ram 256
```

## Create an image
This is the template used to launch our test VM

```bash
wget http://download.cirros-cloud.net/0.4.0/cirros-0.4.0-x86_64-disk.img
apt-get install -y qemu-utils
qemu-img convert -f qcow2 -O raw cirros-0.4.0-x86_64-disk.img cirros.raw
openstack image create --container-format bare --disk-format raw \
  --file cirros.raw --public "cirros"
```


## Open up the firewall
Get the ID of the security group for the scoped project, in this case `admin`,
then open up ICMP, TCP, and UDP for that project.

```
proj_id=$(openstack project list | grep admin | awk '{print $2}')
group_id=$(openstack security group list | grep $proj_id | awk '{print $2}')

openstack security group rule create --proto icmp $group_id
openstack security group rule create --proto tcp --dst-port 1:65535 $group_id
openstack security group rule create --proto udp --dst-port 1:65535 $group_id
```


---


# Create a test VM

```bash
openstack server create --image cirros --flavor tiny --network vx1-net test
# This server was assigned 192.168.0.13

openstack floating ip create infra-net
# The floating IP created was 10.100.202.226

openstack server add floating ip \
  --fixed-ip-address 192.168.0.13 test 10.100.202.226
```

You can now ping or SSH to your VM. The cloud is ready for use.
