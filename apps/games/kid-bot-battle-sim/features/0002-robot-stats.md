# Robot Stats

Every robot has the following stats:

- **Health**: Hit points. Robot is destroyed at 0. Default: 10
- **Energy**: Powers movement and items. Cannot act at 0. Default: 20
- **Defence**: Subtracted from incoming damage. Default: 0
- **Attack**: Percentage multiplier for weapon damage. Default: 0
  - Formula: `damage = base_damage * (1 + attack/100) - defence`
- **Dodge**: Chance of taking 0 damage from an attack. Default: 0
- **Hands**: Number of arms. Determines how many weapons can be used per turn. Default: 2
- **Level**: Determines access to stronger shop items. Default: 0
- **Exp**: Gained from fights. 10 exp required per level.
- **Inventory Size**: Max items across weapons, gear, and consumables. Default: 4
- **Money**: Currency for the shop. Starting: 100
- **Wins**: Total fights won
- **Fights**: Total fights fought

When a robot is created, all stats start at their defaults. The player starts at level 0 with 100 money.

# Interfaces

## CLI
- Display stats in a formatted block with labels and values
- Use icons: `♥` for health, `⚡` for energy
- Show level progress as `Level: 0 (Exp: 0/10)`

## Web
- Render stats as a styled card with labeled rows
- Use color-coded bars for health and energy
- Show level progress with a progress bar

## Mobile
- Display stats in a compact vertical list
- Use color-coded bars for health and energy
- Tap a stat to see its description

## API
- `GET /game/:gameId/robot` returns full robot stat object
- Stats object includes all fields with current and max values where applicable
