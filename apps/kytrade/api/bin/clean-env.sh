#!/bin/bash
source export.sh
docker-compose down
rm -r postgres-data/
docker-compose up
