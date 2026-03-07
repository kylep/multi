#!/bin/bash
RELEASE=$(cat RELEASE)
echo "docker build -t kpericak/ai-security-toolkit-1:$RELEASE ."
docker build -t kpericak/ai-security-toolkit-1:$RELEASE .
