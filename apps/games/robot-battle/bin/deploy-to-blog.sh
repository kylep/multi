#!/usr/bin/env bash
# Build Robot Battle and copy to blog public directory.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BLOG_DEST="$PROJECT_DIR/../../blog/blog/public/games/robot-battle"

echo "Building Robot Battle..."
cd "$PROJECT_DIR"
npm run build

echo "Deploying to $BLOG_DEST..."
rm -rf "$BLOG_DEST"
mkdir -p "$BLOG_DEST"
cp -r dist/* "$BLOG_DEST/"

echo "Done. Game deployed to /games/robot-battle/index.html"
