# Battle Flow

When the player selects Fight from the main menu, they choose an opponent from
the available static enemies.

## Opponent Selection
```
Choose your opponent:
1. MiniBot
2. Sparky
3. Firebot
```

## Turn Structure
Battles are simultaneous turn-based. Each turn:
1. Battle status is displayed (health bars, energy, last turn's combat log)
2. Player chooses an action:
   - `1` Attack
   - `2` Use Item (consumable)
   - `3` Rest
   - `4` Surrender (also `q`, `quit`, `surrender`, `forfeit`, `give up`)
3. AI-suggested defaults are shown in brackets: `[1]>` — press Enter to accept
4. Enemy AI chooses its action
5. Both actions resolve in **random order**
6. Results are displayed

## Actions

### Attack
The player selects which weapons to use from their equipped weapons, limited by
available hands. Each weapon can only be used once per attack. Selecting duplicates
shows an error.

### Use Item
Consume a consumable item for its effect. This does **not** end the turn — the
player still picks a main action (attack or rest) afterward.

### Rest
The robot does nothing and passively regenerates some energy. Items can improve
resting.

### Surrender
A confirmation prompt appears: "Are you sure you want to surrender? (y/n)".
If confirmed, the battle ends immediately as a loss. No rewards are given.
The fight is recorded as a loss.

## First Battle Tip
On the first battle, show: "TIP: You can just hit Enter to let the AI pick your move"

# Interfaces

## CLI
- Numbered opponent list for selection
- Turn display with health bars, energy, and combat log
- Bracketed AI suggestions: `[1]>` or `[1,2]>`
- Accept Enter to use suggested action
- Turn header: `════════════ TURN 3 ════════════`
- Clear screen between turns

## Web
- Opponent selection as clickable cards with enemy descriptions
- Split-screen battle view: player left, enemy right
- Animated health bars that decrease on damage
- Action buttons with AI-suggested default highlighted
- Combat log scrolling panel

## Mobile
- Opponent selection as a scrollable list with portraits
- Battle view stacked vertically: enemy top, player bottom
- Swipe or tap action buttons
- Combat log expandable at bottom of screen

## API
- `POST /game/:gameId/battle/start` with body `{ "enemyId": string }`
- `POST /game/:gameId/battle/turn` with body `{ "action": "attack" | "item" | "rest" | "surrender", "weaponSlots"?: number[], "itemSlot"?: number }`
- `GET /game/:gameId/battle/state` returns current battle state
- Returns `{ turnNumber, playerHp, enemyHp, combatLog, suggestedAction }`
