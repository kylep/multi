#!/bin/bash
RELEASE=$(cat RELEASE)
echo docker push kpericak/base:$RELEASE
docker push kpericak/base:$RELEASE
