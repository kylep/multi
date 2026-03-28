# Robot Battle — Game Design

## Overview

A turn-based robot combat game played in the browser. Players name their
robot, buy weapons and gear from a shop, then fight increasingly tough
enemies to earn money and experience. Built for kids — simple mechanics,
fun descriptions, clear feedback.

## Core Loop

1. **Name** your robot (you start with a free Stick)
2. **Shop** — buy weapons, gear, consumables; sell unwanted items
3. **Fight** — pick an enemy, choose actions each turn, win or lose
4. **Level up** — earn XP from wins, unlock higher-tier items and enemies
5. Repeat from step 2

## Combat

- **Simultaneous turns**: both player and enemy choose actions, then
  actions resolve in random order
- **Actions**: Attack (pick weapons), Use Item (consumable), Rest (+5 energy)
- **Hit chance**: `(accuracy - dodge) / 100`, clamped to 0–1
- **Damage**: `floor(baseDamage * (1 + attackPercent/100)) - defence`, min 0
- **Hands**: each weapon costs hands; total cannot exceed available hands
- **Energy**: attacks cost energy; resting restores 5
- **Consumables**: single-use, apply effects immediately (before turn resolution)
- **Victory**: reduce enemy HP to 0; rewards money + XP
- **Defeat**: robot is "destroyed" but auto-rebuilt; no rewards
- **Surrender**: forfeit mid-battle; no rewards, no penalty
- **Auto-Battle**: AI plays for you with a 1-second pause between turns

## Auto-Battle

A 5th action in the battle menu: "Auto-Battle". When selected, the AI
takes over the player's decisions for the remainder of the fight. Each
turn plays out automatically with a 1-second pause so the player can
watch the action unfold.

### Behavior

- Appears as option 5 in the battle action menu (alongside Attack, Use
  Item, Rest, Surrender)
- Once activated, the battle runs to completion without player input
- Uses `aiPlanAction(battle, true)` — the same AI logic already used
  for enemy turns and for the default-move suggestions
- Each auto-turn: show battle status → 750ms pause → AI picks action →
  resolve turn → show results → 750ms pause → next turn
- Battle ends normally (victory or defeat) — no surrender during auto
- After the battle ends, the normal rewards/defeat screen is shown and
  the player presses Enter to continue (same as manual battle)

### Why a battle action (not a toggle elsewhere)

The choice appears mid-battle because that's when tedium strikes. A
kid starts a fight, does a few turns manually, gets bored, hits
Auto-Battle, and watches the rest play out. No settings screen needed.

## Progression

- XP: level up every 10 XP
- Higher levels unlock better items in the shop and tougher enemies
- Money earned from wins; bonus from "Money Maker" gear

## Items

### Weapons
| Name | Level | Damage | Energy | Accuracy | Hands | Cost |
|------|-------|--------|--------|----------|-------|------|
| Stick | 0 | 1 | 1 | 80 | 1 | $50 |
| Sword | 2 | 10 | 5 | 100 | 2 | $150 |
| Shock Rod | 3 | 5 | 3 | 95 | 1 | $200 |
| Sawed-off Shotgun | 5 | 15 | 0 | 150 | 1 | $300 |
| Flame Thrower | 5 | 10 | 0 | 90 | 2 | $150 |
| Lightsabre | 10 | 30 | 20 | 90 | 2 | $1000 |

### Gear
Passive stat bonuses. Does not stack (one of each type).

### Consumables
Single-use items: Repair Kit (+10 HP), Grenade (30 dmg), Throwing Net (-30 dodge).

## Starting Equipment

New players receive a free Stick in their inventory. This ensures
the first fight is winnable without visiting the shop. The Stick
is added during `createPlayer`, not as a shop purchase.

## Enemies

| Name | Level | Gear | Reward | XP |
|------|-------|------|--------|----|
| MiniBot | 1 | Cardboard Armor | $50 | 2 |
| Sparky | 3 | Small Battery, Small Computer Chip | $80 | 3 |
| Firebot | 5 | Gold Computer Chip | $150 | 5 |

MiniBot is the intro enemy — nerfed to only Cardboard Armor (no
Propeller) so a fresh player with a Stick can reliably win.

## Save & Load

Game progress persists in browser `localStorage` under the key
`robot-battle-save`. Saving is fully automatic — the player never
needs to press a save button.

### When saves happen

- Immediately after creating a new robot (so the save always exists)
- After every fight (win, loss, or surrender — once back at main menu)
- After every shop session (when leaving the shop back to main menu)

### Title screen behavior

On launch, the game checks `localStorage` for an existing save:

- **No save found**: normal flow — title screen → "Name your robot" prompt
- **Save found**: title screen → two choices:
  - `Continue: <name> Lv.<level>` — loads the save and goes to main menu
  - `New Game` — deletes the save, prompts for a new name

### Quit behavior

Choosing "Quit" from the main menu does **not** end the game. It returns
to the title screen (New/Continue). The save persists. This lets kids
switch between starting fresh and continuing without reloading the page.

### What gets saved

The entire `Robot` object (name, level, exp, money, wins, fights,
inventory with all items). The `AssetRegistry` is **not** saved — it is
reloaded from JSON on every launch. Only the player's mutable state is
persisted.

### Storage format

```json
{
  "version": 1,
  "player": { /* Robot object */ }
}
```

The `version` field allows future migration if the save format changes.
If the version doesn't match, the save is discarded (treated as no save).

## UI

Browser-based terminal aesthetic — green text on black background, monospace
font. Interactive via clickable choice buttons and text input. HP/energy
bars rendered with block characters.
