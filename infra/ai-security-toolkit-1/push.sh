#!/bin/bash
RELEASE=$(cat RELEASE)
echo docker push kpericak/ai-security-toolkit-1:$RELEASE
docker push kpericak/ai-security-toolkit-1:$RELEASE
