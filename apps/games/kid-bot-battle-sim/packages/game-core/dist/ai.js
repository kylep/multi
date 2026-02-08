export function planAiTurn(robot) {
    const consumablesUsed = [];
    // Use all consumables
    for (let i = 0; i < robot.consumables.length; i++) {
        consumablesUsed.push(i);
    }
    // Try to attack with as many weapons as possible
    const weaponSlots = selectBestWeapons(robot);
    if (weaponSlots.length > 0) {
        return { mainAction: "attack", weaponSlots, consumablesUsed };
    }
    // Rest if can't attack
    return { mainAction: "rest", weaponSlots: [], consumablesUsed };
}
export function suggestPlayerAction(robot) {
    // Same logic as AI for suggestions
    return planAiTurn(robot);
}
function selectBestWeapons(robot) {
    // Sort weapons by damage descending, then greedily pick weapons that fit
    const indexed = robot.weapons
        .map((w, i) => ({ weapon: w, index: i }))
        .sort((a, b) => b.weapon.damage - a.weapon.damage);
    let handsUsed = 0;
    let energyUsed = 0;
    const selected = [];
    for (const { weapon, index } of indexed) {
        if (handsUsed + weapon.hands <= robot.hands && energyUsed + weapon.energyCost <= robot.energy) {
            // Check ammo requirements
            if (weapon.requirements) {
                const hasAmmo = robot.gear.includes(weapon.requirements[0]);
                if (!hasAmmo)
                    continue;
            }
            handsUsed += weapon.hands;
            energyUsed += weapon.energyCost;
            selected.push(index);
        }
    }
    return selected.sort((a, b) => a - b);
}
//# sourceMappingURL=ai.js.map