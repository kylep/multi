#!/bin/bash
# Run all tests: unit + e2e.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "=== Unit tests (Vitest) ==="
pnpm test

echo ""
echo "=== E2E tests (Playwright) ==="
pnpm e2e

echo ""
echo "All tests passed."
