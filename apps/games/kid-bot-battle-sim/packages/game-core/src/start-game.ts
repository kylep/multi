import { GameState } from "./types.js";
import { createRobot, healRobot } from "./robot.js";

export function startGame(playerName: string): GameState {
  const trimmed = playerName.trim();
  if (!trimmed) {
    throw new Error("Player name must not be empty");
  }

  const robot = healRobot(createRobot());

  return {
    gameId: crypto.randomUUID(),
    playerName: trimmed,
    robot,
    phase: "menu",
    battle: null,
    firstBattle: true,
  };
}
