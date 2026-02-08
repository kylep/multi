# Items

Every robot has an inventory of items, which starts empty. There is a maximum
inventory size (default 4) that can be expanded with gear.

Items come in three types:

## Weapons
Used to attack during battle. Each weapon has:
- Level requirement
- Base damage
- Money cost
- Energy cost per use
- Accuracy (percentage chance to hit)
- Hands required (1 or 2)
- Optional item requirements (e.g., ammo)

### Weapon List
| Name             | Lvl | Dmg | Cost | Energy | Accuracy | Hands | Requires       |
|------------------|-----|-----|------|--------|----------|-------|----------------|
| Stick            | 0   | 1   | 10   | 1      | 80       | 1     | —              |
| Sword            | 2   | 10  | 50   | 5      | 100      | 2     | —              |
| Shock Rod        | 3   | 5   | 40   | 3      | 95       | 1     | —              |
| Sawed-off Shotgun| 5   | 15  | 100  | 0      | 150      | 1     | 1 Shotgun Shell|
| Flame Thrower    | 5   | 10  | 150  | 0      | 90       | 2     | —              |
| Lightsabre       | 10  | 30  | 1000 | 20     | 90       | 2     | 1 Shotgun Shell|

## Gear
Passive items that grant stat bonuses. Gear does not stack — you cannot own
more than one of the same gear item.

### Gear List
| Name             | Lvl | Cost | Effects           | Requires    |
|------------------|-----|------|-------------------|-------------|
| Shotgun Shell    | 5   | 30   | —                 | —           |
| Cardboard Armor  | 0   | 10   | +5 Health         | —           |
| Third Arm        | 2   | 150  | +1 Hand           | —           |
| Fourth Arm       | 5   | 250  | +1 Hand           | Third Arm   |
| Fifth Arm        | 5   | 350  | +1 Hand           | Fourth Arm  |
| Gold Computer Chip| 3  | 40   | +1 Defence        | —           |
| Small Computer Chip| 3 | 40   | +10 Dodge         | —           |
| Power Chip       | 3   | 60   | +10% Attack       | —           |
| Money Maker      | 0   | 100  | +20% Money Prize  | —           |
| Propeller        | 1   | 50   | +10 Dodge         | —           |
| Small Battery    | 1   | 50   | +5 Energy         | —           |
| Medium Battery   | 4   | 150  | +20 Energy        | —           |
| Big Battery      | 7   | 350  | +25 Energy        | —           |

## Consumables
Single-use items activated during battle. Using a consumable does not end your turn.

### Consumable List
| Name         | Lvl | Cost | Effects                     | Requires         |
|--------------|-----|------|-----------------------------|------------------|
| Repair Kit   | 2   | 30   | +10 temporary Health        | Health below 100%|
| Grenade      | 8   | 100  | Deal 30 damage to enemy     | —                |
| Throwing Net | 4   | 100  | -30 Dodge to enemy          | —                |

# Interfaces

## CLI
- Display item details with formatted tables when inspecting
- Show item type prefix in inventory lists: `[W]`, `[G]`, `[C]`
- Use `show <number>` to view full item details

## Web
- Render items as cards with icons per type (sword, shield, potion)
- Hover to see full item details in a tooltip
- Color-code by type: weapons red, gear blue, consumables green

## Mobile
- List items with type icons and key stats inline
- Tap to expand full details
- Color-code by type

## API
- `GET /game/items` returns full item catalog
- `GET /game/items/:id` returns single item details
- `GET /game/:gameId/inventory` returns player's current inventory
