import { describe, expect, it } from "vitest";
import { buyItem, canBuy, countInventorySlots, getSellPrice, listAvailableItems, restockConsumables, sellItem } from "../../src/engine/shop";
import type { Consumable } from "../../src/engine/types";
import { createGameState, createPlayer } from "../../src/engine/state";
import { loadAssets } from "../../src/engine/data";

function setup() {
  const registry = loadAssets();
  const state = createGameState(registry);
  createPlayer(state, "TestBot");
  return state;
}

describe("listAvailableItems", () => {
  it("returns all items (including above player level)", () => {
    const state = setup();
    const items = listAvailableItems(state);
    expect(items.length).toBeGreaterThan(0);
    // Should include items above player level (shown greyed out in shop)
    expect(items.some((i) => i.level > state.player!.level)).toBe(true);
  });
});

describe("canBuy", () => {
  it("allows buying affordable items", () => {
    const state = setup();
    const stick = state.registry.getItem("Stick")!;
    const result = canBuy(state, stick);
    expect(result.ok).toBe(true);
  });

  it("rejects items above player level", () => {
    const state = setup();
    const sword = state.registry.getItem("Sword")!;
    const result = canBuy(state, sword);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("level");
  });

  it("rejects when not enough money", () => {
    const state = setup();
    state.player!.money = 0;
    const stick = state.registry.getItem("Stick")!;
    const result = canBuy(state, stick);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("money");
  });

  it("rejects when inventory full", () => {
    const state = setup();
    state.player!.money = 10000;
    // Clear and fill inventory to capacity
    state.player!.inventory = [];
    for (let i = 0; i < state.player!.inventorySize; i++) {
      state.player!.inventory.push({ ...state.registry.getItem("Stick")! });
    }
    const stick = state.registry.getItem("Stick")!;
    const result = canBuy(state, stick);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("full");
  });

  it("rejects duplicate gear", () => {
    const state = setup();
    state.player!.money = 10000;
    const propeller = state.registry.getItem("Propeller")!;
    state.player!.inventory.push({ ...propeller });
    const result = canBuy(state, propeller);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("already");
  });
});

describe("buyItem", () => {
  it("deducts money and adds to inventory", () => {
    const state = setup();
    const propeller = state.registry.getItem("Propeller")!;
    const result = buyItem(state, propeller);
    expect(result.success).toBe(true);
    expect(state.player!.money).toBe(50); // 100 - 50
    expect(state.player!.inventory.length).toBe(2); // starter Stick + Propeller
  });
});

describe("sellItem", () => {
  it("returns full price and removes from inventory", () => {
    const state = setup();
    // Sell the starter Stick
    const invItem = state.player!.inventory[0];
    expect(invItem.name).toBe("Stick");
    const result = sellItem(state, invItem);
    expect(result.success).toBe(true);
    expect(result.moneyGained).toBe(50);
    expect(state.player!.inventory.length).toBe(0);
  });
});

describe("countInventorySlots", () => {
  it("counts non-stackable items normally", () => {
    const state = setup();
    // Player starts with 1 Stick
    expect(countInventorySlots(state.player!)).toBe(1);
  });

  it("ammo gear does not count as inventory slot", () => {
    const state = setup();
    state.player!.level = 5;
    const shell = state.registry.getItem("Shotgun Shell")!;
    state.player!.inventory.push({ ...shell }, { ...shell }, { ...shell });
    // 1 Stick + 3 Shotgun Shells (ammo = free) = 1 slot
    expect(countInventorySlots(state.player!)).toBe(1);
  });
});

describe("stackable gear buying", () => {
  it("allows buying multiple stackable gear items", () => {
    const state = setup();
    state.player!.level = 5;
    state.player!.money = 10000;
    const shell = state.registry.getItem("Shotgun Shell")!;
    // Buy first shell
    const r1 = buyItem(state, shell);
    expect(r1.success).toBe(true);
    // Buy second shell — should not be rejected as duplicate
    const r2 = canBuy(state, shell);
    expect(r2.ok).toBe(true);
    const r3 = buyItem(state, shell);
    expect(r3.success).toBe(true);
    // Should have 3 items in array but ammo doesn't take inventory slots
    expect(state.player!.inventory.filter((i) => i.name === "Shotgun Shell").length).toBe(2);
    expect(countInventorySlots(state.player!)).toBe(1); // Stick only, shells are ammo (free)
  });

  it("allows buying ammo even when inventory slots are full", () => {
    const state = setup();
    state.player!.level = 5;
    state.player!.money = 10000;
    // Fill all 4 slots: Stick + 3 gear
    state.player!.inventory.push(
      { ...state.registry.getItem("Propeller")! },
      { ...state.registry.getItem("Small Battery")! },
      { ...state.registry.getItem("Cardboard Armor")! },
    );
    expect(countInventorySlots(state.player!)).toBe(4);
    // Buying Shotgun Shell should work (ammo doesn't take inventory slots)
    const shell = state.registry.getItem("Shotgun Shell")!;
    const result = canBuy(state, shell);
    expect(result.ok).toBe(true);
  });

  it("sells one stackable item at a time", () => {
    const state = setup();
    state.player!.level = 5;
    const shell = state.registry.getItem("Shotgun Shell")!;
    state.player!.inventory.push({ ...shell }, { ...shell });
    const shellInv = state.player!.inventory.find((i) => i.name === "Shotgun Shell")!;
    sellItem(state, shellInv);
    expect(state.player!.inventory.filter((i) => i.name === "Shotgun Shell").length).toBe(1);
  });
});

describe("getSellPrice", () => {
  it("returns full buy price", () => {
    expect(getSellPrice({ name: "x", itemType: "weapon", level: 0, moneyCost: 100, description: "", requirements: [], damage: 1, energyCost: 1, accuracy: 100, hands: 1 })).toBe(100);
  });
});

describe("consumables and inventory slots", () => {
  it("consumables do not count as inventory slots", () => {
    const state = setup();
    state.player!.level = 10;
    const grenade = state.registry.getItem("Grenade")!;
    state.player!.inventory.push({ ...grenade });
    // Stick = 1 slot, Grenade = 0 slots (consumable)
    expect(countInventorySlots(state.player!)).toBe(1);
  });

  it("can buy consumable when inventory is full", () => {
    const state = setup();
    state.player!.level = 10;
    state.player!.money = 10000;
    // Fill all 4 slots with weapons
    state.player!.inventory.push(
      { ...state.registry.getItem("Wrench")! },
      { ...state.registry.getItem("Wrench")! },
      { ...state.registry.getItem("Wrench")! },
    );
    // 4 slots: Stick + 3 wrenches
    expect(countInventorySlots(state.player!)).toBe(4);
    // Should still be able to buy a consumable
    const grenade = state.registry.getItem("Grenade")!;
    expect(canBuy(state, grenade).ok).toBe(true);
  });
});

describe("ammo maxStack", () => {
  it("enforces maxStack limit on ammo", () => {
    const state = setup();
    state.player!.level = 45;
    state.player!.money = 1000000;
    const missile = state.registry.getItem("Antimatter Missile")!;
    // Buy up to max (3)
    for (let i = 0; i < 3; i++) {
      const r = buyItem(state, missile);
      expect(r.success).toBe(true);
    }
    // Next should fail
    const check = canBuy(state, missile);
    expect(check.ok).toBe(false);
    expect(check.reason).toContain("Max 3");
  });

  it("ammo does not take inventory slots", () => {
    const state = setup();
    state.player!.level = 5;
    state.player!.money = 10000;
    const shell = state.registry.getItem("Shotgun Shell")!;
    buyItem(state, shell);
    buyItem(state, shell);
    buyItem(state, shell);
    // 3 shells + 1 Stick, but shells are ammo so only 1 slot used
    expect(countInventorySlots(state.player!)).toBe(1);
  });
});

describe("restockConsumables", () => {
  function restockSetup() {
    const state = setup();
    const player = state.player!;
    player.settings.restockConsumables = true;
    player.level = 50;
    return state;
  }

  it("does nothing when the setting is off", () => {
    const state = restockSetup();
    state.player!.settings.restockConsumables = false;
    const result = restockConsumables(state, ["Repair Kit"]);
    expect(result).toEqual({ bought: [], bankWithdraw: 0, skipped: [] });
  });

  it("rebuys from the wallet without touching the bank", () => {
    const state = restockSetup();
    const player = state.player!;
    const kit = state.registry.getItem("Repair Kit")!;
    player.money = kit.moneyCost * 2;
    player.bank = 5000;

    const result = restockConsumables(state, ["Repair Kit"]);
    expect(result.bought).toEqual(["Repair Kit"]);
    expect(result.bankWithdraw).toBe(0);
    expect(result.skipped).toEqual([]);
    expect(player.bank).toBe(5000);
    expect(player.money).toBe(kit.moneyCost);
  });

  it("withdraws only the shortfall, never the whole bank", () => {
    const state = restockSetup();
    const player = state.player!;
    const kit = state.registry.getItem("Repair Kit")!;
    player.money = 0;
    player.bank = 5000;

    const result = restockConsumables(state, ["Repair Kit"]);
    expect(result.bought).toEqual(["Repair Kit"]);
    expect(result.bankWithdraw).toBe(kit.moneyCost);
    expect(player.bank).toBe(5000 - kit.moneyCost);
    expect(player.money).toBe(0);
  });

  it("leaves the bank alone and reports the skip when the item is unaffordable", () => {
    const state = restockSetup();
    const player = state.player!;
    player.trollMode = true;
    player.money = 0;
    player.bank = 500_000;

    const result = restockConsumables(state, ["Troll Bomb"]);
    expect(result.bought).toEqual([]);
    expect(result.bankWithdraw).toBe(0);
    expect(player.bank).toBe(500_000);
    expect(player.money).toBe(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].name).toBe("Troll Bomb");
    expect(result.skipped[0].reason).toContain("1000000");
  });

  it("rolls the withdrawal back when the buy fails for a non-money reason", () => {
    const state = restockSetup();
    const player = state.player!;
    const kit = state.registry.getItem("Repair Kit")! as Consumable;
    player.money = 0;
    player.bank = 5000;
    // Already holding the maximum, so canBuy refuses on max stack.
    for (let i = 0; i < kit.maxStack; i++) player.inventory.push({ ...kit });

    const result = restockConsumables(state, ["Repair Kit"]);
    expect(result.bought).toEqual([]);
    expect(result.bankWithdraw).toBe(0);
    expect(player.bank).toBe(5000);
    expect(player.money).toBe(0);
    expect(result.skipped[0].reason).toContain("Max");
  });

  it("skips the Troll Bomb entirely without troll mode", () => {
    const state = restockSetup();
    state.player!.money = 5_000_000;
    const result = restockConsumables(state, ["Troll Bomb"]);
    expect(result.bought).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(state.player!.money).toBe(5_000_000);
  });

  it("buys what it can afford and reports what it cannot", () => {
    const state = restockSetup();
    const player = state.player!;
    player.trollMode = true;
    const kit = state.registry.getItem("Repair Kit")!;
    player.money = kit.moneyCost;
    player.bank = 0;

    const result = restockConsumables(state, ["Troll Bomb", "Repair Kit"]);
    expect(result.bought).toEqual(["Repair Kit"]);
    expect(result.skipped.map((s) => s.name)).toEqual(["Troll Bomb"]);
    expect(player.money).toBe(0);
  });
});
