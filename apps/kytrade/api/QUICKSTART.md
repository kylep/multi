# Getting set up

Source the export file (write one if it doesn't exist)
```
source export.sh
```

Optionally clean up any old data and containers
```
docker-compose down
rm -r postgres-data/
```

Start the services up
```
docker-compose up
```

Set up the python env
```
poetry shell
poetry install
```

Load the initial data in to the database
```
bin/hydrate-db.sh

```

..
```

```
