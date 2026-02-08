import { Robot, InventoryItem } from "./types.js";
import { Item } from "./data/items.js";
export declare function lookupItem(itemName: string): Item | undefined;
export declare function addItem(robot: Robot, itemName: string): {
    robot: Robot;
    item: InventoryItem;
};
export declare function removeItem(robot: Robot, instanceId: string): Robot;
export declare function hasItem(robot: Robot, itemName: string): boolean;
export declare function getInventoryByType(robot: Robot, type: "weapon" | "gear" | "consumable"): InventoryItem[];
//# sourceMappingURL=inventory.d.ts.map