import { describe, it, expect } from "vitest";
import {
  createRobot,
  addItem,
  removeItem,
  hasItem,
  getInventoryByType,
} from "@kid-bot-battle-sim/game-core";

describe("inventory", () => {
  it("adds an item to inventory", () => {
    const robot = createRobot();
    const { robot: updated, item } = addItem(robot, "Stick");
    expect(updated.inventory).toHaveLength(1);
    expect(updated.inventory[0].itemName).toBe("Stick");
    expect(item.type).toBe("weapon");
  });

  it("prevents adding when inventory is full", () => {
    let robot = createRobot(); // size 4
    const { robot: r1 } = addItem(robot, "Stick");
    const { robot: r2 } = addItem(r1, "Stick");
    const { robot: r3 } = addItem(r2, "Stick");
    const { robot: r4 } = addItem(r3, "Stick");
    expect(() => addItem(r4, "Stick")).toThrow("Inventory is full");
  });

  it("prevents duplicate gear", () => {
    const robot = createRobot();
    const { robot: r1 } = addItem(robot, "Cardboard Armor");
    expect(() => addItem(r1, "Cardboard Armor")).toThrow("Already own gear");
  });

  it("allows duplicate weapons", () => {
    const robot = createRobot();
    const { robot: r1 } = addItem(robot, "Stick");
    const { robot: r2 } = addItem(r1, "Stick");
    expect(r2.inventory).toHaveLength(2);
  });

  it("removes an item by instanceId", () => {
    const robot = createRobot();
    const { robot: r1, item } = addItem(robot, "Stick");
    const r2 = removeItem(r1, item.instanceId);
    expect(r2.inventory).toHaveLength(0);
  });

  it("hasItem returns correct value", () => {
    const robot = createRobot();
    expect(hasItem(robot, "Stick")).toBe(false);
    const { robot: r1 } = addItem(robot, "Stick");
    expect(hasItem(r1, "Stick")).toBe(true);
  });

  it("getInventoryByType filters correctly", () => {
    let robot = createRobot();
    const { robot: r1 } = addItem(robot, "Stick");
    const { robot: r2 } = addItem(r1, "Cardboard Armor");
    expect(getInventoryByType(r2, "weapon")).toHaveLength(1);
    expect(getInventoryByType(r2, "gear")).toHaveLength(1);
    expect(getInventoryByType(r2, "consumable")).toHaveLength(0);
  });
});
