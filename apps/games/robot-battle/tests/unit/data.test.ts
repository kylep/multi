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

  it("loads armor gear tiers", () => {
    expect(registry.gear.has("Cardboard Armor")).toBe(true);
    expect(registry.gear.has("Tin Armor")).toBe(true);
    expect(registry.gear.has("Iron Armor")).toBe(true);
    expect(registry.gear.get("Tin Armor")!.healthBonus).toBe(10);
    expect(registry.gear.get("Tin Armor")!.defenceBonus).toBe(1);
  });

  it("loads consumables", () => {
    expect(registry.consumables.has("Repair Kit")).toBe(true);
    expect(registry.consumables.get("Repair Kit")!.healthRestore).toBe(10);
  });

  it("loads enemies", () => {
    expect(registry.enemies.size).toBe(18);
    expect(registry.enemies.has("MiniBot")).toBe(true);
    expect(registry.enemies.has("TITAN")).toBe(true);
    expect(registry.enemies.has("Apocalypse")).toBe(true);
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

  it("Sword energy cost is 2 (buffed from 4)", () => {
    const sword = registry.weapons.get("Sword")!;
    expect(sword.energyCost).toBe(2);
  });

  it("Death Ray damage is 75 (nerfed from 100)", () => {
    const deathRay = registry.weapons.get("Death Ray")!;
    expect(deathRay.damage).toBe(75);
  });

  it("no arm gear items exist (moved to upgrades)", () => {
    expect(registry.gear.has("Third Arm")).toBe(false);
    expect(registry.gear.has("Fourth Arm")).toBe(false);
    expect(registry.gear.has("Fifth Arm")).toBe(false);
    expect(registry.gear.has("Sixth Arm")).toBe(false);
  });

  it("ammo items have maxStack and are stackable", () => {
    const shell = registry.gear.get("Shotgun Shell")!;
    expect(shell.stackable).toBe(true);
    expect(shell.maxStack).toBe(20);
    expect(shell.category).toBe("Ammo");
    const missile = registry.gear.get("Missile")!;
    expect(missile.stackable).toBe(true);
    expect(missile.maxStack).toBe(10);
    const amMissile = registry.gear.get("Antimatter Missile")!;
    expect(amMissile.stackable).toBe(true);
    expect(amMissile.maxStack).toBe(1);
  });

  it("Missile Launcher requires Missile ammo", () => {
    const ml = registry.weapons.get("Missile Launcher")!;
    expect(ml.requirements).toContain("Missile");
    expect(ml.energyCost).toBe(5);
  });

  it("accuracy items exist", () => {
    expect(registry.gear.has("Targeting Scope")).toBe(true);
    expect(registry.gear.get("Targeting Scope")!.accuracyBonus).toBe(10);
    expect(registry.gear.has("Auto-Aim Module")).toBe(true);
    expect(registry.consumables.has("Targeting Lock")).toBe(true);
    expect(registry.consumables.get("Targeting Lock")!.accuracyBonus).toBe(30);
  });

  it("consumables have useText", () => {
    const grenade = registry.consumables.get("Grenade")!;
    expect(grenade.useText).toBeTruthy();
    expect(grenade.useText.length).toBeGreaterThan(0);
  });

  it("gear has category field", () => {
    const armor = registry.gear.get("Iron Armor")!;
    expect(armor.category).toBe("Armor");
    const battery = registry.gear.get("Small Battery")!;
    expect(battery.category).toBe("Battery");
  });

  it("enemies have appearance and backstory", () => {
    const minibot = registry.enemies.get("MiniBot")!;
    expect(minibot.appearance.length).toBeGreaterThan(0);
    expect(minibot.backstory.length).toBeGreaterThan(0);
  });

  it("enemies with arm upgrades get correct hands", () => {
    const rustclaw = registry.createEnemyRobot("Rustclaw")!;
    expect(rustclaw.hands).toBe(3); // third-arm upgrade
    const nightmare = registry.createEnemyRobot("Nightmare")!;
    expect(nightmare.hands).toBe(6); // all arm upgrades
  });
});
