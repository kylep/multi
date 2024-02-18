# Installation Steps

## On AWS
from `multi/`:
from `multi/`:

Set the `ENV` environment variable
```
export ENV=aws
```

create `secrets/helm-values/aws/api-values.yaml`. Example:

```
cat << EOH > secrets/helm-values/aws/api-values.yaml
image:
  tag: "2.0.0"

EOH

```

Now use Helm to install the API.

```
helm install kytrade-api kytrade/api/helm --values secrets/helm-values/aws/api-values.yaml
```
