# Combat Test Spec

## Unit Tests (tests/unit/battle.test.ts)

### Hit Chance
- 100 accuracy vs 0 dodge → 100% hit
- 50 accuracy vs 150 dodge → 0% hit (clamped)
- 80 accuracy vs 20 dodge → 60% hit

### Damage Calculation
- Base damage minus defence
- Attack percent bonus applied as multiplier
- Floors to zero when defence exceeds damage

### Execute Attack
- Deals correct damage with 100% accuracy weapon
- Fails with insufficient energy (no energy spent)
- Fails with insufficient hands

### Rest
- Restores up to 5 energy
- Does not exceed max energy

### Consumables
- Restores health
- Deals damage to enemy
- Cannot reuse same consumable

### Victory Check
- Returns "player" when enemy HP ≤ 0
- Returns "enemy" when player HP ≤ 0
- Returns null when both alive

### Turn Management
- `endTurn` increments turn number
- Copies current log to last-turn log
- Clears current log

### Plan + Resolve
- Both actions resolve in a full turn
- Random order execution

### Status Effects (tests/unit/status.test.ts)
- `STATUS_RULES` covers all five types with an icon, label and `t-*` colour
- Durations: burn 3, shock 2, corrode 3, radiation Infinity, dazzle 3
- Damage fractions: burn 15%, radiation 10% per tick
- `tryInflict` respects the inflict chance (seeded rng), the item's chance
  override, and does nothing for a source with no effect
- God mode robots are immune
- Re-applying refreshes duration instead of stacking; the higher potency wins
- Re-applying radiation keeps the existing tick count and adopts the higher
  potency, so repeat nukes ramp rather than restarting the ramp
- Infliction logs `X is BURNED!` into the current turn log
- Burn tick deals floor(15% of source damage), ignores defence, and can kill
- God mode robots take no tick damage
- Radiation escalates 10%, 20%, 30% of source damage and never expires
- Non-damaging effects deal no tick damage
- `decrementStatuses` expires at zero and logs `X is no longer burned`
- Corrode reduces `battleDefence` by 25%
- Dazzle halves `battleDodge` and sets `battleAccuracyMultiplier` to 0.8
- `shouldFizzle` is false without shock, true on a roll under 25%
- `cureStatuses` clears everything, returns the cured list, logs
  `Repair Kit cured BURN, SHOCK`, and logs nothing when there is nothing to cure

### Status Effects in Battle (tests/unit/battle.test.ts)
- `executeAttack` with a 100% Burn weapon inflicts burn
- A blocked hit (Blast Shield) still applies the effect
- `resolveTurn` ticks burn damage into `currentTurnLog` and decrements duration
- A burn tick can end the battle
- A shocked fighter's fizzled attack spends no energy and deals no damage
- A Repair Kit cures every active effect
- A damaging consumable that is dodged inflicts nothing
- A non-damaging consumable (EMP Bomb) still inflicts its effect

### Status Effect Data (tests/unit/data.test.ts)
- Weapon effects load with chance overrides (Flame Thrower burn 0.66,
  Nuke Launcher radiation 1, Laser Gun dazzle 0.1) and the 0.2 default
  (Chainsaw corrode); Stick has none
- An unknown `statusEffect.type` throws at load, naming the item and the type
- Consumable effects load (Plasma Grenade burn, EMP Bomb shock, Nuke
  radiation); Repair Kit has none
- Acid Grenade (level 12, $200, 20 dmg, corrode 100%) and Flashbang
  (level 9, $120, 5 dmg, dazzle 100%) exist with useText

## E2E Tests (tests/e2e/combat.spec.ts)

### Start Battle
- Navigate: name robot → fight → MiniBot (player starts with free Stick)
- Verify: "FIGHT #1: vs MiniBot" and "Turn 1" visible

### Attack
- Select weapon "1" and press Enter
- Verify: "Turn Resolution" text appears

### Surrender
- Click Surrender → confirm Yes
- Verify: "SURRENDERED" text visible

### Rest
- Click Rest
- Verify: "You prepare to rest..." visible

### Enemy select shows difficulty tags
- Navigate to fight menu
- Verify: difficulty tag visible (e.g. "[Fair]" for MiniBot at level 1)

### Enemy detail screen
- Click an enemy from the list
- Verify: detail screen shows HP, dodge, defence, weapon name + damage, reward
- Verify: Fight and Back buttons visible
- Click Back → returns to enemy list

### Loss earns $10 consolation
- Start with $100, surrender a fight
- Verify: money is $110 after returning to main menu

### HP clamp in battle summary
- Battle summary never shows negative HP values

### Level-up unlock preview
- Win enough fights to approach level 2
- Verify: after a win, "Next level:" text shows upcoming item unlocks

### Mobile: battle renders without horizontal scroll
- HP bars use responsive width (10 chars on viewports < 500px, 20 chars on desktop)
- Battle panels stack vertically on mobile via CSS media query
- Action buttons wrap naturally with smaller padding on mobile
