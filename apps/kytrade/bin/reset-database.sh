#!/bin/bash
if [[ ! -d bin || ! -d postgres-data ]]; then
  echo "ERROR: either not in root dir or postgres-data/ not found"
  exit 1
fi

rm -rf postgres-data/
