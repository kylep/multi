import { BattleRobot, WeaponResult, RandomFn } from "./types.js";
export declare function calculateHitChance(accuracy: number, dodge: number): number;
export declare function calculateDamage(baseDamage: number, attack: number, defence: number): number;
export declare function resolveAttack(attacker: BattleRobot, defender: BattleRobot, weaponSlots: number[], random?: RandomFn): {
    attacker: BattleRobot;
    defender: BattleRobot;
    results: WeaponResult[];
};
export declare function resolveRest(robot: BattleRobot): {
    robot: BattleRobot;
    energyRestored: number;
};
export declare function resolveConsumable(user: BattleRobot, target: BattleRobot, consumableSlot: number): {
    user: BattleRobot;
    target: BattleRobot;
    effectDescription: string;
};
export declare function validateWeaponSelection(robot: BattleRobot, slots: number[]): {
    valid: boolean;
    error?: string;
};
//# sourceMappingURL=combat.d.ts.map