/** Shop screen — tabbed single-page UI. */

import type { Terminal, Choice } from "../terminal";
import type { GameState } from "../../engine/state";
import type { Gear, Consumable, Item, Weapon } from "../../engine/types";
import { buyItem, canBuy, getSellPrice, listAvailableItems, sellItem } from "../../engine/shop";
import {
  getEffectiveMaxEnergy,
  getEffectiveMaxHealth,
  getEffectiveAttack,
  getEffectiveDefence,
  getEffectiveDodge,
  getEffectiveHands,
  getWeapons,
  getGear,
  getConsumables,
} from "../../engine/robot";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderShopHeader(terminal: Terminal, state: GameState): void {
  const player = state.player!;
  const invFull = player.inventory.length >= player.inventorySize;
  const invClass = invFull ? "t-red t-bold" : "";

  terminal.printHTML(
    `<div class="panel-header" style="margin-bottom:4px"><span class="t-yellow t-bold">SHOP</span> &nbsp; <span class="t-yellow">$${player.money}</span> &nbsp; <span class="${invClass}">Inv: ${player.inventory.length}/${player.inventorySize}</span> &nbsp; <span class="t-dim">Lv.${player.level}</span></div>`
  );
}

/** Tab navigation choices to prepend to any shop grid */
function shopTabChoices(exclude: string): Choice[] {
  const tabs = ["Buy", "Sell", "Inventory"];
  return tabs
    .filter((t) => t.toLowerCase() !== exclude)
    .map((t) => ({ label: t, value: t.toLowerCase() }));
}

export async function shopScreen(terminal: Terminal, state: GameState): Promise<void> {
  const player = state.player!;
  let currentTab = "buy";

  while (true) {
    player.health = getEffectiveMaxHealth(player);
    player.energy = getEffectiveMaxEnergy(player);

    terminal.clear();
    renderShopHeader(terminal, state);

    if (currentTab === "buy") {
      const result = await renderBuyTab(terminal, state);
      if (result === "back") break;
      if (result === "sell" || result === "inventory") { currentTab = result; continue; }
      // Otherwise stayed on buy (bought something), loop to re-render
    } else if (currentTab === "sell") {
      const result = await renderSellTab(terminal, state);
      if (result === "back") break;
      if (result === "buy" || result === "inventory") { currentTab = result; continue; }
    } else if (currentTab === "inventory") {
      const result = await renderInventoryTab(terminal, state);
      if (result === "back") break;
      if (result === "buy" || result === "sell") { currentTab = result; continue; }
    }
  }
}

async function renderBuyTab(terminal: Terminal, state: GameState): Promise<string> {
  // Tab nav row
  const navChoices = [...shopTabChoices("buy"), { label: "Back", value: "back" }];
  terminal.print("BUY", "t-yellow t-bold");

  const available = listAvailableItems(state);

  const choices: Choice[] = [];
  for (let i = 0; i < available.length; i++) {
    const item = available[i];
    const check = canBuy(state, item);
    choices.push({
      label: `${item.name} — $${item.moneyCost}`,
      value: `buy-${i}`,
      subtitle: itemSummary(item) + (check.ok ? "" : ` [${check.reason}]`),
      disabled: !check.ok,
    });
  }

  // Nav at bottom of grid
  for (const nav of navChoices) choices.push(nav);

  const choice = await terminal.promptChoice("", choices, "grid");

  if (choice === "back" || choice === "sell" || choice === "inventory") return choice;

  if (choice.startsWith("buy-")) {
    const idx = parseInt(choice.slice(4), 10);
    if (idx >= 0 && idx < available.length) {
      const item = available[idx];
      const confirmed = await terminal.promptConfirm(
        `Buy ${item.name} for $${item.moneyCost}?`,
        "Buy",
        "Cancel",
      );
      if (confirmed) buyItem(state, item);
    }
  }

  return "buy"; // stay on buy tab
}

async function renderSellTab(terminal: Terminal, state: GameState): Promise<string> {
  const player = state.player!;
  const navChoices = [...shopTabChoices("sell"), { label: "Back", value: "back" }];
  terminal.print("SELL", "t-yellow t-bold");

  if (player.inventory.length === 0) {
    terminal.print("(No items to sell)", "t-dim");
  }

  const choices: Choice[] = [];
  for (let i = 0; i < player.inventory.length; i++) {
    const item = player.inventory[i];
    choices.push({
      label: `${item.name} — $${getSellPrice(item)}`,
      value: `sell-${i}`,
      subtitle: itemSummary(item),
    });
  }

  for (const nav of navChoices) choices.push(nav);

  const choice = await terminal.promptChoice("", choices, "grid");

  if (choice === "back" || choice === "buy" || choice === "inventory") return choice;

  if (choice.startsWith("sell-")) {
    const idx = parseInt(choice.slice(5), 10);
    if (idx >= 0 && idx < player.inventory.length) {
      const item = player.inventory[idx];
      const confirmed = await terminal.promptConfirm(
        `Sell ${item.name} for $${getSellPrice(item)}?`,
        "Sell",
        "Cancel",
      );
      if (confirmed) sellItem(state, item);
    }
  }

  return "sell"; // stay on sell tab
}

async function renderInventoryTab(terminal: Terminal, state: GameState): Promise<string> {
  const player = state.player!;
  terminal.print("INVENTORY", "t-yellow t-bold");

  // Compact stats
  terminal.printHTML(
    `<div class="panel" style="padding:6px 10px"><span class="t-cyan">HP: ${player.health}/${getEffectiveMaxHealth(player)}</span> &nbsp; <span class="t-cyan">EN: ${player.energy}/${getEffectiveMaxEnergy(player)}</span> &nbsp; Atk: ${getEffectiveAttack(player)}% &nbsp; Def: ${getEffectiveDefence(player)} &nbsp; Dodge: ${getEffectiveDodge(player)} &nbsp; Hands: ${getEffectiveHands(player)}</div>`
  );

  // Equipment side by side
  const weapons = getWeapons(player);
  const gear = getGear(player);
  const consumables = getConsumables(player);

  const weaponHtml = weapons.length === 0
    ? `<div class="t-dim">(none)</div>`
    : weapons.map((w) => `<div class="t-green">${esc(w.name)} — ${w.damage}dmg, ${w.accuracy}%acc</div>`).join("");

  // Group gear by name (for stackable items like Shotgun Shell)
  const gearCounts = new Map<string, { gear: typeof gear[0]; count: number }>();
  for (const g of gear) {
    const existing = gearCounts.get(g.name);
    if (existing) existing.count++;
    else gearCounts.set(g.name, { gear: g, count: 1 });
  }

  const gearHtml = gear.length === 0
    ? `<div class="t-dim">(none)</div>`
    : [...gearCounts.values()].map(({ gear: g, count }) => {
      const fx: string[] = [];
      if (g.healthBonus) fx.push(`+${g.healthBonus}HP`);
      if (g.energyBonus) fx.push(`+${g.energyBonus}EN`);
      if (g.defenceBonus) fx.push(`+${g.defenceBonus}Def`);
      if (g.attackBonus) fx.push(`+${g.attackBonus}%Atk`);
      if (g.handsBonus) fx.push(`+${g.handsBonus}H`);
      if (g.dodgeBonus) fx.push(`+${g.dodgeBonus}Dodge`);
      if (g.moneyBonusPercent) fx.push(`+${g.moneyBonusPercent}%$`);
      const countStr = count > 1 ? ` x${count}` : "";
      const fxStr = fx.length > 0 ? ` — ${fx.join(", ")}` : "";
      return `<div class="t-cyan">${esc(g.name)}${countStr}${fxStr}</div>`;
    }).join("");

  terminal.printHTML(`<div class="battle-layout"><div class="panel" style="padding:6px 10px"><div class="t-yellow t-bold">Weapons</div>${weaponHtml}</div><div class="panel" style="padding:6px 10px"><div class="t-yellow t-bold">Gear</div>${gearHtml}</div></div>`);

  if (consumables.length > 0) {
    const conHtml = consumables.map((c) => `<div class="t-green">${esc(c.name)}</div>`).join("");
    terminal.printHTML(`<div class="panel" style="padding:6px 10px"><div class="t-yellow t-bold">Items</div>${conHtml}</div>`);
  }

  // Nav
  const navChoices = [...shopTabChoices("inventory"), { label: "Back", value: "back" }];
  const choice = await terminal.promptChoice("", navChoices, "row");
  return choice;
}

function itemSummary(item: Item): string {
  if (item.itemType === "weapon") {
    const w = item as Weapon;
    return `${w.damage} dmg, ${w.accuracy}% acc, ${w.energyCost} en, ${w.hands}h`;
  }
  if (item.itemType === "gear") {
    const g = item as Gear;
    const parts: string[] = [];
    if (g.healthBonus) parts.push(`+${g.healthBonus} HP`);
    if (g.energyBonus) parts.push(`+${g.energyBonus} EN`);
    if (g.defenceBonus) parts.push(`+${g.defenceBonus} Def`);
    if (g.attackBonus) parts.push(`+${g.attackBonus}% Atk`);
    if (g.handsBonus) parts.push(`+${g.handsBonus} Hands`);
    if (g.dodgeBonus) parts.push(`+${g.dodgeBonus} Dodge`);
    if (g.moneyBonusPercent) parts.push(`+${g.moneyBonusPercent}% Money`);
    return parts.length ? parts.join(", ") : item.description;
  }
  if (item.itemType === "consumable") {
    const c = item as Consumable;
    const parts: string[] = [];
    if (c.healthRestore) parts.push(`+${c.healthRestore} HP`);
    if (c.energyRestore) parts.push(`+${c.energyRestore} EN`);
    if (c.tempDefence) parts.push(`+${c.tempDefence} Temp Def`);
    if (c.tempAttack) parts.push(`+${c.tempAttack}% Temp Atk`);
    if (c.damage) parts.push(`${c.damage} Dmg`);
    if (c.enemyDodgeReduction) parts.push(`-${c.enemyDodgeReduction} Dodge`);
    return parts.length ? parts.join(", ") : item.description;
  }
  return "";
}
