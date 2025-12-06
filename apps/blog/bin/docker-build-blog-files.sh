#!/bin/bash
# Build the static files using Docker to ensure cross-platform compatibility.
# This solves the issue where git commands with single-quoted format strings
# fail on Windows but work on Linux/Mac.
#
# Usage: bin/docker-build-blog-files.sh blog/out/

if [ ! -d bin/ ]; then
    echo "Run all scripts from apps/blog/"
    exit 1
fi

# Check if output directory argument is provided
if [[ "$1" == "" ]]; then
  echo "ERROR: output_dir positional argument is required"
  echo "Usage: bin/docker-build-blog-files.sh <output_dir>"
  exit 1
fi

output_dir=$1

# Ensure the docker image is built
# NOTE(Kyle): Working on windows is a pain, disabling in code since grep isn't present... TODO - figure out WSL For build tooling 
#echo "Building Docker image (if needed)..."
#docker-compose build

# Run the build inside the Docker container
# Mount the output directory so we can get the built files out
echo "Running build inside Docker container..."
docker run --rm \
  -v "$(pwd)/$output_dir:/output" \
  gcr.io/kylepericak/kylepericakdotcom:latest \
  bash -c "cd /app && bash bin/build-blog-files.sh /output"

echo "Build complete! Static files are in $output_dir"

