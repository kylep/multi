import { describe, it, expect } from "vitest";
import {
  startGame,
  startBattle,
  resolveTurn,
  endBattle,
  buyItem,
  healRobot,
  getAvailableEnemies,
  ENEMIES,
  type TurnAction,
} from "@kid-bot-battle-sim/game-core";

function makeGameWithWeapon() {
  let state = startGame("TestPlayer");
  // Buy a stick so the player can fight
  const result = buyItem(state.robot, "Stick");
  state = { ...state, robot: result.robot };
  return state;
}

describe("getAvailableEnemies", () => {
  it("returns the static enemy roster", () => {
    const enemies = getAvailableEnemies();
    expect(enemies.length).toBeGreaterThanOrEqual(3);
    expect(enemies.map((e) => e.name)).toContain("MiniBot");
    expect(enemies.map((e) => e.name)).toContain("Sparky");
    expect(enemies.map((e) => e.name)).toContain("Firebot");
  });
});

describe("startBattle", () => {
  it("creates a battle state against MiniBot", () => {
    const state = startBattle(makeGameWithWeapon(), "MiniBot");
    expect(state.battle).not.toBeNull();
    expect(state.battle!.enemyName).toBe("MiniBot");
    expect(state.battle!.enemy.name).toBe("MiniBot");
    expect(state.battle!.outcome).toBe("ongoing");
    expect(state.battle!.turn).toBe(1);
  });

  it("builds player battle robot with weapons from inventory", () => {
    const state = startBattle(makeGameWithWeapon(), "MiniBot");
    expect(state.battle!.player.weapons).toHaveLength(1);
    expect(state.battle!.player.weapons[0].name).toBe("Stick");
  });

  it("builds enemy with gear-boosted stats", () => {
    const state = startBattle(makeGameWithWeapon(), "MiniBot");
    // MiniBot has Cardboard Armor (+5 hp) and Propeller (+10 dodge)
    expect(state.battle!.enemy.maxHealth).toBe(15);
    expect(state.battle!.enemy.dodge).toBe(10);
  });

  it("throws for unknown enemy", () => {
    expect(() => startBattle(makeGameWithWeapon(), "FakeBot")).toThrow("Unknown enemy");
  });
});

describe("resolveTurn", () => {
  it("resolves an attack turn", () => {
    let state = startBattle(makeGameWithWeapon(), "MiniBot");
    const action: TurnAction = { mainAction: "attack", weaponSlots: [0], consumablesUsed: [] };
    // Use deterministic random: always hit, player goes first
    state = resolveTurn(state, action, () => 0);
    expect(state.battle!.combatLog.length).toBeGreaterThan(0);
    expect(state.battle!.turnHistory).toHaveLength(1);
  });

  it("resolves a rest turn", () => {
    let state = startBattle(makeGameWithWeapon(), "MiniBot");
    // Drain some energy first
    state = {
      ...state,
      battle: {
        ...state.battle!,
        player: { ...state.battle!.player, energy: 5 },
      },
    };
    const action: TurnAction = { mainAction: "rest", weaponSlots: [], consumablesUsed: [] };
    state = resolveTurn(state, action, () => 0);
    const restLog = state.battle!.combatLog.find(
      (l) => l.actor === "TestPlayer" && l.action === "rest"
    );
    expect(restLog).toBeDefined();
  });

  it("handles surrender", () => {
    let state = startBattle(makeGameWithWeapon(), "MiniBot");
    const action: TurnAction = { mainAction: "surrender", weaponSlots: [], consumablesUsed: [] };
    state = resolveTurn(state, action);
    expect(state.battle!.outcome).toBe("defeat");
    expect(state.robot.fights).toBe(1);
    expect(state.robot.wins).toBe(0);
  });

  it("grants victory rewards when enemy dies", () => {
    let state = startBattle(makeGameWithWeapon(), "MiniBot");
    // Set enemy to 1hp so one hit kills
    state = {
      ...state,
      battle: {
        ...state.battle!,
        enemy: { ...state.battle!.enemy, health: 1, dodge: 0 },
      },
    };
    const action: TurnAction = { mainAction: "attack", weaponSlots: [0], consumablesUsed: [] };
    // random=0 means always hit and player goes first
    state = resolveTurn(state, action, () => 0);
    expect(state.battle!.outcome).toBe("victory");
    expect(state.battle!.rewards).not.toBeNull();
    expect(state.battle!.rewards!.exp).toBe(2); // MiniBot exp reward
    // Started with 50 after buying a Stick (100 - 50), got MiniBot reward (50)
    expect(state.robot.money).toBe(100);
    expect(state.robot.wins).toBe(1);
  });
});

describe("leveling", () => {
  it("levels up when enough exp is earned", () => {
    let state = startGame("TestPlayer");
    // Give robot enough exp to be close to leveling
    state = { ...state, robot: { ...state.robot, exp: 9, money: 10000 } };
    const { robot } = buyItem(state.robot, "Stick");
    state = { ...state, robot };

    state = startBattle(state, "MiniBot");
    state = {
      ...state,
      battle: {
        ...state.battle!,
        enemy: { ...state.battle!.enemy, health: 1, dodge: 0 },
      },
    };
    const action: TurnAction = { mainAction: "attack", weaponSlots: [0], consumablesUsed: [] };
    state = resolveTurn(state, action, () => 0);

    expect(state.battle!.rewards!.leveledUp).toBe(true);
    expect(state.robot.level).toBe(1);
  });
});

describe("endBattle", () => {
  it("clears battle state and returns to menu", () => {
    let state = startBattle(makeGameWithWeapon(), "MiniBot");
    state = endBattle(state);
    expect(state.battle).toBeNull();
    expect(state.phase).toBe("menu");
  });
});
