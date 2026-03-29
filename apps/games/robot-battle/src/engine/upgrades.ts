/** Permanent upgrades for the player's robot. */

import type { Robot } from "./types";

export interface UpgradeDef {
  id: string;
  name: string;
  cost: number;
  description: string;
  requires: string | null;
}

const UPGRADES: UpgradeDef[] = [
  { id: "armor-plating", name: "Armor Plating", cost: 5000, description: "+3 Defence (permanent)", requires: null },
  { id: "dodge-circuits", name: "Dodge Circuits", cost: 10000, description: "+5 Dodge (permanent)", requires: null },
  { id: "energy-core", name: "Energy Core", cost: 10000, description: "+20 Max Energy (permanent)", requires: null },
  { id: "inventory-5", name: "Inventory 5", cost: 5000, description: "Add a 5th inventory slot", requires: null },
  { id: "inventory-6", name: "Inventory 6", cost: 20000, description: "Add a 6th inventory slot", requires: "inventory-5" },
  { id: "inventory-7", name: "Inventory 7", cost: 50000, description: "Add a 7th inventory slot", requires: "inventory-6" },
];

export function listUpgrades(): UpgradeDef[] {
  return UPGRADES;
}

export function getUpgrade(id: string): UpgradeDef | undefined {
  return UPGRADES.find((u) => u.id === id);
}

export function canBuyUpgrade(player: Robot, upgrade: UpgradeDef): { ok: boolean; reason?: string } {
  if (player.upgrades.includes(upgrade.id)) {
    return { ok: false, reason: "Already owned" };
  }
  if (upgrade.requires && !player.upgrades.includes(upgrade.requires)) {
    const req = UPGRADES.find((u) => u.id === upgrade.requires);
    return { ok: false, reason: `Requires ${req?.name ?? upgrade.requires}` };
  }
  if (player.settings.mode !== "sandbox" && player.money < upgrade.cost) {
    return { ok: false, reason: "Not enough money" };
  }
  return { ok: true };
}

export function buyUpgrade(player: Robot, upgrade: UpgradeDef): void {
  if (player.settings.mode !== "sandbox") player.money -= upgrade.cost;
  player.upgrades.push(upgrade.id);
  applyUpgradeEffect(player, upgrade.id);
}

function applyUpgradeEffect(player: Robot, id: string): void {
  if (id === "armor-plating") player.defence = Math.max(player.defence, 3);
  if (id === "dodge-circuits") player.dodge = Math.max(player.dodge, 5);
  if (id === "energy-core") player.maxEnergy = Math.max(player.maxEnergy, 40);
  if (id === "inventory-5") player.inventorySize = Math.max(player.inventorySize, 5);
  if (id === "inventory-6") player.inventorySize = Math.max(player.inventorySize, 6);
  if (id === "inventory-7") player.inventorySize = Math.max(player.inventorySize, 7);
}

/** Re-apply all purchased upgrade effects (called on save load). */
export function applyAllUpgrades(player: Robot): void {
  for (const id of player.upgrades) {
    applyUpgradeEffect(player, id);
  }
}
