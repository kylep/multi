#!/bin/bash
# Run the integration suite against the docker-compose postgres, in a
# dedicated kytrade_test database so real data is never touched.
# Run from apps/kytrade/. Password comes from the environment or .env;
# a throwaway default is used only when neither exists (fresh volume).
set -euo pipefail

if [[ ! -d src ]]; then
  echo "ERROR: run this from apps/kytrade/"
  exit 1
fi

if [[ -z "${POSTGRES_PASSWORD:-}" && ! -f .env ]]; then
  export POSTGRES_PASSWORD=kytrade-itest
fi

docker compose up -d postgres --wait
docker compose exec postgres \
  psql -U "${POSTGRES_USER:-kytrade}" -d "${DATABASE_NAME:-kytrade}" \
  -c 'CREATE DATABASE kytrade_test' 2>/dev/null || true

DATABASE_NAME=kytrade_test uv run pytest -m integration -o addopts= "$@"
