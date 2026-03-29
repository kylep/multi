/** Enemy AI logic. */

import type { BattleRobot, BattleState, Consumable, PlannedAction, Weapon } from "./types";
import { getConsumables, getEffectiveHands, getEffectiveMaxHealth, getWeaponEnergyCost, getWeapons, hasItem } from "./robot";

export function aiSelectWeapons(fighter: BattleRobot): Weapon[] {
  const weapons = getWeapons(fighter.robot);
  if (weapons.length === 0 || fighter.currentEnergy <= 0) return [];

  let availableHands = getEffectiveHands(fighter.robot);
  let availableEnergy = fighter.currentEnergy;

  const usable = weapons.filter(
    (w) =>
      getWeaponEnergyCost(w, fighter.robot) <= availableEnergy &&
      w.requirements.every((req) => hasItem(fighter.robot, req)),
  );

  // Sort by damage-per-hand ratio descending
  const sorted = [...usable].sort((a, b) => b.damage / b.hands - a.damage / a.hands);

  const selected: Weapon[] = [];
  const usedIds = new Set<Weapon>();

  for (const weapon of sorted) {
    if (usedIds.has(weapon)) continue;
    const eCost = getWeaponEnergyCost(weapon, fighter.robot);
    if (weapon.hands <= availableHands && eCost <= availableEnergy) {
      selected.push(weapon);
      usedIds.add(weapon);
      availableHands -= weapon.hands;
      availableEnergy -= eCost;
    }
  }

  return selected;
}

function shouldUseConsumable(fighter: BattleRobot, consumable: Consumable): boolean {
  // Healing items: wait until damaged enough to get full (or near-full) value
  if (consumable.healthRestore > 0) {
    const maxHp = getEffectiveMaxHealth(fighter.robot);
    const missing = maxHp - fighter.currentHealth;
    return missing >= consumable.healthRestore * 0.75;
  }
  // Non-healing consumables (grenades, shields, etc.): use immediately
  return true;
}

export function aiPlanAction(battle: BattleState, isPlayer: boolean): PlannedAction {
  const fighter = isPlayer ? battle.player : battle.enemy;

  // Use consumables (enemies only — auto-battle shouldn't waste player items)
  if (!isPlayer) {
    for (const consumable of getConsumables(fighter.robot)) {
      if (!fighter.consumablesUsed.includes(consumable.name)) {
        if (shouldUseConsumable(fighter, consumable)) {
          return { actionType: "consumable", weapons: [], consumable };
        }
      }
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
