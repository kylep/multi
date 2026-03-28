/** Enemy AI logic. */

import type { BattleRobot, BattleState, PlannedAction, Weapon } from "./types";
import { getConsumables, getEffectiveHands, getWeapons, hasItem } from "./robot";

export function aiSelectWeapons(fighter: BattleRobot): Weapon[] {
  const weapons = getWeapons(fighter.robot);
  if (weapons.length === 0 || fighter.currentEnergy <= 0) return [];

  let availableHands = getEffectiveHands(fighter.robot);
  let availableEnergy = fighter.currentEnergy;

  const usable = weapons.filter(
    (w) =>
      w.energyCost <= availableEnergy &&
      w.requirements.every((req) => hasItem(fighter.robot, req)),
  );

  // Sort by damage-per-hand ratio descending
  const sorted = [...usable].sort((a, b) => b.damage / b.hands - a.damage / a.hands);

  const selected: Weapon[] = [];
  const usedIds = new Set<Weapon>();

  for (const weapon of sorted) {
    if (usedIds.has(weapon)) continue;
    if (weapon.hands <= availableHands && weapon.energyCost <= availableEnergy) {
      selected.push(weapon);
      usedIds.add(weapon);
      availableHands -= weapon.hands;
      availableEnergy -= weapon.energyCost;
    }
  }

  return selected;
}

export function aiPlanAction(battle: BattleState, isPlayer: boolean): PlannedAction {
  const fighter = isPlayer ? battle.player : battle.enemy;

  // Use consumables first
  for (const consumable of getConsumables(fighter.robot)) {
    if (!fighter.consumablesUsed.includes(consumable.name)) {
      return { actionType: "consumable", weapons: [], consumable };
    }
  }

  // Then attack
  const selectedWeapons = aiSelectWeapons(fighter);
  if (selectedWeapons.length > 0) {
    return { actionType: "attack", weapons: selectedWeapons, consumable: null };
  }

  // Default: rest
  return { actionType: "rest", weapons: [], consumable: null };
}
