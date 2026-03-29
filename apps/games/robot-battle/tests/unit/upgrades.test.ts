import { describe, it, expect } from "vitest";
import type { Robot } from "../../src/engine/types";
import { canBuyUpgrade, buyUpgrade, listUpgrades, applyAllUpgrades } from "../../src/engine/upgrades";

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
    upgrades: [],
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
});
