#!/bin/bash
if [[ ! -d raw-data ]]; then
  echo "ERROR: run this from root dir"
  exit 1
fi

# run the alembic db migration to ensure tables are setup ok
alembic upgrade head

# load the indexes. I haven't found a good API for this so they're in static files
kt etl load-sp500 raw-data/indexes/spy-oct17-2022.xlsx
