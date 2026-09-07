# Status Effects Spec (v0.14.0)

Pokémon-style status effects. Weapons and consumables can inflict an
effect on hit. Effects tick each turn, show as badges in the battle
panel, and are cured by any Repair Kit.

## 1. Effects

| Effect | Badge | Sources | What it does | Duration |
|--------|-------|---------|--------------|----------|
| Burn | 🔥 BURN | Flame Thrower (66%), Plasma Cannon, Plasma Grenade | 25% of the source's base damage each turn, ignores defence | 3 turns |
| Shock | ⚡ SHOCK | Shock Rod, Thunder Hammer, EMP Bomb | 25% chance each turn the action fizzles ("seizes up") | 2 turns |
| Corrode | 🧪 CORRODE | Chainsaw, Antimatter Blade, Antimatter Missile Launcher, Acid Grenade (100%) | -25% defence | 3 turns |
| Radiation | ☢ RADIATION | Nuke Launcher (100%), Nuke (100%) | 10% of the source's base damage per turn, growing each turn (10%, 20%, 30%…), ignores defence | Rest of battle |
| Dazzle | ✨ DAZZLE | Laser Gun (10%), Death Ray (10%), Flashbang (100%) | -50% dodge, -20% hit accuracy (weapon accuracy + robot bonuses) | 3 turns |

Default inflict chance is 20%. Items override with `chance`.

### Rules

- One instance per effect type per robot. Re-applying refreshes the
  duration and updates potency to the new source if it is higher. No
  stacking.
- Effects are rolled per weapon hit (each weapon in a multi-weapon
  attack rolls separately) and per damaging consumable that lands.
- Effects apply only when the hit lands and deals ≥ 0 damage. A blocked
  hit (Blast Shield) still applies the effect — the shield stops damage,
  not fire.
- God mode robots are immune.
- Any Repair Kit (Repair, Mega, Ultra) cures every active effect.
- Effects are battle-only state on `BattleRobot`. `Robot` and the save
  format do not change. `SAVE_VERSION` stays at 3.
- Damage ticks can kill. `checkVictory` runs after ticks.

### Tick timing

`resolveTurn` runs both planned actions, then ticks statuses on both
robots (player first, then enemy), then decrements durations. Tick log
lines land in the current turn's log so they render with that turn.
Radiation's per-turn damage uses the number of ticks elapsed so far
(`potency * ticks`), so turn 1 after infliction deals 10%, turn 2 deals
20%, etc.

Shock's fizzle roll happens in `executePlannedAction` before the action
runs. A fizzled action still consumes the turn but spends no energy and
no consumable.

## 2. Data shape

`items.json` weapons and consumables gain an optional block:

```json
"Flame Thrower": {
  ...,
  "statusEffect": { "type": "burn", "chance": 0.66 }
}
"Chainsaw": {
  ...,
  "statusEffect": { "type": "corrode" }
}
```

`chance` is optional and defaults to 0.2. The loader normalises this
into `statusEffect: { type, chance } | null` on `Weapon` and
`Consumable`.

Effect rules (duration, potency, badge, colour) live in one table in
`src/engine/status.ts`, not per item.

### New consumables

| Name | Level | Cost | Damage | Effect | Max |
|------|-------|------|--------|--------|-----|
| Acid Grenade | 12 | 200 | 20 | Corrode 100% | 5 |
| Flashbang | 9 | 120 | 5 | Dazzle 100% | 5 |

Both have modest direct damage; the effect is the selling point.

## 3. Engine

New `src/engine/status.ts`:

```typescript
export type StatusType = "burn" | "shock" | "corrode" | "radiation" | "dazzle";

export interface ActiveStatus {
  type: StatusType;
  turnsLeft: number;      // Infinity for radiation
  potency: number;        // burn/radiation: per-tick base damage; others: unused (0)
  ticks: number;          // how many ticks have run (radiation scaling)
}

export const STATUS_RULES: Record<StatusType, StatusRule>;

export function tryInflict(battle, target, source: { statusEffect, damage }, rng): boolean;
export function tickStatuses(battle, br): void;          // damage + log, one robot
export function decrementStatuses(battle, br): void;     // expire + log
export function cureStatuses(battle, br): StatusType[];
export function hasStatus(br, type): boolean;
export function shouldFizzle(br, rng): boolean;          // shock roll
```

Changes to existing engine code:

- `types.ts`: `Weapon` and `Consumable` gain `statusEffect: StatusEffectSpec | null`. `BattleRobot` gains `statuses: ActiveStatus[]`.
- `data.ts`: loaders normalise `statusEffect`.
- `robot.ts`: `createBattleRobot` initialises `statuses: []`. `battleDefence` applies Corrode (-25%, floor). `battleDodge` applies Dazzle (-50%, floor). New `battleAccuracyMultiplier(br)` returns 0.8 under Dazzle.
- `battle.ts`:
  - `executeAttack`: hit accuracy = `(weapon.accuracy + bonuses) * battleAccuracyMultiplier(attacker)`. On hit, `tryInflict`.
  - `useConsumable`: on landed damage, `tryInflict`. Any consumable with `healthRestore > 0` calls `cureStatuses` and logs cures.
  - `executePlannedAction`: `shouldFizzle` check first.
  - `resolveTurn`: after actions, tick + decrement for both robots unless the battle is over.
- `ai.ts`: no change.

## 4. UI

- `battle.ts` (`printBattleStatus`): a badge row under EN for each robot, e.g. `🔥 BURN (2)  ☢ RADIATION`. Radiation shows no counter. Colours: burn `t-red`, shock `t-yellow`, corrode `t-green`, radiation `t-magenta`, dazzle `t-cyan`.
- Log lines (from the engine): `X is BURNED!`, `X takes 5 burn damage`, `X seizes up and can't act!`, `X is no longer burned`, `Repair Kit cured BURN, SHOCK`.
- `shop.ts` weapon and consumable detail lines append the effect: `10 dmg, 85% acc, 4 en, 2h, 66% Burn`.
- `terminal.css`: `.status-badge` spacing class only; colours reuse existing `t-*` classes.

## 5. Version and changelog

- `package.json` version → `0.14.0`.
- `menu.ts` `CHANGELOG` gains a `0.14.0` entry dated 2026-09-07 listing each effect, its sources, the new consumables, and the Repair Kit cure rule.

## 6. Balance pass

After implementation, a throwaway script (not committed) runs seeded
auto-battles for a level-appropriate player against every enemy, with
effects enabled and disabled, and reports win rate and mean turns.
Targets: no matchup swings by more than ~15 points, and Radiation never
makes the Nuke a guaranteed win against the end-game boss tier. Tune
numbers in `STATUS_RULES` and item `chance` values; record final
numbers in this spec.

## 7. Tests

`tests/unit/status.test.ts`:
- tryInflict respects chance (seeded rng), god mode immunity, refresh-not-stack, higher potency wins on refresh
- burn tick deals floor(25% of source damage), ignores defence, can kill
- radiation escalates 10/20/30% and never expires
- corrode reduces battleDefence by 25%
- dazzle halves battleDodge and multiplies accuracy by 0.8
- shock fizzle roll at 25%
- decrement expires at 0 and logs
- cureStatuses clears all and returns the cured list

`tests/unit/battle.test.ts` additions:
- executeAttack with a 100% Burn weapon inflicts burn
- resolveTurn ticks burn damage into currentTurnLog and can end the battle
- shocked fighter's fizzled attack spends no energy
- Repair Kit consumable cures effects
- blocked hit still applies the effect

`tests/unit/data.test.ts` additions:
- Flame Thrower loads with burn at 0.66, Chainsaw with corrode at 0.2 default, Stick with null
- Acid Grenade and Flashbang exist with expected effects

`spec/tests/combat.spec.md` gains a Status Effects section mirroring the above.
