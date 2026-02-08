export type { GameState, Robot, InventoryItem, BattleState, BattleRobot, BattleWeapon, BattleConsumable, TurnAction, TurnResult, TurnSnapshot, WeaponResult, RandomFn, } from "./types.js";
export * from "./data/index.js";
export { startGame } from "./start-game.js";
export { createRobot, computeEffectiveStats, healRobot, formatRobotStats } from "./robot.js";
export { lookupItem, addItem, removeItem, hasItem, getInventoryByType } from "./inventory.js";
export { enterShop, getShopCatalog, buyItem, sellItem } from "./shop.js";
export type { BuyResult, SellResult } from "./shop.js";
export { getAvailableEnemies, startBattle, resolveTurn, endBattle } from "./battle.js";
export { calculateHitChance, calculateDamage, resolveAttack, resolveRest, resolveConsumable, validateWeaponSelection, } from "./combat.js";
export { planAiTurn, suggestPlayerAction } from "./ai.js";
//# sourceMappingURL=index.d.ts.map