#!/bin/bash
# Build static blog files and serve them with python3 http.server.
# Designed for container environments where next dev is too heavy.
# Run from apps/blog/. Kill with: kill $(cat /tmp/static-server.pid)
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BLOG_DIR="$SCRIPT_DIR/.."

if curl -s -o /dev/null http://localhost:3000 2>/dev/null; then
  echo "Server already running at http://localhost:3000"
  exit 0
fi

# Build static files
cd "$BLOG_DIR"
bin/build-blog-files.sh

# Serve from the out/ directory
cd "$BLOG_DIR/blog/out"
python3 -m http.server 3000 > /tmp/static-server.log 2>&1 &
echo $! > /tmp/static-server.pid

# Wait up to 5 seconds for the server
for i in $(seq 1 10); do
  if curl -s -o /dev/null http://localhost:3000 2>/dev/null; then
    echo "Static server ready (PID $(cat /tmp/static-server.pid))"
    exit 0
  fi
  sleep 0.5
done

kill "$(cat /tmp/static-server.pid)" 2>/dev/null || true
echo "Static server did not start in time" >&2
exit 1
