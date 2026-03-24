#!/bin/bash
# Build's the static files. If a posarg is passed, copies them there.
# You can't build straight into a volume mount on Docker.
# Google Cloud Build expects the posarg to be /workspace.

if [ ! -d bin/ ]; then
    echo "Run all scripts from apps/blog/"
      exit 1
fi

if [ -f exports.sh ]; then
  echo "Found exports file. Sourcing it."
  source exports.sh
fi


cd blog
mkdir -p out/

echo "Building the static files..."
# TODO: Support toggling the node_env with an argument
npm run build 2>&1 | tee ../build.log
build_status=${PIPESTATUS[0]}
if [ "$build_status" -ne 0 ]; then
  echo "Build failed with exit code $build_status"
  exit "$build_status"
fi

# copy index1.html to index.html for convenience and better ux
cp out/index1.html out/index.html

# Generate sitemap.xml in out/
echo "Generating sitemap..."
if ! node scripts/generate-sitemap.mjs; then
  echo "Sitemap generation failed"
  exit 1
fi

# Generate feed.xml (RSS) in out/
echo "Generating RSS feed..."
if ! node scripts/generate-rss.mjs; then
  echo "RSS feed generation failed"
  exit 1
fi

if [[ "$1" == "" ]]; then
  echo "WARNING: output_dir pos arg is reuqired if copying to volume mount"
  exit 0
fi

# Copy the contents to a directory im allowed to volume mount (same nextjs hack)
cd ..
output_dir=$1
echo "Copying the static files to $output_dir"
mkdir -p $1
cp -r blog/out/* $1/ 2>&1 | grep -v "(not copied)"
