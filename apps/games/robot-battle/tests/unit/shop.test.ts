import { describe, expect, it } from "vitest";
import { buyItem, canBuy, countInventorySlots, getSellPrice, listAvailableItems, sellItem } from "../../src/engine/shop";
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

  it("counts stackable gear group as 1 slot", () => {
    const state = setup();
    state.player!.level = 5;
    const shell = state.registry.getItem("Shotgun Shell")!;
    state.player!.inventory.push({ ...shell }, { ...shell }, { ...shell });
    // 1 Stick + 3 Shotgun Shells (counted as 1 slot) = 2 slots
    expect(countInventorySlots(state.player!)).toBe(2);
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
    // Should have 3 items in array but only 2 inventory slots
    expect(state.player!.inventory.filter((i) => i.name === "Shotgun Shell").length).toBe(2);
    expect(countInventorySlots(state.player!)).toBe(2); // Stick + 1 shell slot
  });

  it("allows buying stackable gear even when inventory slots are full", () => {
    const state = setup();
    state.player!.level = 5;
    state.player!.money = 10000;
    // Fill all 4 slots: Stick + 3 gear
    state.player!.inventory.push(
      { ...state.registry.getItem("Propeller")! },
      { ...state.registry.getItem("Small Battery")! },
      { ...state.registry.getItem("Shotgun Shell")! },
    );
    expect(countInventorySlots(state.player!)).toBe(4);
    // Buying another Shotgun Shell should work (stacks into existing slot)
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
