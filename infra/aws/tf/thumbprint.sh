#!/bin/bash
# From https://github.com/hashicorp/terraform-provider-aws/issues/10104
# Required to get the thumbprint_list value of openid_connect_provider in iam.tf

REGION=$1
THUMBPRINT=$(echo | openssl s_client -servername oidc.eks.${REGION}.amazonaws.com -showcerts -connect oidc.eks.${REGION}.amazonaws.com:443 2>&- | tail -r | sed -n '/-----END CERTIFICATE-----/,/-----BEGIN CERTIFICATE-----/p; /-----BEGIN CERTIFICATE-----/q' | tail -r | openssl x509 -fingerprint -noout | sed 's/://g' | awk -F= '{print tolower($2)}')
THUMBPRINT_JSON="{\"thumbprint\": \"${THUMBPRINT}\"}"
echo $THUMBPRINT_JSON


# ... "Setting thumbprints to ["9E99A48A9960B14926BB7F3B02E22DA2B0AB7280"] should suffice"
