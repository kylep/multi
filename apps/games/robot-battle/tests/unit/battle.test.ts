import { describe, expect, it } from "vitest";
import {
  calculateDamage,
  calculateHitChance,
  checkVictory,
  createBattle,
  endTurn,
  executeAttack,
  executeRest,
  planAttack,
  planRest,
  resolveTurn,
  useConsumable,
} from "../../src/engine/battle";
import { createBattleRobot } from "../../src/engine/robot";
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
    level: 1,
    exp: 0,
    money: 100,
    wins: 0,
    fights: 0,
    inventorySize: 4,
    inventory: [],
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
    enemyDodgeReduction: 0,
    ...overrides,
  };
}

describe("calculateHitChance", () => {
  it("returns 1.0 for 100 accuracy vs 0 dodge", () => {
    expect(calculateHitChance(100, 0)).toBe(1.0);
  });

  it("clamps to 0 when dodge exceeds accuracy", () => {
    expect(calculateHitChance(50, 150)).toBe(0);
  });

  it("handles partial chance", () => {
    expect(calculateHitChance(80, 20)).toBeCloseTo(0.6);
  });
});

describe("calculateDamage", () => {
  it("base damage minus defence", () => {
    const weapon = makeWeapon({ damage: 5 });
    const attacker = createBattleRobot(makeRobot());
    const defender = createBattleRobot(makeRobot({ defence: 2 }));
    expect(calculateDamage(weapon, attacker, defender)).toBe(3);
  });

  it("applies attack percent bonus", () => {
    const weapon = makeWeapon({ damage: 10 });
    const attacker = createBattleRobot(makeRobot({ attack: 50 }));
    const defender = createBattleRobot(makeRobot());
    // 10 * (1 + 50/100) = 15
    expect(calculateDamage(weapon, attacker, defender)).toBe(15);
  });

  it("floors to zero when defence exceeds damage", () => {
    const weapon = makeWeapon({ damage: 1 });
    const attacker = createBattleRobot(makeRobot());
    const defender = createBattleRobot(makeRobot({ defence: 100 }));
    expect(calculateDamage(weapon, attacker, defender)).toBe(0);
  });
});

describe("executeAttack", () => {
  it("deals damage with 100% accuracy weapon", () => {
    const weapon = makeWeapon({ damage: 3, accuracy: 100 });
    const player = makeRobot({ inventory: [weapon] });
    const enemy = makeRobot({ name: "Enemy" });
    const battle = createBattle(player, enemy);
    const rng = createRng(42);

    const result = executeAttack(battle, battle.player, battle.enemy, [weapon], rng);
    expect(result.success).toBe(true);
    expect(result.damageDealt).toBe(3);
    expect(battle.enemy.currentHealth).toBe(7);
  });

  it("fails with insufficient energy", () => {
    const weapon = makeWeapon({ energyCost: 100 });
    const player = makeRobot({ inventory: [weapon] });
    const enemy = makeRobot();
    const battle = createBattle(player, enemy);
    const rng = createRng(1);

    const result = executeAttack(battle, battle.player, battle.enemy, [weapon], rng);
    expect(result.success).toBe(false);
  });

  it("fails with insufficient hands", () => {
    const w1 = makeWeapon({ hands: 2 });
    const w2 = makeWeapon({ name: "Other", hands: 1 });
    const player = makeRobot({ inventory: [w1, w2] });
    const battle = createBattle(player, makeRobot());
    const rng = createRng(1);

    const result = executeAttack(battle, battle.player, battle.enemy, [w1, w2], rng);
    expect(result.success).toBe(false);
  });
});

describe("executeRest", () => {
  it("restores up to 5 energy", () => {
    const player = makeRobot();
    const battle = createBattle(player, makeRobot());
    battle.player.currentEnergy = 10;

    executeRest(battle, battle.player);
    expect(battle.player.currentEnergy).toBe(15);
  });

  it("does not exceed max energy", () => {
    const player = makeRobot();
    const battle = createBattle(player, makeRobot());
    battle.player.currentEnergy = 18;

    executeRest(battle, battle.player);
    expect(battle.player.currentEnergy).toBe(20);
  });
});

describe("useConsumable", () => {
  it("restores health", () => {
    const kit = makeConsumable({ healthRestore: 5 });
    const player = makeRobot({ inventory: [kit] });
    const battle = createBattle(player, makeRobot());
    battle.player.currentHealth = 5;

    const result = useConsumable(battle, battle.player, battle.enemy, kit);
    expect(result.success).toBe(true);
    expect(battle.player.currentHealth).toBe(10);
  });

  it("deals damage to enemy", () => {
    const grenade = makeConsumable({ name: "Grenade", damage: 5 });
    const player = makeRobot({ inventory: [grenade] });
    const battle = createBattle(player, makeRobot());

    useConsumable(battle, battle.player, battle.enemy, grenade);
    expect(battle.enemy.currentHealth).toBe(5);
  });

  it("cannot use same consumable twice", () => {
    const kit = makeConsumable();
    const player = makeRobot({ inventory: [kit] });
    const battle = createBattle(player, makeRobot());
    battle.player.consumablesUsed.push("Test Kit");

    const result = useConsumable(battle, battle.player, battle.enemy, kit);
    expect(result.success).toBe(false);
  });
});

describe("checkVictory", () => {
  it("returns player when enemy is dead", () => {
    const battle = createBattle(makeRobot(), makeRobot());
    battle.enemy.currentHealth = 0;
    expect(checkVictory(battle)).toBe("player");
    expect(battle.winner).toBe("player");
  });

  it("returns enemy when player is dead", () => {
    const battle = createBattle(makeRobot(), makeRobot());
    battle.player.currentHealth = 0;
    expect(checkVictory(battle)).toBe("enemy");
  });

  it("returns null when both alive", () => {
    const battle = createBattle(makeRobot(), makeRobot());
    expect(checkVictory(battle)).toBeNull();
  });
});

describe("endTurn", () => {
  it("increments turn number and clears log", () => {
    const battle = createBattle(makeRobot(), makeRobot());
    battle.currentTurnLog.push("test");

    endTurn(battle);
    expect(battle.turnNumber).toBe(2);
    expect(battle.lastTurnLog).toEqual(["test"]);
    expect(battle.currentTurnLog).toEqual([]);
  });
});

describe("planAttack + resolveTurn", () => {
  it("resolves a full turn with both actions", () => {
    const weapon = makeWeapon({ damage: 3, accuracy: 100 });
    const player = makeRobot({ inventory: [weapon] });
    const enemyWeapon = makeWeapon({ name: "Enemy Stick", damage: 2, accuracy: 100 });
    const enemy = makeRobot({ name: "Enemy", inventory: [enemyWeapon] });
    const battle = createBattle(player, enemy);

    planAttack(battle, [weapon], true);
    planAttack(battle, [enemyWeapon], false);

    const rng = createRng(42);
    const results = resolveTurn(battle, rng);
    expect(results.length).toBe(2);
    expect(results.every((r) => r.result.success)).toBe(true);
  });
});
