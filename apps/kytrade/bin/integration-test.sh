#!/bin/bash
# Run the integration suite against a disposable docker-compose postgres.
# Run from apps/kytrade/. Uses a throwaway password and database state.
set -euo pipefail

if [[ ! -d src ]]; then
  echo "ERROR: run this from apps/kytrade/"
  exit 1
fi

export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-kytrade-itest}"
docker compose up -d postgres --wait

uv run pytest -m integration -o addopts= "$@"
