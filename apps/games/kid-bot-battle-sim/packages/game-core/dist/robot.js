import { DEFAULT_ROBOT_STATS, STARTING_MONEY } from "./data/config.js";
import { GEAR } from "./data/items.js";
export function createRobot() {
    return {
        ...DEFAULT_ROBOT_STATS,
        money: STARTING_MONEY,
        wins: 0,
        fights: 0,
        inventory: [],
    };
}
function findGear(itemName) {
    return GEAR.find((g) => g.name === itemName);
}
export function computeEffectiveStats(robot) {
    let maxHealth = DEFAULT_ROBOT_STATS.maxHealth;
    let maxEnergy = DEFAULT_ROBOT_STATS.maxEnergy;
    let defence = DEFAULT_ROBOT_STATS.defence;
    let attack = DEFAULT_ROBOT_STATS.attack;
    let hands = DEFAULT_ROBOT_STATS.hands;
    let dodge = DEFAULT_ROBOT_STATS.dodge;
    let inventorySize = DEFAULT_ROBOT_STATS.inventorySize;
    let moneyBonusPercent = 0;
    for (const invItem of robot.inventory) {
        if (invItem.type !== "gear")
            continue;
        const gear = findGear(invItem.itemName);
        if (!gear)
            continue;
        maxHealth += gear.effects.healthBonus ?? 0;
        maxEnergy += gear.effects.energyBonus ?? 0;
        defence += gear.effects.defenceBonus ?? 0;
        attack += gear.effects.attackBonus ?? 0;
        hands += gear.effects.handsBonus ?? 0;
        dodge += gear.effects.dodgeBonus ?? 0;
        moneyBonusPercent += gear.effects.moneyBonusPercent ?? 0;
    }
    return { maxHealth, maxEnergy, defence, attack, hands, dodge, inventorySize, moneyBonusPercent };
}
export function healRobot(robot) {
    const stats = computeEffectiveStats(robot);
    return {
        ...robot,
        health: stats.maxHealth,
        maxHealth: stats.maxHealth,
        energy: stats.maxEnergy,
        maxEnergy: stats.maxEnergy,
        defence: stats.defence,
        attack: stats.attack,
        hands: stats.hands,
        dodge: stats.dodge,
    };
}
export function formatRobotStats(robot, name) {
    const stats = computeEffectiveStats(robot);
    const lines = [
        `=== ${name} ===`,
        `Level: ${robot.level} (Exp: ${robot.exp}/${(robot.level + 1) * 10})`,
        `♥ Health: ${robot.health}/${stats.maxHealth}`,
        `⚡ Energy: ${robot.energy}/${stats.maxEnergy}`,
        `Defence: ${stats.defence} | Attack: ${stats.attack} | Dodge: ${stats.dodge}`,
        `Hands: ${stats.hands} | Inventory: ${robot.inventory.length}/${stats.inventorySize}`,
        `Money: $${robot.money} | Wins: ${robot.wins} | Fights: ${robot.fights}`,
    ];
    return lines.join("\n");
}
//# sourceMappingURL=robot.js.map