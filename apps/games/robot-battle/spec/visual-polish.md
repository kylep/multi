# Visual Polish Spec — v0.4.0

## Direction

Shift from "CLI terminal emulator" to "retro point-and-click game UI."
Keep the green-on-black monospace aesthetic, but make everything look
intentionally designed rather than like a terminal dump. Use the full
800px width. Add borders, panels, cards. Text input is only for the
name entry screen — everything else is click/tap.

## Screen-by-screen issues and fixes

### 1. Title screen

**Now**: Title text + two plain text choices, lots of dead space.

**Fix**: Center the title block vertically. Make Continue and New Game
into large bordered button cards, side by side horizontally. Show
version in bottom-right corner dimmed.

```
         ╔═══════════════════════════╗
         ║      ROBOT BATTLE        ║
         ╚═══════════════════════════╝

   ┌──────────────────┐  ┌──────────────────┐
   │ ▶ Continue       │  │   New Game       │
   │   ClickBot Lv.3  │  │                  │
   └──────────────────┘  └──────────────────┘

                                     v0.4.0
```

### 2. Name entry

**Now**: Plain text prompt + invisible text input.

**Fix**: Center it. Give the text input a visible green border, wider,
with a blinking cursor. Add a "Start" button below it (click or Enter).

### 3. Main menu

**Now**: Stats line + vertical text list.

**Fix**: Player stats in a bordered header panel. Menu choices as
horizontal button cards (2x2 grid or 4-across).

```
┌─────────────────────────────────────────────┐
│ ClickBot     $110     Lv.1  XP 0/10        │
└─────────────────────────────────────────────┘

 ┌──────────┐  ┌──────────┐
 │ ⚔ Fight  │  │ 🛒 Shop  │
 └──────────┘  └──────────┘
 ┌──────────┐  ┌──────────┐
 │ 🔍 Robot │  │ 🚪 Quit  │
 └──────────┘  └──────────┘
```

Use CSS grid for the 2x2 layout. Each card is a bordered div with
hover highlight.

### 4. Shop

**Now**: Buy/Sell/Inventory/Back as vertical text. Buy menu is a long
vertical list.

**Fix**: Shop header panel with money/level/inventory count. Buy/Sell
as tab-like buttons at the top. Item list as bordered cards — each
card shows name, price, stat summary. Cards laid out in a 2-column
grid so items use horizontal space. Greyed-out cards for items you
can't afford. Click a card → modal confirmation.

```
┌─────────────────────────────────────────────┐
│ SHOP    $110    Inventory: 1/4    [Back]    │
└─────────────────────────────────────────────┘
  [Buy]  [Sell]

┌────────────────────┐  ┌────────────────────┐
│ Stick         $50  │  │ Wrench        $75  │
│ 1 dmg, 80% acc    │  │ 2 dmg, 90% acc    │
└────────────────────┘  └────────────────────┘
┌────────────────────┐  ┌────────────────────┐
│ Cardboard     $100 │  │ Money Maker   $100 │
│ +5 HP              │  │ +20% Money         │
└────────────────────┘  └────────────────────┘
```

### 5. Enemy select

**Now**: Header + vertical text list with difficulty tags.

**Fix**: Enemy cards in a row or column. Each card shows name, level,
difficulty tag (colored), reward. Click opens the detail screen.

```
┌─────────────────────────────────────────────┐
│ CHOOSE YOUR OPPONENT              [Back]    │
└─────────────────────────────────────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ MiniBot     │  │ Sparky      │  │ Firebot     │
│ Lv.1 [Fair] │  │ Lv.3 [Hard] │  │ Lv.5 [Dead] │
│ $50, 2 XP   │  │ $80, 3 XP   │  │ $150, 5 XP  │
└─────────────┘  └─────────────┘  └─────────────┘
```

### 6. Enemy detail

**Now**: Plain text dump + Fight!/Back choices.

**Fix**: Bordered panel with enemy info. Stats in a structured layout.
Fight! as a large green button. Back as a smaller secondary button.

### 7. Battle screen

**Now**: HP bars + vertical action list.

**Fix**: Two-panel layout — player on left, enemy on right, each in a
bordered panel with name, HP bar, energy bar. Actions as horizontal
button row below. Turn resolution as a bordered log panel between them.

```
┌─ ClickBot (You) ────┐  ┌─ MiniBot (Enemy) ────┐
│ HP  [████████░░] 8/10│  │ HP  [██████████] 15/15│
│ EN  [████████░░] 18/20│  │ EN  [██████████] 20/20│
└──────────────────────┘  └──────────────────────┘

┌─ Turn 2 ─────────────────────────────────────┐
│ ClickBot attacks! Stick hits for 1 damage    │
│ MiniBot attacks! Stick misses!               │
└──────────────────────────────────────────────┘

 [Auto] [Attack] [Item] [Rest] [Surrender]
```

Action buttons are horizontal, bordered, inline — not a vertical list.

### 8. Inspect / inventory

**Now**: Sections work but are plain text.

**Fix**: Bordered panels for each section. Weapon/gear items as small
cards. Use 2-column grid for equipment.

### 9. Victory / defeat

**Now**: Compact text — good content, but visually flat.

**Fix**: Large centered result text. Rewards in a bordered panel.
Next level preview highlighted. Auto-dismiss countdown still fine.

## Implementation approach

### New CSS classes needed

- `.panel` — bordered container (green border, slight padding)
- `.panel-header` — panel with background tint for headers
- `.card` — bordered clickable item (border, padding, hover effect)
- `.card-grid` — CSS grid for 2-column card layout
- `.card.disabled` — greyed out for unbuyable items
- `.button-row` — horizontal flex container for action buttons
- `.btn` — bordered button (like Back but for any action)
- `.btn-primary` — green fill for primary actions (Fight!)
- `.btn-secondary` — border-only for secondary actions (Back)
- `.battle-layout` — two-column grid for player/enemy panels

### Terminal changes

- Keep `promptChoice` but add a `layout` option: `"list"` (current
  vertical) or `"grid"` (2-column cards) or `"row"` (horizontal buttons)
- Each choice can have a `subtitle` field for the second line in cards
- Each choice can have a `disabled` flag to grey it out
- `promptText` stays for name entry only — styled with visible border

### Screen file changes

Every screen file needs updating to use the new panel/card/button
patterns instead of plain `terminal.print()` calls. The screen files
construct HTML structures using the panel/card classes.

### What NOT to change

- Engine code — zero changes
- Game logic — zero changes
- Save format — zero changes
- Keyboard shortcuts (arrows, numbers, Enter, Escape) — keep all of them

## New enemies + balance pass

### Enemy roster (17 enemies, levels 1–50)

> **Note:** This table was updated post-content-expansion to match
> `enemies.json`. Effective HP = 10 + level*2 + gear HP bonuses.

| # | Name | Level | Eff. HP | Def | Weapons | Key Gear | Reward | XP |
|---|------|-------|---------|-----|---------|----------|--------|----|
| 1 | MiniBot | 1 | 17 | 0 | Stick (1) | Cardboard Armor | $50 | 2 |
| 2 | Buzzblade | 2 | 19 | 0 | Wrench (2) | Cardboard Armor, Propeller | $75 | 2 |
| 3 | Sparky | 3 | 26 | 1 | Shock Rod (5) | Tin Armor, Small Battery, Small Computer Chip | $100 | 3 |
| 4 | Rustclaw | 4 | 28 | 1 | Wrench (2) x2 | Tin Armor, Third Arm, Propeller | $150 | 4 |
| 5 | Firebot | 5 | 40 | 3 | Flame Thrower (10) | Iron Armor, Gold Computer Chip | $200 | 5 |
| 6 | Smashbot | 6 | 42 | 2 | Sword (5), Wrench (2) | Iron Armor, Third Arm, Small Battery | $250 | 6 |
| 7 | Voltank | 7 | 44 | 3 | Shotgun (15), Shock Rod (5) | Iron Armor, Medium Battery, Fourth Arm, Gold Computer Chip, Shotgun Shell | $350 | 7 |
| 8 | Boombox | 9 | 68 | 4 | Flame Thrower (10) | Steel Armor, Medium Battery, Jet Booster | $500 | 8 |
| 9 | Omega | 10 | 70 | 4 | Lightsabre (30) | Steel Armor, Big Battery, Power Chip | $600 | 10 |
| 10 | Ironclad | 13 | 96 | 12 | Laser Gun (20), Shock Rod (5) | Titanium Armor, Big Battery, Fourth Arm, Gold Computer Chip + armor-plating | $1500 | 10 |
| 11 | Laserface | 16 | 102 | 8 | Laser Gun (20) x2 | Titanium Armor, Mega Battery, Fourth Arm, Advanced Chip | $2500 | 10 |
| 12 | Thunderbot | 20 | 150 | 15 | Plasma Cannon (80) | Diamond Armor, Mega Battery, Ultra Power Chip + armor-plating | $4000 | 12 |
| 13 | Megacrusher | 25 | 160 | 15 | Thunder Hammer (60), Chainsaw (35) | Diamond Armor, Nuclear Battery, Fifth Arm, Quantum Chip + armor-plating | $8000 | 12 |
| 14 | Doombot | 30 | 270 | 23 | Missile Launcher (150) | Plasma Shield, Nuclear Battery, Ultra Power Chip, Hyperdrive + armor-plating | $12000 | 15 |
| 15 | Nightmare | 35 | 280 | 23 | Death Ray (100), Thunder Hammer (60) | Plasma Shield, Fusion Battery, Sixth Arm, Quantum Chip, Hyperdrive + armor-plating | $18000 | 15 |
| 16 | Apocalypse | 40 | 490 | 38 | Nuke Launcher (300) | Cosmic Armor, Dark Matter Core, Hyperdrive + armor-plating | $30000 | 18 |
| 17 | TITAN | 50 | 510 | 38 | Galaxy Destroyer (500) | Cosmic Armor, Dark Matter Core, Hyperdrive, Quantum Chip + armor-plating | $50000 | 20 |

**Buzzblade** (level 2): Rusty bot with spinning blades. Wrench + Propeller
gives it dodge. Bridge between MiniBot and Sparky.

**Rustclaw** (level 4): A scrappy dual-wielding bot. Has two Wrenches
and a Third Arm (3 hands total). Hits twice per turn for 2 dmg each.
Propeller gives 10 dodge. Bridge between Sparky and Firebot.

**Voltank** (level 7): A heavy armored bot with a shotgun and shock
rod. High HP, high damage output, but needs Shotgun Shells (which it
starts with). Burns through ammo then falls back to Shock Rod.

**Omega** (level 10): Lightsabre deals 30 dmg but costs 15 energy —
it can only fire a few times before resting. Steel Armor gives solid
bulk (70 HP). Big Battery + Power Chip sustain and boost damage.

### Progression design

- **Lv.1 vs MiniBot**: Even fight (both have Stick + Cardboard Armor).
  Win rate ~50%. Need 1 win ($50 reward + $100 start = $150) to afford Sword.
- **Lv.2 vs Buzzblade**: Wrench + Propeller dodge makes it slightly trickier
  than MiniBot. Winnable with Sword or upgraded gear.
- **Lv.3 vs Sparky**: Shock Rod (5 dmg) with Tin Armor (26 HP). Challenging
  but winnable with good gear. Rewards fund further upgrades.
- **Lv.4 vs Rustclaw**: Need good gear (armor + dodge) to survive dual
  Wrench attacks. Rewards fund Flame Thrower / advanced gear.
- **Lv.5+ vs Firebot**: Flame Thrower does 10 dmg. Need Iron Armor
  (40 HP effective) to survive. Reward funds high-end gear.
- **Lv.7+ vs Voltank**: Shotgun does 15 dmg on first turns, then Shock Rod.
  Need full build (armor + dodge + battery) to survive.
- **Lv.9+ vs Boombox**: Flame Thrower + Grenade. Steel Armor makes it tanky.
  Jet Booster dodge makes it hard to hit.
- **Lv.10 vs Omega**: Lightsabre hits for 30 dmg. Need Steel Armor or better
  and consumables. First real wall.
- **Lv.13+ vs Ironclad**: First enemy with armor-plating upgrade (+3 def).
  96 HP and 12 defence — need strong weapons to punch through.
- **Lv.20+ vs Thunderbot**: Plasma Cannon at 80 dmg. 150 HP and 15 def.
  Diamond Armor tier needed to survive.
- **Lv.30+ vs Doombot**: Missile Launcher at 150 dmg. 270 HP wall.
- **Lv.40+ vs Apocalypse**: Nuke Launcher at 300 dmg. 490 HP. Near endgame.
- **Lv.50 vs TITAN**: Galaxy Destroyer at 500 dmg. 510 HP. The final boss.

## Version

Bump to v0.4.0 — visual overhaul + new enemies.
