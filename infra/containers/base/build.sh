#!/bin/bash
RELEASE=$(cat RELEASE)
echo "docker build -t kpericak/base:$RELEASE"
docker build -t kpericak/base:$RELEASE .
