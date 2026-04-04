/** Data models for Robot Battle. */

export type ItemType = "weapon" | "gear" | "consumable";

export interface ItemBase {
  name: string;
  itemType: ItemType;
  level: number;
  moneyCost: number;
  description: string;
  requirements: string[];
}

export interface Weapon extends ItemBase {
  itemType: "weapon";
  damage: number;
  energyCost: number;
  accuracy: number;
  hands: number;
}

export interface Gear extends ItemBase {
  itemType: "gear";
  healthBonus: number;
  energyBonus: number;
  defenceBonus: number;
  attackBonus: number;
  handsBonus: number;
  dodgeBonus: number;
  accuracyBonus: number;
  moneyBonusPercent: number;
  stackable: boolean;
  maxStack: number;
  category: string;
}

export interface Consumable extends ItemBase {
  itemType: "consumable";
  healthRestore: number;
  energyRestore: number;
  tempDefence: number;
  tempAttack: number;
  damage: number;
  damageBlock: number;
  enemyDodgeReduction: number;
  useText: string;
  accuracyBonus: number;
  maxStack: number;
}

export type Item = Weapon | Gear | Consumable;

export interface Robot {
  name: string;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  defence: number;
  attack: number;
  hands: number;
  dodge: number;
  accuracy: number;
  level: number;
  exp: number;
  money: number;
  bank: number;
  wins: number;
  fights: number;
  inventorySize: number;
  inventory: Item[];
  upgrades: string[];
  repeatableUpgrades: Record<string, number>;
  settings: { mode: "oliver" | "lucas" | "sandbox"; oliverChallenge: boolean };
  defeatedEnemies: string[];
  challengeDefeatedEnemies: string[];
  cheatsUsed: boolean;
  godMode: boolean;
  newGamePlusLevel: number;
  titanDefeated: boolean;
}

export interface Enemy {
  name: string;
  level: number;
  weapons: string[];
  gear: string[];
  consumables: string[];
  upgrades: string[];
  reward: number;
  expReward: number;
  description: string;
  appearance: string;
  backstory: string;
  challengeName: string;
}

export interface BattleRobot {
  robot: Robot;
  currentHealth: number;
  currentEnergy: number;
  tempDefence: number;
  tempAttack: number;
  tempAccuracy: number;
  tempDodgeReduction: number;
  damageBlock: number;
  consumablesUsed: string[];
  consumableUsedThisTurn: boolean;
}

export interface PlannedAction {
  actionType: "attack" | "rest" | "consumable";
  weapons: Weapon[];
  consumable: Consumable | null;
}

export interface TurnSnapshot {
  turn: number;
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
}

export interface BattleState {
  player: BattleRobot;
  enemy: BattleRobot;
  fightNumber: number;
  turnNumber: number;
  battleLog: string[];
  lastTurnLog: string[];
  currentTurnLog: string[];
  winner: "player" | "enemy" | null;
  playerAction: PlannedAction | null;
  enemyAction: PlannedAction | null;
  turnHistory: TurnSnapshot[];
  turnLogs: string[][];
}

export interface ActionResult {
  success: boolean;
  message: string;
  damageDealt: number;
  energySpent: number;
  turnEnded: boolean;
}

export interface ShopResult {
  success: boolean;
  message: string;
  moneySpent: number;
  moneyGained: number;
}

// RNG interface for seedable randomness
export interface Rng {
  random(): number;
  choice<T>(arr: T[]): T;
}
