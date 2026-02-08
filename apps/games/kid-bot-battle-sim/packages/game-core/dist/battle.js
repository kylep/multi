import { ENEMIES } from "./data/enemies.js";
import { WEAPONS, GEAR, CONSUMABLES } from "./data/items.js";
import { computeEffectiveStats } from "./robot.js";
import { resolveAttack, resolveRest, resolveConsumable } from "./combat.js";
import { planAiTurn } from "./ai.js";
export function getAvailableEnemies() {
    return [...ENEMIES];
}
function buildBattleWeapons(weaponNames) {
    const results = [];
    for (let i = 0; i < weaponNames.length; i++) {
        const w = WEAPONS.find((x) => x.name === weaponNames[i]);
        if (!w)
            continue;
        const bw = {
            slotIndex: i,
            name: w.name,
            damage: w.damage,
            energyCost: w.energyCost,
            accuracy: w.accuracy,
            hands: w.hands,
        };
        if (w.requirements)
            bw.requirements = w.requirements;
        results.push(bw);
    }
    return results;
}
function buildBattleConsumables(consumableNames) {
    return consumableNames
        .map((name, i) => {
        const c = CONSUMABLES.find((x) => x.name === name);
        if (!c)
            return null;
        return { slotIndex: i, name: c.name, effects: c.effects };
    })
        .filter((c) => c !== null);
}
function buildEnemyBattleRobot(enemy) {
    // Compute enemy stats from their gear
    let health = 10;
    let energy = 20;
    let defence = 0;
    let attack = 0;
    let hands = 2;
    let dodge = 0;
    for (const gearName of enemy.gear) {
        const g = GEAR.find((x) => x.name === gearName);
        if (!g)
            continue;
        health += g.effects.healthBonus ?? 0;
        energy += g.effects.energyBonus ?? 0;
        defence += g.effects.defenceBonus ?? 0;
        attack += g.effects.attackBonus ?? 0;
        hands += g.effects.handsBonus ?? 0;
        dodge += g.effects.dodgeBonus ?? 0;
    }
    return {
        name: enemy.name,
        health,
        maxHealth: health,
        energy,
        maxEnergy: energy,
        defence,
        attack,
        hands,
        dodge,
        weapons: buildBattleWeapons(enemy.weapons),
        gear: [...enemy.gear],
        consumables: buildBattleConsumables(enemy.consumables),
    };
}
function buildPlayerBattleRobot(state) {
    const stats = computeEffectiveStats(state.robot);
    const weaponNames = state.robot.inventory
        .filter((i) => i.type === "weapon")
        .map((i) => i.itemName);
    const consumableNames = state.robot.inventory
        .filter((i) => i.type === "consumable")
        .map((i) => i.itemName);
    const gearNames = state.robot.inventory
        .filter((i) => i.type === "gear")
        .map((i) => i.itemName);
    return {
        name: state.playerName,
        health: state.robot.health,
        maxHealth: stats.maxHealth,
        energy: state.robot.energy,
        maxEnergy: stats.maxEnergy,
        defence: stats.defence,
        attack: stats.attack,
        hands: stats.hands,
        dodge: stats.dodge,
        weapons: buildBattleWeapons(weaponNames),
        gear: gearNames,
        consumables: buildBattleConsumables(consumableNames),
    };
}
export function startBattle(state, enemyName) {
    const enemy = ENEMIES.find((e) => e.name === enemyName);
    if (!enemy)
        throw new Error(`Unknown enemy: ${enemyName}`);
    const battle = {
        enemyName,
        player: buildPlayerBattleRobot(state),
        enemy: buildEnemyBattleRobot(enemy),
        turn: 1,
        combatLog: [],
        turnHistory: [],
        outcome: "ongoing",
        rewards: null,
    };
    return { ...state, phase: "battle", battle };
}
export function resolveTurn(state, playerAction, random = Math.random) {
    if (!state.battle || state.battle.outcome !== "ongoing") {
        throw new Error("No active battle");
    }
    let battle = { ...state.battle };
    let player = { ...battle.player };
    let enemy = { ...battle.enemy };
    const log = [];
    // Handle surrender
    if (playerAction.mainAction === "surrender") {
        log.push({ actor: player.name, action: "surrender" });
        const enemyDef = ENEMIES.find((e) => e.name === battle.enemyName);
        battle = {
            ...battle,
            player,
            enemy,
            combatLog: log,
            outcome: "defeat",
            rewards: null,
        };
        const robot = {
            ...state.robot,
            fights: state.robot.fights + 1,
        };
        return { ...state, battle, robot };
    }
    // Resolve consumables for both sides
    for (const slot of playerAction.consumablesUsed) {
        if (player.consumables[slot]) {
            const result = resolveConsumable(player, enemy, slot);
            player = result.user;
            enemy = result.target;
            log.push({
                actor: player.name,
                action: "consumable",
                consumableName: playerAction.consumablesUsed.length > 0 ? player.consumables[slot]?.name ?? "item" : "item",
                consumableEffect: result.effectDescription,
            });
        }
    }
    const enemyAction = planAiTurn(enemy);
    for (const slot of enemyAction.consumablesUsed) {
        if (enemy.consumables[slot]) {
            const result = resolveConsumable(enemy, player, slot);
            enemy = result.user;
            player = result.target;
            log.push({
                actor: enemy.name,
                action: "consumable",
                consumableName: enemy.consumables[slot]?.name ?? "item",
                consumableEffect: result.effectDescription,
            });
        }
    }
    const pending = [
        { who: "player", action: playerAction },
        { who: "enemy", action: enemyAction },
    ];
    // Random order
    if (random() < 0.5)
        pending.reverse();
    for (const p of pending) {
        // Check if robot is already dead
        if (player.health <= 0 || enemy.health <= 0)
            break;
        const isPlayer = p.who === "player";
        const actor = isPlayer ? player : enemy;
        const target = isPlayer ? enemy : player;
        if (p.action.mainAction === "attack" && p.action.weaponSlots.length > 0) {
            const result = resolveAttack(actor, target, p.action.weaponSlots, random);
            if (isPlayer) {
                player = result.attacker;
                enemy = result.defender;
            }
            else {
                enemy = result.attacker;
                player = result.defender;
            }
            log.push({
                actor: actor.name,
                action: "attack",
                weaponResults: result.results,
            });
        }
        else {
            // Rest
            const result = resolveRest(actor);
            if (isPlayer) {
                player = result.robot;
            }
            else {
                enemy = result.robot;
            }
            log.push({
                actor: actor.name,
                action: "rest",
                energyRestored: result.energyRestored,
            });
        }
    }
    // Record snapshot
    const snapshot = {
        turn: battle.turn,
        playerHp: player.health,
        playerMaxHp: player.maxHealth,
        enemyHp: enemy.health,
        enemyMaxHp: enemy.maxHealth,
    };
    // Check outcome
    let outcome = battle.outcome;
    let rewards = battle.rewards;
    let robot = { ...state.robot };
    if (enemy.health <= 0) {
        outcome = "victory";
        const enemyDef = ENEMIES.find((e) => e.name === battle.enemyName);
        // Calculate money bonus
        const stats = computeEffectiveStats(robot);
        let moneyBonusPercent = 0;
        for (const inv of robot.inventory) {
            if (inv.itemName === "Money Maker") {
                moneyBonusPercent += 20;
            }
        }
        const baseMoney = enemyDef.reward;
        const bonusMoney = Math.floor(baseMoney * moneyBonusPercent / 100);
        const totalMoney = baseMoney + bonusMoney;
        const newExp = robot.exp + enemyDef.expReward;
        const expPerLevel = 10;
        const newLevel = Math.floor(newExp / expPerLevel);
        const leveledUp = newLevel > robot.level;
        rewards = {
            money: totalMoney,
            exp: enemyDef.expReward,
            leveledUp,
            newLevel,
        };
        robot = {
            ...robot,
            money: robot.money + totalMoney,
            exp: newExp,
            level: newLevel,
            wins: robot.wins + 1,
            fights: robot.fights + 1,
        };
        // Remove consumed consumables from actual inventory
        const consumedNames = new Set();
        for (const slot of playerAction.consumablesUsed) {
            const c = battle.player.consumables[slot];
            if (c)
                consumedNames.add(c.name);
        }
        // Remove first matching consumable for each used
        const newInventory = [...robot.inventory];
        for (const name of consumedNames) {
            const idx = newInventory.findIndex((i) => i.type === "consumable" && i.itemName === name);
            if (idx !== -1)
                newInventory.splice(idx, 1);
        }
        robot = { ...robot, inventory: newInventory };
    }
    else if (player.health <= 0) {
        outcome = "defeat";
        robot = { ...robot, fights: robot.fights + 1 };
    }
    battle = {
        ...battle,
        player,
        enemy,
        turn: battle.turn + 1,
        combatLog: log,
        turnHistory: [...battle.turnHistory, snapshot],
        outcome,
        rewards,
    };
    return { ...state, battle, robot };
}
export function endBattle(state) {
    return { ...state, phase: "menu", battle: null };
}
//# sourceMappingURL=battle.js.map