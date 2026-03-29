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
