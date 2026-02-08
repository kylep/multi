import { describe, it, expect } from "vitest";
import { startGame } from "@kid-bot-battle-sim/game-core";

describe("startGame", () => {
  it("returns a GameState with the player name", () => {
    const state = startGame("Alice");
    expect(state.playerName).toBe("Alice");
    expect(state.phase).toBe("menu");
  });

  it("generates a unique gameId", () => {
    const a = startGame("Alice");
    const b = startGame("Bob");
    expect(a.gameId).not.toBe(b.gameId);
  });

  it("trims whitespace from player name", () => {
    const state = startGame("  Alice  ");
    expect(state.playerName).toBe("Alice");
  });

  it("throws if player name is empty", () => {
    expect(() => startGame("")).toThrow("Player name must not be empty");
  });

  it("throws if player name is only whitespace", () => {
    expect(() => startGame("   ")).toThrow("Player name must not be empty");
  });
});
