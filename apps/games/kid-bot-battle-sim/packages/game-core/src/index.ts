// Types
export type {
  GameState,
  Robot,
  InventoryItem,
  BattleState,
  BattleRobot,
  BattleWeapon,
  BattleConsumable,
  TurnAction,
  TurnResult,
  TurnSnapshot,
  WeaponResult,
  RandomFn,
} from "./types.js";

// Data
export * from "./data/index.js";

// Game start
export { startGame } from "./start-game.js";

// Robot
export { createRobot, computeEffectiveStats, healRobot, formatRobotStats } from "./robot.js";

// Inventory
export { lookupItem, addItem, removeItem, hasItem, getInventoryByType } from "./inventory.js";

// Shop
export { enterShop, getShopCatalog, buyItem, sellItem } from "./shop.js";
export type { BuyResult, SellResult } from "./shop.js";

// Battle
export { getAvailableEnemies, startBattle, resolveTurn, endBattle } from "./battle.js";

// Combat
export {
  calculateHitChance,
  calculateDamage,
  resolveAttack,
  resolveRest,
  resolveConsumable,
  validateWeaponSelection,
} from "./combat.js";

// AI
export { planAiTurn, suggestPlayerAction } from "./ai.js";
