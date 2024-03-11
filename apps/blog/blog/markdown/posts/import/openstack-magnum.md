title: Openstack Magnum: Kubernetes as a Service
summary: How to install, configure, and operate Magnum to deploy Kubernetes
slug: openstack-magnum
category: cloud
tags: OpenStack, Kubernetes
date: 2019-08-30
modified: 2019-08-30
status: draft


Magnum is an OpenStack project used to deploy Kubernetes clusters "as a
service". Once installed and configured, users can create K8S clusters with a
single command.

Magnum depends on the core OpenStack projects, plus Heat and Octavia.


To install OpenStack & Magnum, I've written two posts:

- [OpenStack dev cluster in a VM](/openstack-1-vm-ka-aio.html)
- [OpenStack dev cluster on one metal server](/openstack-3-metal-ka-aio.html)


**NOTE**: I haven't figured out how to get Octavia to actually work yet. Its
absurdly difficult. Until it works, you cant use the LoadBalancer type for your
services with this guide. NodePort still works.


---


# Configure OpenStack Dependencies


## Create an SSH Key-pair

Enter a SSH public key for `$pub_key`. Be sure to keep the private key safe.

The openstack command to create a key-pair needs to load a file for the
public key, so echo it to a file first.

This key will be used in the COE template and injected into each container
host VM.

```bash
pub_key=""
echo $pub_key > id_rsa.pub
openstack keypair create --public-key id_rsa.pub k8s

# Optionally,clean up
rm id_rsa.pub
```


## Deploy CoreOS Glance Image

Magnum needs a base image to install Kubernetes onto.
The two supported options are fedora-atomic and CoreOS.

```bash
# Download & Unzip CoreOS
wget https://stable.release.core-os.net/amd64-usr/current/coreos_production_openstack_image.img.bz2
bzip2 -d  coreos_production_openstack_image.img.bz2

# Install qemu-utils to enable the qemu-img command
apt-get install -y qemu-utils

# Convert the image file from qcow2 to raw format
qemu-img convert -f qcow2 \
  -O raw coreos_production_openstack_image.img coreos.raw

# Upload the image to OpenStack
openstack image create --property os_distro=coreos --container-format bare \
  --disk-format raw --public --file coreos.raw coreos
```


## Create a flavor for the K8S nodes

This defines the size of the container host VMs.

```bash
openstack flavor create medium --disk 50 --vcpus 1 --ram 4096
```


---



# Install the Magnum CLI
This guide uses the CLI, I don't really like Horizon.

Be sure to source an openrc file for your project before running openstack
commands.

```bash
pip install python-openstackclient python-neutronclient python-magnumclient
```

## Show Container Orchestration Engine Service Status
If the service isn't healthy, there's no point moving forward with this guide.

```bash
openstack coe service list
```


---



# Create a Kubernetes ClusterTemplate

See [here](https://docs.openstack.org/magnum/latest/user/#overview) for the
various arguments available to the cluster template create command.

Create the Container Orchestration Engine template

```bash
# Create the cluster template
openstack coe cluster template create \
  --coe kubernetes \
  --image coreos \
  --external-network vlan3-net \
  --keypair k8s \
  --flavor medium \
  --volume-driver cinder \
  --network-driver flannel \
  --dns-nameserver 8.8.8.8 \
  --master-flavor medium \
  --server-type vm \
  --docker-volume-size 5 \
  --master-lb-enabled \
  --floating-ip-enabled \
  k8s

# Confirm it was created
openstack coe cluster template list
```


---


# Create the Kubernetes Cluster

See [here](https://docs.openstack.org/magnum/latest/install/launch-instance.html)
for detailed steps.

```bash
# Create the cluster
openstack coe cluster create --cluster-template k8s --node-count 1 kubernetes1

# Check the status
openstack coe cluster list
```

Watch the status in the `coe cluster list` output.

It will start as `CREATE_IN_PROGRESS` if things are working, then move to
either `CREATE_FAILED` or `CREATE_COMPLETE`.

If the create failed, its google time. Otherwise, the K8S cluster is now live!


---


# Use the Kubernetes Cluster


## Generate Cluster Config

This will create a cluster config file for kubectl in the current working
directory, and print the export command to set `$KUBECONFIG`.

```bash
openstack coe cluster config kubernetes1
```

Run the returned export command that it printed to set up `kubectl`.


## Confirm Kubectl works and nodes are online

Kubectl will use the config file at the path defined by `$KUBECONFIG`.

```bash
kubectl get nodes
```


## Create a load-balanced service

I'm writing a guide on how to install Octavia but I haven't gotten it working
yet.



---


# Next Up

I'm writing a section on how to use Kubernetes in general too, but I want to
fix the Octavia problem first. Check back later!
