/** Shop screen. */

import type { Terminal, Choice } from "../terminal";
import type { GameState } from "../../engine/state";
import type { Gear, Consumable, Item, Weapon } from "../../engine/types";
import { buyItem, canBuy, getSellPrice, listAvailableItems, sellItem } from "../../engine/shop";
import { getEffectiveMaxEnergy, getEffectiveMaxHealth } from "../../engine/robot";
import { showRobotStats } from "./inspect";

export async function shopScreen(terminal: Terminal, state: GameState): Promise<void> {
  const player = state.player!;

  while (true) {
    // Auto-heal in shop
    player.health = getEffectiveMaxHealth(player);
    player.energy = getEffectiveMaxEnergy(player);

    terminal.clear();
    terminal.print("");
    terminal.print("=== SHOP ===", "t-yellow t-bold");
    terminal.print(`Level: ${player.level} | Money: $${player.money} | Inventory: ${player.inventory.length}/${player.inventorySize}`);
    terminal.print("");

    const choice = await terminal.promptChoice("What would you like to do?", [
      { label: "1. Buy", value: "buy" },
      { label: "2. Sell", value: "sell" },
      { label: "3. Inventory", value: "inventory" },
      { label: "4. Back", value: "back" },
    ]);

    if (choice === "back") break;
    if (choice === "buy") await buyMenu(terminal, state);
    else if (choice === "sell") await sellMenu(terminal, state);
    else if (choice === "inventory") {
      await showRobotStats(terminal, state);
      await terminal.promptContinue();
    }
  }
}

async function buyMenu(terminal: Terminal, state: GameState): Promise<void> {
  const player = state.player!;

  while (true) {
    terminal.clear();
    terminal.print("");
    terminal.print("=== BUY ===", "t-yellow t-bold");
    terminal.print(`Level: ${player.level} | Money: $${player.money} | Inventory: ${player.inventory.length}/${player.inventorySize}`);
    terminal.print("");

    const available = listAvailableItems(state);

    const choices: Choice[] = [{ label: "B. Back", value: "back" }];
    for (let i = 0; i < available.length; i++) {
      const item = available[i];
      const check = canBuy(state, item);
      const status = check.ok ? "" : ` [${check.reason}]`;
      choices.push({
        label: `${i + 1}. ${item.name} - $${item.moneyCost}${status}\n     ${itemSummary(item)}`,
        value: String(i),
      });
    }

    const choice = await terminal.promptChoice("Select an item to buy:", choices);

    if (choice === "back") break;

    const idx = parseInt(choice, 10);
    if (idx >= 0 && idx < available.length) {
      const item = available[idx];
      const check = canBuy(state, item);

      if (!check.ok) {
        await terminal.promptConfirm(`${item.name}: ${check.reason}`, "OK", "OK");
      } else {
        const confirmed = await terminal.promptConfirm(
          `Buy ${item.name} for $${item.moneyCost}?`,
          "Buy",
          "Cancel",
        );
        if (confirmed) {
          const result = buyItem(state, item);
          terminal.print(result.message, result.success ? "t-green" : "t-red");
        }
      }
    }
  }
}

async function sellMenu(terminal: Terminal, state: GameState): Promise<void> {
  const player = state.player!;

  while (true) {
    terminal.clear();
    terminal.print("");
    terminal.print("=== SELL ===", "t-yellow t-bold");
    terminal.print(`Level: ${player.level} | Money: $${player.money} | Inventory: ${player.inventory.length}/${player.inventorySize}`);
    terminal.print("");

    if (player.inventory.length === 0) {
      terminal.print("(No items to sell)");
      await terminal.promptContinue();
      break;
    }

    const choices: Choice[] = [{ label: "B. Back", value: "back" }];
    for (let i = 0; i < player.inventory.length; i++) {
      const item = player.inventory[i];
      choices.push({
        label: `${i + 1}. ${item.name} - $${getSellPrice(item)}`,
        value: String(i),
      });
    }

    const choice = await terminal.promptChoice("Select an item to sell:", choices);

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
        const result = sellItem(state, item);
        terminal.print(result.message, result.success ? "t-green" : "t-red");
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

function showItemDetails(terminal: Terminal, item: Item): void {
  terminal.print("");
  terminal.print(`  ${item.description}`, "t-dim");
  if (item.itemType === "weapon") {
    const w = item as Weapon;
    terminal.print(`  Damage: ${w.damage} | Energy: ${w.energyCost} | Accuracy: ${w.accuracy} | Hands: ${w.hands}`, "t-dim");
  } else if (item.itemType === "gear") {
    const g = item as Gear;
    const effects: string[] = [];
    if (g.healthBonus) effects.push(`+${g.healthBonus} HP`);
    if (g.energyBonus) effects.push(`+${g.energyBonus} Energy`);
    if (g.defenceBonus) effects.push(`+${g.defenceBonus} Def`);
    if (g.attackBonus) effects.push(`+${g.attackBonus}% Atk`);
    if (g.handsBonus) effects.push(`+${g.handsBonus} Hands`);
    if (g.dodgeBonus) effects.push(`+${g.dodgeBonus} Dodge`);
    if (g.moneyBonusPercent) effects.push(`+${g.moneyBonusPercent}% Money`);
    if (effects.length) terminal.print(`  Effects: ${effects.join(", ")}`, "t-dim");
  } else if (item.itemType === "consumable") {
    const c = item as Consumable;
    const effects: string[] = [];
    if (c.healthRestore) effects.push(`+${c.healthRestore} HP`);
    if (c.energyRestore) effects.push(`+${c.energyRestore} Energy`);
    if (c.tempDefence) effects.push(`+${c.tempDefence} Temp Def`);
    if (c.tempAttack) effects.push(`+${c.tempAttack}% Temp Atk`);
    if (c.damage) effects.push(`${c.damage} Dmg`);
    if (c.enemyDodgeReduction) effects.push(`-${c.enemyDodgeReduction} Dodge`);
    if (effects.length) terminal.print(`  Effects: ${effects.join(", ")}`, "t-dim");
  }
}
