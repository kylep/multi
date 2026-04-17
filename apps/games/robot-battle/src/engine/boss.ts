/** End-game boss: randomly generated opponent that appears after winning a round. */

import type { AssetRegistry } from "./data";
import type { EndGameBossSpec, Enemy, Item, Robot, Weapon, Gear, Consumable } from "./types";
import {
  listRepeatableUpgrades,
  getRepeatableUpgradeCost,
  getUpgrade,
  applyAllUpgrades,
} from "./upgrades";

const BOSS_FIRST_NAMES = [
  "Poopy",
  "Stinky",
  "Sir Booger",
  "Captain Underpants",
  "Princess Puddle",
  "Mr. Fart",
  "Wedgie",
  "Tooty",
  "Snotrocket",
  "Burpy",
  "Gassy",
  "Drooly",
  "Smelly",
  "Pickle",
  "Cheese Goblin",
  "Uncle Meatball",
  "Chonky",
  "Slimey",
  "Buttbot",
  "Diaper Dan",
  "Nugget",
  "Waffle",
  "Sock Monster",
  "Bogey",
  "Gurgles",
];

const BOSS_TITLES = [
  "the Destroyer",
  "the Magnificent",
  "the Unflushable",
  "the Belcher",
  "the Thunder-Butt",
  "the Stinkmaster",
  "the Cookie Thief",
  "the Pants-Wetter",
  "the Bonkers",
  "the Sticky",
  "the Rotten",
  "the Dreaded",
  "the Toilet Menace",
  "the Booger King",
  "the Fart Lord",
  "the Slobber",
  "the Unwashed",
  "the Tuba Player",
  "the Wiggly",
  "the Waffle Wizard",
];

function randomBossName(): string {
  const first = BOSS_FIRST_NAMES[Math.floor(Math.random() * BOSS_FIRST_NAMES.length)];
  const title = BOSS_TITLES[Math.floor(Math.random() * BOSS_TITLES.length)];
  return `${first} ${title}`;
}

function pickBestWeapons(registry: AssetRegistry, count: number): string[] {
  const weapons = Array.from(registry.weapons.values())
    .filter((w) => !w.requirements || w.requirements.length === 0)
    .sort((a, b) => b.damage - a.damage);
  return weapons.slice(0, count).map((w) => w.name);
}

function pickBestGear(registry: AssetRegistry, count: number): string[] {
  // Sort by level desc (proxy for strength), pick top N non-stackable
  const gear = Array.from(registry.gear.values())
    .filter((g) => !g.stackable)
    .sort((a, b) => b.level - a.level || b.moneyCost - a.moneyCost);
  return gear.slice(0, count).map((g) => g.name);
}

function pickBestConsumables(registry: AssetRegistry): string[] {
  // Give a spread of top-tier consumables
  const cons = Array.from(registry.consumables.values())
    .sort((a, b) => b.level - a.level || b.moneyCost - a.moneyCost);
  const names: string[] = [];
  for (const c of cons.slice(0, 5)) {
    // 2 copies of each top consumable, bounded by maxStack
    const copies = Math.min(2, c.maxStack > 0 ? c.maxStack : 2);
    for (let i = 0; i < copies; i++) names.push(c.name);
  }
  return names;
}

function calculatePlayerWorth(player: Robot): number {
  const upgradeCost = player.upgrades.reduce((sum, id) => {
    const def = getUpgrade(id);
    return sum + (def?.cost ?? 0);
  }, 0);
  let repUpgradeCost = 0;
  const repDefs = listRepeatableUpgrades();
  for (const [id, level] of Object.entries(player.repeatableUpgrades)) {
    const def = repDefs.find((r) => r.id === id);
    if (!def) continue;
    for (let i = 0; i < level; i++) {
      repUpgradeCost += getRepeatableUpgradeCost(def, i);
    }
  }
  return player.money + player.bank + upgradeCost + repUpgradeCost;
}

/** Spend the given budget on repeatable upgrades, rotating through available types. */
function spendBudgetOnRepeatables(budget: number): Record<string, number> {
  const levels: Record<string, number> = {};
  const defs = listRepeatableUpgrades();
  let remaining = budget;
  let progress = true;
  while (remaining > 0 && progress) {
    progress = false;
    for (const def of defs) {
      const currentLevel = levels[def.id] ?? 0;
      const cost = getRepeatableUpgradeCost(def, currentLevel);
      if (cost <= remaining) {
        levels[def.id] = currentLevel + 1;
        remaining -= cost;
        progress = true;
      }
    }
  }
  return levels;
}

/** Generate a random end-game boss stronger than the given player. */
export function generateEndGameBossSpec(registry: AssetRegistry, player: Robot): EndGameBossSpec {
  const budget = Math.floor(calculatePlayerWorth(player) * 1.25);
  const repeatableUpgrades = spendBudgetOnRepeatables(budget);

  // Total hands needed to wield multiple weapons — boss gets "sixth-arm" effectively
  const weapons = pickBestWeapons(registry, 3);
  const gear = pickBestGear(registry, 4);
  const consumables = pickBestConsumables(registry);

  return {
    name: randomBossName(),
    level: Math.max(player.level + 1, 1),
    weapons,
    gear,
    consumables,
    repeatableUpgrades,
  };
}

/** Build a Robot from a boss spec, tied to the player's NG+ level for scaling. */
export function createBossRobot(
  registry: AssetRegistry,
  spec: EndGameBossSpec,
  playerNewGamePlusLevel: number,
): Robot {
  const stats = registry.defaultRobotStats;
  const robot: Robot = {
    name: spec.name,
    health: stats.health,
    maxHealth: stats.maxHealth,
    energy: stats.energy,
    maxEnergy: stats.maxEnergy,
    defence: stats.defence,
    attack: stats.attack,
    hands: 6, // boss has 6 arms so it can dual-wield heavy gear
    dodge: stats.dodge,
    accuracy: 0,
    level: spec.level,
    exp: 0,
    money: 0,
    bank: 0,
    wins: 0,
    fights: 0,
    inventorySize: 99,
    inventory: [],
    upgrades: [],
    repeatableUpgrades: { ...spec.repeatableUpgrades },
    settings: {
      mode: "oliver",
      oliverChallenge: false,
      autoDeposit: false,
      restockConsumables: false,
    },
    defeatedEnemies: [],
    challengeDefeatedEnemies: [],
    cheatsUsed: false,
    godMode: false,
    newGamePlusLevel: playerNewGamePlusLevel,
    titanDefeated: false,
    endGameBoss: null,
  };

  for (const name of spec.weapons) {
    const w = registry.weapons.get(name);
    if (w) robot.inventory.push({ ...w } as Weapon);
  }
  for (const name of spec.gear) {
    const g = registry.gear.get(name);
    if (g) robot.inventory.push({ ...g } as Gear);
  }
  for (const name of spec.consumables) {
    const c = registry.consumables.get(name);
    if (c) robot.inventory.push({ ...c } as Consumable);
  }

  applyAllUpgrades(robot);
  return robot;
}

/** Build an Enemy record suitable for the battle / detail UI from a boss spec. */
export function bossAsEnemy(spec: EndGameBossSpec): Enemy {
  return {
    name: spec.name,
    level: spec.level,
    weapons: spec.weapons,
    gear: spec.gear,
    consumables: spec.consumables,
    upgrades: [],
    reward: 50000,
    expReward: 100,
    description: "A terrifying opponent unlike any other.",
    appearance: "It glares at you with unnatural menace.",
    backstory: "Born from the echoes of your own victories, this foe is your reckoning.",
    challengeName: "",
  };
}
