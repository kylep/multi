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
  getWeapons,
  getGear,
  getConsumables,
} from "../../engine/robot";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function showRobotStats(terminal: Terminal, state: GameState): Promise<void> {
  const player = state.player!;

  terminal.printHTML(`
    <div class="panel-header">
      <span class="t-blue t-bold" style="font-size:18px">${esc(player.name)}</span>
      &nbsp;&nbsp;
      <span class="t-magenta">Lv.${player.level}</span>
      &nbsp;
      <span class="t-magenta t-dim">XP ${player.exp}/10</span>
      &nbsp;&nbsp;
      <span class="t-yellow">$${player.money}</span>
      &nbsp;&nbsp;
      <span class="t-dim">${player.wins}W / ${player.fights}F</span>
    </div>
  `);

  // Combat stats panel
  terminal.printHTML(`
    <div class="panel">
      <div class="t-yellow t-bold">Stats</div>
      <div class="t-cyan">HP: ${player.health}/${getEffectiveMaxHealth(player)} &nbsp; Energy: ${player.energy}/${getEffectiveMaxEnergy(player)}</div>
      <div>Attack: ${getEffectiveAttack(player)}% &nbsp; Defence: ${getEffectiveDefence(player)} &nbsp; Dodge: ${getEffectiveDodge(player)} &nbsp; Hands: ${getEffectiveHands(player)}</div>
    </div>
  `);

  // Equipment panels side by side
  const weapons = getWeapons(player);
  const gear = getGear(player);
  const consumables = getConsumables(player);

  const weaponHtml = weapons.length === 0
    ? `<div class="t-dim">(none)</div>`
    : weapons.map((w) =>
      `<div class="t-green">${esc(w.name)} &mdash; ${w.damage} dmg, ${w.accuracy}% acc, ${w.energyCost} en, ${w.hands}h</div>`
    ).join("");

  // Group gear by name for stack display
  const gearCounts = new Map<string, { g: typeof gear[0]; count: number }>();
  for (const g of gear) {
    const existing = gearCounts.get(g.name);
    if (existing) existing.count++;
    else gearCounts.set(g.name, { g, count: 1 });
  }

  const gearHtml = gear.length === 0
    ? `<div class="t-dim">(none)</div>`
    : [...gearCounts.values()].map(({ g, count }) => {
      const fx: string[] = [];
      if (g.healthBonus) fx.push(`+${g.healthBonus} HP`);
      if (g.energyBonus) fx.push(`+${g.energyBonus} Energy`);
      if (g.defenceBonus) fx.push(`+${g.defenceBonus} Def`);
      if (g.attackBonus) fx.push(`+${g.attackBonus}% Atk`);
      if (g.handsBonus) fx.push(`+${g.handsBonus} Hands`);
      if (g.dodgeBonus) fx.push(`+${g.dodgeBonus} Dodge`);
      if (g.moneyBonusPercent) fx.push(`+${g.moneyBonusPercent}% Money`);
      const countStr = count > 1 ? ` x${count}` : "";
      const fxStr = fx.length > 0 ? ` &mdash; ${fx.join(", ")}` : "";
      return `<div class="t-cyan">${esc(g.name)}${countStr}${fxStr}</div>`;
    }).join("");

  terminal.printHTML(`
    <div class="battle-layout">
      <div class="panel">
        <div class="t-yellow t-bold">Weapons</div>
        ${weaponHtml}
      </div>
      <div class="panel">
        <div class="t-yellow t-bold">Gear</div>
        ${gearHtml}
      </div>
    </div>
  `);

  if (consumables.length > 0) {
    const conHtml = consumables.map((c) =>
      `<div class="t-green">${esc(c.name)} &mdash; ${esc(c.description)}</div>`
    ).join("");
    terminal.printHTML(`<div class="panel"><div class="t-yellow t-bold">Items</div>${conHtml}</div>`);
  }

  terminal.print(`Inventory: ${player.inventory.length}/${player.inventorySize}`, "t-dim");
}
