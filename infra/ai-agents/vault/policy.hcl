# Policy for ai-agents service account
# Grants read-only access to ai-agents secrets

path "secret/data/ai-agents/*" {
  capabilities = ["read"]
}

path "secret/metadata/ai-agents/*" {
  capabilities = ["read"]
}
