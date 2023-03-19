# kytrade

- My personal trading tools and automation.
- Open source, but I'd advise against using any of this without talking to me.
- Kytrade 1, or just Kytrade, is an extant trading CLI that I wrote a while ago.
- Eventually I'll merge the old CLI into this and rename kytrade2 to kytrade


## Dev

Start the dev env
```
mkdir -p postgres-data
docker-compose up
```

First time you start it, also create the database
```
docker exec -it kytrade2-postgres-1 psql -U kytrade
```

## Prod

Check the `multi/infra` dir to set up a K8s cluster.

### Deploying the app to K8s

Make sure you have helmfile and helm-diff installed.

```
helmfile apply
```


---

# Hydrating the database

Particuarly for local dev, you'll want to load some data before things are useful.

```
bin/hydrade-db.sh
```

