/** Game entry point — title screen + save/load + main loop. */

import type { Terminal } from "../terminal";
import { loadAssets } from "../../engine/data";
import { createGameState, createPlayer } from "../../engine/state";
import { deleteSave, hasSave, loadGame, saveGame, type SaveStorage } from "../../engine/save";
import { getEffectiveMaxEnergy, getEffectiveMaxHealth } from "../../engine/robot";
import { mainMenu } from "./menu";

export async function startGame(
  terminal: Terminal,
  storage: SaveStorage = localStorage,
): Promise<void> {
  const registry = loadAssets();

  // Outer loop: title screen → game → quit returns here
  while (true) {
    terminal.clear();
    terminal.print("=============================", "t-yellow t-bold");
    terminal.print("       ROBOT BATTLE", "t-yellow t-bold");
    terminal.print("=============================", "t-yellow t-bold");
    terminal.print("");

    const state = createGameState(registry);

    if (hasSave(storage)) {
      const saved = loadGame(storage);
      if (saved) {
        const choice = await terminal.promptChoice("", [
          { label: `Continue: ${saved.name} Lv.${saved.level}`, value: "continue" },
          { label: "New Game", value: "new" },
        ]);

        if (choice === "continue") {
          state.player = saved;
          // Sync health/energy to max on load
          state.player.health = getEffectiveMaxHealth(state.player);
          state.player.energy = getEffectiveMaxEnergy(state.player);
        } else {
          deleteSave(storage);
          const name = await terminal.promptText("Name your robot: ");
          const playerName = name.trim() || "RoboPlayer";
          createPlayer(state, playerName);
          saveGame(storage, state.player!);
        }
      } else {
        // Corrupted save — treat as no save
        deleteSave(storage);
        const name = await terminal.promptText("Name your robot: ");
        const playerName = name.trim() || "RoboPlayer";
        createPlayer(state, playerName);
        saveGame(storage, state.player!);
      }
    } else {
      const name = await terminal.promptText("Name your robot: ");
      const playerName = name.trim() || "RoboPlayer";
      createPlayer(state, playerName);
      saveGame(storage, state.player!);
    }

    terminal.print("");
    terminal.print(`Welcome, ${state.player!.name}!`, "t-magenta");

    const save = () => saveGame(storage, state.player!);
    await mainMenu(terminal, state, save);
    // mainMenu returns when user quits → loop back to title
  }
}
