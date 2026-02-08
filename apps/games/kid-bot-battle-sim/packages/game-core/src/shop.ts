import { Robot } from "./types.js";
import { ALL_ITEMS, Item } from "./data/items.js";
import { addItem, lookupItem, hasItem } from "./inventory.js";
import { computeEffectiveStats, healRobot } from "./robot.js";

export interface BuyResult {
  success: boolean;
  error?: string;
  robot: Robot;
}

export interface SellResult {
  success: boolean;
  error?: string;
  robot: Robot;
  refund: number;
}

export function enterShop(robot: Robot): Robot {
  return healRobot(robot);
}

export function getShopCatalog(robot: Robot): Array<Item & { canBuy: boolean; reason?: string }> {
  const stats = computeEffectiveStats(robot);
  return ALL_ITEMS.map((item) => {
    const reasons: string[] = [];

    if (robot.money < item.moneyCost) reasons.push("Not enough money");
    if (robot.inventory.length >= stats.inventorySize) reasons.push("Inventory full");
    if (item.level > robot.level) reasons.push(`Requires level ${item.level}`);

    if (item.type === "gear") {
      if (item.requirements) {
        for (const req of item.requirements) {
          if (!hasItem(robot, req)) reasons.push(`Requires ${req}`);
        }
      }
      if (hasItem(robot, item.name)) reasons.push("Already owned");
    }

    if (item.type === "weapon" && "requirements" in item && item.requirements) {
      for (const req of item.requirements) {
        if (!hasItem(robot, req)) reasons.push(`Requires ${req}`);
      }
    }

    return {
      ...item,
      canBuy: reasons.length === 0,
      reason: reasons.length > 0 ? reasons[0] : undefined,
    };
  });
}

export function buyItem(robot: Robot, itemName: string): BuyResult {
  const itemDef = lookupItem(itemName);
  if (!itemDef) return { success: false, error: `Unknown item: ${itemName}`, robot };

  const stats = computeEffectiveStats(robot);

  // Check money
  if (robot.money < itemDef.moneyCost) {
    return { success: false, error: "Not enough money", robot };
  }

  // Check inventory space
  if (robot.inventory.length >= stats.inventorySize) {
    return { success: false, error: "Inventory full", robot };
  }

  // Check level
  if (itemDef.level > robot.level) {
    return { success: false, error: `Requires level ${itemDef.level}`, robot };
  }

  // Check requirements
  if ("requirements" in itemDef && itemDef.requirements) {
    for (const req of itemDef.requirements) {
      if (!hasItem(robot, req)) {
        return { success: false, error: `Requires ${req}`, robot };
      }
    }
  }

  // Check gear stacking
  if (itemDef.type === "gear" && hasItem(robot, itemName)) {
    return { success: false, error: "Already own this gear", robot };
  }

  // Buy it
  const updated = { ...robot, money: robot.money - itemDef.moneyCost };
  const { robot: withItem } = addItem(updated, itemName);

  return { success: true, robot: withItem };
}

export function sellItem(robot: Robot, instanceId: string): SellResult {
  const invItem = robot.inventory.find((i) => i.instanceId === instanceId);
  if (!invItem) return { success: false, error: "Item not found", robot, refund: 0 };

  const itemDef = lookupItem(invItem.itemName);
  if (!itemDef) return { success: false, error: "Unknown item", robot, refund: 0 };

  const refund = Math.floor(itemDef.moneyCost / 2);
  const newInventory = robot.inventory.filter((i) => i.instanceId !== instanceId);

  return {
    success: true,
    robot: { ...robot, inventory: newInventory, money: robot.money + refund },
    refund,
  };
}
