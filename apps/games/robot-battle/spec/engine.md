# Robot Battle — Engine Spec

## Architecture

Pure TypeScript functions operating on plain objects. Zero DOM dependency
in the engine layer. All game state is serializable to JSON.

```
src/engine/
  types.ts    — all interfaces (Robot, Item, BattleState, etc.)
  rng.ts      — seedable mulberry32 RNG
  robot.ts    — Robot/BattleRobot helper functions
  battle.ts   — combat logic (attack, rest, consumable, turn resolution)
  ai.ts       — enemy AI weapon selection and action planning
  shop.ts     — buy/sell logic, requirement/level checks
  state.ts    — GameState management (create player, award XP/money)
  data.ts     — AssetRegistry, JSON loading
  save.ts     — localStorage save/load/delete
```

## Key Design Decisions

1. **Plain objects + standalone functions** instead of classes. State is a
   bag of data; behavior lives in pure functions. This makes serialization
   trivial and testing straightforward.

2. **Attacker/defender passed explicitly** to all combat functions. No
   "current turn" flag — the caller decides who attacks whom.

3. **Seedable RNG** (mulberry32) for deterministic unit tests. Pass a
   seeded `Rng` to any function that needs randomness.

4. **Simultaneous turns**: both sides plan actions, then `resolveTurn()`
   executes them in random order. Consumables execute immediately when
   used (before the main turn resolution).

## Data Flow

```
JSON files → loadAssets() → AssetRegistry
                              ↓
                        createGameState()
                              ↓
                          GameState { registry, player }
                              ↓
         createBattle(player, enemyRobot) → BattleState
                              ↓
         planAttack/planRest/planConsumable → stored on BattleState
                              ↓
         resolveTurn() → executes actions, updates HP/energy
                              ↓
         endTurn() → snapshot, clear logs, increment turn
```

## Item System

Three item types sharing a base interface (`ItemBase`):
- **Weapon**: damage, energyCost, accuracy, hands, requirements
- **Gear**: passive stat bonuses (health, energy, defence, attack, hands, dodge, money%)
- **Consumable**: one-time effects (heal, damage, temp buffs, dodge reduction)

Gear does not stack — you cannot equip two of the same gear item.
Consumables are removed from inventory when used.

## Save System

The save module (`src/engine/save.ts`) provides four pure functions
plus a storage interface for testability:

```typescript
interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
```

- `saveGame(storage, player)` — serializes `{ version: 1, player }` to JSON
- `loadGame(storage)` — parses JSON, returns `Robot | null` (null if missing/invalid/wrong version)
- `deleteSave(storage)` — removes the save key
- `hasSave(storage)` — returns boolean

In production, `storage` is `window.localStorage`. In tests, a plain
object implementing `SaveStorage` is used instead.

The save contains only the `Robot` object. The `AssetRegistry` is
stateless and reloaded from JSON each time. This keeps saves small
and avoids versioning issues with item data changes.

## Combat Math

- **Hit chance**: `clamp((accuracy - dodge) / 100, 0, 1)`
- **Damage**: `max(0, floor(baseDmg * (1 + atkPercent/100)) - defence)`
- **Rest**: restores 5 energy per turn (capped at max)
- **Victory**: first robot to reach 0 HP loses
