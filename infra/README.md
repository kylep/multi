# Infrastructure

The main reason for moving everything into this monorepo was to share infrastructure.

## [aws](aws/)
This is sort of "production", but I tear it down pretty often because its expensive. Once I go
"live" I might keep it up but EKS can easily be over $80/month which isn't great.


## [local-k8s](local-k8s/)
A little K8s cluster I run from home on an Intel Nuc
