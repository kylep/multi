title: Operating OpenStack from Ansible
summary: Creating instances, volumes, and networks in OpenStack using Ansible
slug: openstack-ansible
category: cloud
tags: OpenStack, Ansible
date: 2019-12-03
modified: 2019-12-03
status: published
image: openstack.png
thumbnail: openstack-thumb.png


**This post is linked to from the [OpenStack Deep Dive Project](/openstack.html)**

---



**Assumption:** To avoid dealing with varying OpenStack policy configuration,
it's assumed that the scoped user has both `_member_` and `admin` on the scoped
project.

Check out [the Breqwatr GitHub Examples](https://github.com/breqwatr/ansible-openstack-examples)
for some usable code. I wrote this post while contributing to that project.

**Note:** Don't confuse this with "OpenStack-Ansible", which is an open-source
deployment tool for creating OpenStack clouds themselves. This guide covers how
to deploy workloads to an already-deployed cloud.

---

[TOC]

---


# Setup

Install Ansible and the OpenStack packages

```bash
apt-get install -y python ptyhon-pip
pip install \
  ansible \
  openstack-sdk

```


---


# Finding OpenStack modules

I haven't found a good comprehensive list. Some `os_` modules can be found
 using search here:
[OpenStack Ansible Modules](https://docs.ansible.com/ansible/latest/search.html?q=os_&check_keywords=yes&area=default).

I'll be showing how to use a few useful ones in this post.


---


# Define Auth Settings

Define a file to hold the authentication data for your cloud. Something like
this:

`vi environment.yml`

```yml
is_https_cert_valid: no
openstack_auth:
  auth_url: https://<openstack vip/fqdn>:5000
  username: <username>
  password: <password>
  project_name: <project>
```


---



# Users, Projects, and Roles: IAM for OpenStack

OpenStack associates cloud entities (like VMs, volumes, networks, etc.) inside
projects. Users can be granted access as either a member or admin to projects,
allowing them to interact with those entities. Projects can also have quotas
assigned to them, which will limit the resources any one user can take.

**Ansible modules used to manage identity configuration:**

- [os_project_info](https://docs.ansible.com/ansible/latest/modules/os_project_info_module.html)
- [os_project](https://docs.ansible.com/ansible/latest/modules/os_project_module.html)
- [os_quota](https://docs.ansible.com/ansible/latest/modules/os_quota_module.html)
- [os_user_info](https://docs.ansible.com/ansible/latest/modules/os_user_info_module.html)
- [os_user](https://docs.ansible.com/ansible/latest/modules/os_user_module.html)
- [os_keystone_role](https://docs.ansible.com/ansible/latest/modules/os_keystone_role_module.html)


## Show Project(s)

Module: [os_project_info](https://docs.ansible.com/ansible/latest/modules/os_project_info_module.html)

```yaml
# If name: is empty, all projects will be queried
- name: "Get project details"
  os_project_info:
    auth: "{{ openstack_auth }}"
    verify: "{{ is_https_cert_valid }}"
    name: "{{ project_name_or_id }}"
  register: projects
```


## Create Project

Module: [os_project](https://docs.ansible.com/ansible/latest/modules/os_project_module.html)

```yaml
- name: "Create the 'DemoProject' project"
  os_project:
    auth: "{{ openstack_auth }}"
    state: present
    name: DemoProject
    description: Ansible-created demo project. Safe to delete.
    domain_id: default
    enabled: True`yaml

```

## Apply Quota to Project

Module: [os_quota](https://docs.ansible.com/ansible/latest/modules/os_quota_module.html)

```yaml
# -1 is used to indicate unlimited. RAM is in MB.
- name: "Set a quota on 'DemoProject'"
  os_quota:
    name: DemoProject
    cores: 4
    gigabytes: 100
    instances: 2
    volumes: -1
    snapshots: -1
    ram: 8192
```

## Show user(s)

Module: [os_user_info](https://docs.ansible.com/ansible/latest/modules/os_user_info_module.html)

```yaml
# If name: is used, only one user is selected. Else, all are.
- name: "Get users details"
  os_user_info:
    auth: "{{ openstack_auth }}"
    verify: "{{ is_https_cert_valid }}"
    name: "{{ user_name_or_id }}"
  register: users
```

## Create user

Module: [os_user](https://docs.ansible.com/ansible/latest/modules/os_user_module.html)

```yaml
- name: "Create the user 'DemoUser' in keystone"
  os_user:
    auth: "{{ openstack_auth }}"
    state: present
    name: DemoUser
    password: Breqwatr2019
    update_password: on_create
    email: demouser@example.com
    domain: default
    default_project: DemoProject
```


## Add User to Project

Generally the two roles that matter in an OpenStack cloud, or at least one
deployed using Kolla-Ansible, are `_member_` and `admin`. Their access levels
are intuitive.

```yaml
- name: "Add demo user to demo project as _member_"
  os_user_role:
    auth: "{{ openstack_auth }}"
    verify: "{{ is_https_cert_valid }}"
    user: "{{ demo_user_name }}"
    role: "{{ member_role_name }}"
    project: "{{ demo_project }}"
```

---


# Defining Virtual Environment: Images, Flavors, and Networking

Before cloud users can make instances, cloud administrators need to define the
possible properties of those instances.

Servers/VMs/instances are launched by OpenStack inside projects.
Their RAM, CPU, and boot volume size are defined by a "flavor". The boot volume
is created as a copy of a template image.

OpenStack also defines the networking of the instance. It creates virtual
ports and binds them to the instance. For external access, some instances use
an external VLAN directly on their assigned ports. Another popular approach is
to use a private overlay network scoped to one project, such as a VXLAN.
Instance ports are given IPs on the VXLAN, then users create a
"Floating IP" to enable inbound access. Floating IPs are static NAT rules,
which grab an IP from a pool on an upstream VLAN network.

**Ansible modules used to define instances and their environment**:

- [os_image_info](https://docs.ansible.com/ansible/latest/modules/os_image_info_module.html)
- [os_image](https://docs.ansible.com/ansible/latest/modules/os_image_module.html)
- [os_flavor_info](https://docs.ansible.com/ansible/latest/modules/os_flavor_info_module.html)
- [os_nova_flavor](https://docs.ansible.com/ansible/latest/modules/os_flavor_info_module.html)
- [os_project_access](https://docs.ansible.com/ansible/latest/modules/os_project_access_module.html)
- [os_network_info](https://docs.ansible.com/ansible/latest/modules/os_networks_info_module.html)
- [os_network](https://docs.ansible.com/ansible/latest/modules/os_network_module.html)
- [os_subnets_info](https://docs.ansible.com/ansible/latest/modules/os_subnets_info_module.html)
- [os_subnet](https://docs.ansible.com/ansible/latest/modules/os_subnet_module.html)
- [os_router](https://docs.ansible.com/ansible/latest/modules/os_router_module.html)

## Template Images

OpenStack uses Glance to manage its image registry. Glance is basically an
intelligent file-server for volume template images. It has some nice features
under the hood to work with various storage providers, allowing features like
near-instant zero-cost clones that barely use any data.


### List Image Information

Module: [os_image_info](https://docs.ansible.com/ansible/latest/modules/os_image_info_module.html)

```yaml
# get data about all images
- name: "Get images datas"
  os_image_info:
    auth: "{{ openstack_auth }}"
    verify: "{{ is_https_cert_valid }}"

# get data about one image. 'image:' accepts the name (if unique) or ID.
- name: "Get images datas"
  os_image_info:
    auth: "{{ openstack_auth }}"
    verify: "{{ is_https_cert_valid }}"
		server: "{{ image_name_or_id }}"
```


### Deploy a Glance Image

Module: [os_image](https://docs.ansible.com/ansible/latest/modules/os_image_module.html)

```yaml
- name: "Upload Cirros image"
  os_image:
    auth: "{{ openstack_auth }}"
    verify: "{{ is_https_cert_valid }}"
    name: DemoCirros
    container_format: bare
    disk_format: raw
    state: present
    filename: "{{ files_directory }}/cirros.raw"
    is_public: yes
    min_disk: 1
    min_ram: 256
```

### Grant Project Access to Private Image

Honestly I can't figure this one out. You should be able to set the image
to shared instead of just public or private, but Ansible only has a boolean for
`is_public`. Just create it scoped to the project you want to access it in if
you want it to be private, I guess.


## Flavors: Define Instance Size

### List Flavor Information

Module: [os_flavor_info](https://docs.ansible.com/ansible/latest/modules/os_flavor_info_module.html)

```yaml
# when name: is empty, all flavors are returned
- name: "Get flavors details"
  os_flavor_info:
    auth: "{{ openstack_auth }}"
    verify: "{{ is_https_cert_valid }}"
    name: "{{ flavor_name_or_id }}"
  register: flavors
```

### Create a Flavor

See [os_nova_flavor](https://docs.ansible.com/ansible/latest/modules/os_flavor_info_module.html)

Flavors defien the size of instances. If it's public, all projects on the cloud
can use it. If private, access needs to be explicitly granted.

-  CPU: cores
-  RAM: MB
-  Disk: GB

```yaml
- name: "Create a private demo flavor"
  os_nova_flavor:
    auth: "{{ openstack_auth }}"
    verify: "{{ is_https_cert_valid }}"
    state: present
    name: "{{ demo_flavor }}"
    ram: 1024
    vcpus: 1
    disk: 10
    is_public: no
```


### Grant Access to Flavor

See [os_project_access](https://docs.ansible.com/ansible/latest/modules/os_project_access_module.html)


```yaml
- name: "Get project's ID by its name"
  os_project_info:
    auth: "{{ openstack_auth }}"
    verify: "{{ is_https_cert_valid }}"
    name: "{{ demo_project }}"
  register: project_data

- name: "Grant the project access to the demo flavor"
  os_project_access:
    auth: "{{ openstack_auth }}"
    verify: "{{ is_https_cert_valid }}"
    state: present
    target_project_id: "{{ project_data['openstack_projects'][0]['id'] }}"
    resource_name: "{{ demo_flavor }}"
    resource_type: nova_flavor
```


## Networking


### List current networks

Module: [os_network_info](https://docs.ansible.com/ansible/latest/modules/os_networks_info_module.html)

```yaml
- name: "Get network details"
  os_networks_info:
    auth: "{{ openstack_auth }}"
    verify: "{{ is_https_cert_valid }}"
    name: "{{ network_name_or_id }}"
  register: networks
```

### Create a VLAN Network

Module: [os_network](https://docs.ansible.com/ansible/latest/modules/os_network_module.html)

A network administrator will still need to trunk the VLAN to the cloud nodes,
but this configuration will cause outbound traffic on the created network to
use the assigned VLAN tag.

This network can be considered an external network. You might want it to reach
your edge firewall and whatever other network resources your instances will be
connecting to.

```yaml
- name: "Deploy private VLAN network"
  os_network:
    auth: "{{ openstack_auth }}"
    verify: "{{ is_https_cert_valid }}"
    state: present
    name: "{{ vlan_network_name }}"
    external: true
    provider_segmentation_id: "{{ vlan_id }}"
    provider_network_type: "vlan"
    provider_physical_network: physnet1
    shared: no
    project: "{{ demo_project }}"
```

### Create a VXLAN Network

Module: [os_network](https://docs.ansible.com/ansible/latest/modules/os_network_module.html).

This network will not be accessible from outside the OpenStack cluster. To
access it, you'll either need to connect from another instance on this network,
or through a virtual router connected to both this and an external network.

```yaml
- name: "Deploy private VXLAN overlay network"
  os_network:
    auth: "{{ openstack_auth }}"
    verify: "{{ is_https_cert_valid }}"
    state: present
    name: "{{ vxlan_network_name }}"
    external: false
    provider_network_type: "vxlan"
    shared: no
    project: "{{ demo_project }}"
```


### Show subnets

Module: [os_subnets_info](https://docs.ansible.com/ansible/latest/modules/os_subnets_info_module.html)

```yaml
- name: "Get subnet details"
  os_subnets_info:
    auth: "{{ openstack_auth }}"
    verify: "{{ is_https_cert_valid }}"
    name: "{{ subnet_name_or_id }}"
  register: subnets
```

### Create a Subnet

Module: [os_subnet](https://docs.ansible.com/ansible/latest/modules/os_subnet_module.html)

In OpenStack, there isn't a one-to-one mapping between networks and subnets.
You can technically have more than one subnet share a VLAN ID, for instance.
That isn't the convention used most places though, so I suggest you keep to a
one-to-one mapping anyways.

```yaml
- name: "Create a subnet for a vlan network"
  os_subnet:
    auth: "{{ openstack_auth }}"
    verify: "{{ is_https_cert_valid }}"
    state: present
    network_name: "{{ vlan_network_name }}"
    name: "{{ vlan_subnet_name }}"
    cidr: "{{ vlan_cidr }}"
    allocation_pool_start: "{{ vlan_allocation_pool_start }}"
    allocation_pool_end: "{{ vlan_allocation_pool_end }}"
    dns_nameservers:
       - 1.1.1.1
       - 8.8.8.8
    host_routes:
       - destination: 0.0.0.0/0
         nexthop: "{{ vlan_upstream_router_ip }}"
```


### Create a Router

Module: [os_router](https://docs.ansible.com/ansible/latest/modules/os_router_module.html)

```yaml
# For the interfaces: section, you can just pass the subnet name instead of
# the dictionary shown below, and it will inherit that subnet's gateway. The
# approach shown here is more explicit and can also use other IPs as needed.
- name: "Create router from overlay to external network"
  os_router:
    auth: "{{ openstack_auth }}"
    verify: "{{ is_https_cert_valid }}"
    state: present
    name: "{{ router_name }}"
    network: "{{ vlan_network_name }}"
    external_fixed_ips:
      - subnet: "{{ vlan_subnet_name }}"
    interfaces:
      - net: "{{ vxlan_network_name }}"
        subnet: "{{ vxlan_subnet_name }}"
        portip: "{{ router_ip }}"
```


---


# Launching Instances

Unlike the above examples that were done as an admin scoped user, the examples
in this section will be executed from a non-admin user. The VMs & key-pairs
created will be owned by the user who created them, so you don't want your
administrator user to execute those tasks.

Modules used in this section:

- [os_keypair](https://docs.ansible.com/ansible/latest/modules/os_keypair_module.html)

## Define SSH Keypair

Module: [os_keypair](https://docs.ansible.com/ansible/latest/modules/os_keypair_module.html)

Most Linux cloud images disable password login, even at the console level. In
order to get into the VM, you need to inject an SSH public key using
cloud-init. OpenStack handles all that for you, but you have to upload your
key so it knows what to inject.

```yaml
# You won't be able to access many Linux images without an SSH keypair injected
# into the image's authorized keys file. OpenStack manages keypairs and does
# the injection automatically using cloud-init.
#
- name: "Define SSH keypair"
  os_keypair:
    auth: "{{ demo_user_auth }}"
    verify: "{{ is_https_cert_valid }}"
    state: present
    name: "{{ ssh_keypair_name }}"
    public_key: "{{ ssh_public_key }}"
```


## Servers

### Get Server(s) Data

Module: [os_server_info](https://docs.ansible.com/ansible/latest/modules/os_server_info_module.html)

```yaml
# if server: is empty, data about all servers is returned
- name: "Get named server data"
  os_server_info:
    auth: "{{openstack_auth}}"
    verify: "{{ is_https_cert_valid }}"
		server: "{{ server_name_or_id }}"
  register: servers
```

### Create Instance/Server/VM

Module: [os_server](https://docs.ansible.com/ansible/latest/modules/os_server_module.html)

```yaml
- name: "Create a server"
  os_server:
    state: present
    auth: "{{ demo_user_auth }}"
    verify: "{{ is_https_cert_valid }}"
    name: "{{ server_name }}"
    image: "{{ demo_image_name }}"
    key_name: "{{ ssh_keypair_name }}"
    flavor: "{{ demo_flavor }}"
    nics:
      - net-name: "{{ vxlan_network_name }}"
```

## Floating IP

A floating IP address is a static NAT rule from the external VLAN network
to the address of the instance's port on the internal overlay network.

Module: [os_floating_ip](https://docs.ansible.com/ansible/latest/modules/os_floating_ip_module.html)

```yaml
- name: "Assign floating IP"
  os_floating_ip:
    auth: "{{ demo_user_auth }}"
    verify: "{{ is_https_cert_valid }}"
    state: present
    reuse: yes
    server: "{{ server_name }}"
    network: "{{ vlan_network_name }}"
```

---


# Troubleshooting

## Error: shade is required for this module.

The version of Ansible you're using is too old.

## Error: openstacksdk is required for this module

You didn't install `openstacksdk` in the setup step.

## Issues with the auth variable
The `os_` tasks require an `auth` property, which expects a dictionary
containing the properties shown in the `openstack_auth` variable above. If any
are missing, it won't work.

## Error: CERTIFICATE_VERIFY_FAILED

You've probably got a self-signed certificate. For those, you need to use
 `verify: no` in the `os_*` module.

