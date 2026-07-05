#!/bin/bash
# Wipe the local postgres volume. Run from apps/kytrade/.
set -euo pipefail

if [[ ! -d postgres-data ]]; then
  echo "ERROR: either not in apps/kytrade/ or postgres-data/ not found"
  exit 1
fi

docker compose down
rm -r postgres-data/
