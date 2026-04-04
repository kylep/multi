/** Shop screen — tabbed single-page UI. */

import type { Terminal, Choice } from "../terminal";
import type { GameState } from "../../engine/state";
import type { Gear, Consumable, Item, Robot, Weapon } from "../../engine/types";
import { buyItem, canBuy, countInventorySlots, getSellPrice, listAvailableItems, sellItem } from "../../engine/shop";
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
  getWeaponEnergyCost,
} from "../../engine/robot";
import type { SoundPlayer } from "../sound";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderShopHeader(terminal: Terminal, state: GameState): void {
  const player = state.player!;
  const slots = countInventorySlots(player);
  const invFull = slots >= player.inventorySize;
  const invClass = invFull ? "t-red t-bold" : "";

  terminal.printHTML(
    `<div class="panel-header" style="margin-bottom:4px"><span class="t-yellow t-bold">SHOP</span> &nbsp; <span class="t-yellow">$${player.money}</span> &nbsp; <span class="${invClass}">Inv: ${slots}/${player.inventorySize}</span> &nbsp; <span class="t-dim">Lv.${player.level}</span></div>`
  );
}

/** Tab bar choices — all tabs always shown, active tab highlighted */
function shopTabChoices(activeTab: string, filterOn?: boolean): Choice[] {
  const tabs = ["Buy", "Sell", "Inventory"];
  const choices: Choice[] = tabs.map((t) => ({
    label: t,
    value: t.toLowerCase(),
    group: "tab",
    active: t.toLowerCase() === activeTab,
  }));
  if (filterOn !== undefined) {
    choices.push({
      label: filterOn ? "Filter: On" : "Filter: Off",
      value: "toggle-filter",
      group: "tab",
      active: filterOn,
    });
  }
  choices.push({ label: "Back", value: "back", group: "tab", active: false });
  return choices;
}

export async function shopScreen(terminal: Terminal, state: GameState, sound?: SoundPlayer): Promise<void> {
  const player = state.player!;
  let currentTab = "buy";
  let filterOn = true;
  const collapsed = new Set<string>();

  while (true) {
    player.health = getEffectiveMaxHealth(player);
    player.energy = getEffectiveMaxEnergy(player);

    terminal.clear();
    renderShopHeader(terminal, state);

    if (currentTab === "buy") {
      const result = await renderBuyTab(terminal, state, filterOn, collapsed, sound);
      if (result === "back") break;
      if (result === "toggle-filter") { filterOn = !filterOn; continue; }
      if (result === "sell" || result === "inventory") { currentTab = result; continue; }
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

async function renderBuyTab(terminal: Terminal, state: GameState, filterOn: boolean, collapsed: Set<string>, sound?: SoundPlayer): Promise<string> {
  const allItems = listAvailableItems(state);
  const player = state.player!;
  const available = filterOn
    ? allItems.filter((i) => i.level <= player.level)
    : allItems;

  // Group by type with section headers
  const weapons = available.filter((i) => i.itemType === "weapon");
  const gear = available.filter((i) => i.itemType === "gear");
  const consumables = available.filter((i) => i.itemType === "consumable");

  // Sub-categorize gear
  const gearCategoryOrder = ["Armor", "Battery", "Chip", "Booster", "Ammo"];
  const gearByCategory = new Map<string, typeof gear>();
  for (const item of gear) {
    const cat = (item as Gear).category || "Other";
    if (!gearByCategory.has(cat)) gearByCategory.set(cat, []);
    gearByCategory.get(cat)!.push(item);
  }

  const choices: Choice[] = [...shopTabChoices("buy", filterOn)];

  function addItemSection(label: string, items: typeof available): void {
    if (items.length === 0) return;
    const isCollapsed = collapsed.has(label);
    const arrow = isCollapsed ? "▶" : "▼";
    choices.push({ label: `${arrow} ${label}`, value: `toggle-section-${label}`, group: "header" });
    if (isCollapsed) return;
    for (const item of items) {
      const i = available.indexOf(item);
      const check = canBuy(state, item);
      const owned = item.itemType === "gear" && (item as Gear).stackable
        ? player.inventory.filter((inv) => inv.name === item.name).length
        : 0;
      const maxStack = item.itemType === "gear" ? (item as Gear).maxStack : 0;
      const ownedTag = owned > 0 ? ` (${owned}${maxStack > 0 ? `/${maxStack}` : ""})` : "";
      choices.push({
        label: `${item.name}${ownedTag} — $${item.moneyCost}`,
        value: `buy-${i}`,
        subtitle: itemSummary(item, state.player!) + (check.ok ? "" : ` [${check.reason}]`),
        disabled: !check.ok,
      });
    }
  }

  addItemSection("--- Weapons ---", weapons);
  for (const cat of gearCategoryOrder) {
    const items = gearByCategory.get(cat);
    if (items && items.length > 0) addItemSection(`--- ${cat} ---`, items);
  }
  // Any uncategorized gear
  for (const [cat, items] of gearByCategory) {
    if (!gearCategoryOrder.includes(cat) && items.length > 0) {
      addItemSection(`--- ${cat} ---`, items);
    }
  }
  addItemSection("--- Consumables ---", consumables);

  choices.push({ label: "Back", value: "back", subtitle: "Return to main menu" });

  const choice = await terminal.promptChoice("", choices, "grid");

  if (choice === "back" || choice === "sell" || choice === "inventory" || choice === "toggle-filter") return choice;

  if (choice.startsWith("toggle-section-")) {
    const sectionLabel = choice.slice("toggle-section-".length);
    if (collapsed.has(sectionLabel)) collapsed.delete(sectionLabel);
    else collapsed.add(sectionLabel);
    return "buy"; // re-render
  }

  if (choice.startsWith("buy-")) {
    const idx = parseInt(choice.slice(4), 10);
    if (idx >= 0 && idx < available.length) {
      const item = available[idx];
      const isConsumable = item.itemType === "consumable";
      const isAmmo = item.itemType === "gear" && (item as Gear).category === "Ammo";
      const isStackable = isConsumable || isAmmo;

      if (isStackable) {
        // Quantity purchase for stackable items
        const maxStackLimit = isConsumable ? (item as Consumable).maxStack : (item as Gear).maxStack;
        const owned = player.inventory.filter((inv) => inv.name === item.name).length;
        const canBuyMax = maxStackLimit > 0 ? maxStackLimit - owned : 99;
        const affordMax = player.settings.mode === "sandbox" ? canBuyMax : Math.floor(player.money / item.moneyCost);
        const maxQty = Math.min(canBuyMax, affordMax);

        if (maxQty <= 0) {
          // Can't buy any
        } else if (maxQty === 1) {
          const confirmed = await terminal.promptConfirm(
            `Buy ${item.name} for $${item.moneyCost}?`,
            "Buy",
            "Cancel",
          );
          if (confirmed) { buyItem(state, item); sound?.buy(); }
        } else {
          // Show quantity prompt
          const qtyStr = await terminal.promptText(`Buy ${item.name} ($${item.moneyCost} each) — How many? (1-${maxQty}):`);
          const qty = parseInt(qtyStr, 10);
          if (!isNaN(qty) && qty > 0) {
            const actualQty = Math.min(qty, maxQty);
            const totalCost = actualQty * item.moneyCost;
            const confirmed = await terminal.promptConfirm(
              `Buy ${actualQty}x ${item.name} for $${totalCost.toLocaleString()}?`,
              "Buy",
              "Cancel",
            );
            if (confirmed) {
              for (let q = 0; q < actualQty; q++) buyItem(state, item);
              sound?.buy();
            }
          }
        }
      } else {
        const confirmed = await terminal.promptConfirm(
          `Buy ${item.name} for $${item.moneyCost}?`,
          "Buy",
          "Cancel",
        );
        if (confirmed) {
          buyItem(state, item);
          sound?.buy();
        }
      }
    }
  }

  return "buy"; // stay on buy tab
}

async function renderSellTab(terminal: Terminal, state: GameState): Promise<string> {
  const player = state.player!;

  if (player.inventory.length === 0) {
    terminal.print("(No items to sell)", "t-dim");
  }

  // Group items by name for display
  const itemGroups = new Map<string, { item: typeof player.inventory[0]; count: number; firstIndex: number }>();
  for (let i = 0; i < player.inventory.length; i++) {
    const item = player.inventory[i];
    const existing = itemGroups.get(item.name);
    if (existing) {
      existing.count++;
    } else {
      itemGroups.set(item.name, { item, count: 1, firstIndex: i });
    }
  }

  // Split into sections: equipment (uses slots), ammo, consumables (free)
  const equipment: typeof itemGroups extends Map<string, infer V> ? [string, V][] : never = [];
  const ammo: typeof equipment = [];
  const consumableItems: typeof equipment = [];
  for (const entry of itemGroups) {
    const item = entry[1].item;
    if (item.itemType === "consumable") consumableItems.push(entry);
    else if (item.itemType === "gear" && (item as Gear).category === "Ammo") ammo.push(entry);
    else equipment.push(entry);
  }

  const choices: Choice[] = [...shopTabChoices("sell")];

  function addSellSection(label: string, entries: typeof equipment): void {
    if (entries.length === 0) return;
    choices.push({ label, value: `header-${label}`, disabled: true, group: "header" });
    for (const [name, { item, count, firstIndex }] of entries) {
      const countStr = count > 1 ? ` (${count})` : "";
      choices.push({
        label: `${name}${countStr} — $${getSellPrice(item)}`,
        value: `sell-${firstIndex}`,
        subtitle: itemSummary(item, state.player!),
      });
    }
  }

  addSellSection("--- Equipment ---", equipment);
  addSellSection("--- Ammo ---", ammo);
  // Consumables cannot be sold

  choices.push({ label: "Back", value: "back", subtitle: "Return to main menu" });

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

  // Build inventory content HTML
  const statsHtml = `<div class="panel" style="padding:6px 10px"><span class="t-cyan">HP: ${player.health}/${getEffectiveMaxHealth(player)}</span> &nbsp; <span class="t-cyan">EN: ${player.energy}/${getEffectiveMaxEnergy(player)}</span> &nbsp; Atk: ${getEffectiveAttack(player)}% &nbsp; Def: ${getEffectiveDefence(player)} &nbsp; Dodge: ${getEffectiveDodge(player)} &nbsp; Hands: ${getEffectiveHands(player)}</div>`;

  const weapons = getWeapons(player);
  const gear = getGear(player);
  const consumables = getConsumables(player);

  const weaponCounts = new Map<string, { weapon: typeof weapons[0]; count: number }>();
  for (const w of weapons) {
    const existing = weaponCounts.get(w.name);
    if (existing) existing.count++;
    else weaponCounts.set(w.name, { weapon: w, count: 1 });
  }
  const weaponHtml = weapons.length === 0
    ? `<div class="t-dim">(none)</div>`
    : [...weaponCounts.values()].map(({ weapon: w, count }) => {
      const countStr = count > 1 ? ` (${count})` : "";
      return `<div class="t-green">${esc(w.name)}${countStr} — ${w.damage}dmg, ${w.accuracy}%acc</div>`;
    }).join("");

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
      if (g.accuracyBonus) fx.push(`+${g.accuracyBonus}Acc`);
      if (g.moneyBonusPercent) fx.push(`+${g.moneyBonusPercent}%$`);
      const countStr = count > 1 ? ` x${count}` : "";
      const fxStr = fx.length > 0 ? ` — ${fx.join(", ")}` : "";
      return `<div class="t-cyan">${esc(g.name)}${countStr}${fxStr}</div>`;
    }).join("");

  let contentHTML = statsHtml;
  contentHTML += `<div class="battle-layout"><div class="panel" style="padding:6px 10px"><div class="t-yellow t-bold">Weapons</div>${weaponHtml}</div><div class="panel" style="padding:6px 10px"><div class="t-yellow t-bold">Gear</div>${gearHtml}</div></div>`;

  if (consumables.length > 0) {
    const conCounts = new Map<string, number>();
    for (const c of consumables) {
      conCounts.set(c.name, (conCounts.get(c.name) ?? 0) + 1);
    }
    const conHtml = [...conCounts.entries()].map(([name, count]) => {
      const countStr = count > 1 ? ` (${count})` : "";
      return `<div class="t-green">${esc(name)}${countStr}</div>`;
    }).join("");
    contentHTML += `<div class="panel" style="padding:6px 10px"><div class="t-yellow t-bold">Items</div>${conHtml}</div>`;
  }

  // Tab bar with inventory content below it
  const choices: Choice[] = [...shopTabChoices("inventory")];
  choices.push({ label: "Back", value: "back", subtitle: "Return to main menu" });
  const choice = await terminal.promptChoice("", choices, "grid", contentHTML);
  return choice;
}

function itemSummary(item: Item, player: Robot): string {
  if (item.itemType === "weapon") {
    const w = item as Weapon;
    return `${w.damage} dmg, ${w.accuracy}% acc, ${getWeaponEnergyCost(w, player)} en, ${w.hands}h`;
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
    if (g.accuracyBonus) parts.push(`+${g.accuracyBonus} Acc`);
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
    if (c.damageBlock) parts.push(`Blocks ${c.damageBlock} Dmg`);
    if (c.enemyDodgeReduction) parts.push(`-${c.enemyDodgeReduction} Dodge`);
    if (c.accuracyBonus) parts.push(`+${c.accuracyBonus} Acc`);
    return parts.length ? parts.join(", ") : item.description;
  }
  return "";
}
