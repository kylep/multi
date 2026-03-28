/** Shop screen. */

import type { Terminal, Choice } from "../terminal";
import type { GameState } from "../../engine/state";
import type { Gear, Consumable, Item, Weapon } from "../../engine/types";
import { buyItem, canBuy, getSellPrice, listAvailableItems, sellItem } from "../../engine/shop";
import { getEffectiveMaxEnergy, getEffectiveMaxHealth } from "../../engine/robot";
import { showRobotStats } from "./inspect";

function shopHeader(terminal: Terminal, state: GameState, activeTab: string): void {
  const player = state.player!;
  const invFull = player.inventory.length >= player.inventorySize;
  const invClass = invFull ? "t-red t-bold" : "";
  terminal.printHTML(
    `<div class="panel-header" style="margin-bottom:0"><span class="t-yellow t-bold">SHOP</span> &nbsp; <span class="t-yellow">$${player.money}</span> &nbsp; <span class="${invClass}">Inv: ${player.inventory.length}/${player.inventorySize}</span> &nbsp; <span class="t-dim">Lv.${player.level}</span></div>`
  );
  // Only show static tab bar on sub-screens (buy/sell)
  if (activeTab) {
    const tabs = ["Buy", "Sell", "Back"];
    const tabHtml = tabs.map((t) => {
      const val = t.toLowerCase();
      const isActive = val === activeTab;
      const isBack = val === "back";
      let cls = "btn";
      if (isActive) cls += " btn-primary";
      else if (isBack) cls += " btn-secondary";
      return `<span class="${cls}" style="display:inline-block;padding:4px 16px;margin:0 4px 0 0;cursor:default;font-size:14px">${t}</span>`;
    }).join("");
    terminal.printHTML(`<div style="margin:2px 0 8px 0">${tabHtml}</div>`);
  }
}

export async function shopScreen(terminal: Terminal, state: GameState): Promise<void> {
  const player = state.player!;

  while (true) {
    player.health = getEffectiveMaxHealth(player);
    player.energy = getEffectiveMaxEnergy(player);

    terminal.clear();
    shopHeader(terminal, state, "");
    // Main shop: tabs are the interactive choices (no static tab bar)
    const choice = await terminal.promptChoice("", [
      { label: "Buy", value: "buy" },
      { label: "Sell", value: "sell" },
      { label: "Inventory", value: "inventory" },
      { label: "Back", value: "back" },
    ], "row");

    if (choice === "back") break;
    if (choice === "buy") await buyMenu(terminal, state);
    else if (choice === "sell") await sellMenu(terminal, state);
    else if (choice === "inventory") {
      await showRobotStats(terminal, state);
      await terminal.promptContinue(0);
    }
  }
}

async function buyMenu(terminal: Terminal, state: GameState): Promise<void> {
  const player = state.player!;

  while (true) {
    terminal.clear();
    shopHeader(terminal, state, "buy");

    const available = listAvailableItems(state);

    const choices: Choice[] = [];
    for (let i = 0; i < available.length; i++) {
      const item = available[i];
      const check = canBuy(state, item);
      choices.push({
        label: `${item.name} — $${item.moneyCost}`,
        value: String(i),
        subtitle: itemSummary(item) + (check.ok ? "" : ` [${check.reason}]`),
        disabled: !check.ok,
      });
    }
    choices.push({ label: "Back", value: "back" });

    const choice = await terminal.promptChoice("", choices, "grid");

    if (choice === "back") break;

    const idx = parseInt(choice, 10);
    if (idx >= 0 && idx < available.length) {
      const item = available[idx];
      const confirmed = await terminal.promptConfirm(
        `Buy ${item.name} for $${item.moneyCost}?`,
        "Buy",
        "Cancel",
      );
      if (confirmed) {
        buyItem(state, item);
      }
    }
  }
}

async function sellMenu(terminal: Terminal, state: GameState): Promise<void> {
  const player = state.player!;

  while (true) {
    terminal.clear();
    shopHeader(terminal, state, "sell");

    if (player.inventory.length === 0) {
      terminal.print("(No items to sell)", "t-dim");
      await terminal.promptContinue(0);
      break;
    }

    const choices: Choice[] = [];
    for (let i = 0; i < player.inventory.length; i++) {
      const item = player.inventory[i];
      choices.push({
        label: `${item.name} — $${getSellPrice(item)}`,
        value: String(i),
        subtitle: itemSummary(item),
      });
    }
    choices.push({ label: "Back", value: "back" });

    const choice = await terminal.promptChoice("", choices, "grid");

    if (choice === "back") break;

    const idx = parseInt(choice, 10);
    if (idx >= 0 && idx < player.inventory.length) {
      const item = player.inventory[idx];
      const confirmed = await terminal.promptConfirm(
        `Sell ${item.name} for $${getSellPrice(item)}?`,
        "Sell",
        "Cancel",
      );
      if (confirmed) {
        sellItem(state, item);
      }
    }
  }
}

function itemSummary(item: Item): string {
  if (item.itemType === "weapon") {
    const w = item as Weapon;
    return `${w.damage} dmg, ${w.accuracy}% acc, ${w.energyCost} energy, ${w.hands}h`;
  }
  if (item.itemType === "gear") {
    const g = item as Gear;
    const parts: string[] = [];
    if (g.healthBonus) parts.push(`+${g.healthBonus} HP`);
    if (g.energyBonus) parts.push(`+${g.energyBonus} Energy`);
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
    if (c.energyRestore) parts.push(`+${c.energyRestore} Energy`);
    if (c.tempDefence) parts.push(`+${c.tempDefence} Temp Def`);
    if (c.tempAttack) parts.push(`+${c.tempAttack}% Temp Atk`);
    if (c.damage) parts.push(`${c.damage} Dmg`);
    if (c.enemyDodgeReduction) parts.push(`-${c.enemyDodgeReduction} Dodge`);
    return parts.length ? parts.join(", ") : item.description;
  }
  return "";
}
