title: Install Non-Prod OpenStack on a Physical Server
summary: Installing all-in-one OpenStack with Kolla-Ansible metal as a test cloud
slug: openstack-aio-ka-metal
category: cloud
tags: OpenStack
date: 2019-08-13
modified: 2019-08-13
status: published
image: openstack-kolla.png
thumbnail: openstack-kolla-thumb.png



**This post is linked to from the [OpenStack Deep Dive Project](/openstack.html)**

---

This guide installs OpenStack on a single metal server.

To install OpenStack, I use [Kolla-Ansible](https://github.com/openstack/kolla-ansible),
an open source Ansible project that deploys Kolla OpenStack images.

OpenStack [Rocky](https://www.openstack.org/software/rocky/) will be installed,
configured with a
[VLAN provider network](https://docs.openstack.org/ocata/networking-guide/intro-os-networking.html#intro-os-networking-provider)
for overcloud networking, and include the following OpenStack APIs:

- Keystone
- Cinder
- Nova
- Glance
- Neutron
- Heat
- Magnum

---

[TOC]

---


# Environment
This was the hardware used while writing this guide. It's neither the minimum
nor recommended hardware setup for any sort of cloud.

**Hardware:**

Intel NUC with two drives, one interface, 32G RAM, running Ubuntu 18.04.

**Drive Labels:**

- Boot drive: `/dev/nvme0n1`
- Cinder LVM backup: `dev/sda`

**Networking**

- Physical interface `eno1`
- VLAN subinterface `vlan.2@eno1`
- Host IP: `10.254.2.2`
- Cloud VIP: `10.254.2.254`


---


# Update & Prepare System

Configure the VG for cinder and install Kolla-Ansible

```bash
# Update and install deps
apt-get update && apt-get upgrade -y
apt-get -y install python python-pip
pip install \
  ansible \
  python-openstackclient \
  python-neutronclient \
  python-magnumclient

# Create VG for cinder LVM
pvcreate /dev/sda
vgcreate cinder-volumes /dev/sda

# Install Kolla-Ansible
cd ~
git clone https://github.com/openstack/kolla-ansible.git
cd ~/kolla-ansible
git checkout stable/rocky
pip install .

# Deploy initial KA config files
mkdir -p /etc/kolla/config
cp ~/kolla-ansible/etc/kolla/passwords.yml /etc/kolla/
cp ~/kolla-ansible/ansible/inventory/all-in-one /etc/kolla/inventory
kolla-genpwd
```

# Configure Networking

The Intel NUC only has one Ethernet port, but Kolla-Ansible requires two ports.
One port is for the APIs, and another can't have any addresses on it as it ends
up being controlled by OpenVSwitch and Neutron.

To get around this, I use VLAN subinterfaces. This works well, but it does
require that you add a layer 3 route from the overcloud subnet to the
undercloud API network the guests need to connect to the host.

OVS creates a bridge bound to the physical port, where the VLAN modules
work alongside it. The only drawback is you can't use those VLANs in the
overcloud.

`vi /etc/netplan/01-netcfg.yaml`

```text
network:
  version: 2
  renderer: networkd
  ethernets:
      eno1:
        dhcp4: false
        dhcp6: false
  vlans:
    vlan.2:
      id: 2
      link: eno1
      addresses: [ 10.254.2.2/24 ]
      gateway4: 10.254.2.1
      nameservers:
        addresses: ["8.8.8.8", "8.8.4.4"]
```

Apply the changes. This might kick you.
```bash
netplan try
```


# Enable VLANs for Neutron

Create this config file to enable VLAN support

```bash
mkdir -p /etc/kolla/config/neutron
```

`vi /etc/kolla/config/neutron/ml2_conf.ini`

```ini
[ml2_type_vlan]
network_vlan_ranges = physnet1:1:4094
```


# Globals file

`vi /etc/kolla/globals.yml`

```yaml
---

kolla_internal_vip_address: "10.254.2.254"
neutron_external_interface: "eno1"
network_interface: "vlan.2"
keepalived_virtual_router_id: "66"

kolla_base_distro: "ubuntu"
kolla_install_type: "source"
openstack_release: "rocky"

enable_keepalived: "yes"
enable_mariadb: "yes"
enable_memcached: "yes"
enable_rabbitmq: "yes"
enable_chrony: "yes"
enable_fluentd: "yes"
enable_nova_ssh: "yes"
enable_ceph: "no"
enable_horizon: "yes"

enable_haproxy: "yes"
kolla_enable_tls_external: "yes"

enable_nova: "yes"
nova_compute_virt_type: "kvm"

enable_keystone: "yes"
keystone_admin_user: "admin"
keystone_admin_project: "admin"

enable_glance: "yes"
glance_backend_file: "yes"

enable_cinder: "yes"
enable_cinder_backup: "no"
enable_cinder_backend_lvm: "yes"
cinder_volume_group: "cinder-volumes"
cinder_backend_ceph: "no"

enable_neutron: "yes"
enable_neutron_lbaas: "yes"
neutron_extension_drivers:
  - name: "port_security"
    enabled: true
  - name: "dns"
    enabled: true

enable_magnum: "yes"
enable_octavia: "no"
default_docker_volume_type: "local-lvm"
```


---


# Install OpenStack using Kolla-Ansible

```bash
kolla-ansible certificates
kolla-ansible -i /etc/kolla/inventory bootstrap-servers
kolla-ansible -i /etc/kolla/inventory deploy
kolla-ansible -i /etc/kolla/inventory post-deploy
```


---

# Overcloud Cluster Configuration

The OpenStack services are deployed, now to configure the cloud to be usable.

For details about these commands, see my previous VM guide [here](/openstack-aio-ka-vm..html).

These commands are ran right on the physical OpenStack host.

```bash
# Authenticate to the cloud
source /etc/kolla/admin-openrc.sh

# Define the volume type in cinder
openstack volume type create --public local-lvm

# Create a provider network on VLAN 3
openstack network create --external --share \
  --provider-physical-network physnet1 --provider-network-type vlan \
  --provider-segment 3 --disable-port-security vlan3-net

# Assign a subnet to the vlan3-net network
openstack subnet create \
  --dhcp --network vlan3-net \
  --subnet-range 10.254.3.0/24 \
  vlan3-subnet

# Create a small cirros-sized flavor
openstack flavor create tiny --disk 1 --vcpus 1 --ram 256

# Download and import Cirros as a glance image
wget http://download.cirros-cloud.net/0.4.0/cirros-0.4.0-x86_64-disk.img
apt-get install -y qemu-utils
qemu-img convert -f qcow2 -O raw cirros-0.4.0-x86_64-disk.img cirros.raw
openstack image create --container-format bare --disk-format raw \
  --file cirros.raw --public "cirros"

# Open up the firewall rules for the admin project
proj_id=$(openstack project list | grep admin | awk '{print $2}')
group_id=$(openstack security group list | grep $proj_id | awk '{print $2}')

openstack security group rule create --proto icmp $group_id
openstack security group rule create --proto tcp --dst-port 1:65535 $group_id
openstack security group rule create --proto udp --dst-port 1:65535 $group_id
```


---


# Create a test VM
```bash
openstack server create --image cirros --flavor tiny --network vlan3-net test
```

The cloud is now ready for use. If layer 3 routing from VLAN 2 to VLAN 3 is
configured, then the VM will be accessible.

