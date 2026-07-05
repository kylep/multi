#!/bin/bash
# Create tables and load the S&P 500 baseline. Run from apps/kytrade/.
set -euo pipefail

if [[ ! -d raw-data ]]; then
  echo "ERROR: run this from apps/kytrade/"
  exit 1
fi

uv run kt db init
uv run kt etl load-sp500 raw-data/indexes/spy-oct17-2022.xlsx
