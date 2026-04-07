/** Asset loading from JSON data files. */

import type { Consumable, Enemy, Gear, Item, Robot, Weapon } from "./types";
import { applyAllUpgrades } from "./upgrades";

import configJson from "../data/config.json";
import itemsJson from "../data/items.json";
import enemiesJson from "../data/enemies.json";

// ── Loader helpers ──

function loadWeapon(name: string, d: Record<string, unknown>): Weapon {
  return {
    name,
    itemType: "weapon",
    level: (d.level as number) ?? 0,
    moneyCost: (d.moneyCost as number) ?? 0,
    description: (d.description as string) ?? "",
    requirements: (d.requirements as string[]) ?? [],
    damage: (d.damage as number) ?? 1,
    energyCost: (d.energyCost as number) ?? 1,
    accuracy: (d.accuracy as number) ?? 100,
    hands: (d.hands as number) ?? 1,
  };
}

function loadGear(name: string, d: Record<string, unknown>): Gear {
  return {
    name,
    itemType: "gear",
    level: (d.level as number) ?? 0,
    moneyCost: (d.moneyCost as number) ?? 0,
    description: (d.description as string) ?? "",
    requirements: (d.requirements as string[]) ?? [],
    healthBonus: (d.healthBonus as number) ?? 0,
    energyBonus: (d.energyBonus as number) ?? 0,
    defenceBonus: (d.defenceBonus as number) ?? 0,
    attackBonus: (d.attackBonus as number) ?? 0,
    handsBonus: (d.handsBonus as number) ?? 0,
    dodgeBonus: (d.dodgeBonus as number) ?? 0,
    accuracyBonus: (d.accuracyBonus as number) ?? 0,
    moneyBonusPercent: (d.moneyBonusPercent as number) ?? 0,
    stackable: (d.stackable as boolean) ?? false,
    maxStack: (d.maxStack as number) ?? 0,
    category: (d.category as string) ?? "",
  };
}

function loadConsumable(name: string, d: Record<string, unknown>): Consumable {
  return {
    name,
    itemType: "consumable",
    level: (d.level as number) ?? 0,
    moneyCost: (d.moneyCost as number) ?? 0,
    description: (d.description as string) ?? "",
    requirements: (d.requirements as string[]) ?? [],
    healthRestore: (d.healthRestore as number) ?? 0,
    energyRestore: (d.energyRestore as number) ?? 0,
    tempDefence: (d.tempDefence as number) ?? 0,
    tempAttack: (d.tempAttack as number) ?? 0,
    damage: (d.damage as number) ?? 0,
    damageBlock: (d.damageBlock as number) ?? 0,
    enemyDodgeReduction: (d.enemyDodgeReduction as number) ?? 0,
    useText: (d.useText as string) ?? "",
    accuracyBonus: (d.accuracyBonus as number) ?? 0,
    maxStack: (d.maxStack as number) ?? 0,
  };
}

function loadEnemy(name: string, d: Record<string, unknown>): Enemy {
  return {
    name,
    level: (d.level as number) ?? 1,
    weapons: (d.weapons as string[]) ?? [],
    gear: (d.gear as string[]) ?? [],
    consumables: (d.consumables as string[]) ?? [],
    upgrades: (d.upgrades as string[]) ?? [],
    reward: (d.reward as number) ?? 0,
    expReward: (d.expReward as number) ?? 1,
    description: (d.description as string) ?? "",
    appearance: (d.appearance as string) ?? "",
    backstory: (d.backstory as string) ?? "",
    challengeName: (d.challengeName as string) ?? "",
  };
}

// ── AssetRegistry ──

export interface DefaultRobotStats {
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  defence: number;
  attack: number;
  hands: number;
  dodge: number;
  inventorySize: number;
}

export interface AssetRegistry {
  weapons: Map<string, Weapon>;
  gear: Map<string, Gear>;
  consumables: Map<string, Consumable>;
  enemies: Map<string, Enemy>;
  defaultRobotStats: DefaultRobotStats;
  startingMoney: number;
  getItem(name: string): Item | undefined;
  getAllItems(): Item[];
  getItemsForLevel(level: number): Item[];
  createEnemyRobot(enemyName: string): Robot | null;
}

export function loadAssets(): AssetRegistry {
  const weapons = new Map<string, Weapon>();
  const gear = new Map<string, Gear>();
  const consumables = new Map<string, Consumable>();
  const enemies = new Map<string, Enemy>();

  // Load items
  const items = itemsJson as Record<string, Record<string, Record<string, unknown>>>;
  for (const [name, data] of Object.entries(items.weapons ?? {})) {
    weapons.set(name, loadWeapon(name, data));
  }
  for (const [name, data] of Object.entries(items.gear ?? {})) {
    gear.set(name, loadGear(name, data));
  }
  for (const [name, data] of Object.entries(items.consumables ?? {})) {
    consumables.set(name, loadConsumable(name, data));
  }

  // Load enemies
  const enemyData = enemiesJson as Record<string, Record<string, Record<string, unknown>>>;
  for (const [name, data] of Object.entries(enemyData.enemies ?? {})) {
    enemies.set(name, loadEnemy(name, data));
  }

  // Load config
  const config = configJson as {
    defaultRobotStats: DefaultRobotStats;
    startingMoney: number;
  };

  const registry: AssetRegistry = {
    weapons,
    gear,
    consumables,
    enemies,
    defaultRobotStats: config.defaultRobotStats,
    startingMoney: config.startingMoney,

    getItem(name: string): Item | undefined {
      return weapons.get(name) ?? gear.get(name) ?? consumables.get(name);
    },

    getAllItems(): Item[] {
      return [
        ...weapons.values(),
        ...gear.values(),
        ...consumables.values(),
      ];
    },

    getItemsForLevel(level: number): Item[] {
      return registry.getAllItems().filter((i) => i.level <= level);
    },

    createEnemyRobot(enemyName: string): Robot | null {
      const enemy = enemies.get(enemyName);
      if (!enemy) return null;

      const stats = config.defaultRobotStats;
      const robot: Robot = {
        name: enemy.name,
        health: stats.health,
        maxHealth: stats.maxHealth,
        energy: stats.energy,
        maxEnergy: stats.maxEnergy,
        defence: stats.defence,
        attack: stats.attack,
        hands: stats.hands,
        dodge: stats.dodge,
        accuracy: 0,
        level: enemy.level,
        exp: 0,
        money: 0,
        bank: 0,
        wins: 0,
        fights: 0,
        inventorySize: 99,
        inventory: [],
        upgrades: [],
        repeatableUpgrades: {},
        settings: { mode: "oliver", oliverChallenge: false },
        defeatedEnemies: [],
        challengeDefeatedEnemies: [],
        cheatsUsed: false,
        godMode: false,
        newGamePlusLevel: 0,
        titanDefeated: false,
      };

      for (const wName of enemy.weapons) {
        const w = weapons.get(wName);
        if (w) robot.inventory.push({ ...w });
      }
      for (const gName of enemy.gear) {
        const g = gear.get(gName);
        if (g) robot.inventory.push({ ...g });
      }
      for (const cName of enemy.consumables) {
        const c = consumables.get(cName);
        if (c) robot.inventory.push({ ...c });
      }

      // Apply enemy upgrades
      if (enemy.upgrades.length > 0) {
        robot.upgrades = [...enemy.upgrades];
        applyAllUpgrades(robot);
      }

      return robot;
    },
  };

  return registry;
}
