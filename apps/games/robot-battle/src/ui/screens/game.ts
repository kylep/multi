/** Game entry point — title screen + save slots + main loop. */

import type { Terminal, Choice } from "../terminal";
import { loadAssets } from "../../engine/data";
import { createGameState, createPlayer } from "../../engine/state";
import {
  deleteSlot,
  listSlots,
  loadSlot,
  migrateV1Save,
  saveSlot,
  NUM_SLOTS,
  type GameSettings,
  type SaveStorage,
  DEFAULT_SETTINGS,
} from "../../engine/save";
import { getEffectiveMaxEnergy, getEffectiveMaxHealth } from "../../engine/robot";
import { mainMenu } from "./menu";
import type { SoundPlayer } from "../sound";
import packageJson from "../../../package.json";

export async function startGame(
  terminal: Terminal,
  storage: SaveStorage = localStorage,
  sound?: SoundPlayer,
): Promise<void> {
  const registry = loadAssets();

  // Migrate old single-save format on first run
  migrateV1Save(storage);

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
    let activeSlot = 0;
    let settings: GameSettings = { ...DEFAULT_SETTINGS };

    // Show save slot selection
    const slots = listSlots(storage);
    const choices: Choice[] = [];
    for (const s of slots) {
      if (s.player) {
        choices.push({
          label: `Slot ${s.slot}: ${s.player.name} Lv.${s.player.level} — $${s.player.money}`,
          value: `load-${s.slot}`,
        });
      } else {
        choices.push({
          label: `Slot ${s.slot}: Empty`,
          value: `new-${s.slot}`,
          subtitle: "Start a new game",
        });
      }
    }

    // Add delete options for occupied slots
    const occupiedSlots = slots.filter((s) => s.player);
    if (occupiedSlots.length > 0) {
      choices.push({
        label: "Delete a save",
        value: "delete",
        subtitle: "Remove a saved game",
      });
    }

    const choice = await terminal.promptChoice("", choices, "grid");

    if (choice === "delete") {
      const deleteChoices: Choice[] = occupiedSlots.map((s) => ({
        label: `Delete Slot ${s.slot}: ${s.player!.name}`,
        value: String(s.slot),
      }));
      deleteChoices.push({ label: "Cancel", value: "cancel" });
      const delChoice = await terminal.promptChoice("Which slot to delete?", deleteChoices);
      if (delChoice !== "cancel") {
        const slot = parseInt(delChoice, 10);
        const confirmed = await terminal.promptConfirm(
          `Delete ${slots[slot - 1].player!.name}? This cannot be undone.`,
          "Delete",
          "Cancel",
        );
        if (confirmed) deleteSlot(storage, slot);
      }
      continue; // Return to title screen
    }

    if (choice.startsWith("load-")) {
      activeSlot = parseInt(choice.slice(5), 10);
      const loaded = loadSlot(storage, activeSlot);
      if (loaded) {
        state.player = loaded.player;
        settings = loaded.settings;
        state.player.health = getEffectiveMaxHealth(state.player);
        state.player.energy = getEffectiveMaxEnergy(state.player);
      } else {
        continue; // Corrupt save, re-show title
      }
    } else if (choice.startsWith("new-")) {
      activeSlot = parseInt(choice.slice(4), 10);
      const name = await terminal.promptText("Name your robot:");
      const playerName = name.trim() || "RoboPlayer";
      createPlayer(state, playerName);
      saveSlot(storage, activeSlot, state.player!, settings);
    }

    // Apply sound settings
    if (sound) sound.setEnabled(settings.soundEnabled);

    terminal.print("");
    terminal.print(`Welcome, ${state.player!.name}!`, "t-magenta");

    const save = () => saveSlot(storage, activeSlot, state.player!, settings);
    await mainMenu(terminal, state, save, sound, settings);
  }
}
