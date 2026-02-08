import { describe, it, expect } from "vitest";
import {
  createRobot,
  computeEffectiveStats,
  healRobot,
  addItem,
  DEFAULT_ROBOT_STATS,
  STARTING_MONEY,
} from "@kid-bot-battle-sim/game-core";

describe("createRobot", () => {
  it("creates a robot with default stats", () => {
    const robot = createRobot();
    expect(robot.health).toBe(DEFAULT_ROBOT_STATS.health);
    expect(robot.energy).toBe(DEFAULT_ROBOT_STATS.energy);
    expect(robot.level).toBe(0);
    expect(robot.money).toBe(STARTING_MONEY);
    expect(robot.inventory).toEqual([]);
    expect(robot.wins).toBe(0);
    expect(robot.fights).toBe(0);
  });
});

describe("computeEffectiveStats", () => {
  it("returns base stats with no gear", () => {
    const robot = createRobot();
    const stats = computeEffectiveStats(robot);
    expect(stats.maxHealth).toBe(10);
    expect(stats.maxEnergy).toBe(20);
    expect(stats.hands).toBe(2);
    expect(stats.dodge).toBe(0);
  });

  it("applies gear bonuses", () => {
    let robot = createRobot();
    robot = { ...robot, level: 5, money: 1000 };
    const { robot: r1 } = addItem(robot, "Cardboard Armor");
    const { robot: r2 } = addItem(r1, "Small Battery");
    const stats = computeEffectiveStats(r2);
    expect(stats.maxHealth).toBe(15); // +5 from Cardboard Armor
    expect(stats.maxEnergy).toBe(25); // +5 from Small Battery
  });

  it("stacks multiple gear bonuses", () => {
    let robot = createRobot();
    robot = { ...robot, level: 5, money: 1000 };
    const { robot: r1 } = addItem(robot, "Propeller");
    const { robot: r2 } = addItem(r1, "Small Computer Chip");
    const stats = computeEffectiveStats(r2);
    expect(stats.dodge).toBe(20); // +10 + +10
  });
});

describe("healRobot", () => {
  it("restores health and energy to effective max", () => {
    let robot = createRobot();
    robot = { ...robot, health: 1, energy: 1, level: 1, money: 500 };
    const { robot: withArmor } = addItem(robot, "Cardboard Armor");
    const healed = healRobot(withArmor);
    expect(healed.health).toBe(15); // 10 + 5
    expect(healed.energy).toBe(20);
  });
});
