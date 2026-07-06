#!/bin/bash
# Create tables, load index membership, track house ETFs. Run from apps/kytrade/.
set -euo pipefail

if [[ ! -d src ]]; then
  echo "ERROR: run this from apps/kytrade/"
  exit 1
fi

uv run kt db init
uv run kt data load-index all || {
  echo "WARN: live fetch failed, using the bundled Oct 2022 S&P 500 snapshot"
  uv run kt data load-index sp500 --file raw-data/indexes/spy-oct17-2022.xlsx
}
uv run kt data track-etf SPY --currency USD
uv run kt data track-etf QQQ --currency USD
uv run kt data track-etf XIU.TO --currency CAD
