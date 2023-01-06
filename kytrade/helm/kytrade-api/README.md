```
# prep the ns
k create ns kytrade

# build the library chart - "helm dependency update" works too
helm dependency build

# show what will get installed
helm template kytrade-api ./ --values values.yaml --namespace kytrade | tee sample-manifest.yaml

# install it
helm install kytrade-api ./ --namespace kytrade --values values.yaml
```
