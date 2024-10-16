#!/bin/bash
if [ ! -d bin/ ]; then
  echo "Run all scripts from apps/blog/"
  exit 1
fi

docker-compose --progress plain build
# docker push gcr.io/kylepericak/kylepericakdotcom:latest
