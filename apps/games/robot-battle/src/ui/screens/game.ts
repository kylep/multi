/** Game entry point — title screen + save/load + main loop. */

import type { Terminal } from "../terminal";
import { loadAssets } from "../../engine/data";
import { createGameState, createPlayer } from "../../engine/state";
import { deleteSave, hasSave, loadGame, saveGame, type SaveStorage } from "../../engine/save";
import { getEffectiveMaxEnergy, getEffectiveMaxHealth } from "../../engine/robot";
import { mainMenu } from "./menu";
import packageJson from "../../../package.json";

export async function startGame(
  terminal: Terminal,
  storage: SaveStorage = localStorage,
): Promise<void> {
  const registry = loadAssets();

  while (true) {
    terminal.clear();
    terminal.printHTML(`
      <div class="title-center">
        <div class="t-yellow t-bold" style="font-size:20px">╔═══════════════════════════╗</div>
        <div class="t-yellow t-bold" style="font-size:24px">ROBOT BATTLE</div>
        <div class="t-yellow t-bold" style="font-size:20px">╚═══════════════════════════╝</div>
        <div class="t-dim" style="margin-top:4px">v${packageJson.version}</div>
      </div>
    `);

    const state = createGameState(registry);

    if (hasSave(storage)) {
      const saved = loadGame(storage);
      if (saved) {
        const choice = await terminal.promptChoice("", [
          { label: `Continue: ${saved.name} Lv.${saved.level}`, value: "continue" },
          { label: "New Game", value: "new" },
        ], "row");

        if (choice === "continue") {
          state.player = saved;
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
  }
}
