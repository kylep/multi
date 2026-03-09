# Policy for openclaw service account
# Grants read-only access to openclaw secrets

path "secret/data/openclaw" {
  capabilities = ["read"]
}

path "secret/metadata/openclaw" {
  capabilities = ["read"]
}
