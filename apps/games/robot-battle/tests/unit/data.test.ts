import { describe, expect, it } from "vitest";
import { hydrateStatusEffects, loadAssets, loadStatusEffect } from "../../src/engine/data";
import { createGameState, createPlayer } from "../../src/engine/state";
import type { Weapon } from "../../src/engine/types";

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
    expect(registry.enemies.size).toBe(19);
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
    expect(shell.maxStack).toBe(60);
    expect(shell.category).toBe("Ammo");
    const missile = registry.gear.get("Missile")!;
    expect(missile.stackable).toBe(true);
    expect(missile.maxStack).toBe(30);
    const amMissile = registry.gear.get("Antimatter Missile")!;
    expect(amMissile.stackable).toBe(true);
    expect(amMissile.maxStack).toBe(3);
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

  it("loads weapon status effects with chance overrides and defaults", () => {
    expect(registry.weapons.get("Flame Thrower")!.statusEffect).toEqual({ type: "burn", chance: 0.66 });
    expect(registry.weapons.get("Chainsaw")!.statusEffect).toEqual({ type: "corrode", chance: 0.2 });
    expect(registry.weapons.get("Nuke Launcher")!.statusEffect).toEqual({ type: "radiation", chance: 1 });
    expect(registry.weapons.get("Laser Gun")!.statusEffect).toEqual({ type: "dazzle", chance: 0.1 });
    expect(registry.weapons.get("Stick")!.statusEffect).toBeNull();
  });

  it("rejects an unknown status effect type at load", () => {
    expect(() => loadStatusEffect("Typo Blade", { statusEffect: { type: "brun" } }))
      .toThrow(/Typo Blade.*brun/);
    expect(loadStatusEffect("Chainsaw", { statusEffect: { type: "corrode" } }))
      .toEqual({ type: "corrode", chance: 0.2 });
    expect(loadStatusEffect("Stick", {})).toBeNull();
  });

  it("loads consumable status effects", () => {
    expect(registry.consumables.get("Plasma Grenade")!.statusEffect).toEqual({ type: "burn", chance: 0.2 });
    expect(registry.consumables.get("EMP Bomb")!.statusEffect).toEqual({ type: "shock", chance: 0.2 });
    expect(registry.consumables.get("Nuke")!.statusEffect).toEqual({ type: "radiation", chance: 1 });
    expect(registry.consumables.get("Repair Kit")!.statusEffect).toBeNull();
  });

  it("loads the Acid Grenade and Flashbang consumables", () => {
    const acid = registry.consumables.get("Acid Grenade")!;
    expect(acid.level).toBe(12);
    expect(acid.moneyCost).toBe(200);
    expect(acid.damage).toBe(20);
    expect(acid.maxStack).toBe(5);
    expect(acid.statusEffect).toEqual({ type: "corrode", chance: 1 });
    expect(acid.useText.length).toBeGreaterThan(0);

    const flash = registry.consumables.get("Flashbang")!;
    expect(flash.level).toBe(9);
    expect(flash.moneyCost).toBe(120);
    expect(flash.damage).toBe(5);
    expect(flash.maxStack).toBe(5);
    expect(flash.statusEffect).toEqual({ type: "dazzle", chance: 1 });
    expect(flash.useText.length).toBeGreaterThan(0);
  });

  it("loads the Troll Bomb consumable", () => {
    const bomb = registry.consumables.get("Troll Bomb")!;
    expect(bomb.level).toBe(0);
    expect(bomb.moneyCost).toBe(1_000_000);
    expect(bomb.damage).toBe(1_000_000);
    expect(bomb.maxStack).toBe(5);
    expect(bomb.alwaysHits).toBe(true);
    expect(bomb.statusEffect).toBeNull();
    expect(bomb.useText.length).toBeGreaterThan(0);
  });

  it("defaults alwaysHits to false on a normal consumable", () => {
    expect(registry.consumables.get("Grenade")!.alwaysHits).toBe(false);
  });

  it("hydrates statusEffect onto pre-0.14.0 saved items", () => {
    const player = createPlayer(createGameState(registry), "Old Save");

    // A save written before v0.14.0: whole item copies, no statusEffect field.
    const oldFlameThrower = { ...registry.weapons.get("Flame Thrower")! } as Partial<Weapon>;
    delete oldFlameThrower.statusEffect;
    const oldStick = { ...registry.weapons.get("Stick")! } as Partial<Weapon>;
    delete oldStick.statusEffect;
    const removedItem = { ...registry.weapons.get("Stick")!, name: "Banana Peel Launcher" };
    delete (removedItem as Partial<Weapon>).statusEffect;

    player.inventory.push(oldFlameThrower as Weapon, oldStick as Weapon, removedItem as Weapon);
    hydrateStatusEffects(player, registry);

    expect(oldFlameThrower.statusEffect).toEqual({ type: "burn", chance: 0.66 });
    expect(oldStick.statusEffect).toBeNull();
    expect(removedItem.statusEffect).toBeUndefined();
  });

  it("leaves an already-set statusEffect alone", () => {
    const player = createPlayer(createGameState(registry), "New Save");
    const nerfed = { ...registry.weapons.get("Flame Thrower")!, statusEffect: null };
    player.inventory.push(nerfed);
    hydrateStatusEffects(player, registry);
    expect(nerfed.statusEffect).toBeNull();
  });

  it("enemies with arm upgrades get correct hands", () => {
    const rustclaw = registry.createEnemyRobot("Rustclaw")!;
    expect(rustclaw.hands).toBe(3); // third-arm upgrade
    const nightmare = registry.createEnemyRobot("Nightmare")!;
    expect(nightmare.hands).toBe(6); // all arm upgrades
  });
});
