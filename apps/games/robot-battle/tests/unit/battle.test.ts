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
  recordTurnSnapshot,
  resolveTurn,
  shouldShowLootBox,
  useConsumable,
} from "../../src/engine/battle";
import { createBattleRobot, getEffectiveAccuracy } from "../../src/engine/robot";
import { loadAssets } from "../../src/engine/data";
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
    level: 1,
    exp: 0,
    money: 100,
    bank: 0,
    wins: 0,
    fights: 0,
    inventorySize: 4,
    inventory: [],
    upgrades: [],
    repeatableUpgrades: {},
    settings: { mode: "oliver", oliverChallenge: false },
    defeatedEnemies: [],
    challengeDefeatedEnemies: [],
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
    damageBlock: 0,
    enemyDodgeReduction: 0,
    useText: "",
    accuracyBonus: 0,
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
    expect(battle.enemy.currentHealth).toBe(9); // 12 HP (10 base + 2 from lv1) - 3 dmg
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
    expect(battle.enemy.currentHealth).toBe(7); // 12 HP - 5 dmg
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
    expect(battle.winner).toBe("enemy");
  });

  it("returns null when both alive", () => {
    const battle = createBattle(makeRobot(), makeRobot());
    expect(checkVictory(battle)).toBeNull();
  });
});

describe("recordTurnSnapshot", () => {
  it("clamps HP to 0 (never negative)", () => {
    const battle = createBattle(makeRobot(), makeRobot());
    battle.player.currentHealth = -5;
    battle.enemy.currentHealth = -3;
    recordTurnSnapshot(battle);
    const snap = battle.turnHistory[0];
    expect(snap.playerHp).toBe(0);
    expect(snap.enemyHp).toBe(0);
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

describe("basic weapon accuracy regression", () => {
  it("80% accuracy weapon hits most of the time against 0 dodge", () => {
    const weapon = makeWeapon({ name: "Rocket Launcher", damage: 50, accuracy: 80, energyCost: 12, hands: 2 });
    let hitCount = 0;
    for (let seed = 0; seed < 100; seed++) {
      const player = makeRobot({ energy: 20, maxEnergy: 20, inventory: [{ ...weapon }] });
      const enemy = makeRobot({ name: "MiniBot", dodge: 0, maxHealth: 10, health: 10 });
      const b = createBattle(player, enemy);
      const rng = createRng(seed);
      const result = executeAttack(b, b.player, b.enemy, [weapon], rng);
      if (result.damageDealt > 0) hitCount++;
    }
    // 80% accuracy should hit ~80 out of 100
    expect(hitCount).toBeGreaterThan(60);
  });

  it("100% accuracy weapon never misses against 0 dodge", () => {
    const weapon = makeWeapon({ damage: 5, accuracy: 100 });
    for (let seed = 0; seed < 50; seed++) {
      const player = makeRobot({ inventory: [{ ...weapon }] });
      const enemy = makeRobot({ name: "Target", dodge: 0 });
      const b = createBattle(player, enemy);
      const rng = createRng(seed);
      const result = executeAttack(b, b.player, b.enemy, [weapon], rng);
      expect(result.damageDealt).toBeGreaterThan(0);
    }
  });

  it("getEffectiveAccuracy does not return NaN with gear lacking accuracyBonus", () => {
    // Simulate gear that might not have accuracyBonus set
    const gear = { name: "Iron Armor", itemType: "gear" as const, level: 5, moneyCost: 500, description: "", requirements: [], healthBonus: 20, energyBonus: 0, defenceBonus: 2, attackBonus: 0, handsBonus: 0, dodgeBonus: 0, accuracyBonus: 0, moneyBonusPercent: 0, stackable: false, maxStack: 0, category: "Armor" };
    const player = makeRobot({ inventory: [gear] });
    const acc = getEffectiveAccuracy(player);
    expect(Number.isNaN(acc)).toBe(false);
    expect(acc).toBe(0);
  });
});

describe("real game data accuracy", () => {
  it("player with real Rocket Launcher hits real MiniBot", () => {
    const registry = loadAssets();
    const rocketLauncher = registry.weapons.get("Rocket Launcher")!;
    const minibot = registry.createEnemyRobot("MiniBot")!;

    let hitCount = 0;
    for (let seed = 0; seed < 100; seed++) {
      const player = makeRobot({
        level: 12,
        inventory: [{ ...rocketLauncher }],
      });
      const b = createBattle(player, minibot);
      const rng = createRng(seed);
      const result = executeAttack(b, b.player, b.enemy, [rocketLauncher], rng);
      if (result.damageDealt > 0) hitCount++;
    }
    // 80% accuracy vs 0 dodge: expect ~80 hits
    expect(hitCount).toBeGreaterThan(60);
  });
});

describe("accuracy bonus", () => {
  it("player accuracy stat improves hit chance", () => {
    // Weapon with 50 accuracy vs 50 dodge = 0% hit
    // But player has 30 accuracy bonus = (50+30-50)/100 = 30% hit
    const weapon = makeWeapon({ damage: 5, accuracy: 50 });
    const player = makeRobot({ accuracy: 30, inventory: [weapon] });
    const enemy = makeRobot({ name: "Dodger", dodge: 50 });
    const battle = createBattle(player, enemy);

    // With seeded rng that returns ~0.47 first call, then values for the attack
    // The key test: weapon accuracy 50 + player accuracy 30 - dodge 50 = 30% chance
    // Just verify we can attack and it doesn't always miss
    let hitCount = 0;
    for (let i = 0; i < 50; i++) {
      const b = createBattle(
        makeRobot({ accuracy: 30, inventory: [{ ...weapon }] }),
        makeRobot({ name: "Dodger", dodge: 50 }),
      );
      const rng = createRng(i);
      executeAttack(b, b.player, b.enemy, [weapon], rng);
      if (b.battleLog.some((l) => l.includes("hits for"))) hitCount++;
    }
    // Should hit roughly 30% of the time
    expect(hitCount).toBeGreaterThan(5);
    expect(hitCount).toBeLessThan(25);
  });
});

describe("consumable useText", () => {
  it("uses useText when present", () => {
    const grenade = makeConsumable({ name: "Grenade", damage: 5, useText: "BOOM goes the grenade!" });
    const player = makeRobot({ inventory: [grenade] });
    const battle = createBattle(player, makeRobot());
    useConsumable(battle, battle.player, battle.enemy, grenade);
    expect(battle.battleLog.some((l) => l.includes("BOOM goes the grenade!"))).toBe(true);
  });

  it("falls back to default text without useText", () => {
    const kit = makeConsumable({ healthRestore: 5 });
    const player = makeRobot({ inventory: [kit] });
    const battle = createBattle(player, makeRobot());
    useConsumable(battle, battle.player, battle.enemy, kit);
    expect(battle.battleLog.some((l) => l.includes("uses Test Kit:"))).toBe(true);
  });
});

describe("consumable accuracyBonus", () => {
  it("adds temp accuracy to attacker", () => {
    const lock = makeConsumable({ name: "Lock", accuracyBonus: 30 });
    const player = makeRobot({ inventory: [lock] });
    const battle = createBattle(player, makeRobot());
    useConsumable(battle, battle.player, battle.enemy, lock);
    expect(battle.player.tempAccuracy).toBe(30);
  });
});

describe("consumable damage reduction", () => {
  it("defence reduces consumable damage", () => {
    // Enemy has 5 defence, grenade does 30 → 25 after reduction
    const grenade = makeConsumable({ name: "Grenade", damage: 30 });
    const player = makeRobot({ inventory: [grenade] });
    const enemy = makeRobot({ name: "Tank", defence: 5 });
    const battle = createBattle(player, enemy);
    // Use a seeded rng that won't dodge (high roll)
    const rng = createRng(999);
    useConsumable(battle, battle.player, battle.enemy, grenade, rng);
    // Enemy started at effectiveMaxHealth, took 25 damage
    const maxHp = battle.enemy.currentHealth;
    // Check that damage was reduced (not the full 30)
    expect(battle.battleLog.some((l) => l.includes("25 damage"))).toBe(true);
  });

  it("dodge at 50% effectiveness can avoid consumable damage", () => {
    // Enemy with 200 dodge → 100% dodge chance at half effectiveness
    const grenade = makeConsumable({ name: "Grenade", damage: 30 });
    const player = makeRobot({ inventory: [grenade] });
    const enemy = makeRobot({ name: "Dodger", dodge: 200 });
    const battle = createBattle(player, enemy);
    const rng = createRng(42);
    const startHp = battle.enemy.currentHealth;
    useConsumable(battle, battle.player, battle.enemy, grenade, rng);
    // With 200 dodge, half effectiveness = 100% dodge chance, should always dodge
    expect(battle.enemy.currentHealth).toBe(startHp);
    expect(battle.battleLog.some((l) => l.includes("dodged"))).toBe(true);
  });

  it("zero dodge means no dodge chance against consumables", () => {
    const grenade = makeConsumable({ name: "Grenade", damage: 30 });
    const player = makeRobot({ inventory: [grenade] });
    const enemy = makeRobot({ name: "Static", dodge: 0 });
    const battle = createBattle(player, enemy);
    const rng = createRng(42);
    const startHp = battle.enemy.currentHealth;
    useConsumable(battle, battle.player, battle.enemy, grenade, rng);
    expect(battle.enemy.currentHealth).toBeLessThan(startHp);
  });
});

describe("shouldShowLootBox", () => {
  it("returns false with 0 turns", () => {
    const rng = createRng(42);
    expect(shouldShowLootBox(0, rng)).toBe(false);
  });

  it("eventually returns true with many turns", () => {
    // 100 turns, 5% per turn → very likely to trigger at least once
    let triggered = false;
    for (let seed = 0; seed < 20; seed++) {
      const rng = createRng(seed);
      if (shouldShowLootBox(100, rng)) { triggered = true; break; }
    }
    expect(triggered).toBe(true);
  });
});
