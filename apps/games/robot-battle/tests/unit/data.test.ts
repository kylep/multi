import { describe, expect, it } from "vitest";
import { loadAssets } from "../../src/engine/data";

describe("loadAssets", () => {
  const registry = loadAssets();

  it("loads weapons", () => {
    expect(registry.weapons.size).toBeGreaterThanOrEqual(7);
    const stick = registry.weapons.get("Stick")!;
    expect(stick.damage).toBe(1);
    expect(stick.accuracy).toBe(80);
    expect(stick.hands).toBe(1);
  });

  it("loads Wrench weapon", () => {
    const wrench = registry.weapons.get("Wrench")!;
    expect(wrench.damage).toBe(2);
    expect(wrench.accuracy).toBe(90);
    expect(wrench.energyCost).toBe(2);
    expect(wrench.moneyCost).toBe(75);
  });

  it("loads gear including Wooden Armor (not nested under Cardboard)", () => {
    expect(registry.gear.has("Cardboard Armor")).toBe(true);
    expect(registry.gear.has("Wooden Armor")).toBe(true);
    expect(registry.gear.get("Wooden Armor")!.healthBonus).toBe(25);
  });

  it("loads consumables", () => {
    expect(registry.consumables.has("Repair Kit")).toBe(true);
    expect(registry.consumables.get("Repair Kit")!.healthRestore).toBe(10);
  });

  it("loads enemies", () => {
    expect(registry.enemies.size).toBe(3);
    expect(registry.enemies.has("MiniBot")).toBe(true);
    expect(registry.enemies.has("Sparky")).toBe(true);
    expect(registry.enemies.has("Firebot")).toBe(true);
  });

  it("loads config defaults", () => {
    expect(registry.defaultRobotStats.health).toBe(10);
    expect(registry.defaultRobotStats.hands).toBe(2);
    expect(registry.startingMoney).toBe(100);
  });

  it("getItem finds items by name across types", () => {
    expect(registry.getItem("Stick")?.itemType).toBe("weapon");
    expect(registry.getItem("Propeller")?.itemType).toBe("gear");
    expect(registry.getItem("Grenade")?.itemType).toBe("consumable");
    expect(registry.getItem("Nonexistent")).toBeUndefined();
  });

  it("getItemsForLevel filters correctly", () => {
    const level0 = registry.getItemsForLevel(0);
    expect(level0.length).toBeGreaterThan(0);
    expect(level0.every((i) => i.level <= 0)).toBe(true);
    const level5 = registry.getItemsForLevel(5);
    expect(level5.length).toBeGreaterThan(level0.length);
  });

  it("createEnemyRobot populates inventory from enemy definition", () => {
    const minibot = registry.createEnemyRobot("MiniBot")!;
    expect(minibot.name).toBe("MiniBot");
    expect(minibot.inventory.length).toBe(2); // Stick + Cardboard Armor
    expect(minibot.inventory.some((i) => i.name === "Stick")).toBe(true);
    expect(minibot.inventory.some((i) => i.name === "Cardboard Armor")).toBe(true);
  });
});
