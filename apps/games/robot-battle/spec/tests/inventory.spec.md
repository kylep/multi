# Inventory Test Spec

## Unit Tests (tests/unit/state.test.ts)

### Create Player
- Starts with default stats from config
- Starting money = 100
- Level = 1, starts with a Stick in inventory

### Award Money
- Awards base amount with no bonus gear
- Applies money bonus percent from Money Maker gear (20%)

### Record Fight
- Increments fight count
- Increments win count only on victory

### Award XP
- Levels up at 10 XP (resets to 0)
- Does not level up below 10
- Handles multiple level-ups from large XP awards

## Unit Tests (tests/unit/data.test.ts)

### Load Assets
- Loads all 7 weapons (including Wrench)
- Loads gear including Wooden Armor (fixed nesting bug from YAML)
- Loads consumables (Repair Kit, Grenade, Throwing Net)
- Loads 6 enemies

### Get Item
- Finds items by name across all types
- Returns undefined for nonexistent items

### Items for Level
- Filters items correctly by level threshold

### Create Enemy Robot
- Populates inventory from enemy definition
- MiniBot has 2 items: Stick + Cardboard Armor
