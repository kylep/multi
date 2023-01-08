# Where I left off

## Wishlist
- Fix DETAIL:  Token "NaN" is invalid. error when saving stock data
- Would be nice to replace Click with Typer to stay modern.
- impl logging lib, integrate w/ debug and maybe click commands
- swap flask with fastAPI to stay modern
- figure out OpenAPI spec w/ fastAPI


## 2022-12-07
Hydrate works, introduced kt stocks cmds to populate historical data.


## 2022-12-06
Was working on getting the hydrate script to work, had to redo the schema because it
was too slow.

The etl.py script in the cli dir is half-baked and erroring, particuarly where it saves
the daily price history
