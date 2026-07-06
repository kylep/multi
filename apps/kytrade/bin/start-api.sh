#!/bin/bash
# Run the API locally with auto-reload. Run from apps/kytrade/.
set -euo pipefail

uv run uvicorn kytrade.api.app:app --reload --port 8000
