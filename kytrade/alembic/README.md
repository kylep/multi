# Alembic setup
Generic single-database configuration.

## Initial setup

- I've updated env.py to use the ENGINE from kytrade.lib.db.common.
- The BASE from kytrade.lib.db.models provides the metadata
- Then I made the baseline against an empty db with:

```
alembic revision -m "baseline"
```

- I've set the CLI up to make a new database with the required tables by running

```
kt util init-db
```

## Applying the migrations

```
alembic upgrade head
```

If you used `db.create_all()` from a shell, you can use alembic stamp head to indicate
that the current state of the database represents the application of all migrations.

## Updating the migrations
Update the migrations by making a new revision
```
alembic revision --autogenerate -m 'text explaining this revision'
```



