export interface Robot {
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  defence: number;
  attack: number;
  hands: number;
  dodge: number;
  level: number;
  exp: number;
  inventorySize: number;
  money: number;
  wins: number;
  fights: number;
  inventory: InventoryItem[];
}

export interface InventoryItem {
  instanceId: string;
  itemName: string;
  type: "weapon" | "gear" | "consumable";
}

export interface GameState {
  gameId: string;
  playerName: string;
  robot: Robot;
  phase: "menu" | "shop" | "battle";
  battle: BattleState | null;
  firstBattle: boolean;
}

export interface BattleRobot {
  name: string;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  defence: number;
  attack: number;
  hands: number;
  dodge: number;
  weapons: BattleWeapon[];
  gear: string[];
  consumables: BattleConsumable[];
}

export interface BattleWeapon {
  slotIndex: number;
  name: string;
  damage: number;
  energyCost: number;
  accuracy: number;
  hands: number;
  requirements?: string[];
}

export interface BattleConsumable {
  slotIndex: number;
  name: string;
  effects: {
    healthRestore?: number;
    damage?: number;
    enemyDodgeReduction?: number;
  };
}

export interface TurnAction {
  mainAction: "attack" | "rest" | "surrender";
  weaponSlots: number[];
  consumablesUsed: number[];
}

export interface WeaponResult {
  weaponName: string;
  hit: boolean;
  damage: number;
}

export interface TurnResult {
  actor: string;
  action: "attack" | "rest" | "surrender" | "consumable";
  weaponResults?: WeaponResult[];
  consumableName?: string;
  consumableEffect?: string;
  energyRestored?: number;
}

export interface TurnSnapshot {
  turn: number;
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
}

export interface BattleState {
  enemyName: string;
  player: BattleRobot;
  enemy: BattleRobot;
  turn: number;
  combatLog: TurnResult[];
  turnHistory: TurnSnapshot[];
  outcome: "ongoing" | "victory" | "defeat";
  rewards: { money: number; exp: number; leveledUp: boolean; newLevel: number } | null;
}

export type RandomFn = () => number;
