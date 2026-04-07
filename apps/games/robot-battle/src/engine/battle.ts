/** Battle engine — pure functions, zero DOM. */

import type {
  ActionResult,
  BattleRobot,
  BattleState,
  Consumable,
  PlannedAction,
  Robot,
  Rng,
  TurnSnapshot,
  Weapon,
} from "./types";
import {
  battleDefence,
  battleDodge,
  createBattleRobot,
  getEffectiveAccuracy,
  getEffectiveAttack,
  getEffectiveHands,
  getEffectiveMaxEnergy,
  getEffectiveMaxHealth,
  getRestEnergyBonus,
  hasItem,
  isAlive,
  getWeaponEnergyCost,
} from "./robot";
import { createRng } from "./rng";

// ── Helpers ──

function log(battle: BattleState, message: string): void {
  battle.battleLog.push(message);
  battle.currentTurnLog.push(message);
}

function ok(msg: string, opts?: Partial<ActionResult>): ActionResult {
  return { success: true, message: msg, damageDealt: 0, energySpent: 0, turnEnded: true, ...opts };
}

function fail(msg: string): ActionResult {
  return { success: false, message: msg, damageDealt: 0, energySpent: 0, turnEnded: false };
}

// ── Create battle ──

export function createBattle(
  player: Robot,
  enemy: Robot,
  fightNumber = 1,
): BattleState {
  return {
    player: createBattleRobot(player),
    enemy: createBattleRobot(enemy),
    fightNumber,
    turnNumber: 1,
    battleLog: ["Battle begins! Both robots choose their actions simultaneously."],
    lastTurnLog: [],
    currentTurnLog: [],
    winner: null,
    playerAction: null,
    enemyAction: null,
    turnHistory: [],
    turnLogs: [],
  };
}

// ── Damage math ──

export function calculateHitChance(accuracy: number, dodge: number): number {
  return Math.max(0, Math.min(1, (accuracy - dodge) / 100));
}

export function calculateDamage(
  weapon: Weapon,
  attacker: BattleRobot,
  defender: BattleRobot,
): number {
  const attackPercent = getEffectiveAttack(attacker.robot) + attacker.tempAttack;
  const defence = battleDefence(defender);
  const modified = weapon.damage * (1 + attackPercent / 100);
  return Math.max(0, Math.floor(modified) - defence);
}

// ── Execute attack ──

export function executeAttack(
  battle: BattleState,
  attacker: BattleRobot,
  defender: BattleRobot,
  weapons: Weapon[],
  rng: Rng,
): ActionResult {
  if (weapons.length === 0) return fail("No weapons selected");

  const totalHands = weapons.reduce((s, w) => s + w.hands, 0);
  if (totalHands > getEffectiveHands(attacker.robot)) {
    return fail(`Not enough hands (need ${totalHands}, have ${getEffectiveHands(attacker.robot)})`);
  }

  const totalEnergy = weapons.reduce((s, w) => s + getWeaponEnergyCost(w, attacker.robot), 0);
  if (totalEnergy > attacker.currentEnergy) {
    return fail(`Not enough energy (need ${totalEnergy}, have ${attacker.currentEnergy})`);
  }

  for (const weapon of weapons) {
    for (const req of weapon.requirements) {
      if (!hasItem(attacker.robot, req)) {
        return fail(`${weapon.name} requires ${req}`);
      }
    }
  }

  // Spend energy
  attacker.currentEnergy -= totalEnergy;

  // Consume requirements
  for (const weapon of weapons) {
    for (const req of weapon.requirements) {
      const idx = attacker.robot.inventory.findIndex((i) => i.name === req);
      if (idx !== -1) {
        attacker.robot.inventory.splice(idx, 1);
        log(battle, `${attacker.robot.name} used ${req}`);
      }
    }
  }

  log(battle, `${attacker.robot.name} attacks!`);

  let totalDamage = 0;
  const messages: string[] = [];

  for (let i = 0; i < weapons.length; i++) {
    const weapon = weapons[i];
    const accuracyBonus = getEffectiveAccuracy(attacker.robot) + attacker.tempAccuracy;
    const hitChance = calculateHitChance(weapon.accuracy + accuracyBonus, battleDodge(defender));
    const roll = rng.random();

    if (roll < hitChance) {
      let damage = calculateDamage(weapon, attacker, defender);
      // God mode: defender takes 0 damage
      if (defender.robot.godMode) {
        const msg = `  ${weapon.name} ${i + 1} hits for 0 damage... BECAUSE YOU ARE A GOD`;
        messages.push(msg);
        log(battle, msg);
      } else {
        const rawDamage = damage;
        if (defender.damageBlock > 0) {
          const blocked = Math.min(damage, defender.damageBlock);
          defender.damageBlock -= blocked;
          damage -= blocked;
          log(battle, `  Shield blocked ${blocked} of ${rawDamage} damage!`);
        }
        totalDamage += damage;
        defender.currentHealth -= damage;
        const msg = `  ${weapon.name} ${i + 1} hits for ${damage} damage`;
        messages.push(msg);
        log(battle, msg);
      }
    } else {
      const msg = `  ${weapon.name} ${i + 1} misses!`;
      messages.push(msg);
      log(battle, msg);
    }
  }

  checkVictory(battle);

  return ok(messages.join("\n"), { damageDealt: totalDamage, energySpent: totalEnergy });
}

// ── Execute rest ──

export function executeRest(
  battle: BattleState,
  fighter: BattleRobot,
): ActionResult {
  const maxEnergy = getEffectiveMaxEnergy(fighter.robot);
  const baseRest = 5 + getRestEnergyBonus(fighter.robot);
  const restored = Math.min(baseRest, maxEnergy - fighter.currentEnergy);
  fighter.currentEnergy += restored;
  log(battle, `${fighter.robot.name} rests and recovers ${restored} energy`);
  return ok(`Recovered ${restored} energy`);
}

// ── Use consumable ──

export function useConsumable(
  battle: BattleState,
  attacker: BattleRobot,
  defender: BattleRobot,
  consumable: Consumable,
  rng?: Rng,
): ActionResult {
  const r = rng ?? createRng();
  if (!hasItem(attacker.robot, consumable.name)) {
    return fail("Don't have this consumable");
  }
  if (attacker.consumableUsedThisTurn) {
    return fail("Already used a consumable this turn");
  }

  attacker.consumableUsedThisTurn = true;
  attacker.consumablesUsed.push(consumable.name);
  const idx = attacker.robot.inventory.findIndex((i) => i.name === consumable.name);
  if (idx !== -1) attacker.robot.inventory.splice(idx, 1);

  const effects: string[] = [];

  if (consumable.healthRestore > 0) {
    const max = getEffectiveMaxHealth(attacker.robot);
    const actual = Math.min(consumable.healthRestore, max - attacker.currentHealth);
    attacker.currentHealth += actual;
    effects.push(`+${actual} health`);
  }
  if (consumable.energyRestore > 0) {
    const max = getEffectiveMaxEnergy(attacker.robot);
    const actual = Math.min(consumable.energyRestore, max - attacker.currentEnergy);
    attacker.currentEnergy += actual;
    effects.push(`+${actual} energy`);
  }
  if (consumable.tempDefence > 0) {
    attacker.tempDefence += consumable.tempDefence;
    effects.push(`+${consumable.tempDefence} temp defence`);
  }
  if (consumable.tempAttack > 0) {
    attacker.tempAttack += consumable.tempAttack;
    effects.push(`+${consumable.tempAttack} temp attack`);
  }
  if (consumable.damageBlock > 0) {
    attacker.damageBlock += consumable.damageBlock;
    effects.push(`blocks ${consumable.damageBlock} damage this turn`);
  }
  if (consumable.damage > 0) {
    if (defender.robot.godMode) {
      effects.push(`0 damage... BECAUSE YOU ARE A GOD`);
    } else {
      // 50% dodge chance against consumable damage
      const dodge = battleDodge(defender);
      const dodgeChance = Math.max(0, Math.min(1, dodge / 200)); // half effectiveness
      if (r.random() < dodgeChance) {
        effects.push(`enemy dodged ${consumable.name}!`);
      } else {
        // Defence reduces consumable damage
        const defence = battleDefence(defender);
        let dmg = Math.max(0, consumable.damage - defence);
        if (defender.damageBlock > 0) {
          const blocked = Math.min(dmg, defender.damageBlock);
          defender.damageBlock -= blocked;
          dmg -= blocked;
        }
        defender.currentHealth -= dmg;
        effects.push(`${dmg} damage to enemy`);
      }
    }
  }
  if (consumable.enemyDodgeReduction > 0) {
    defender.tempDodgeReduction += consumable.enemyDodgeReduction;
    effects.push(`-${consumable.enemyDodgeReduction} enemy dodge`);
  }
  if (consumable.accuracyBonus > 0) {
    attacker.tempAccuracy += consumable.accuracyBonus;
    effects.push(`+${consumable.accuracyBonus} temp accuracy`);
  }

  const isPlayer = attacker === battle.player;
  if (consumable.useText && isPlayer) {
    log(battle, `${attacker.robot.name}: ${consumable.useText}`);
  } else {
    log(battle, `${attacker.robot.name} uses ${consumable.name}: ${effects.join(", ")}`);
  }
  checkVictory(battle);

  return ok(`Used ${consumable.name}: ${effects.join(", ")}`, { turnEnded: false });
}

// ── Victory check ──

export function checkVictory(battle: BattleState): "player" | "enemy" | null {
  if (!isAlive(battle.player)) {
    battle.winner = "enemy";
    log(battle, `${battle.player.robot.name} has been destroyed!`);
    return "enemy";
  }
  if (!isAlive(battle.enemy)) {
    battle.winner = "player";
    log(battle, `${battle.enemy.robot.name} has been destroyed!`);
    return "player";
  }
  return null;
}

// ── Turn management ──

export function recordTurnSnapshot(battle: BattleState): void {
  const snapshot: TurnSnapshot = {
    turn: battle.turnNumber,
    playerHp: Math.max(0, battle.player.currentHealth),
    playerMaxHp: getEffectiveMaxHealth(battle.player.robot),
    enemyHp: Math.max(0, battle.enemy.currentHealth),
    enemyMaxHp: getEffectiveMaxHealth(battle.enemy.robot),
  };
  battle.turnHistory.push(snapshot);
}

export function endTurn(battle: BattleState): void {
  recordTurnSnapshot(battle);
  battle.turnLogs.push([...battle.currentTurnLog]);
  battle.lastTurnLog = [...battle.currentTurnLog];
  battle.currentTurnLog = [];
  battle.playerAction = null;
  battle.enemyAction = null;
  battle.player.damageBlock = 0;
  battle.enemy.damageBlock = 0;
  battle.player.consumableUsedThisTurn = false;
  battle.enemy.consumableUsedThisTurn = false;
  battle.turnNumber += 1;
}

// ── Plan actions ──

export function planAttack(
  battle: BattleState,
  weapons: Weapon[],
  isPlayer: boolean,
): ActionResult {
  const fighter = isPlayer ? battle.player : battle.enemy;
  if (weapons.length === 0) return fail("No weapons selected");

  const totalHands = weapons.reduce((s, w) => s + w.hands, 0);
  if (totalHands > getEffectiveHands(fighter.robot)) {
    return fail(`Not enough hands (need ${totalHands}, have ${getEffectiveHands(fighter.robot)})`);
  }

  const totalEnergy = weapons.reduce((s, w) => s + getWeaponEnergyCost(w, fighter.robot), 0);
  if (totalEnergy > fighter.currentEnergy) {
    return fail(`Not enough energy (need ${totalEnergy}, have ${fighter.currentEnergy})`);
  }

  for (const weapon of weapons) {
    for (const req of weapon.requirements) {
      if (!hasItem(fighter.robot, req)) {
        return fail(`${weapon.name} requires ${req}`);
      }
    }
  }

  const action: PlannedAction = { actionType: "attack", weapons, consumable: null };
  if (isPlayer) battle.playerAction = action;
  else battle.enemyAction = action;

  return ok(`Planned attack with ${weapons.map((w) => w.name).join(", ")}`);
}

export function planRest(battle: BattleState, isPlayer: boolean): ActionResult {
  const action: PlannedAction = { actionType: "rest", weapons: [], consumable: null };
  if (isPlayer) battle.playerAction = action;
  else battle.enemyAction = action;
  return ok("Planned to rest");
}

export function planConsumable(
  battle: BattleState,
  consumable: Consumable,
  isPlayer: boolean,
): ActionResult {
  const fighter = isPlayer ? battle.player : battle.enemy;
  if (fighter.consumablesUsed.includes(consumable.name)) return fail("Already used this consumable");
  if (!hasItem(fighter.robot, consumable.name)) return fail("Don't have this consumable");

  const action: PlannedAction = { actionType: "consumable", weapons: [], consumable };
  if (isPlayer) battle.playerAction = action;
  else battle.enemyAction = action;
  return ok(`Planned to use ${consumable.name}`);
}

// ── Resolve turn ──

function executePlannedAction(
  battle: BattleState,
  action: PlannedAction,
  isPlayer: boolean,
  rng: Rng,
): ActionResult {
  const attacker = isPlayer ? battle.player : battle.enemy;
  const defender = isPlayer ? battle.enemy : battle.player;

  if (action.actionType === "attack") {
    return executeAttack(battle, attacker, defender, action.weapons, rng);
  }
  if (action.actionType === "rest") {
    return executeRest(battle, attacker);
  }
  if (action.actionType === "consumable" && action.consumable) {
    return useConsumable(battle, attacker, defender, action.consumable, rng);
  }
  return fail("Invalid action");
}

export function resolveTurn(
  battle: BattleState,
  rng?: Rng,
): Array<{ actor: string; result: ActionResult }> {
  const r = rng ?? createRng();
  const results: Array<{ actor: string; result: ActionResult }> = [];

  const playerFirst = r.random() < 0.5;

  const order: Array<{ label: string; action: PlannedAction | null; isPlayer: boolean }> = playerFirst
    ? [
        { label: "player", action: battle.playerAction, isPlayer: true },
        { label: "enemy", action: battle.enemyAction, isPlayer: false },
      ]
    : [
        { label: "enemy", action: battle.enemyAction, isPlayer: false },
        { label: "player", action: battle.playerAction, isPlayer: true },
      ];

  for (const { action, isPlayer } of order) {
    if (battle.winner) break;
    const resolved = action ?? { actionType: "rest" as const, weapons: [], consumable: null };
    const result = executePlannedAction(battle, resolved, isPlayer, r);
    const actor = isPlayer ? battle.player.robot.name : battle.enemy.robot.name;
    results.push({ actor, result });
  }

  return results;
}

// ── Loot Box ──

export function shouldShowLootBox(turns: number, rng: Rng): boolean {
  for (let i = 0; i < turns; i++) {
    if (rng.random() < 0.025) return true;
  }
  return false;
}
