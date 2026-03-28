/** Shop engine — pure functions. */

import type { Gear, Item, Robot, ShopResult } from "./types";
import type { GameState } from "./state";
import { getGear, hasItem } from "./robot";

export function listAvailableItems(state: GameState): Item[] {
  const player = state.player!;
  return state.registry.getItemsForLevel(player.level);
}

export function canBuy(state: GameState, item: Item): { ok: boolean; reason: string } {
  const player = state.player!;

  if (item.level > player.level) return { ok: false, reason: `Requires level ${item.level}` };
  if (player.money < item.moneyCost)
    return { ok: false, reason: `Not enough money (need ${item.moneyCost}, have ${player.money})` };
  if (player.inventory.length >= player.inventorySize) return { ok: false, reason: "Inventory is full" };

  for (const req of item.requirements) {
    if (!hasItem(player, req)) return { ok: false, reason: `Requires ${req}` };
  }

  if (item.itemType === "gear") {
    if (getGear(player).some((g) => g.name === item.name)) {
      return { ok: false, reason: "You already have this gear equipped" };
    }
  }

  return { ok: true, reason: "" };
}

export function buyItem(state: GameState, item: Item): ShopResult {
  const check = canBuy(state, item);
  if (!check.ok) return { success: false, message: check.reason, moneySpent: 0, moneyGained: 0 };

  const player = state.player!;
  player.money -= item.moneyCost;
  // Deep copy the item so each purchase is a unique instance
  player.inventory.push({ ...item });

  return {
    success: true,
    message: `Bought ${item.name} for $${item.moneyCost}`,
    moneySpent: item.moneyCost,
    moneyGained: 0,
  };
}

export function getSellPrice(item: Item): number {
  return Math.floor(item.moneyCost / 2);
}

export function sellItem(state: GameState, item: Item): ShopResult {
  const player = state.player!;
  const idx = player.inventory.indexOf(item);
  if (idx === -1) return { success: false, message: "Item not in inventory", moneySpent: 0, moneyGained: 0 };

  const sellPrice = getSellPrice(item);
  player.inventory.splice(idx, 1);
  player.money += sellPrice;

  return {
    success: true,
    message: `Sold ${item.name} for $${sellPrice}`,
    moneySpent: 0,
    moneyGained: sellPrice,
  };
}
