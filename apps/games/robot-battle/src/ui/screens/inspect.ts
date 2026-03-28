/** Robot stats / inspect screen. */

import type { Terminal } from "../terminal";
import type { GameState } from "../../engine/state";
import {
  getEffectiveAttack,
  getEffectiveDefence,
  getEffectiveDodge,
  getEffectiveHands,
  getEffectiveMaxEnergy,
  getEffectiveMaxHealth,
} from "../../engine/robot";

export async function showRobotStats(terminal: Terminal, state: GameState): Promise<void> {
  const player = state.player!;
  terminal.print("");
  terminal.print(`=== ${player.name} ===`, "t-magenta");
  terminal.print(`Level: ${player.level} (Exp: ${player.exp}/10)`);
  terminal.print(`Health: ${player.health}/${getEffectiveMaxHealth(player)}`, "t-cyan");
  terminal.print(`Energy: ${player.energy}/${getEffectiveMaxEnergy(player)}`, "t-cyan");
  terminal.print(`Defence: ${getEffectiveDefence(player)}`);
  terminal.print(`Attack: ${getEffectiveAttack(player)}%`);
  terminal.print(`Hands: ${getEffectiveHands(player)}`);
  terminal.print(`Dodge: ${getEffectiveDodge(player)}`);
  terminal.print(`Money: $${player.money}`, "t-magenta");
  terminal.print(`Wins: ${player.wins} / Fights: ${player.fights}`);
  terminal.print(`Inventory: ${player.inventory.length}/${player.inventorySize}`);

  if (player.inventory.length > 0) {
    terminal.print("");
    terminal.print("Inventory:");
    for (let i = 0; i < player.inventory.length; i++) {
      terminal.print(`  ${i + 1}. ${player.inventory[i].name}`);
    }
  }
}
