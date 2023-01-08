# kytrade

- My personal trading tools and automation.
- Open source, but I'd advise against using any of this without talking to me.
- Kytrade 1, or just Kytrade, is an extant trading CLI that I wrote a while ago.
- Eventually I'll merge the old CLI into this and rename kytrade2 to kytrade


## Dev

Start the dev env
```
mkdir -p postgres-data
docker-compose up
```

First time you start it, also create the database
```
docker exec -it kytrade2-postgres-1 psql -U kytrade
```

## Prod

### Creating the K8s cluster

The EKS cluster to run Kytrade is defined with Terraform

```
source export.sh
cd tf/aws

# terraform init  # required for brand new cluster

tf apply

# verify the EKS cluster and its details look ok
aws eks list-clusters
aws eks list-nodegroups --cluster-name kytrade2-EKS-Cluster
aws eks describe-nodegroup --cluster-name kytrade2-EKS-Cluster --nodegroup-name kytrade2-EKS-Node-Group

# Get kubeconfig file
rm -rf ~/.kube
aws eks update-kubeconfig --region ca-central-1 --name kytrade2-EKS-Cluster

# Verify cluster - note with EKS you don't need to add a CNI, Amazon VPC CNI is installed
k get nodes
```

### Verify infra

```
k create deployment nginx -replicas 1 --image nginx
kubectl expose deployment nginx --name nginx --port 8080 --target-port 80 --type ClusterIP

```



### Deploying the app to K8s
```
# ...helmfile example
```


---

# Hydrating the database

Particuarly for local dev, you'll want to load some data before things are useful.

```
bin/hydrade-db.sh
```

