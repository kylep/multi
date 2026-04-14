#!/bin/bash
# Install dependencies and set up the project.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "Installing dependencies..."
pnpm install

echo "Installing Playwright browsers..."
pnpm exec playwright install chromium

echo "Done. Run bin/start-dev.sh to start the dev server."
