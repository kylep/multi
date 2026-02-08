export interface Weapon {
    type: "weapon";
    name: string;
    level: number;
    damage: number;
    moneyCost: number;
    energyCost: number;
    accuracy: number;
    hands: number;
    requirements?: string[];
    description: string;
}
export interface Gear {
    type: "gear";
    name: string;
    level: number;
    moneyCost: number;
    requirements?: string[];
    description: string;
    effects: {
        healthBonus?: number;
        energyBonus?: number;
        handsBonus?: number;
        defenceBonus?: number;
        dodgeBonus?: number;
        attackBonus?: number;
        moneyBonusPercent?: number;
    };
}
export interface Consumable {
    type: "consumable";
    name: string;
    level: number;
    moneyCost: number;
    description: string;
    effects: {
        healthRestore?: number;
        damage?: number;
        enemyDodgeReduction?: number;
    };
}
export type Item = Weapon | Gear | Consumable;
export declare const WEAPONS: Weapon[];
export declare const GEAR: Gear[];
export declare const CONSUMABLES: Consumable[];
export declare const ALL_ITEMS: Item[];
//# sourceMappingURL=items.d.ts.map