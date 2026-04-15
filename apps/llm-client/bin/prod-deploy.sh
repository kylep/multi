#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
OUT_DIR="$APP_DIR/out"

if [ ! -f "$OUT_DIR/index.html" ]; then
  echo "No output files found. Run: npm run build --prefix $APP_DIR"
  exit 1
fi

src_url="$OUT_DIR"
dst_url="gs://kyle.pericak.com/apps/llm-client"

echo "Checking for changes..."
if ! dry_run_output=$(gsutil -m rsync -r -c -n "$src_url" "$dst_url"); then
  echo "Dry-run failed, aborting."
  exit 1
fi

gsutil -m rsync -r -c "$src_url" "$dst_url"

changed_urls=()
while IFS= read -r url; do
  [[ -n "$url" ]] && changed_urls+=("$url")
done < <(echo "$dry_run_output" \
  | grep "^Would copy" \
  | sed "s|Would copy .* to \(gs://.*\)$|\1|")

if [ ${#changed_urls[@]} -gt 0 ]; then
  echo "Disabling cache headers on ${#changed_urls[@]} changed file(s)..."
  gsutil -m setmeta -h "Cache-Control:no-cache,no-store,must-revalidate" \
    "${changed_urls[@]}"
else
  echo "No files changed, skipping metadata update."
fi

echo "Deployed to https://kyle.pericak.com/apps/llm-client/"
