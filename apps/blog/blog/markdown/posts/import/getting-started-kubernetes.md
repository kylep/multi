title: Intro to Building a Kubernetes Application
description: How to build a simple Kubernetes application, with K8S on Magnum
slug: getting-started-kubernetes
category: kubernetes
tags: Kubernetes,Docker
date: 2019-08-29
modified: 2019-08-29
status: draft


This guide isn't finished, don't follow it


This guide will use an already-deployed Kubernetes cluster to deploy a simple
application. For more information about how to deploy Kubernetes, check out my
guide [Deploy Magnum for OpenStack with Kolla-Ansible](/openstack-2-magnum.html).
Magnum is an open


---


# Install kubectl
First thing's first, kubectl needs to be installed on your workstation.

For better steps, follow [this guide](https://kubernetes.io/docs/tasks/tools/install-kubectl/)

On Ubuntu 18.04, run:
```bash
ver=$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)
curl -LO https://storage.googleapis.com/kubernetes-release/release/$ver/bin/linux/amd64/kubectl
chmod +x ./kubectl
mv ./kubectl /usr/local/bin/kubectl
```

## Set $KUBECONFIG
If using Magnum, this can be done by running

```bash
$(openstack coe cluster config <cluster name>)
```


---


# Kubernetes Basics
Check out this [kubectl cheatsheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

## Proxy K8S Network to Workstation

This will launch a proxy on `localhost:8001` into the K8S cluster's network.

```bash
kubectl proxy
```
## Run kubernetes-bootcamp

I don't know what it does, but its useful to run it as an example anyways.
```bash
kubectl run kubernetes-bootcamp --image=gcr.io/google-samples/kubernetes-bootcamp:v1 --port=8080
```

## Nodes
### What is a Node?
Nodes are container host servers running kubelet and Docker.
They're also known as minions.

### Interacting with Nodes

```bash
kubectl get nodes
kubectl describe nodes
kubectl describe nodes <node name>
```


## Pods

### What is a Pod?
See [here](https://cloud.google.com/kubernetes-engine/docs/concepts/pod#pod_templates).
To paraphrase, pods:

- Contain one or more Docker containers
- Each have their own IP address
- Share networking and storage between all containers in the pod
- Meant to run a single instance of your application
- Meant to be deployed inside Deployments as replicas
- Do not automatically heal if a node fails


### Interacting with Pods

List the deployed pods:

```bash
kubectl get pods

# To show pods from all namespaces
kubectl get pods -A

# Show info about pods
kubectl describe pods

# Describe a pod in particular
kubectl describe pods <pod name>
```

### Pod Logs & Exec

To print the logs or run commands inside a pod:

```bash
# Print logs
kubectl logs <pod name>

# Execute Command
kubectl exec <pod name> <command>

# Launch interactive shell
kubectl exec -it <pod name> <command> bash
```

Since I used OpenStack Magnum to deploy K8S, this is **broken**.
That's no surprise, as most things with OpenStack are broken unless you set
them up *just right*.

In this case, there doesn't appear to be any correct way to configure  Magnum
or its COE template so the `kubectl logs` and `kubectl exec` commands actually
work on a new cluster.

The workaround sucks. You have to update the `/etc/hosts` entry on each master
node to identify the internal IP of each minion. **THEN** you need to reboot
the master nodes for the changes to take effect. You could probably restart
a particular container or service, but I'm not sure which.

The default username for the CoreOS cloud image is `core`.
SSH using `ssh core@<floating ip>`.
Password authentication is disabled, but Magnum will have injected the public
key using cloud-init using the keypair defined when setting up the coe
template.


For google, the related error code is:
```bash
Error from server: Get https://<minion hostname>:10250/containerLogs/default/<pod name>: dial tcp: lookup <minion hostname> on 8.8.8.8:53: no such host
```

## Deployments
### What is a deployment?
See [here](https://cloud.google.com/kubernetes-engine/docs/concepts/deployment).
Basically though, deployments are containers that hold x identical pods.

To list launched deployments:

```bash
kubectl get deployments
```

### Interacting with Deployments

```bash
# Restart the pods in a replica by destroying and recreating them
kubectl scale deployment <name> --replicas=0
kubectl scale deployment <name> --replicas=1
```


## Services
### What is a Service?
See [here](https://kubernetes.io/docs/concepts/services-networking/service/).

Services are network objects consisting of different pods.
They are the mechanism by which pods are exposed outside of Kubernetes.

Services are bound to pods using labels and selectors.
Labels are key/value pairs attached to pods.
Selectors are defined in yaml and identify which labels the service should
look for.

#### There are 4 types of service:

1. ClusterIP: Internal networking only
1. NodePort: Bind the service to a port on each Node IP, NAT'd to ClusterIP
1. LoadBalancer: Creates a load balancer with its own IP, balances NodePorts
1. ExternalName: DNS Magic, works with kube-dns to return a CNAME

### Interacting with Services

```bash
# list services
kubectl get services

# to create the service from a deployment, get its name
kubectl get deployment
# deployment_name = "kubernetes-bootcamp"

# create a service using NodePort
# Note: In Magnum the node IP is not routed, need to use the floating IP
kubectl expose deployment kubernetes-bootcamp --type=NodePort --port 8080

# Should be able to curl the Endpoints value now
kubectl get service
curl <floating ip of node>:<port from service>

# create a service using LoadBalancer
kubectl expose deployment kubernetes-bootcamp --type=LoadBalancer --port 8080

# wait for the external ip to exit <pending> state
kubectl get service



# show detailed info about the service
kubectl describe service kubernetes-bootcamp

# delete a service
kubectl delete service kubernetes-bootcamp
```










# Suggested Reading
- [kubernetes.io - Kubernetes Basics](https://kubernetes.io/docs/tutorials/kubernetes-basics/)


