import { describe, expect, it } from "vitest";
import {
  deleteSlot,
  hasAnySlot,
  listSlots,
  loadSlot,
  migrateV1Save,
  saveSlot,
  DEFAULT_SETTINGS,
} from "../../src/engine/save";
import type { SaveStorage } from "../../src/engine/save";
import type { Robot } from "../../src/engine/types";

function createMockStorage(): SaveStorage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };
}

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

describe("saveSlot / loadSlot", () => {
  it("writes and reads a save in a given slot", () => {
    const storage = createMockStorage();
    const player = makeRobot({ name: "SlotBot" });
    saveSlot(storage, 1, player);
    const loaded = loadSlot(storage, 1);
    expect(loaded).not.toBeNull();
    expect(loaded!.player.name).toBe("SlotBot");
    expect(loaded!.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("returns null for empty slot", () => {
    const storage = createMockStorage();
    expect(loadSlot(storage, 2)).toBeNull();
  });

  it("preserves settings", () => {
    const storage = createMockStorage();
    saveSlot(storage, 1, makeRobot(), { soundEnabled: false });
    const loaded = loadSlot(storage, 1)!;
    expect(loaded.settings.soundEnabled).toBe(false);
  });

  it("preserves inventory items with correct types", () => {
    const storage = createMockStorage();
    const player = makeRobot({
      inventory: [
        { name: "Stick", itemType: "weapon", level: 0, moneyCost: 50, description: "", requirements: [], damage: 1, energyCost: 1, accuracy: 80, hands: 1 },
        { name: "Propeller", itemType: "gear", level: 1, moneyCost: 50, description: "", requirements: [], healthBonus: 0, energyBonus: 0, defenceBonus: 0, attackBonus: 0, handsBonus: 0, dodgeBonus: 10, moneyBonusPercent: 0, stackable: false },
      ],
    });
    saveSlot(storage, 1, player);
    const loaded = loadSlot(storage, 1)!;
    expect(loaded.player.inventory).toHaveLength(2);
    expect(loaded.player.inventory[0].itemType).toBe("weapon");
    expect(loaded.player.inventory[1].itemType).toBe("gear");
  });
});

describe("listSlots", () => {
  it("returns 3 slots", () => {
    const storage = createMockStorage();
    const slots = listSlots(storage);
    expect(slots).toHaveLength(3);
  });

  it("shows occupied and empty slots", () => {
    const storage = createMockStorage();
    saveSlot(storage, 1, makeRobot({ name: "Bot1" }));
    saveSlot(storage, 3, makeRobot({ name: "Bot3" }));
    const slots = listSlots(storage);
    expect(slots[0].player?.name).toBe("Bot1");
    expect(slots[1].player).toBeNull();
    expect(slots[2].player?.name).toBe("Bot3");
  });
});

describe("deleteSlot", () => {
  it("removes a save slot", () => {
    const storage = createMockStorage();
    saveSlot(storage, 2, makeRobot());
    deleteSlot(storage, 2);
    expect(loadSlot(storage, 2)).toBeNull();
  });

  it("no error when slot is empty", () => {
    const storage = createMockStorage();
    expect(() => deleteSlot(storage, 1)).not.toThrow();
  });
});

describe("hasAnySlot", () => {
  it("returns false when no saves", () => {
    const storage = createMockStorage();
    expect(hasAnySlot(storage)).toBe(false);
  });

  it("returns true when any slot occupied", () => {
    const storage = createMockStorage();
    saveSlot(storage, 2, makeRobot());
    expect(hasAnySlot(storage)).toBe(true);
  });
});

describe("migrateV1Save", () => {
  it("migrates legacy save to slot 1", () => {
    const storage = createMockStorage();
    const legacyData = { version: 1, player: makeRobot({ name: "LegacyBot" }) };
    storage.setItem("robot-battle-save", JSON.stringify(legacyData));
    migrateV1Save(storage);
    expect(storage.getItem("robot-battle-save")).toBeNull();
    const loaded = loadSlot(storage, 1);
    expect(loaded).not.toBeNull();
    expect(loaded!.player.name).toBe("LegacyBot");
  });

  it("does not overwrite existing slot 1", () => {
    const storage = createMockStorage();
    saveSlot(storage, 1, makeRobot({ name: "Existing" }));
    const legacyData = { version: 1, player: makeRobot({ name: "LegacyBot" }) };
    storage.setItem("robot-battle-save", JSON.stringify(legacyData));
    migrateV1Save(storage);
    expect(storage.getItem("robot-battle-save")).toBeNull();
    const loaded = loadSlot(storage, 1)!;
    expect(loaded.player.name).toBe("Existing");
  });

  it("no-op when no legacy save", () => {
    const storage = createMockStorage();
    expect(() => migrateV1Save(storage)).not.toThrow();
  });
});

describe("round-trip", () => {
  it("save then load returns identical Robot", () => {
    const storage = createMockStorage();
    const original = makeRobot({ name: "RoundTrip", level: 7, money: 999, wins: 42, fights: 50 });
    saveSlot(storage, 1, original);
    const loaded = loadSlot(storage, 1)!;
    expect(loaded.player).toEqual(original);
  });

  it("round-trips mixed inventory", () => {
    const storage = createMockStorage();
    const original = makeRobot({
      inventory: [
        { name: "Sword", itemType: "weapon", level: 2, moneyCost: 150, description: "", requirements: [], damage: 10, energyCost: 5, accuracy: 100, hands: 2 },
        { name: "Cardboard Armor", itemType: "gear", level: 0, moneyCost: 100, description: "", requirements: [], healthBonus: 5, energyBonus: 0, defenceBonus: 0, attackBonus: 0, handsBonus: 0, dodgeBonus: 0, moneyBonusPercent: 0, stackable: false },
        { name: "Grenade", itemType: "consumable", level: 8, moneyCost: 100, description: "", requirements: [], healthRestore: 0, energyRestore: 0, tempDefence: 0, tempAttack: 0, damage: 30, enemyDodgeReduction: 0 },
      ],
    });
    saveSlot(storage, 2, original);
    const loaded = loadSlot(storage, 2)!;
    expect(loaded.player.inventory).toEqual(original.inventory);
  });
});
