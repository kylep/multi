/** Shop engine — pure functions. */

import type { Gear, Item, Robot, ShopResult } from "./types";
import type { GameState } from "./state";
import { getGear, hasItem } from "./robot";

/** Count inventory slots used. Consumables and ammo are free, other stackable gear groups count as 1 slot. */
export function countInventorySlots(player: Robot): number {
  const stacked = new Set<string>();
  let count = 0;
  for (const item of player.inventory) {
    if (item.itemType === "consumable") continue;
    if (item.itemType === "gear" && (item as Gear).category === "Ammo") continue;
    if (item.itemType === "gear" && (item as Gear).stackable) {
      if (!stacked.has(item.name)) {
        stacked.add(item.name);
        count++;
      }
    } else {
      count++;
    }
  }
  return count;
}

export function listAvailableItems(state: GameState): Item[] {
  return state.registry.getAllItems();
}

function isAmmoGear(item: Item): boolean {
  if (item.itemType !== "gear") return false;
  const g = item as Gear;
  return g.healthBonus === 0 && g.energyBonus === 0 && g.defenceBonus === 0
    && g.attackBonus === 0 && g.handsBonus === 0 && g.dodgeBonus === 0
    && g.moneyBonusPercent === 0;
}

export function canBuy(state: GameState, item: Item): { ok: boolean; reason: string } {
  const player = state.player!;
  const sandbox = player.settings.mode === "sandbox";

  if (!sandbox && item.level > player.level) return { ok: false, reason: `Requires level ${item.level}` };
  if (!sandbox && player.money < item.moneyCost)
    return { ok: false, reason: `Not enough money (need ${item.moneyCost}, have ${player.money})` };

  for (const req of item.requirements) {
    if (!hasItem(player, req)) return { ok: false, reason: `Requires ${req}` };
  }

  if (item.itemType === "gear") {
    const gear = item as Gear;
    if (!gear.stackable && getGear(player).some((g) => g.name === item.name)) {
      return { ok: false, reason: "You already have this gear equipped" };
    }
  }

  // Consumables don't take inventory space
  if (item.itemType === "consumable") return { ok: true, reason: "" };

  // Ammo doesn't take inventory space but has a max stack
  if (item.itemType === "gear" && (item as Gear).category === "Ammo") {
    const g = item as Gear;
    if (g.maxStack > 0) {
      const owned = player.inventory.filter((inv) => inv.name === item.name).length;
      if (owned >= g.maxStack) return { ok: false, reason: `Max ${g.maxStack} allowed` };
    }
    return { ok: true, reason: "" };
  }

  // Stackable items don't need a free slot if you already have one
  if (item.itemType === "gear" && (item as Gear).stackable && hasItem(player, item.name)) {
    // Enforce max stack limit
    const g = item as Gear;
    if (g.maxStack > 0) {
      const owned = player.inventory.filter((inv) => inv.name === item.name).length;
      if (owned >= g.maxStack) return { ok: false, reason: `Max ${g.maxStack} allowed` };
    }
    return { ok: true, reason: "" };
  }

  if (countInventorySlots(player) >= player.inventorySize) return { ok: false, reason: "Inventory is full" };

  return { ok: true, reason: "" };
}

export function buyItem(state: GameState, item: Item): ShopResult {
  const check = canBuy(state, item);
  if (!check.ok) return { success: false, message: check.reason, moneySpent: 0, moneyGained: 0 };

  const player = state.player!;
  const sandbox = player.settings.mode === "sandbox";
  if (!sandbox) player.money -= item.moneyCost;
  // Shallow copy so each purchase is a unique instance
  player.inventory.push({ ...item });

  return {
    success: true,
    message: sandbox ? `Got ${item.name}` : `Bought ${item.name} for $${item.moneyCost}`,
    moneySpent: sandbox ? 0 : item.moneyCost,
    moneyGained: 0,
  };
}

export function getSellPrice(item: Item): number {
  return item.moneyCost;
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
