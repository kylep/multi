#!/bin/bash
rm -rf ~/.kube
aws eks update-kubeconfig --region ca-central-1 --name staging_cluster
