```
# prep the ns
k create ns kytrade

# build the library chart - "helm dependency update" works too
helm dependency build

# show what will get installed
helm template kytrade-client ./ --namespace kytrade --values values.yaml| tee sample-manifest.yaml

# install it
helm install kytrade-client ./ --namespace kytrade --values values.yaml
```
