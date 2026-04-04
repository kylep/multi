import { describe, it, expect } from "vitest";
import type { Robot } from "../../src/engine/types";
import {
  canBuyUpgrade,
  buyUpgrade,
  listUpgrades,
  applyAllUpgrades,
  allNormalUpgradesPurchased,
  listRepeatableUpgrades,
  getRepeatableUpgradeCost,
  canBuyRepeatableUpgrade,
  buyRepeatableUpgrade,
} from "../../src/engine/upgrades";

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

describe("canBuyUpgrade", () => {
  const inv5 = listUpgrades().find((u) => u.id === "inventory-5")!;
  const inv6 = listUpgrades().find((u) => u.id === "inventory-6")!;

  it("allows purchase when affordable", () => {
    const player = makeRobot({ money: 10000 });
    expect(canBuyUpgrade(player, inv5).ok).toBe(true);
  });

  it("rejects when not enough money", () => {
    const player = makeRobot({ money: 100 });
    const result = canBuyUpgrade(player, inv5);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Not enough money");
  });

  it("rejects when already owned", () => {
    const player = makeRobot({ money: 10000, upgrades: ["inventory-5"] });
    const result = canBuyUpgrade(player, inv5);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Already owned");
  });

  it("rejects inventory-6 without inventory-5", () => {
    const player = makeRobot({ money: 50000 });
    const result = canBuyUpgrade(player, inv6);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Requires Inventory 5");
  });

  it("allows inventory-6 with inventory-5 purchased", () => {
    const player = makeRobot({ money: 50000, upgrades: ["inventory-5"] });
    expect(canBuyUpgrade(player, inv6).ok).toBe(true);
  });
});

describe("buyUpgrade", () => {
  const inv5 = listUpgrades().find((u) => u.id === "inventory-5")!;
  const armorPlating = listUpgrades().find((u) => u.id === "armor-plating")!;

  it("deducts money and adds upgrade", () => {
    const player = makeRobot({ money: 10000 });
    buyUpgrade(player, inv5);
    expect(player.money).toBe(5000);
    expect(player.upgrades).toContain("inventory-5");
  });

  it("increases inventory size", () => {
    const player = makeRobot({ money: 10000 });
    buyUpgrade(player, inv5);
    expect(player.inventorySize).toBe(5);
  });

  it("armor plating adds defence", () => {
    const player = makeRobot({ money: 10000 });
    buyUpgrade(player, armorPlating);
    expect(player.money).toBe(5000);
    expect(player.defence).toBe(3);
    expect(player.upgrades).toContain("armor-plating");
  });
});

describe("applyAllUpgrades", () => {
  it("re-applies inventory size from purchased upgrades", () => {
    const player = makeRobot({ upgrades: ["inventory-5", "inventory-6"], inventorySize: 4 });
    applyAllUpgrades(player);
    expect(player.inventorySize).toBe(6);
  });

  it("re-applies repeatable upgrades on load", () => {
    const player = makeRobot({ repeatableUpgrades: { "rep-hp": 3, "rep-defence": 2 } });
    applyAllUpgrades(player);
    expect(player.maxHealth).toBe(10 + 15); // 3 * 5
    expect(player.defence).toBe(0 + 2); // 2 * 1
  });
});

describe("arm upgrades", () => {
  const thirdArm = listUpgrades().find((u) => u.id === "third-arm")!;
  const fourthArm = listUpgrades().find((u) => u.id === "fourth-arm")!;

  it("third arm gives +1 hand", () => {
    const player = makeRobot({ money: 1000 });
    buyUpgrade(player, thirdArm);
    expect(player.hands).toBe(3);
  });

  it("fourth arm requires third arm", () => {
    const player = makeRobot({ money: 1000 });
    expect(canBuyUpgrade(player, fourthArm).ok).toBe(false);
  });

  it("fourth arm works with third arm", () => {
    const player = makeRobot({ money: 1000, upgrades: ["third-arm"], hands: 3 });
    buyUpgrade(player, fourthArm);
    expect(player.hands).toBe(4);
  });
});

describe("new stat upgrades", () => {
  const targeting = listUpgrades().find((u) => u.id === "targeting-system")!;
  const advTargeting = listUpgrades().find((u) => u.id === "advanced-targeting")!;
  const evasion = listUpgrades().find((u) => u.id === "evasion-boosters")!;
  const hpBoost = listUpgrades().find((u) => u.id === "hp-boost")!;

  it("targeting system gives +10 accuracy", () => {
    const player = makeRobot({ money: 5000 });
    buyUpgrade(player, targeting);
    expect(player.accuracy).toBe(10);
  });

  it("advanced targeting requires targeting system", () => {
    const player = makeRobot({ money: 10000 });
    expect(canBuyUpgrade(player, advTargeting).ok).toBe(false);
  });

  it("evasion boosters requires dodge circuits", () => {
    const player = makeRobot({ money: 10000 });
    expect(canBuyUpgrade(player, evasion).ok).toBe(false);
  });

  it("hp boost gives +20 max HP", () => {
    const player = makeRobot({ money: 10000 });
    buyUpgrade(player, hpBoost);
    expect(player.maxHealth).toBe(30);
  });
});

describe("repeatable upgrades", () => {
  it("allNormalUpgradesPurchased returns false when missing upgrades", () => {
    const player = makeRobot();
    expect(allNormalUpgradesPurchased(player)).toBe(false);
  });

  it("allNormalUpgradesPurchased returns true when all owned", () => {
    const allIds = listUpgrades().map((u) => u.id);
    const player = makeRobot({ upgrades: allIds });
    expect(allNormalUpgradesPurchased(player)).toBe(true);
  });

  it("cost increases linearly per level", () => {
    const repHp = listRepeatableUpgrades().find((r) => r.id === "rep-hp")!;
    expect(getRepeatableUpgradeCost(repHp, 0)).toBe(2000);
    expect(getRepeatableUpgradeCost(repHp, 1)).toBe(3000);
    expect(getRepeatableUpgradeCost(repHp, 10)).toBe(12000);
  });

  it("cannot buy repeatable without all normal upgrades (non-sandbox)", () => {
    const player = makeRobot({ money: 100000 });
    const repHp = listRepeatableUpgrades().find((r) => r.id === "rep-hp")!;
    expect(canBuyRepeatableUpgrade(player, repHp).ok).toBe(false);
  });

  it("can buy repeatable with all normal upgrades", () => {
    const allIds = listUpgrades().map((u) => u.id);
    const player = makeRobot({ money: 100000, upgrades: allIds });
    const repHp = listRepeatableUpgrades().find((r) => r.id === "rep-hp")!;
    expect(canBuyRepeatableUpgrade(player, repHp).ok).toBe(true);
  });

  it("buying repeatable increments level and applies effect", () => {
    const allIds = listUpgrades().map((u) => u.id);
    const player = makeRobot({ money: 100000, upgrades: allIds });
    applyAllUpgrades(player);
    const repHp = listRepeatableUpgrades().find((r) => r.id === "rep-hp")!;
    buyRepeatableUpgrade(player, repHp);
    expect(player.repeatableUpgrades["rep-hp"]).toBe(1);
    // HP boost sets maxHealth to max(10,30)=30, then rep-hp adds 5 = 35
    // But applyAllUpgrades was called first which sets maxHealth to 70 (hp-boost-2)
    // Then buyRepeatableUpgrade adds 5 = 75
    expect(player.maxHealth).toBe(75);
    expect(player.money).toBe(100000 - 2000);
  });
});
