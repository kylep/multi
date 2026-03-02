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
dry_run_output=$(gsutil -m rsync -r -c -d -n $src_url $dst_url)
if [ $? -ne 0 ]; then
  echo "Dry-run failed, aborting."
  exit 1
fi

gsutil -m rsync -r -c -d $src_url $dst_url

# Build array of changed GCS URLs (array handles spaces in names safely)
mapfile -t changed_urls < <(echo "$dry_run_output" \
  | grep "^Would copy" \
  | sed "s|Would copy .* to \(gs://.*\)$|\1|")

if [ ${#changed_urls[@]} -gt 0 ]; then
  echo "Disabling cache headers on ${#changed_urls[@]} changed file(s)..."
  gsutil -m setmeta -h "Cache-Control:no-cache,no-store,must-revalidate" \
    "${changed_urls[@]}"
else
  echo "No files changed, skipping metadata update."
fi
