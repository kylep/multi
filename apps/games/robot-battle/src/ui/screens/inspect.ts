/** Robot stats / inspect screen. */

import type { Terminal } from "../terminal";
import type { GameState } from "../../engine/state";
import type { Weapon, Gear, Consumable } from "../../engine/types";
import {
  getEffectiveAttack,
  getEffectiveDefence,
  getEffectiveDodge,
  getEffectiveHands,
  getEffectiveMaxEnergy,
  getEffectiveMaxHealth,
  getWeapons,
  getGear,
  getConsumables,
} from "../../engine/robot";

export async function showRobotStats(terminal: Terminal, state: GameState): Promise<void> {
  const player = state.player!;

  terminal.print("");
  terminal.print(`=== ${player.name} ===`, "t-blue t-bold");
  terminal.print("");

  // Stats line
  terminal.printLine([
    { text: `Lv.${player.level}`, css: "t-magenta t-bold" },
    { text: `  XP ${player.exp}/10`, css: "t-magenta" },
    { text: "  |  " },
    { text: `$${player.money}`, css: "t-yellow" },
    { text: "  |  " },
    { text: `${player.wins}W/${player.fights}F`, css: "t-dim" },
  ]);
  terminal.print("");

  // Combat stats
  terminal.print("-- Stats --", "t-yellow t-bold");
  terminal.print(`  HP: ${player.health}/${getEffectiveMaxHealth(player)}   Energy: ${player.energy}/${getEffectiveMaxEnergy(player)}`, "t-cyan");
  terminal.print(`  Attack: ${getEffectiveAttack(player)}%   Defence: ${getEffectiveDefence(player)}   Dodge: ${getEffectiveDodge(player)}   Hands: ${getEffectiveHands(player)}`);
  terminal.print("");

  // Weapons
  const weapons = getWeapons(player);
  terminal.print("-- Weapons --", "t-yellow t-bold");
  if (weapons.length === 0) {
    terminal.print("  (none)", "t-dim");
  } else {
    for (const w of weapons) {
      terminal.print(`  ${w.name}  ${w.damage} dmg, ${w.accuracy}% acc, ${w.energyCost} energy, ${w.hands}h`, "t-green");
    }
  }

  // Gear
  const gear = getGear(player);
  terminal.print("-- Gear --", "t-yellow t-bold");
  if (gear.length === 0) {
    terminal.print("  (none)", "t-dim");
  } else {
    for (const g of gear) {
      const effects: string[] = [];
      if (g.healthBonus) effects.push(`+${g.healthBonus} HP`);
      if (g.energyBonus) effects.push(`+${g.energyBonus} Energy`);
      if (g.defenceBonus) effects.push(`+${g.defenceBonus} Def`);
      if (g.attackBonus) effects.push(`+${g.attackBonus}% Atk`);
      if (g.handsBonus) effects.push(`+${g.handsBonus} Hands`);
      if (g.dodgeBonus) effects.push(`+${g.dodgeBonus} Dodge`);
      if (g.moneyBonusPercent) effects.push(`+${g.moneyBonusPercent}% Money`);
      terminal.print(`  ${g.name}  ${effects.join(", ")}`, "t-cyan");
    }
  }

  // Consumables
  const consumables = getConsumables(player);
  if (consumables.length > 0) {
    terminal.print("-- Items --", "t-yellow t-bold");
    for (const c of consumables) {
      terminal.print(`  ${c.name}  ${c.description}`, "t-green");
    }
  }

  terminal.print("");
  terminal.print(`Inventory: ${player.inventory.length}/${player.inventorySize}`, "t-dim");
}
