import { ALL_ITEMS } from "./data/items.js";
import { computeEffectiveStats } from "./robot.js";
export function lookupItem(itemName) {
    return ALL_ITEMS.find((i) => i.name === itemName);
}
export function addItem(robot, itemName) {
    const itemDef = lookupItem(itemName);
    if (!itemDef)
        throw new Error(`Unknown item: ${itemName}`);
    const stats = computeEffectiveStats(robot);
    if (robot.inventory.length >= stats.inventorySize) {
        throw new Error("Inventory is full");
    }
    if (itemDef.type === "gear") {
        const alreadyOwned = robot.inventory.some((i) => i.type === "gear" && i.itemName === itemName);
        if (alreadyOwned)
            throw new Error(`Already own gear: ${itemName}`);
    }
    const item = {
        instanceId: crypto.randomUUID(),
        itemName,
        type: itemDef.type,
    };
    return {
        robot: { ...robot, inventory: [...robot.inventory, item] },
        item,
    };
}
export function removeItem(robot, instanceId) {
    const idx = robot.inventory.findIndex((i) => i.instanceId === instanceId);
    if (idx === -1)
        throw new Error("Item not in inventory");
    return {
        ...robot,
        inventory: robot.inventory.filter((i) => i.instanceId !== instanceId),
    };
}
export function hasItem(robot, itemName) {
    return robot.inventory.some((i) => i.itemName === itemName);
}
export function getInventoryByType(robot, type) {
    return robot.inventory.filter((i) => i.type === type);
}
//# sourceMappingURL=inventory.js.map