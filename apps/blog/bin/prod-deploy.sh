#!/bin/bash


if [ ! -f blog/out/index1.html ]; then
  echo "No output files found. Try bin/build.sh"
  exit
fi

if [ ! -f blog/out/index.html ]; then
  echo "WARN: index1 but not index found. Copying."
  cp blog/out/index1.html blog/out/index.html
fi

# Run the gsutil rsync module to upload files to GCS
# -r    recurse - sync directories
# -c    compare checksums instead of mtime
# -d    Delete extra files under dst_url not found under src_url
src_url="blog/out"
dst_url="gs://kyle.pericak.com"

# Dry run first to find which files will change
echo "Checking for changes..."
changed_files=$(gsutil -m rsync -r -c -d -n $src_url $dst_url 2>/dev/null \
  | grep "^Would copy" \
  | sed "s|Would copy .* to \(gs://[^ ]*\).*|\1|")

gsutil -m rsync -r -c -d $src_url $dst_url

# Set cache headers only on files that changed
if [ -n "$changed_files" ]; then
  echo "Disabling cache headers on changed files..."
  echo "$changed_files" | xargs gsutil -m setmeta \
    -h "Cache-Control:no-cache,no-store,must-revalidate"
else
  echo "No files changed, skipping metadata update."
fi
