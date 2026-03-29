import { describe, expect, it } from "vitest";
import { deleteSave, hasSave, loadGame, SAVE_KEY, saveGame } from "../../src/engine/save";
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
    upgrades: [],
    settings: { mode: "oliver" as const, oliverChallenge: false },
    defeatedEnemies: [],
    challengeDefeatedEnemies: [],
    ...overrides,
  };
}

describe("saveGame", () => {
  it("writes JSON to storage under the save key", () => {
    const storage = createMockStorage();
    const player = makeRobot();
    saveGame(storage, player);
    const raw = storage.getItem(SAVE_KEY);
    expect(raw).not.toBeNull();
    const data = JSON.parse(raw!);
    expect(data.version).toBe(1);
    expect(data.player.name).toBe("TestBot");
  });

  it("preserves inventory items with correct types", () => {
    const storage = createMockStorage();
    const player = makeRobot({
      inventory: [
        { name: "Stick", itemType: "weapon", level: 0, moneyCost: 50, description: "", requirements: [], damage: 1, energyCost: 1, accuracy: 80, hands: 1 },
        { name: "Propeller", itemType: "gear", level: 1, moneyCost: 50, description: "", requirements: [], healthBonus: 0, energyBonus: 0, defenceBonus: 0, attackBonus: 0, handsBonus: 0, dodgeBonus: 10, moneyBonusPercent: 0 },
        { name: "Repair Kit", itemType: "consumable", level: 2, moneyCost: 30, description: "", requirements: [], healthRestore: 10, energyRestore: 0, tempDefence: 0, tempAttack: 0, damage: 0, enemyDodgeReduction: 0 },
      ],
    });
    saveGame(storage, player);
    const data = JSON.parse(storage.getItem(SAVE_KEY)!);
    expect(data.player.inventory).toHaveLength(3);
    expect(data.player.inventory[0].itemType).toBe("weapon");
    expect(data.player.inventory[1].itemType).toBe("gear");
    expect(data.player.inventory[2].itemType).toBe("consumable");
  });
});

describe("loadGame", () => {
  it("returns Robot when valid save exists", () => {
    const storage = createMockStorage();
    saveGame(storage, makeRobot({ name: "LoadBot", level: 5 }));
    const loaded = loadGame(storage);
    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe("LoadBot");
    expect(loaded!.level).toBe(5);
  });

  it("returns null when no save exists", () => {
    const storage = createMockStorage();
    expect(loadGame(storage)).toBeNull();
  });

  it("returns null when stored JSON is malformed", () => {
    const storage = createMockStorage();
    storage.setItem(SAVE_KEY, "not valid json{{{");
    expect(loadGame(storage)).toBeNull();
  });

  it("returns null when version doesn't match", () => {
    const storage = createMockStorage();
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 999, player: makeRobot() }));
    expect(loadGame(storage)).toBeNull();
  });

  it("returns null when player field is missing", () => {
    const storage = createMockStorage();
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 1 }));
    expect(loadGame(storage)).toBeNull();
  });

  it("soft-migrates missing upgrades and settings fields", () => {
    const storage = createMockStorage();
    // Simulate an old save without the new fields
    const oldPlayer = { ...makeRobot(), upgrades: undefined, settings: undefined };
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 1, player: oldPlayer }));
    const loaded = loadGame(storage)!;
    expect(loaded.upgrades).toEqual([]);
    expect(loaded.settings).toEqual({ mode: "oliver", oliverChallenge: false });
  });

  it("re-applies upgrades on load", () => {
    const storage = createMockStorage();
    const player = makeRobot({ upgrades: ["inventory-5"], inventorySize: 4 });
    saveGame(storage, player);
    const loaded = loadGame(storage)!;
    expect(loaded.inventorySize).toBe(5);
  });

  it("restores inventory items with all fields intact", () => {
    const storage = createMockStorage();
    const player = makeRobot({
      inventory: [
        { name: "Stick", itemType: "weapon", level: 0, moneyCost: 50, description: "a stick", requirements: [], damage: 1, energyCost: 1, accuracy: 80, hands: 1 },
      ],
    });
    saveGame(storage, player);
    const loaded = loadGame(storage)!;
    expect(loaded.inventory[0].name).toBe("Stick");
    expect(loaded.inventory[0].itemType).toBe("weapon");
    expect((loaded.inventory[0] as any).damage).toBe(1);
    expect((loaded.inventory[0] as any).accuracy).toBe(80);
  });

  it("restores a player with empty inventory", () => {
    const storage = createMockStorage();
    saveGame(storage, makeRobot({ inventory: [] }));
    const loaded = loadGame(storage)!;
    expect(loaded.inventory).toEqual([]);
  });
});

describe("deleteSave", () => {
  it("removes the save key from storage", () => {
    const storage = createMockStorage();
    saveGame(storage, makeRobot());
    deleteSave(storage);
    expect(storage.getItem(SAVE_KEY)).toBeNull();
  });

  it("no error when key doesn't exist", () => {
    const storage = createMockStorage();
    expect(() => deleteSave(storage)).not.toThrow();
  });
});

describe("hasSave", () => {
  it("returns true when save exists", () => {
    const storage = createMockStorage();
    saveGame(storage, makeRobot());
    expect(hasSave(storage)).toBe(true);
  });

  it("returns false when no save exists", () => {
    const storage = createMockStorage();
    expect(hasSave(storage)).toBe(false);
  });
});

describe("round-trip", () => {
  it("save then load returns identical Robot", () => {
    const storage = createMockStorage();
    const original = makeRobot({ name: "RoundTrip", level: 7, money: 999, wins: 42, fights: 50 });
    saveGame(storage, original);
    const loaded = loadGame(storage)!;
    expect(loaded).toEqual(original);
  });

  it("round-trips mixed inventory", () => {
    const storage = createMockStorage();
    const original = makeRobot({
      inventory: [
        { name: "Sword", itemType: "weapon", level: 2, moneyCost: 150, description: "", requirements: [], damage: 10, energyCost: 5, accuracy: 100, hands: 2 },
        { name: "Cardboard Armor", itemType: "gear", level: 0, moneyCost: 100, description: "", requirements: [], healthBonus: 5, energyBonus: 0, defenceBonus: 0, attackBonus: 0, handsBonus: 0, dodgeBonus: 0, moneyBonusPercent: 0 },
        { name: "Grenade", itemType: "consumable", level: 8, moneyCost: 100, description: "", requirements: [], healthRestore: 0, energyRestore: 0, tempDefence: 0, tempAttack: 0, damage: 30, enemyDodgeReduction: 0 },
      ],
    });
    saveGame(storage, original);
    const loaded = loadGame(storage)!;
    expect(loaded.inventory).toEqual(original.inventory);
  });
});
