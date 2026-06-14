#!/usr/bin/env bash
#
# Design-system verification gate (PER-135). Run after any design-system
# change; a task is "done" only when this exits 0. Agents use it to
# self-verify before opening a PR.
#
#   apps/blog/bin/verify-design-system.sh
#
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/../blog" && pwd)"
cd "$APP_DIR"

echo "==> [1/5] Biome lint (design-system JS/TS surfaces)"
# Lint, not check: the repo standard (and pre-commit) is biome lint, not
# format enforcement. CSS is excluded — Biome's CSS parser rejects Tailwind
# v4 at-rules (@theme/@plugin) and tokens.css is validated by the build.
npx @biomejs/biome lint components lib .storybook design-system/Foundations.stories.tsx

echo "==> [2/5] No raw hex in design-system components"
node scripts/check-no-raw-hex.mjs

echo "==> [3/5] Storybook build"
npm run build-storybook

echo "==> [4/5] Next.js static export"
npm run build

echo "==> [5/5] Playwright (render + a11y)"
# One retry: heavy wiki routes cold-compile on the dev server's first hit
# and can exceed the per-test timeout; they pass once warm.
npx playwright test --retries=1

echo "==> design-system gate: PASS"
