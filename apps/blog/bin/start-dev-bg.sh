#!/bin/bash
# Start the Next.js dev server in the background and wait for it to be ready.
# Run from apps/blog/. Kill with bin/kill-dev.sh.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../blog"

npm run dev &
DEV_PID=$!

# Wait up to 15 seconds for the server
for i in $(seq 1 30); do
  if curl -s -o /dev/null http://localhost:3000 2>/dev/null; then
    echo "Dev server ready (PID $DEV_PID)"
    exit 0
  fi
  sleep 0.5
done

echo "Dev server did not start in time" >&2
exit 1
