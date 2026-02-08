import { GameState, TurnAction, RandomFn } from "./types.js";
import { StaticEnemy } from "./data/enemies.js";
export declare function getAvailableEnemies(): StaticEnemy[];
export declare function startBattle(state: GameState, enemyName: string): GameState;
export declare function resolveTurn(state: GameState, playerAction: TurnAction, random?: RandomFn): GameState;
export declare function endBattle(state: GameState): GameState;
//# sourceMappingURL=battle.d.ts.map