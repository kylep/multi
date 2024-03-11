title: Install Kubernetes with Kubedm
slug: k8s-1-install-kubeadm
category: guides
date: 2019-08-12
modified: 2019-08-12
Status: draft


[TOC]

---


This was done on an Ubuntu 18.04 server with 16gb ram, 4 cpu, 200GB ssd disk.

# Objective
Install a single-node non-HA K8S cluster for test purposes using Kubeadm.


# Install kubeadm
```
apt-get update && apt-get upgrade

```


# References
 - [kubernetes.io kubeadm guide](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/)
