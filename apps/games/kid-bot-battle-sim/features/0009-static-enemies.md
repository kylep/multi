# Static Enemies

The game includes pre-designed enemies to battle. Each enemy has a level, loadout,
reward values, and a description.

## MiniBot
- **Level**: 1
- **Weapons**: Stick
- **Gear**: Cardboard Armor, Propeller
- **Consumables**: None
- **Money Reward**: $50
- **Exp Reward**: 1
- **Description**: A shoebox sized cardboard box robot with a stick and propeller. He's gonna whack you!

## Sparky
- **Level**: 3
- **Weapons**: Shock Rod
- **Gear**: Small Battery, Small Computer Chip
- **Consumables**: None
- **Money Reward**: $80
- **Exp Reward**: 3
- **Description**: A hyperactive robot that crackles with electricity. Zap zap!

## Firebot
- **Level**: 5
- **Weapons**: Flame Thrower
- **Gear**: Gold Computer Chip
- **Consumables**: None
- **Money Reward**: $150
- **Exp Reward**: 5
- **Description**: A shiny robot with a flame thrower.

# Interfaces

## CLI
- Display enemy list with names and levels for selection
- `Inspect` option to show enemy stats, loadout, and description before fighting

## Web
- Enemy cards with description, level badge, and reward preview
- Click a card to select, with a "Fight!" confirmation button

## Mobile
- Scrollable enemy list with portraits and level indicators
- Tap to expand details, long-press to fight

## API
- `GET /game/enemies` returns all static enemies with stats and loadouts
- `GET /game/enemies/:id` returns single enemy details
