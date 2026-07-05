#!/bin/bash
# Create tables and load current S&P 500 membership. Run from apps/kytrade/.
# Offline fallback: uv run kt data load-sp500 --file raw-data/indexes/spy-oct17-2022.xlsx
set -euo pipefail

if [[ ! -d src ]]; then
  echo "ERROR: run this from apps/kytrade/"
  exit 1
fi

uv run kt db init
uv run kt data load-sp500
