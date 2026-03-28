/** Battle screen — combat UI. */

import type { Terminal, Choice } from "../terminal";
import type { GameState } from "../../engine/state";
import type { BattleState, Weapon } from "../../engine/types";
import {
  createBattle,
  endTurn,
  planAttack,
  planRest,
  recordTurnSnapshot,
  resolveTurn,
  useConsumable,
} from "../../engine/battle";
import { aiPlanAction } from "../../engine/ai";
import { createRng } from "../../engine/rng";
import {
  getConsumables,
  getEffectiveHands,
  getEffectiveMaxEnergy,
  getEffectiveMaxHealth,
  getWeapons,
} from "../../engine/robot";
import { awardExp, awardMoney, recordFight } from "../../engine/state";
import { showRobotStats } from "./inspect";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function battleScreen(
  terminal: Terminal,
  state: GameState,
  enemyName: string,
): Promise<void> {
  const player = state.player!;
  const enemyDef = state.registry.enemies.get(enemyName)!;
  const enemyRobot = state.registry.createEnemyRobot(enemyName);
  if (!enemyRobot) {
    terminal.print("Error creating enemy!", "t-red");
    return;
  }

  const fightNumber = player.fights + 1;
  const battle = createBattle(player, enemyRobot, fightNumber);

  // Battle loop
  while (battle.winner === null) {
    terminal.clear();
    terminal.print("");
    printBattleStatus(terminal, battle);
    terminal.print("");

    // Player picks action
    const result = await playerTurn(terminal, battle);

    if (result === "auto") {
      await autoBattle(terminal, battle);
      break;
    }

    if (result === "surrendered" || battle.winner) break;

    // Enemy AI picks action
    const enemyAction = aiPlanAction(battle, false);
    battle.enemyAction = enemyAction;

    // Resolve turn
    const rng = createRng();
    resolveTurn(battle, rng);

    // Display results
    terminal.print("");
    printTurnLog(terminal, battle);

    if (battle.winner === null) {
      endTurn(battle);
    }

    await terminal.promptText("Press Enter to continue...");
  }

  // Battle ended
  recordTurnSnapshot(battle);
  terminal.print("");

  if (battle.winner === "player") {
    terminal.print("*** VICTORY! ***", "t-green t-bold");
    showBattleSummary(terminal, battle);
    recordFight(state, true);

    terminal.print("");
    terminal.print("-- Rewards --", "t-yellow t-bold");
    const leveled = awardExp(state, enemyDef.expReward);
    terminal.print(`+${enemyDef.expReward} exp`, "t-green");
    const actual = awardMoney(state, enemyDef.reward);
    terminal.print(`+$${actual}`, "t-green");
    if (leveled) {
      terminal.print("");
      terminal.print(`*** LEVEL UP! You are now level ${player.level}! ***`, "t-green t-bold");
    }

    printNextLevelPreview(terminal, state);
    terminal.print("");
    await showRobotStats(terminal, state);
  } else {
    if (battle.player.currentHealth > 0) {
      terminal.print("*** SURRENDERED ***", "t-yellow");
      terminal.print("You retreated from battle. No rewards earned.");
    } else {
      terminal.print("*** DEFEAT ***", "t-red t-bold");
      showBattleSummary(terminal, battle);
      terminal.print("Your robot was destroyed... but it's been rebuilt!");
    }
    recordFight(state, false);
    player.money += 10;
    terminal.print(`+$10 consolation`, "t-green");
    printNextLevelPreview(terminal, state);
  }

  // Reset health/energy
  player.health = getEffectiveMaxHealth(player);
  player.energy = getEffectiveMaxEnergy(player);

  await terminal.promptText("Press Enter to continue...");
}

function printNextLevelPreview(terminal: Terminal, state: GameState): void {
  const player = state.player!;
  const nextLevelItems = state.registry.getAllItems().filter(
    (i) => i.level === player.level + 1,
  );
  if (nextLevelItems.length > 0) {
    terminal.print("");
    terminal.print(
      `Next level unlocks: ${nextLevelItems.map((i) => i.name).join(", ")}`,
      "t-cyan",
    );
  }
}

// ── Auto-Battle ──

async function autoBattle(terminal: Terminal, battle: BattleState): Promise<void> {
  while (battle.winner === null) {
    terminal.clear();
    terminal.print("");
    printBattleStatus(terminal, battle);
    terminal.print("");
    terminal.print("[AUTO-BATTLE]", "t-yellow t-bold");

    await delay(250);

    // AI picks both actions
    const playerAction = aiPlanAction(battle, true);
    battle.playerAction = playerAction;
    const enemyAction = aiPlanAction(battle, false);
    battle.enemyAction = enemyAction;

    // Resolve
    const rng = createRng();
    resolveTurn(battle, rng);

    // Show results
    terminal.print("");
    printTurnLog(terminal, battle);

    if (battle.winner === null) {
      endTurn(battle);
    }

    await delay(250);
  }
}

// ── Display helpers ──

function printTurnLog(terminal: Terminal, battle: BattleState): void {
  terminal.print("---- Turn Resolution ----", "t-yellow t-bold");
  for (const msg of battle.currentTurnLog) {
    if (msg.includes("hits for")) {
      terminal.print(msg, "t-red");
    } else if (msg.includes("destroyed")) {
      terminal.print(msg, "t-red t-bold");
    } else {
      terminal.print(msg);
    }
  }
}

function printBattleStatus(terminal: Terminal, battle: BattleState): void {
  const p = battle.player;
  const e = battle.enemy;
  const pMaxHp = getEffectiveMaxHealth(p.robot);
  const eMaxHp = getEffectiveMaxHealth(e.robot);
  const pMaxEn = getEffectiveMaxEnergy(p.robot);
  const eMaxEn = getEffectiveMaxEnergy(e.robot);

  terminal.print(`FIGHT #${battle.fightNumber}: vs ${e.robot.name}`, "t-yellow t-bold");
  terminal.print("");
  terminal.print(`=== Turn ${battle.turnNumber} ===`, "t-yellow t-bold");
  terminal.print("");
  terminal.print(`${p.robot.name} (You)`, "t-magenta");
  terminal.print(`  Health: ${hpBar(p.currentHealth, pMaxHp)} ${p.currentHealth}/${pMaxHp}`, "t-cyan");
  terminal.print(`  Energy: ${hpBar(p.currentEnergy, pMaxEn)} ${p.currentEnergy}/${pMaxEn}`, "t-yellow");
  terminal.print("");
  terminal.print(`${e.robot.name} (Enemy)`, "t-magenta");
  terminal.print(`  Health: ${hpBar(e.currentHealth, eMaxHp)} ${e.currentHealth}/${eMaxHp}`, "t-cyan");
  terminal.print(`  Energy: ${hpBar(e.currentEnergy, eMaxEn)} ${e.currentEnergy}/${eMaxEn}`, "t-yellow");

  if (battle.lastTurnLog.length > 0) {
    terminal.print("");
    terminal.print("-- Last Turn --", "t-dim");
    for (const msg of battle.lastTurnLog) {
      terminal.print(`  ${msg}`, "t-dim");
    }
  }
}

function hpBar(current: number, max: number, width = 20): string {
  if (max === 0) return "[" + "░".repeat(width) + "]";
  const filled = Math.round((current / max) * width);
  return "[" + "█".repeat(filled) + "░".repeat(width - filled) + "]";
}

function showBattleSummary(terminal: Terminal, battle: BattleState): void {
  if (battle.turnHistory.length === 0) return;
  terminal.print("");
  terminal.print("-- Battle Summary --", "t-yellow t-bold");
  for (const snap of battle.turnHistory) {
    terminal.print(
      `Turn ${snap.turn}: ${battle.player.robot.name} ${snap.playerHp}/${snap.playerMaxHp}, ${battle.enemy.robot.name} ${snap.enemyHp}/${snap.enemyMaxHp}`,
    );
  }
}

// ── Player turn ──

async function playerTurn(
  terminal: Terminal,
  battle: BattleState,
): Promise<"continue" | "surrendered" | "auto"> {
  const player = battle.player;
  const suggested = aiPlanAction(battle, true);

  while (true) {
    const choice = await terminal.promptChoice("Choose your action:", [
      { label: "1. Attack", value: "attack" },
      { label: "2. Use Item", value: "item" },
      { label: "3. Rest", value: "rest" },
      { label: "4. Surrender", value: "surrender" },
      { label: "5. Auto-Battle", value: "auto" },
    ]);

    if (choice === "auto") return "auto";

    if (choice === "surrender") {
      const confirm = await terminal.promptChoice("Are you sure?", [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ]);
      if (confirm === "yes") {
        battle.winner = "enemy";
        return "surrendered";
      }
      continue;
    }

    if (choice === "attack") {
      const planned = await playerPlanAttack(terminal, battle, suggested);
      if (planned) return "continue";
    } else if (choice === "item") {
      await playerUseItem(terminal, battle);
      if (battle.winner) return "continue";
    } else if (choice === "rest") {
      planRest(battle, true);
      terminal.print("You prepare to rest...");
      return "continue";
    }
  }
}

async function playerPlanAttack(
  terminal: Terminal,
  battle: BattleState,
  suggested: { actionType: string; weapons: Weapon[] },
): Promise<boolean> {
  const player = battle.player;
  const weapons = getWeapons(player.robot);

  if (weapons.length === 0) {
    terminal.print("You have no weapons!", "t-red");
    return false;
  }

  terminal.print("");
  terminal.print("Select weapons to attack with:");
  for (let i = 0; i < weapons.length; i++) {
    const w = weapons[i];
    const notes: string[] = [];
    if (w.energyCost > player.currentEnergy) notes.push("not enough energy");
    for (const req of w.requirements) {
      if (!player.robot.inventory.some((it) => it.name === req)) notes.push(`needs ${req}`);
    }
    const status = notes.length ? ` (${notes.join(", ")})` : "";
    terminal.print(`  ${i + 1}. ${w.name} - ${w.damage} dmg, ${w.hands}h, ${w.energyCost} energy${status}`);
  }
  terminal.print(`Available hands: ${getEffectiveHands(player.robot)}`);

  const input = await terminal.promptText("Weapons (comma-separated numbers, e.g. 1,2): ");

  if (input.toLowerCase() === "back" || input === "") return false;

  const indices = input.split(",").map((s) => parseInt(s.trim(), 10) - 1);
  const selectedWeapons: Weapon[] = [];
  for (const idx of indices) {
    if (idx >= 0 && idx < weapons.length) {
      selectedWeapons.push(weapons[idx]);
    } else {
      terminal.print(`Invalid weapon number: ${idx + 1}`, "t-red");
      return false;
    }
  }

  if (new Set(indices).size !== indices.length) {
    terminal.print("You can only use each weapon once per attack", "t-red");
    return false;
  }

  const result = planAttack(battle, selectedWeapons, true);
  if (!result.success) {
    terminal.print(result.message, "t-red");
    return false;
  }

  terminal.print(`You prepare to attack with ${selectedWeapons.map((w) => w.name).join(", ")}...`);
  return true;
}

async function playerUseItem(terminal: Terminal, battle: BattleState): Promise<void> {
  const player = battle.player;
  const consumables = getConsumables(player.robot).filter(
    (c) => !player.consumablesUsed.includes(c.name),
  );

  if (consumables.length === 0) {
    terminal.print("You have no usable consumables!", "t-red");
    return;
  }

  terminal.print("");
  const choices: Choice[] = [{ label: "Back", value: "back" }];
  for (let i = 0; i < consumables.length; i++) {
    choices.push({
      label: `${i + 1}. ${consumables[i].name} - ${consumables[i].description}`,
      value: String(i),
    });
  }

  const choice = await terminal.promptChoice("Select a consumable:", choices);
  if (choice === "back") return;

  const idx = parseInt(choice, 10);
  if (idx >= 0 && idx < consumables.length) {
    const result = useConsumable(battle, battle.player, battle.enemy, consumables[idx]);
    if (result.success) {
      terminal.print(result.message, "t-green");
    } else {
      terminal.print(result.message, "t-red");
    }
  }
}
