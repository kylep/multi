/** Game state management. */

import type { Item, Robot } from "./types";
import type { AssetRegistry } from "./data";
import { getEffectiveMaxEnergy, getEffectiveMaxHealth, getMoneyBonusPercent } from "./robot";

export interface GameState {
  registry: AssetRegistry;
  player: Robot | null;
}

export function createGameState(registry: AssetRegistry): GameState {
  return { registry, player: null };
}

export function createPlayer(state: GameState, name: string): Robot {
  const stats = state.registry.defaultRobotStats;
  const player: Robot = {
    name,
    health: stats.health,
    maxHealth: stats.maxHealth,
    energy: stats.energy,
    maxEnergy: stats.maxEnergy,
    defence: stats.defence,
    attack: stats.attack,
    hands: stats.hands,
    dodge: stats.dodge,
    level: 1,
    exp: 0,
    money: state.registry.startingMoney,
    wins: 0,
    fights: 0,
    inventorySize: stats.inventorySize,
    inventory: [],
    upgrades: [],
    settings: { mode: "oliver", oliverChallenge: false },
    defeatedEnemies: [],
    challengeDefeatedEnemies: [],
  };
  // Give player a free starter Stick
  const stick = state.registry.getItem("Stick");
  if (stick) player.inventory.push({ ...stick });
  // Sync health/energy to effective max
  player.health = getEffectiveMaxHealth(player);
  player.energy = getEffectiveMaxEnergy(player);
  state.player = player;
  return player;
}

export function awardMoney(state: GameState, baseAmount: number): number {
  const player = state.player!;
  const bonusPercent = getMoneyBonusPercent(player);
  const actual = baseAmount + Math.floor((baseAmount * bonusPercent) / 100);
  player.money += actual;
  return actual;
}

export function recordFight(state: GameState, won: boolean): void {
  const player = state.player!;
  player.fights += 1;
  if (won) player.wins += 1;
}

export function getXpToLevel(level: number): number {
  return 10 + 2 * (level - 1);
}

const MAX_LEVEL = 50;

export function awardExp(state: GameState, amount: number): boolean {
  const player = state.player!;
  const capped = player.settings.mode !== "sandbox";
  if (capped && player.level >= MAX_LEVEL) return false;
  player.exp += amount;
  let leveledUp = false;
  while (player.exp >= getXpToLevel(player.level) && (!capped || player.level < MAX_LEVEL)) {
    player.exp -= getXpToLevel(player.level);
    player.level += 1;
    leveledUp = true;
  }
  if (capped && player.level >= MAX_LEVEL) {
    player.exp = 0;
  }
  return leveledUp;
}
