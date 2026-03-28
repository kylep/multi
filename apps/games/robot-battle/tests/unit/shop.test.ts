import { describe, expect, it } from "vitest";
import { buyItem, canBuy, getSellPrice, listAvailableItems, sellItem } from "../../src/engine/shop";
import { createGameState, createPlayer } from "../../src/engine/state";
import { loadAssets } from "../../src/engine/data";

function setup() {
  const registry = loadAssets();
  const state = createGameState(registry);
  createPlayer(state, "TestBot");
  return state;
}

describe("listAvailableItems", () => {
  it("returns items at or below player level", () => {
    const state = setup();
    const items = listAvailableItems(state);
    expect(items.every((i) => i.level <= state.player!.level)).toBe(true);
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
  it("returns half price and removes from inventory", () => {
    const state = setup();
    // Sell the starter Stick
    const invItem = state.player!.inventory[0];
    expect(invItem.name).toBe("Stick");
    const result = sellItem(state, invItem);
    expect(result.success).toBe(true);
    expect(result.moneyGained).toBe(25);
    expect(state.player!.inventory.length).toBe(0);
  });
});

describe("getSellPrice", () => {
  it("returns half of buy price", () => {
    expect(getSellPrice({ name: "x", itemType: "weapon", level: 0, moneyCost: 100, description: "", requirements: [], damage: 1, energyCost: 1, accuracy: 100, hands: 1 })).toBe(50);
  });
});
