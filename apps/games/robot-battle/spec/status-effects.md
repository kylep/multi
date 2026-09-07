# Status Effects Spec (v0.14.0)

Pokémon-style status effects. Weapons and consumables can inflict an
effect on hit. Effects tick each turn, show as badges in the battle
panel, and are cured by any Repair Kit.

## 1. Effects

| Effect | Badge | Sources | What it does | Duration |
|--------|-------|---------|--------------|----------|
| Burn | 🔥 BURN | Flame Thrower (66%), Plasma Cannon, Plasma Grenade | 15% of the source's base damage each turn, ignores defence | 3 turns |
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
- Damage ticks can kill. `checkVictory` runs after ticks, and checks the
  enemy first so a tick that drops both robots at once goes to the player.
  Both destruction lines are logged.

### Tick timing

`resolveTurn` runs both planned actions, then ticks statuses on both
robots (player first, then enemy), then decrements durations. Tick log
lines land in the current turn's log so they render with that turn.
Radiation's per-turn damage uses the number of ticks elapsed so far
(`potency * ticks`), so turn 1 after infliction deals 10%, turn 2 deals
20%, etc.

Shock's fizzle roll happens in `executePlannedAction` for attacks and
rests, and inside `useConsumable` for items. Consumables roll their own so
that the player's immediate item use — which never goes through a planned
action — is rolled the same as the AI's planned one. A fizzled action still
consumes the turn but spends no energy and no consumable; a fizzled
consumable leaves `consumableUsedThisTurn` false, and the battle UI retires
the player's item action for that turn instead.

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
export function cureStatuses(battle, br, sourceName: string): StatusType[];
export function hasStatus(br, type): boolean;
export function shouldFizzle(br, rng): boolean;          // shock roll
```

Changes to existing engine code:

- `types.ts`: `Weapon` and `Consumable` gain `statusEffect: StatusEffectSpec | null`. `BattleRobot` gains `statuses: ActiveStatus[]`.
- `data.ts`: loaders normalise `statusEffect`.
- `robot.ts`: `createBattleRobot` initialises `statuses: []`. `battleDefence` applies Corrode (-25%, floor). `battleDodge` applies Dazzle (-50%, floor). New `battleAccuracyMultiplier(br)` returns 0.8 under Dazzle.
- `battle.ts`:
  - `executeAttack`: hit accuracy = `(weapon.accuracy + bonuses) * battleAccuracyMultiplier(attacker)`. On hit, `tryInflict`.
  - `useConsumable`: `shouldFizzle` check first (before the item is spent). On landed damage, `tryInflict`. Any consumable with `healthRestore > 0` calls `cureStatuses` and logs cures.
  - `executePlannedAction`: `shouldFizzle` check first for attacks and rests; consumables are left to `useConsumable`.
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
- burn tick deals floor(15% of source damage), ignores defence, can kill
- radiation escalates 10/20/30% and never expires
- corrode reduces battleDefence by 25%
- dazzle halves battleDodge and multiplies accuracy by 0.8
- shock fizzle roll at 25%
- a fizzled consumable is kept, and `consumableUsedThisTurn` stays false
- a tick that drops both robots hands the win to the player
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

## 8. Balance results

Method: a throwaway seeded sim (not committed) ran 1000 auto-battles per
matchup, effects on vs effects stripped from every item, same seeds both
ways. Both sides plan with `aiPlanAction`; battles are capped at 50 turns
like the UI's auto-battle. The player is built level-appropriately for each
enemy: best armour and battery, the best equivalent of every gear class the
enemy carries, the enemy's own permanent upgrades, hands filled with the best
damage-per-hand weapons at that level, and 2 of the best repair kit.

Only rows that moved are listed. `delta` is win% with effects minus win%
without; `fx` counts effects inflicted per battle (by the player / by the
enemy) after tuning.

| Matchup | Win% off | Win% on (before) | Win% on (after) | delta (after) | fx (after) |
|---------|---------:|-----------------:|----------------:|--------------:|------------|
| Sparky (3) | 89.6 | 87.5 | 87.5 | -2.1 | shock 1.11/1.38 |
| Voltank (7) | 53.7 | 77.3 | 69.5 | +15.8 | burn 1.23/0.00, shock 0.42/0.57 |
| Warblade (18) | 96.3 | 94.3 | 94.3 | -2.0 | corrode 0.51/0.18 |
| Thunderbot (20) | 37.1 | 35.8 | 35.8 | -1.3 | burn 0.26/0.24 |
| Megacrusher (25) | 21.2 | 27.7 | 24.4 | +3.2 | burn 0.20, shock 0.26/0.61, corrode 0.23/0.64 |
| Doombot (30) | 57.4 | 52.7 | 61.4 | +4.0 | shock 0.32/0.00, burn 0.00/0.18 |
| Nightmare (35) | 98.4 | 93.0 | 98.0 | -0.4 | burn 0.20/0.09, shock 0.23/0.03 |
| Apocalypse (40) | 13.9 | 14.2 | 14.2 | +0.3 | radiation 0.65/0.86 |
| TITAN (50) | 92.9 | 92.3 | 92.3 | -0.6 | radiation 0.00/0.27, corrode 0.18/0.00 |
| **Max abs delta** | | **23.6** | **15.8** | | |
| **Mean abs delta** | | **2.5** | **1.6** | | |

Targeted matchups (after tuning):

| Matchup | Win% off | Win% on | delta |
|---------|---------:|--------:|------:|
| Flame Thrower vs Firebot (5) | 99.0 | 91.9 | -7.1 |
| Nuke Launcher + 5 Nukes vs Apocalypse (40) | 14.9 | 14.8 | -0.1 |
| Nuke Launcher + 5 Nukes vs TITAN (50) | 26.7 | 26.8 | +0.1 |
| Flashbang + Acid Grenade vs Ironclad (13) | 100.0 | 100.0 | 0.0 |

### Change made

`STATUS_RULES.burn.damageFraction` 0.25 → 0.15. Nothing else changed; every
per-item `chance` is unchanged.

Burn was the only effect that could move a matchup by more than 10 points on
its own. It deals a share of the *source's* base damage every turn straight
through armour, so it scaled violently with big-damage sources: a Plasma
Grenade (250 damage) burned for 62 a turn, roughly three quarters of the
grenade itself again over the duration. At 0.15 that drops to 37. Per-effect
isolation runs (each effect enabled alone) after the change:

| Effect | Largest single-matchup swing |
|--------|------------------------------|
| Burn | +18.0 (Voltank), otherwise within ±3 |
| Shock | -6.0 (Sparky), -5.7 (Megacrusher) |
| Corrode | -1.7 (Warblade) |
| Dazzle | +2.7 (Megacrusher) |
| Radiation | ±0.7 |

Durations were left alone: end-game fights resolve in 1-3 turns, so burn 3 vs
burn 2 changed no win rate measurably. The fraction is the only lever that
matters.

### Known residual

Voltank (level 7) still swings +15.8. That matchup is a 53.7% coin flip
resolved in 3-4 turns, and the sim's player mirrors Voltank's third and
fourth arms, so it swings a Flame Thrower alongside two other weapons and
keeps burn refreshed every turn. One point of undefended damage per turn is
worth ~16 points there: dropping the fraction to 0.10 does not help, because
`floor(10 * 0.15)` and `floor(10 * 0.10)` are both 1. Shaving it further
would need the Flame Thrower's 66% chance to come down, which is a fixed
number. A player who has not bought two extra arms by level 7 (the more
likely case — the fourth arm costs $5000) does not equip the Flame Thrower at
all, and that build's worst swing across the whole roster is 7.7 points.

Radiation is deliberately untouched. It never made the Nuke a guaranteed win
(delta +0.1 against TITAN, -0.1 against Apocalypse) because top-tier fights
end before the ramp compounds; buffing it is the one change that could break
the spec's stated target.
