/** Permanent upgrades for the player's robot. */

import type { Robot } from "./types";

export interface UpgradeDef {
  id: string;
  name: string;
  cost: number;
  description: string;
  requires: string | null;
  section: "arms" | "combat" | "utility";
}

const UPGRADES: UpgradeDef[] = [
  // Arms
  { id: "third-arm", name: "Third Arm", cost: 1000, description: "+1 Hand (permanent)", requires: null, section: "arms" },
  { id: "fourth-arm", name: "Fourth Arm", cost: 5000, description: "+1 Hand (permanent)", requires: "third-arm", section: "arms" },
  { id: "fifth-arm", name: "Fifth Arm", cost: 25000, description: "+1 Hand (permanent)", requires: "fourth-arm", section: "arms" },
  { id: "sixth-arm", name: "Sixth Arm", cost: 100000, description: "+1 Hand (permanent)", requires: "fifth-arm", section: "arms" },
  // Combat
  { id: "armor-plating", name: "Armor Plating", cost: 5000, description: "+3 Defence (permanent)", requires: null, section: "combat" },
  { id: "reinforced-plating", name: "Reinforced Plating", cost: 12000, description: "+5 Defence (permanent)", requires: "armor-plating", section: "combat" },
  { id: "dodge-circuits", name: "Dodge Circuits", cost: 10000, description: "+5 Dodge (permanent)", requires: null, section: "combat" },
  { id: "evasion-boosters", name: "Evasion Boosters", cost: 6000, description: "+10 Dodge (permanent)", requires: "dodge-circuits", section: "combat" },
  { id: "phantom-protocol", name: "Phantom Protocol", cost: 15000, description: "+20 Dodge (permanent)", requires: "evasion-boosters", section: "combat" },
  { id: "targeting-system", name: "Targeting System", cost: 3000, description: "+10 Accuracy (permanent)", requires: null, section: "combat" },
  { id: "advanced-targeting", name: "Advanced Targeting", cost: 8000, description: "+20 Accuracy (permanent)", requires: "targeting-system", section: "combat" },
  // Utility
  { id: "energy-core", name: "Energy Core", cost: 10000, description: "+20 Max Energy (permanent)", requires: null, section: "utility" },
  { id: "hp-boost", name: "HP Boost", cost: 5000, description: "+20 Max HP (permanent)", requires: null, section: "utility" },
  { id: "hp-boost-2", name: "HP Boost II", cost: 15000, description: "+40 Max HP (permanent)", requires: "hp-boost", section: "utility" },
  { id: "inventory-5", name: "Inventory 5", cost: 5000, description: "Add a 5th inventory slot", requires: null, section: "utility" },
  { id: "inventory-6", name: "Inventory 6", cost: 20000, description: "Add a 6th inventory slot", requires: "inventory-5", section: "utility" },
  { id: "inventory-7", name: "Inventory 7", cost: 50000, description: "Add a 7th inventory slot", requires: "inventory-6", section: "utility" },
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
  // Arms
  if (id === "third-arm") player.hands = Math.max(player.hands, 3);
  if (id === "fourth-arm") player.hands = Math.max(player.hands, 4);
  if (id === "fifth-arm") player.hands = Math.max(player.hands, 5);
  if (id === "sixth-arm") player.hands = Math.max(player.hands, 6);
  // Combat — defence
  if (id === "armor-plating") player.defence = Math.max(player.defence, 3);
  if (id === "reinforced-plating") player.defence = Math.max(player.defence, 8);
  // Combat — dodge
  if (id === "dodge-circuits") player.dodge = Math.max(player.dodge, 5);
  if (id === "evasion-boosters") player.dodge = Math.max(player.dodge, 15);
  if (id === "phantom-protocol") player.dodge = Math.max(player.dodge, 35);
  // Combat — accuracy
  if (id === "targeting-system") player.accuracy = Math.max(player.accuracy, 10);
  if (id === "advanced-targeting") player.accuracy = Math.max(player.accuracy, 30);
  // Utility
  if (id === "energy-core") player.maxEnergy = Math.max(player.maxEnergy, 40);
  if (id === "hp-boost") player.maxHealth = Math.max(player.maxHealth, 30);
  if (id === "hp-boost-2") player.maxHealth = Math.max(player.maxHealth, 70);
  if (id === "inventory-5") player.inventorySize = Math.max(player.inventorySize, 5);
  if (id === "inventory-6") player.inventorySize = Math.max(player.inventorySize, 6);
  if (id === "inventory-7") player.inventorySize = Math.max(player.inventorySize, 7);
}

/** Re-apply all purchased upgrade effects (called on save load). */
export function applyAllUpgrades(player: Robot): void {
  for (const id of player.upgrades) {
    applyUpgradeEffect(player, id);
  }
  applyAllRepeatableUpgrades(player);
}

// ── Repeatable Upgrades ──

export interface RepeatableUpgradeDef {
  id: string;
  name: string;
  baseCost: number;
  costPerLevel: number;
  description: string;
}

const REPEATABLE_UPGRADES: RepeatableUpgradeDef[] = [
  { id: "rep-hp", name: "+5 Max HP", baseCost: 2000, costPerLevel: 1000, description: "+5 Max HP per level" },
  { id: "rep-damage", name: "+1 Attack", baseCost: 3000, costPerLevel: 1500, description: "+1% Attack per level" },
  { id: "rep-defence", name: "+1 Defence", baseCost: 2500, costPerLevel: 1200, description: "+1 Defence per level" },
  { id: "rep-accuracy", name: "+2 Accuracy", baseCost: 2000, costPerLevel: 1000, description: "+2 Accuracy per level" },
  { id: "rep-dodge", name: "+1 Dodge", baseCost: 2000, costPerLevel: 1000, description: "+1 Dodge per level" },
];

export function listRepeatableUpgrades(): RepeatableUpgradeDef[] {
  return REPEATABLE_UPGRADES;
}

export function getRepeatableUpgradeCost(def: RepeatableUpgradeDef, currentLevel: number): number {
  return def.baseCost + def.costPerLevel * currentLevel;
}

export function allNormalUpgradesPurchased(player: Robot): boolean {
  return UPGRADES.every((u) => player.upgrades.includes(u.id));
}

export function canBuyRepeatableUpgrade(
  player: Robot,
  def: RepeatableUpgradeDef,
): { ok: boolean; reason?: string } {
  if (!allNormalUpgradesPurchased(player) && player.settings.mode !== "sandbox") {
    return { ok: false, reason: "Purchase all normal upgrades first" };
  }
  const level = player.repeatableUpgrades[def.id] ?? 0;
  const cost = getRepeatableUpgradeCost(def, level);
  if (player.settings.mode !== "sandbox" && player.money < cost) {
    return { ok: false, reason: "Not enough money" };
  }
  return { ok: true };
}

export function buyRepeatableUpgrade(player: Robot, def: RepeatableUpgradeDef): void {
  const level = player.repeatableUpgrades[def.id] ?? 0;
  const cost = getRepeatableUpgradeCost(def, level);
  if (player.settings.mode !== "sandbox") player.money -= cost;
  player.repeatableUpgrades[def.id] = level + 1;
  applyRepeatableEffect(player, def.id, 1);
}

function applyRepeatableEffect(player: Robot, id: string, levels: number): void {
  if (id === "rep-hp") player.maxHealth += 5 * levels;
  if (id === "rep-damage") player.attack += 1 * levels;
  if (id === "rep-defence") player.defence += 1 * levels;
  if (id === "rep-accuracy") player.accuracy += 2 * levels;
  if (id === "rep-dodge") player.dodge += 1 * levels;
}

function applyAllRepeatableUpgrades(player: Robot): void {
  for (const [id, level] of Object.entries(player.repeatableUpgrades)) {
    if (level > 0) applyRepeatableEffect(player, id, level);
  }
}
