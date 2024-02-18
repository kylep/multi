# Documents
Documents are sort of a stop-gap data format that I'll need to probably replace with
a relational structure once there's enough data that this gets slow.

```
# kt db documents list
```


## stock/symbols

A flat list of all known symbols
```
{
  <symbol>: {
    "Name": <name>,
    "Identifier": <numeric id, purpose unknown>,
    "SEDOL": <another number, only used in uk/ireland>,
    "weight": <number indicating % of the index>,
    "Sector": "<sector name>",
    "Shares Held": <# of shares held in this index's ETF (SPY...)>,
    "Local Currency": "<currency name, ex USD"
  }
}
```


## stock/indexes
A flat list of all known indexes
```
[
  <symbol n>,
  ...
]
```

## stock/etfs
A flat list of known ETFs
```
[
  <symbol n>,
  ...
]
```

## stock/sectors
A flat list of known sectors
```
[
  <sector name>,
  ...
]
```

---

```
{
  <index name>: {
    <symbol>: {
      "Name": <name>,
      "Identifier": <numeric id, purpose unknown>,
      "SEDOL": <another number, only used in uk/ireland>,
      "weight": <number indicating % of the index>,
      "Sector": "<sector name>",
      "Shares Held": <# of shares held in this index's ETF (SPY...)>,
      "Local Currency": "<currency name, ex USD"
    }
  }
}
```


## stock/symbol/(symbol)/history

An ordered list of stock values by date
```
{
  "<YYYY-MM-DD>": {
    "open": <$x.yy>,
    "close": <$x.yy>,
    "volume": <$x.yy>,
  }
}
```


## stock/sectors

A flat list of all known sectors
```
{
  "<sector name>": ["<symbol>", "<symbol>"],
  ...
}
```

## stock/etfs
A flat list of all known sectors
```
{
  "<sector name>": [],
  ...
}
```
