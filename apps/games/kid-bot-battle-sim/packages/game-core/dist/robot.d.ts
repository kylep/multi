import { Robot } from "./types.js";
export declare function createRobot(): Robot;
export interface EffectiveStats {
    maxHealth: number;
    maxEnergy: number;
    defence: number;
    attack: number;
    hands: number;
    dodge: number;
    inventorySize: number;
    moneyBonusPercent: number;
}
export declare function computeEffectiveStats(robot: Robot): EffectiveStats;
export declare function healRobot(robot: Robot): Robot;
export declare function formatRobotStats(robot: Robot, name: string): string;
//# sourceMappingURL=robot.d.ts.map