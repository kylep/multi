import { describe, it, expect } from "vitest";
import {
  createRobot,
  enterShop,
  buyItem,
  sellItem,
  addItem,
  healRobot,
} from "@kid-bot-battle-sim/game-core";

describe("enterShop", () => {
  it("heals robot to full", () => {
    let robot = createRobot();
    robot = { ...robot, health: 1, energy: 1 };
    const healed = enterShop(robot);
    expect(healed.health).toBe(10);
    expect(healed.energy).toBe(20);
  });
});

describe("buyItem", () => {
  it("buys an item and deducts money", () => {
    const robot = healRobot(createRobot()); // 100 money
    const result = buyItem(robot, "Stick"); // costs 50
    expect(result.success).toBe(true);
    expect(result.robot.money).toBe(50);
    expect(result.robot.inventory).toHaveLength(1);
  });

  it("fails when not enough money", () => {
    let robot = healRobot(createRobot());
    robot = { ...robot, money: 5 };
    const result = buyItem(robot, "Stick"); // costs 50
    expect(result.success).toBe(false);
    expect(result.error).toBe("Not enough money");
  });

  it("fails when inventory is full", () => {
    let robot = healRobot(createRobot());
    robot = { ...robot, money: 10000 };
    const r1 = buyItem(robot, "Stick").robot;
    const r2 = buyItem(r1, "Stick").robot;
    const r3 = buyItem(r2, "Stick").robot;
    const r4 = buyItem(r3, "Stick").robot;
    const result = buyItem(r4, "Stick");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Inventory full");
  });

  it("fails when level too low", () => {
    let robot = healRobot(createRobot()); // level 0
    robot = { ...robot, money: 10000 }; // plenty of money
    const result = buyItem(robot, "Sword"); // level 2
    expect(result.success).toBe(false);
    expect(result.error).toBe("Requires level 2");
  });

  it("fails when missing required gear", () => {
    let robot = healRobot(createRobot());
    robot = { ...robot, level: 10, money: 10000 };
    const result = buyItem(robot, "Fourth Arm"); // requires Third Arm
    expect(result.success).toBe(false);
    expect(result.error).toBe("Requires Third Arm");
  });

  it("fails when duplicate gear", () => {
    let robot = healRobot(createRobot());
    robot = { ...robot, money: 10000 };
    const r1 = buyItem(robot, "Cardboard Armor").robot;
    const result = buyItem(r1, "Cardboard Armor");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Already own this gear");
  });
});

describe("sellItem", () => {
  it("sells an item for half price", () => {
    let robot = healRobot(createRobot());
    const bought = buyItem(robot, "Stick"); // 50 cost
    const inv = bought.robot.inventory[0];
    const result = sellItem(bought.robot, inv.instanceId);
    expect(result.success).toBe(true);
    expect(result.refund).toBe(25); // half of 50
    expect(result.robot.inventory).toHaveLength(0);
    expect(result.robot.money).toBe(50 + 25); // 50 left after buy + 25 refund
  });

  it("fails with invalid instanceId", () => {
    const robot = healRobot(createRobot());
    const result = sellItem(robot, "nonexistent");
    expect(result.success).toBe(false);
  });
});
