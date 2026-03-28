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

### Enemy roster (6 enemies, smooth progression)

| # | Name | Level | HP | Weapons | Key Gear | Reward | XP |
|---|------|-------|----|---------|----------|--------|----|
| 1 | MiniBot | 1 | 15 | Stick (1 dmg) | Cardboard Armor | $50 | 2 |
| 2 | Sparky | 3 | 15 | Shock Rod (5 dmg) | Cardboard Armor, Small Battery, Small Computer Chip | $80 | 3 |
| 3 | Rustclaw | 4 | 20 | Wrench (2 dmg) x2 | Cardboard Armor, Third Arm, Propeller | $120 | 4 |
| 4 | Firebot | 5 | 35 | Flame Thrower (10 dmg) | Wooden Armor, Gold Computer Chip | $150 | 5 |
| 5 | Voltank | 7 | 45 | Shock Rod (5 dmg), Sawed-off Shotgun (15 dmg) | Wooden Armor, Medium Battery, Fourth Arm, Small Computer Chip | $250 | 7 |
| 6 | Omega | 10 | 60 | Lightsabre (30 dmg) | Big Battery, Gold Computer Chip, Power Chip | $500 | 10 |

**Rustclaw** (new, level 4): A scrappy dual-wielding bot. Has two Wrenches
and a Third Arm (3 hands total). Hits twice per turn for 2 dmg each.
Propeller gives 10 dodge. Bridge between Sparky and Firebot.

**Voltank** (new, level 7): A heavy armored bot with a shotgun and shock
rod. High HP, high damage output, but needs Shotgun Shells (which it
starts with). Burns through ammo then falls back to Shock Rod.

**Omega** (new, level 10): The final boss. Lightsabre deals 30 dmg but
costs 20 energy — it can only fire twice before resting. Big Battery
gives +25 energy to sustain it longer. Power Chip boosts damage further.

### Progression design

- **Lv.1 player vs MiniBot**: Even fight (both have Stick + Cardboard Armor).
  Win rate ~50%. Need 5 wins ($250 total) to afford Sword upgrade.
- **Lv.2 with Sword vs Sparky**: Sword (5 dmg) vs Sparky's 15 HP + 10 dodge.
  Challenging but winnable. Need several wins to afford gear upgrades.
- **Lv.3-4 with gear vs Rustclaw**: Need good gear (armor + dodge) to
  survive dual Wrench attacks. Rewards fund Flame Thrower / advanced gear.
- **Lv.5+ vs Firebot**: Flame Thrower does 10 dmg at 90% acc. Need Wooden
  Armor (35 HP effective) to survive. Reward is enough for high-end gear.
- **Lv.7+ vs Voltank**: Shotgun does 15 dmg on first turns, then Shock Rod.
  Need full build (armor + dodge + battery) to survive.
- **Lv.10 vs Omega**: Lightsabre one-shots anything under 30 HP. Need
  max gear and consumables. The final challenge.

### New items needed

**Voltank's gear** — needs Shotgun Shells in inventory (already exists
as a gear item that gets consumed). Give Voltank 2x Shotgun Shell in
consumables or gear.

No new items needed beyond what's already defined — the existing item
set covers the full progression if balanced correctly.

### Enemies JSON additions

Add to `enemies.json`:
```json
"Rustclaw": {
  "level": 4,
  "weapons": ["Wrench", "Wrench"],
  "gear": ["Cardboard Armor", "Third Arm", "Propeller"],
  "consumables": [],
  "reward": 120,
  "expReward": 4,
  "description": "A scrappy junkyard bot with two wrenches and a propeller. Double trouble!"
},
"Voltank": {
  "level": 7,
  "weapons": ["Sawed-off Shotgun", "Shock Rod"],
  "gear": ["Wooden Armor", "Medium Battery", "Fourth Arm", "Small Computer Chip", "Shotgun Shell"],
  "consumables": [],
  "reward": 250,
  "expReward": 7,
  "description": "A heavily armored tank with a shotgun. Watch out for the blast!"
},
"Omega": {
  "level": 10,
  "weapons": ["Lightsabre"],
  "gear": ["Big Battery", "Gold Computer Chip", "Power Chip"],
  "consumables": ["Grenade"],
  "reward": 500,
  "expReward": 10,
  "description": "The ultimate fighting machine. Bzzzzt."
}
```

## Version

Bump to v0.4.0 — visual overhaul + new enemies.
