/** Robot helper functions — replaces Python Robot methods. */

import type { BattleRobot, Gear, Item, Robot, Weapon, Consumable } from "./types";

// ── Robot helpers ──

export function getWeaponEnergyCost(weapon: Weapon, player: Robot): number {
  if (player.settings?.mode === "lucas") return 0;
  return weapon.energyCost;
}

export function getWeapons(robot: Robot): Weapon[] {
  return robot.inventory.filter((i): i is Weapon => i.itemType === "weapon");
}

export function getGear(robot: Robot): Gear[] {
  return robot.inventory.filter((i): i is Gear => i.itemType === "gear");
}

export function getConsumables(robot: Robot): Consumable[] {
  return robot.inventory.filter((i): i is Consumable => i.itemType === "consumable");
}

/** Per-level stat bonus for accuracy/dodge/defence/attack.
 *  Base is +1 per level, plus +1 per New Game+ round. */
export function getLevelStatBonus(robot: Robot): number {
  return robot.level * (1 + (robot.newGamePlusLevel ?? 0));
}

/** Per-level HP bonus. Base is +2 per level, plus +1 per New Game+ round. */
export function getLevelHealthBonus(robot: Robot): number {
  return robot.level * (2 + (robot.newGamePlusLevel ?? 0));
}

export function getEffectiveHands(robot: Robot): number {
  return robot.hands + getGear(robot).reduce((s, g) => s + g.handsBonus, 0);
}

export function getEffectiveDodge(robot: Robot): number {
  return robot.dodge + getLevelStatBonus(robot) + getGear(robot).reduce((s, g) => s + g.dodgeBonus, 0);
}

export function getEffectiveDefence(robot: Robot): number {
  return robot.defence + getLevelStatBonus(robot) + getGear(robot).reduce((s, g) => s + g.defenceBonus, 0);
}

export function getEffectiveMaxHealth(robot: Robot): number {
  return robot.maxHealth + getLevelHealthBonus(robot) + getGear(robot).reduce((s, g) => s + g.healthBonus, 0);
}

export function getEffectiveMaxEnergy(robot: Robot): number {
  return robot.maxEnergy + getGear(robot).reduce((s, g) => s + g.energyBonus, 0);
}

export function getEffectiveAttack(robot: Robot): number {
  return robot.attack + getLevelStatBonus(robot) + getGear(robot).reduce((s, g) => s + g.attackBonus, 0);
}

export function getRestEnergyBonus(robot: Robot): number {
  return getGear(robot).reduce((s, g) => s + Math.ceil(0.5 * g.energyBonus), 0);
}

export function getEffectiveAccuracy(robot: Robot): number {
  return robot.accuracy + getLevelStatBonus(robot) + getGear(robot).reduce((s, g) => s + g.accuracyBonus, 0);
}

export function getMoneyBonusPercent(robot: Robot): number {
  return getGear(robot).reduce((s, g) => s + g.moneyBonusPercent, 0);
}

export function hasItem(robot: Robot, itemName: string): boolean {
  return robot.inventory.some((i) => i.name === itemName);
}

export function getAmmoCount(robot: Robot, ammoName: string): number {
  return robot.inventory.filter((i) => i.name === ammoName).length;
}

/** Get all ammo types the robot carries (for display). */
export function getAmmoSummary(robot: Robot): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  for (const item of robot.inventory) {
    if (item.itemType === "gear" && (item as Gear).stackable && (item as Gear).category === "Ammo") {
      counts.set(item.name, (counts.get(item.name) ?? 0) + 1);
    }
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count }));
}

// ── BattleRobot helpers ──

export function createBattleRobot(robot: Robot): BattleRobot {
  return {
    robot,
    currentHealth: getEffectiveMaxHealth(robot),
    currentEnergy: getEffectiveMaxEnergy(robot),
    tempDefence: 0,
    tempAttack: 0,
    tempAccuracy: 0,
    tempDodgeReduction: 0,
    damageBlock: 0,
    consumablesUsed: [],
    consumableUsedThisTurn: false,
  };
}

export function battleDodge(br: BattleRobot): number {
  return Math.max(0, getEffectiveDodge(br.robot) - br.tempDodgeReduction);
}

export function battleDefence(br: BattleRobot): number {
  return getEffectiveDefence(br.robot) + br.tempDefence;
}

export function isAlive(br: BattleRobot): boolean {
  return br.currentHealth > 0;
}
