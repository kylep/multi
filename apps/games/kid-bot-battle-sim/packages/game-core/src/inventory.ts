import { Robot, InventoryItem } from "./types.js";
import { ALL_ITEMS, Item, GEAR } from "./data/items.js";
import { computeEffectiveStats } from "./robot.js";

export function lookupItem(itemName: string): Item | undefined {
  return ALL_ITEMS.find((i) => i.name === itemName);
}

export function addItem(robot: Robot, itemName: string): { robot: Robot; item: InventoryItem } {
  const itemDef = lookupItem(itemName);
  if (!itemDef) throw new Error(`Unknown item: ${itemName}`);

  const stats = computeEffectiveStats(robot);
  if (robot.inventory.length >= stats.inventorySize) {
    throw new Error("Inventory is full");
  }

  if (itemDef.type === "gear") {
    const alreadyOwned = robot.inventory.some(
      (i) => i.type === "gear" && i.itemName === itemName
    );
    if (alreadyOwned) throw new Error(`Already own gear: ${itemName}`);
  }

  const item: InventoryItem = {
    instanceId: crypto.randomUUID(),
    itemName,
    type: itemDef.type,
  };

  return {
    robot: { ...robot, inventory: [...robot.inventory, item] },
    item,
  };
}

export function removeItem(robot: Robot, instanceId: string): Robot {
  const idx = robot.inventory.findIndex((i) => i.instanceId === instanceId);
  if (idx === -1) throw new Error("Item not in inventory");
  return {
    ...robot,
    inventory: robot.inventory.filter((i) => i.instanceId !== instanceId),
  };
}

export function hasItem(robot: Robot, itemName: string): boolean {
  return robot.inventory.some((i) => i.itemName === itemName);
}

export function getInventoryByType(robot: Robot, type: "weapon" | "gear" | "consumable"): InventoryItem[] {
  return robot.inventory.filter((i) => i.type === type);
}
