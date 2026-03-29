#!/usr/bin/env bash
# Build Robot Battle, copy to blog, build blog, deploy to GCS.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BLOG_DIR="$(dirname "$SCRIPT_DIR")"
GAME_DIR="$BLOG_DIR/../games/robot-battle"

echo "=== Step 1: Build Robot Battle ==="
cd "$GAME_DIR"
npm run build

echo ""
echo "=== Step 2: Copy game to blog ==="
bin/deploy-to-blog.sh

echo ""
echo "=== Step 3: Build blog ==="
cd "$BLOG_DIR"
bin/build-blog-files.sh

echo ""
echo "=== Step 4: Deploy to GCS ==="
bin/prod-deploy.sh

echo ""
echo "=== Step 5: Bust game cache ==="
# Vite hashes JS/CSS bundles but index.html is a stable shell that references
# them. gsutil rsync -c may skip index.html if only the bundle names changed
# inside it (rare) or if index.html was already uploaded but still cached by
# GCS/CDN from a previous deploy. Force no-cache on the game entry point.
gsutil setmeta -h "Cache-Control:no-cache,no-store,must-revalidate" \
  gs://kyle.pericak.com/games/robot-battle/index.html

echo ""
echo "=== Done ==="
