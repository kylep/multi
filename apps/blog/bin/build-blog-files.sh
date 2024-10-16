#!/bin/bash
# Build's the static files. If a posarg is passed, copies them there.
# You can't build straight into a volume mount on Docker.
# Google Cloud Build expects the posarg to be /workspace.

if [ ! -d bin/ ]; then
    echo "Run all scripts from apps/blog/"
      exit 1
fi

cd blog
mkdir -p out/

echo "Building the static files..."
# TODO: Support toggling the node_env with an argument
exec npm run build 2>&1 | tee ../build.log

# copy index1.html to index.html for convenience and better ux
cp out/index1.html out/index.html

# Copy the contents to a directory im allowed to volume mount (same nextjs hack)
cd ..
output_dir=$1
echo "Copying the static files to $output_dir"
mkdir -p $1
cp -r blog/out/* $1/
