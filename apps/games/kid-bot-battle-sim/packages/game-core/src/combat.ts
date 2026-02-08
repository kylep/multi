import { BattleRobot, BattleWeapon, WeaponResult, RandomFn } from "./types.js";

const REST_ENERGY_RESTORE = 5;

export function calculateHitChance(accuracy: number, dodge: number): number {
  return (accuracy - dodge) / 100;
}

export function calculateDamage(baseDamage: number, attack: number, defence: number): number {
  const raw = baseDamage * (1 + attack / 100) - defence;
  return Math.max(0, Math.floor(raw));
}

export function resolveAttack(
  attacker: BattleRobot,
  defender: BattleRobot,
  weaponSlots: number[],
  random: RandomFn = Math.random
): { attacker: BattleRobot; defender: BattleRobot; results: WeaponResult[] } {
  let atk = { ...attacker };
  let def = { ...defender };
  const results: WeaponResult[] = [];

  for (const slot of weaponSlots) {
    const weapon = atk.weapons[slot];
    if (!weapon) continue;

    // Deduct energy
    atk = { ...atk, energy: atk.energy - weapon.energyCost };

    // Check for ammo requirements
    if (weapon.requirements) {
      const ammoIdx = atk.gear.indexOf(weapon.requirements[0]);
      if (ammoIdx === -1) {
        results.push({ weaponName: weapon.name, hit: false, damage: 0 });
        continue;
      }
      // Consume ammo
      const newGear = [...atk.gear];
      newGear.splice(ammoIdx, 1);
      atk = { ...atk, gear: newGear };
    }

    const hitChance = calculateHitChance(weapon.accuracy, def.dodge);
    const roll = random();

    if (roll < hitChance) {
      const damage = calculateDamage(weapon.damage, atk.attack, def.defence);
      def = { ...def, health: Math.max(0, def.health - damage) };
      results.push({ weaponName: weapon.name, hit: true, damage });
    } else {
      results.push({ weaponName: weapon.name, hit: false, damage: 0 });
    }
  }

  return { attacker: atk, defender: def, results };
}

export function resolveRest(robot: BattleRobot): { robot: BattleRobot; energyRestored: number } {
  const restored = Math.min(REST_ENERGY_RESTORE, robot.maxEnergy - robot.energy);
  return {
    robot: { ...robot, energy: robot.energy + restored },
    energyRestored: restored,
  };
}

export function resolveConsumable(
  user: BattleRobot,
  target: BattleRobot,
  consumableSlot: number
): { user: BattleRobot; target: BattleRobot; effectDescription: string } {
  const consumable = user.consumables[consumableSlot];
  if (!consumable) throw new Error("Invalid consumable slot");

  let updatedUser = { ...user };
  let updatedTarget = { ...target };
  let desc = "";

  if (consumable.effects.healthRestore) {
    const restored = consumable.effects.healthRestore;
    updatedUser = { ...updatedUser, health: updatedUser.health + restored };
    desc = `+${restored} health`;
  }
  if (consumable.effects.damage) {
    const dmg = consumable.effects.damage;
    updatedTarget = { ...updatedTarget, health: Math.max(0, updatedTarget.health - dmg) };
    desc = `${dmg} damage to ${updatedTarget.name}`;
  }
  if (consumable.effects.enemyDodgeReduction) {
    const reduction = consumable.effects.enemyDodgeReduction;
    updatedTarget = { ...updatedTarget, dodge: updatedTarget.dodge - reduction };
    desc = `-${reduction} dodge to ${updatedTarget.name}`;
  }

  // Remove consumed item
  const newConsumables = updatedUser.consumables.filter((_, i) => i !== consumableSlot);
  updatedUser = { ...updatedUser, consumables: newConsumables };

  return { user: updatedUser, target: updatedTarget, effectDescription: desc };
}

export function validateWeaponSelection(
  robot: BattleRobot,
  slots: number[]
): { valid: boolean; error?: string } {
  // Check for duplicates
  const unique = new Set(slots);
  if (unique.size !== slots.length) {
    return { valid: false, error: "Cannot use the same weapon twice" };
  }

  // Check slots exist
  for (const s of slots) {
    if (s < 0 || s >= robot.weapons.length) {
      return { valid: false, error: `Invalid weapon slot: ${s + 1}` };
    }
  }

  // Check hands
  let handsNeeded = 0;
  let energyNeeded = 0;
  for (const s of slots) {
    handsNeeded += robot.weapons[s].hands;
    energyNeeded += robot.weapons[s].energyCost;
  }

  if (handsNeeded > robot.hands) {
    return { valid: false, error: "Not enough hands for selected weapons" };
  }

  if (energyNeeded > robot.energy) {
    return { valid: false, error: "Not enough energy for selected weapons" };
  }

  return { valid: true };
}
