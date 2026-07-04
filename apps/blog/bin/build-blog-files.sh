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

# Inject WebSite + Person JSON-LD into the static home page (index.html, index1.html).
# Done post-build because React HTML-escapes script-tag children, breaking JSON-LD.
echo "Injecting home-page JSON-LD..."
if ! node scripts/inject-home-jsonld.mjs; then
  echo "JSON-LD injection failed"
  exit 1
fi

# Storybook ("the workshop") ships alongside the site at /storybook/. It only
# changes when components/tokens/stories/config do, so the slow webpack rebuild
# is gated on a content hash of those inputs vs the hash stored beside the
# deployed copy. Match -> restore the deployed Storybook (no rebuild). Mismatch
# or unreadable bucket -> rebuild. out/storybook is ALWAYS populated; otherwise
# prod-deploy.sh's `rsync -d` would delete the live workshop.
SB_BUCKET="gs://kyle.pericak.com/storybook"
SB_INPUTS=(.storybook components design-system lib package.json package-lock.json postcss.config.js tsconfig.json next.config.js)
if command -v sha256sum >/dev/null 2>&1; then sha_cmd=(sha256sum); else sha_cmd=(shasum -a 256); fi
# Null-delimited so filenames with spaces/special chars hash correctly.
sb_hash=$(find "${SB_INPUTS[@]}" -type f -print0 2>/dev/null | LC_ALL=C sort -z | xargs -0 "${sha_cmd[@]}" | "${sha_cmd[@]}" | awk '{print $1}')
echo "Storybook input hash: $sb_hash"

rebuild_storybook() {
  echo "Building Storybook (inputs changed or no deployed copy)..."
  npm run build-storybook || return 1
  rm -rf out/storybook
  cp -r storybook-static out/storybook
  printf '%s\n' "$sb_hash" > out/storybook/.build-hash
}

sb_deployed_hash=""
if command -v gsutil >/dev/null 2>&1; then
  sb_deployed_hash=$(gsutil cat "$SB_BUCKET/.build-hash" 2>/dev/null | tr -d '[:space:]' || true)
fi

if [ -n "$sb_deployed_hash" ] && [ "$sb_deployed_hash" = "$sb_hash" ]; then
  echo "Storybook inputs unchanged; restoring deployed copy."
  mkdir -p out/storybook
  # Single-process (no -m): gsutil multiprocessing crashes Python on macOS
  # (bugs.python.org/issue33725). Still multithreaded; fine for ~80 small files.
  if ! gsutil -o "GSUtil:parallel_process_count=1" rsync -r "$SB_BUCKET" out/storybook; then
    echo "Restore failed; rebuilding Storybook."
    rebuild_storybook || { echo "Storybook build failed"; exit 1; }
  fi
else
  rebuild_storybook || { echo "Storybook build failed"; exit 1; }
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
