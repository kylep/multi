import { describe, expect, it } from "vitest";
import { createBattle } from "../../src/engine/battle";
import {
  battleAccuracyMultiplier,
  battleDefence,
  battleDodge,
  createBattleRobot,
} from "../../src/engine/robot";
import {
  cureStatuses,
  decrementStatuses,
  hasStatus,
  shouldFizzle,
  STATUS_RULES,
  tickStatuses,
  tryInflict,
} from "../../src/engine/status";
import type { StatusEffectSpec } from "../../src/engine/status";
import { createRng } from "../../src/engine/rng";
import type { Consumable, Robot, Weapon } from "../../src/engine/types";

function makeRobot(overrides?: Partial<Robot>): Robot {
  return {
    name: "TestBot",
    health: 10,
    maxHealth: 10,
    energy: 20,
    maxEnergy: 20,
    defence: 0,
    attack: 0,
    hands: 2,
    dodge: 0,
    accuracy: 0,
    level: 0,
    exp: 0,
    money: 100,
    bank: 0,
    wins: 0,
    fights: 0,
    inventorySize: 4,
    inventory: [],
    upgrades: [],
    repeatableUpgrades: {},
    settings: { mode: "oliver", oliverChallenge: false, autoDeposit: false, restockConsumables: false },
    defeatedEnemies: [],
    challengeDefeatedEnemies: [],
    cheatsUsed: false,
    godMode: false,
    trollMode: false,
    newGamePlusLevel: 0,
    titanDefeated: false,
    endGameBoss: null,
    ...overrides,
  };
}

function makeWeapon(overrides?: Partial<Weapon>): Weapon {
  return {
    name: "Test Stick",
    itemType: "weapon",
    level: 0,
    moneyCost: 50,
    description: "test",
    requirements: [],
    damage: 1,
    energyCost: 1,
    accuracy: 100,
    hands: 1,
    statusEffect: null,
    ...overrides,
  };
}

function makeConsumable(overrides?: Partial<Consumable>): Consumable {
  return {
    name: "Test Kit",
    itemType: "consumable",
    level: 0,
    moneyCost: 10,
    description: "test",
    requirements: [],
    healthRestore: 0,
    energyRestore: 0,
    tempDefence: 0,
    tempAttack: 0,
    damage: 0,
    damageBlock: 0,
    enemyDodgeReduction: 0,
    useText: "",
    accuracyBonus: 0,
    maxStack: 0,
    alwaysHits: false,
    statusEffect: null,
    ...overrides,
  };
}

function effect(type: StatusEffectSpec["type"], chance = 0.2): StatusEffectSpec {
  return { type, chance };
}

describe("STATUS_RULES", () => {
  it("covers every status type with a badge and colour", () => {
    for (const type of ["burn", "shock", "corrode", "radiation", "dazzle"] as const) {
      const rule = STATUS_RULES[type];
      expect(rule.icon.length).toBeGreaterThan(0);
      expect(rule.label).toBe(type.toUpperCase());
      expect(rule.colour).toMatch(/^t-/);
    }
  });

  it("uses the spec durations and damage fractions", () => {
    expect(STATUS_RULES.burn.damageFraction).toBe(0.15);
    expect(STATUS_RULES.radiation.damageFraction).toBe(0.1);
    expect(STATUS_RULES.burn.duration).toBe(3);
    expect(STATUS_RULES.shock.duration).toBe(2);
    expect(STATUS_RULES.corrode.duration).toBe(3);
    expect(STATUS_RULES.radiation.duration).toBe(Infinity);
    expect(STATUS_RULES.dazzle.duration).toBe(3);
  });
});

describe("tryInflict", () => {
  it("respects the inflict chance", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    // Seed 7's first roll is ~0.0117, below the 20% default chance.
    expect(tryInflict(battle, battle.enemy, makeWeapon({ statusEffect: effect("burn") }), createRng(7))).toBe(true);
    expect(hasStatus(battle.enemy, "burn")).toBe(true);
  });

  it("fails when the roll is above the chance", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    // Seed 1's first roll is ~0.6271, above the 20% default chance.
    expect(tryInflict(battle, battle.enemy, makeWeapon({ statusEffect: effect("burn") }), createRng(1))).toBe(false);
    expect(hasStatus(battle.enemy, "burn")).toBe(false);
  });

  it("uses the item's chance override", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    // Same 0.6271 roll now lands because Flame Thrower's chance is 66%.
    const flamer = makeWeapon({ name: "Flame Thrower", statusEffect: effect("burn", 0.66) });
    expect(tryInflict(battle, battle.enemy, flamer, createRng(1))).toBe(true);
  });

  it("does nothing for a source with no status effect", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    expect(tryInflict(battle, battle.enemy, makeWeapon(), createRng(7))).toBe(false);
    expect(battle.enemy.statuses).toHaveLength(0);
  });

  it("god mode robots are immune", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy", godMode: true }));
    const weapon = makeWeapon({ statusEffect: effect("burn", 1) });
    expect(tryInflict(battle, battle.enemy, weapon, createRng(7))).toBe(false);
    expect(battle.enemy.statuses).toHaveLength(0);
  });

  it("logs the infliction into the current turn log", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    tryInflict(battle, battle.enemy, makeWeapon({ statusEffect: effect("burn", 1) }), createRng(7));
    expect(battle.currentTurnLog).toContain("Enemy is BURNED!");
  });

  it("refreshes rather than stacks", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    const weapon = makeWeapon({ damage: 10, statusEffect: effect("burn", 1) });
    tryInflict(battle, battle.enemy, weapon, createRng(7));
    battle.enemy.statuses[0].turnsLeft = 1;
    tryInflict(battle, battle.enemy, weapon, createRng(7));
    expect(battle.enemy.statuses).toHaveLength(1);
    expect(battle.enemy.statuses[0].turnsLeft).toBe(3);
  });

  it("keeps the higher potency on refresh", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    const strong = makeWeapon({ name: "Big", damage: 100, statusEffect: effect("burn", 1) });
    const weak = makeWeapon({ name: "Small", damage: 20, statusEffect: effect("burn", 1) });
    tryInflict(battle, battle.enemy, strong, createRng(7));
    expect(battle.enemy.statuses[0].potency).toBe(15);
    tryInflict(battle, battle.enemy, weak, createRng(7));
    expect(battle.enemy.statuses[0].potency).toBe(15);
  });

  it("raises potency when the new source is stronger", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    const weak = makeWeapon({ name: "Small", damage: 20, statusEffect: effect("burn", 1) });
    const strong = makeWeapon({ name: "Big", damage: 100, statusEffect: effect("burn", 1) });
    tryInflict(battle, battle.enemy, weak, createRng(7));
    expect(battle.enemy.statuses[0].potency).toBe(3);
    tryInflict(battle, battle.enemy, strong, createRng(7));
    expect(battle.enemy.statuses[0].potency).toBe(15);
  });

  it("re-applying radiation ramps potency without restarting the tick count", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    const small = makeConsumable({ name: "Nuke", damage: 100, statusEffect: effect("radiation", 1) });
    const big = makeWeapon({ name: "Nuke Launcher", damage: 300, statusEffect: effect("radiation", 1) });

    tryInflict(battle, battle.enemy, small, createRng(7));
    battle.enemy.currentHealth = 1000;
    tickStatuses(battle, battle.enemy);
    tickStatuses(battle, battle.enemy);
    expect(battle.enemy.statuses[0].ticks).toBe(2);

    // A second, stronger nuke ramps the damage but does not reset the counter:
    // repeat nukes escalate, they do not start the ramp over.
    tryInflict(battle, battle.enemy, big, createRng(7));
    expect(battle.enemy.statuses).toHaveLength(1);
    expect(battle.enemy.statuses[0].ticks).toBe(2);
    expect(battle.enemy.statuses[0].potency).toBe(30);

    const before = battle.enemy.currentHealth;
    tickStatuses(battle, battle.enemy);
    expect(battle.enemy.currentHealth).toBe(before - 90); // 30 potency x 3 ticks
  });
});

describe("tickStatuses", () => {
  it("burn deals floor(15% of source damage) and ignores defence", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy", defence: 100 }));
    const weapon = makeWeapon({ damage: 20, statusEffect: effect("burn", 1) });
    tryInflict(battle, battle.enemy, weapon, createRng(7));

    const before = battle.enemy.currentHealth;
    tickStatuses(battle, battle.enemy);
    expect(battle.enemy.currentHealth).toBe(before - 3);
    expect(battle.currentTurnLog).toContain("Enemy takes 3 burn damage");
  });

  it("burn can kill", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    const weapon = makeWeapon({ damage: 20, statusEffect: effect("burn", 1) });
    tryInflict(battle, battle.enemy, weapon, createRng(7));
    battle.enemy.currentHealth = 3;

    tickStatuses(battle, battle.enemy);
    expect(battle.enemy.currentHealth).toBeLessThanOrEqual(0);
  });

  it("does not tick god mode robots", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    tryInflict(battle, battle.enemy, makeWeapon({ damage: 20, statusEffect: effect("burn", 1) }), createRng(7));
    battle.enemy.robot.godMode = true;

    const before = battle.enemy.currentHealth;
    tickStatuses(battle, battle.enemy);
    expect(battle.enemy.currentHealth).toBe(before);
  });

  it("radiation escalates 10%, 20%, 30% of source damage", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    const nuke = makeConsumable({ name: "Nuke", damage: 100, statusEffect: effect("radiation", 1) });
    tryInflict(battle, battle.enemy, nuke, createRng(7));
    battle.enemy.currentHealth = 1000;

    tickStatuses(battle, battle.enemy);
    expect(battle.enemy.currentHealth).toBe(990);
    tickStatuses(battle, battle.enemy);
    expect(battle.enemy.currentHealth).toBe(970);
    tickStatuses(battle, battle.enemy);
    expect(battle.enemy.currentHealth).toBe(940);
  });

  it("non-damaging effects deal no tick damage", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    tryInflict(battle, battle.enemy, makeWeapon({ damage: 40, statusEffect: effect("shock", 1) }), createRng(7));

    const before = battle.enemy.currentHealth;
    tickStatuses(battle, battle.enemy);
    expect(battle.enemy.currentHealth).toBe(before);
  });
});

describe("decrementStatuses", () => {
  it("expires at zero and logs", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    tryInflict(battle, battle.enemy, makeWeapon({ statusEffect: effect("burn", 1) }), createRng(7));

    decrementStatuses(battle, battle.enemy);
    expect(battle.enemy.statuses[0].turnsLeft).toBe(2);
    decrementStatuses(battle, battle.enemy);
    decrementStatuses(battle, battle.enemy);
    expect(hasStatus(battle.enemy, "burn")).toBe(false);
    expect(battle.currentTurnLog).toContain("Enemy is no longer burned");
  });

  it("radiation never expires", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    tryInflict(battle, battle.enemy, makeWeapon({ damage: 50, statusEffect: effect("radiation", 1) }), createRng(7));

    for (let i = 0; i < 20; i++) decrementStatuses(battle, battle.enemy);
    expect(hasStatus(battle.enemy, "radiation")).toBe(true);
    expect(battle.enemy.statuses[0].turnsLeft).toBe(Infinity);
  });
});

describe("stat modifiers", () => {
  it("corrode reduces battleDefence by 25%", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy", defence: 8 }));
    expect(battleDefence(battle.enemy)).toBe(8);

    tryInflict(battle, battle.enemy, makeWeapon({ statusEffect: effect("corrode", 1) }), createRng(7));
    expect(battleDefence(battle.enemy)).toBe(6);
  });

  it("dazzle halves battleDodge and multiplies accuracy by 0.8", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy", dodge: 11 }));
    expect(battleDodge(battle.enemy)).toBe(11);
    expect(battleAccuracyMultiplier(battle.enemy)).toBe(1);

    tryInflict(battle, battle.enemy, makeWeapon({ statusEffect: effect("dazzle", 1) }), createRng(7));
    expect(battleDodge(battle.enemy)).toBe(5);
    expect(battleAccuracyMultiplier(battle.enemy)).toBe(0.8);
  });
});

describe("shouldFizzle", () => {
  it("is false without shock", () => {
    const br = createBattleRobot(makeRobot());
    expect(shouldFizzle(br, createRng(7))).toBe(false);
  });

  it("fizzles when the roll lands under 25%", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    tryInflict(battle, battle.enemy, makeWeapon({ statusEffect: effect("shock", 1) }), createRng(7));
    // Seed 7's first roll is ~0.0117, under the 25% fizzle chance.
    expect(shouldFizzle(battle.enemy, createRng(7))).toBe(true);
    // Seed 1's first roll is ~0.6271, over it.
    expect(shouldFizzle(battle.enemy, createRng(1))).toBe(false);
  });
});

describe("cureStatuses", () => {
  it("clears every effect and returns the cured list", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    tryInflict(battle, battle.enemy, makeWeapon({ damage: 8, statusEffect: effect("burn", 1) }), createRng(7));
    tryInflict(battle, battle.enemy, makeWeapon({ statusEffect: effect("shock", 1) }), createRng(7));

    const cured = cureStatuses(battle, battle.enemy, "Repair Kit");
    expect(cured).toEqual(["burn", "shock"]);
    expect(battle.enemy.statuses).toHaveLength(0);
    expect(battle.currentTurnLog).toContain("Repair Kit cured BURN, SHOCK");
  });

  it("logs nothing when there is nothing to cure", () => {
    const battle = createBattle(makeRobot(), makeRobot({ name: "Enemy" }));
    const before = battle.currentTurnLog.length;
    expect(cureStatuses(battle, battle.enemy, "Repair Kit")).toEqual([]);
    expect(battle.currentTurnLog).toHaveLength(before);
  });
});
