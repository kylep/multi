import { describe, it, expect } from "vitest";
import {
  calculateHitChance,
  calculateDamage,
  validateWeaponSelection,
  type BattleRobot,
} from "@kid-bot-battle-sim/game-core";

describe("calculateHitChance", () => {
  it("returns correct hit probability", () => {
    expect(calculateHitChance(80, 0)).toBe(0.8);
    expect(calculateHitChance(100, 20)).toBe(0.8);
    expect(calculateHitChance(150, 0)).toBe(1.5); // can exceed 1
  });
});

describe("calculateDamage", () => {
  it("applies the damage formula", () => {
    // base_damage * (1 + attack/100) - defence
    expect(calculateDamage(10, 0, 0)).toBe(10);
    expect(calculateDamage(10, 10, 0)).toBe(11); // 10 * 1.1 = 11
    expect(calculateDamage(10, 0, 3)).toBe(7); // 10 - 3
  });

  it("floors the result", () => {
    expect(calculateDamage(1, 10, 0)).toBe(1); // 1 * 1.1 = 1.1 -> 1
  });

  it("minimum damage is 0", () => {
    expect(calculateDamage(1, 0, 10)).toBe(0);
  });
});

describe("validateWeaponSelection", () => {
  const makeRobot = (overrides?: Partial<BattleRobot>): BattleRobot => ({
    name: "Test",
    health: 10,
    maxHealth: 10,
    energy: 20,
    maxEnergy: 20,
    defence: 0,
    attack: 0,
    hands: 2,
    dodge: 0,
    weapons: [
      { slotIndex: 0, name: "Stick", damage: 1, energyCost: 1, accuracy: 80, hands: 1 },
      { slotIndex: 1, name: "Sword", damage: 10, energyCost: 5, accuracy: 100, hands: 2 },
    ],
    gear: [],
    consumables: [],
    ...overrides,
  });

  it("validates a legal single weapon", () => {
    const result = validateWeaponSelection(makeRobot(), [0]);
    expect(result.valid).toBe(true);
  });

  it("rejects duplicate weapon slots", () => {
    const result = validateWeaponSelection(makeRobot(), [0, 0]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("same weapon twice");
  });

  it("rejects too many hands", () => {
    // Stick (1h) + Sword (2h) = 3 hands, robot has 2
    const result = validateWeaponSelection(makeRobot(), [0, 1]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("hands");
  });

  it("rejects when not enough energy", () => {
    const robot = makeRobot({ energy: 0 });
    const result = validateWeaponSelection(robot, [0]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("energy");
  });
});
