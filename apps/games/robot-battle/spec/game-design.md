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
- **HP clamping**: HP never displays below 0 in battle summaries/snapshots
- **Hands**: each weapon costs hands; total cannot exceed available hands
- **Energy**: attacks cost energy; resting restores 5
- **Consumables**: single-use, apply effects immediately (before turn resolution)
- **Victory**: reduce enemy HP to 0; rewards money + XP
- **Defeat**: robot is "destroyed" but auto-rebuilt; earns $10 consolation
- **Surrender**: forfeit mid-battle; earns $10 consolation (same as defeat)
- **Auto-Battle**: AI plays for you with a 250ms pause between turns

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
- Each auto-turn: show battle status → 250ms pause → AI picks action →
  resolve turn → show results → 250ms pause → next turn
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
- Losses and surrenders earn $10 consolation money (you always make progress)

### Level-up unlock preview

After a fight, the rewards screen shows what the next level unlocks:
"Next level: Sword, Wooden Armor, Third Arm" (items at the next level).
This gives kids a visible goal to grind toward. If the player is already
at the max level with all items unlocked, this line is omitted.

## Items

### Weapons
| Name | Level | Damage | Energy | Accuracy | Hands | Cost |
|------|-------|--------|--------|----------|-------|------|
| Stick | 0 | 1 | 1 | 80 | 1 | $50 |
| Wrench | 0 | 2 | 2 | 90 | 1 | $75 |
| Sword | 2 | 10 | 5 | 100 | 2 | $150 |
| Shock Rod | 3 | 5 | 3 | 95 | 1 | $200 |
| Sawed-off Shotgun | 5 | 15 | 0 | 150 | 1 | $300 |
| Flame Thrower | 5 | 10 | 0 | 90 | 2 | $150 |
| Lightsabre | 10 | 30 | 20 | 90 | 2 | $1000 |

Wrench is the early-game upgrade from Stick — double damage, better
accuracy, but costs more energy. Available from level 0 so a new
player can buy it after one MiniBot win.

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

### Enemy select screen

The fight menu is a paginated list of enemies. Each enemy is a button
showing name, level, and a difficulty tag. Selecting an enemy goes to
an **enemy detail screen** (interstitial) before the fight starts.

#### Enemy list

Shows one button per enemy plus a Back button:
```
=== CHOOSE YOUR OPPONENT ===
Back
1. MiniBot (Lv1) [Fair]
2. Sparky (Lv3) [Hard]
3. Firebot (Lv5) [Deadly]
```

Difficulty tags are based on enemy level vs player level:
- **Easy**: enemy level < player level
- **Fair**: enemy level = player level
- **Hard**: enemy level is 1-2 above player level
- **Deadly**: enemy level is 3+ above player level

This scales to any number of enemies — just buttons in a list.

#### Enemy detail screen (interstitial)

After clicking an enemy, a detail screen shows full info before
committing to the fight:

```
=== MiniBot ===
A shoebox sized cardboard box robot with a stick.

  HP: 15 | Dodge: 0 | Defence: 0
  Weapons: Stick (1 dmg)
  Reward: $50 | XP: 2

[Fight]  [Back]
```

This shows:
- Description (flavor text)
- Stats: HP, dodge, defence (computed from gear)
- Weapons: name + damage for each weapon the enemy carries
- Reward: money + XP

Two buttons: Fight (starts the battle) or Back (return to enemy list).

This design separates browsing from committing — kids can check out
any enemy without accidentally starting a fight, and the list stays
clean even with 20+ enemies.

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

## Versioning

The game uses semver (`MAJOR.MINOR.PATCH`) tracked in `package.json`.
The version is the single source of truth — no separate version file.

### Display

The version is shown on the title screen below the game title:

```
=============================
       ROBOT BATTLE
=============================
v0.2.0

[Continue: Bolt Lv.3]  [New Game]
```

### When to bump

- **PATCH**: bug fixes, balance tweaks, new items/enemies
- **MINOR**: new features (e.g., new screen, new mechanic)
- **MAJOR**: breaking save format changes (save version also bumps)

### Cache busting

Vite content-hashes JS/CSS filenames automatically (`index-CjOT3fiV.js`).
The `index.html` file itself is not hashed — it relies on the serving
layer (nginx `no-cache` for staging, GCS default for prod). If stale
HTML becomes a problem, add `Cache-Control: no-cache` to the nginx
config for `/games/` paths.

## UI

Browser-based terminal aesthetic — green text on black background, monospace
font. Interactive via clickable choice buttons and text input. HP/energy
bars rendered with block characters.
