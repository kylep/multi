import { Robot } from "./types.js";
import { Item } from "./data/items.js";
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
export declare function enterShop(robot: Robot): Robot;
export declare function getShopCatalog(robot: Robot): Array<Item & {
    canBuy: boolean;
    reason?: string;
}>;
export declare function buyItem(robot: Robot, itemName: string): BuyResult;
export declare function sellItem(robot: Robot, instanceId: string): SellResult;
//# sourceMappingURL=shop.d.ts.map