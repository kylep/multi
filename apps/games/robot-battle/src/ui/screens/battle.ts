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

    await terminal.promptContinue(0);
  }

  // Battle ended
  recordTurnSnapshot(battle);
  terminal.print("");

  const turns = battle.turnHistory.length;
  const playerHp = Math.max(0, battle.player.currentHealth);
  const playerMax = getEffectiveMaxHealth(player);

  if (battle.winner === "player") {
    terminal.print("*** VICTORY! ***", "t-green t-bold");
    terminal.print(`Won in ${turns} turns with ${playerHp}/${playerMax} HP remaining`, "t-dim");
    recordFight(state, true);

    terminal.print("");
    const leveled = awardExp(state, enemyDef.expReward);
    const actual = awardMoney(state, enemyDef.reward);
    terminal.print(`  +${enemyDef.expReward} exp   +$${actual}`, "t-green t-bold");

    if (leveled) {
      terminal.print("");
      terminal.print(`*** LEVEL UP! Now level ${player.level}! ***`, "t-yellow t-bold");
    }

    terminal.print("");
    terminal.print(`$${player.money} | Lv.${player.level} (${player.exp}/10 exp) | ${player.wins}W/${player.fights}F`, "t-cyan");
    printNextLevelPreview(terminal, state);
  } else {
    if (battle.player.currentHealth > 0) {
      terminal.print("*** SURRENDERED ***", "t-yellow");
    } else {
      terminal.print("*** DEFEAT ***", "t-red t-bold");
      terminal.print(`Lasted ${turns} turns`, "t-dim");
    }
    recordFight(state, false);
    player.money += 10;
    terminal.print(`  +$10 consolation`, "t-green");
    terminal.print("");
    terminal.print(`$${player.money} | Lv.${player.level} (${player.exp}/10 exp) | ${player.wins}W/${player.fights}F`, "t-cyan");
    printNextLevelPreview(terminal, state);
  }

  // Reset health/energy
  player.health = getEffectiveMaxHealth(player);
  player.energy = getEffectiveMaxEnergy(player);

  await terminal.promptContinue();
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
    // AI picks both actions
    const playerAction = aiPlanAction(battle, true);
    battle.playerAction = playerAction;
    const enemyAction = aiPlanAction(battle, false);
    battle.enemyAction = enemyAction;

    // Resolve
    const rng = createRng();
    resolveTurn(battle, rng);

    // Clear and render everything at once (no blank flash)
    terminal.clear();
    terminal.print("");
    printBattleStatus(terminal, battle);
    terminal.print("");
    terminal.print("[AUTO-BATTLE]", "t-yellow t-bold");
    terminal.print("");
    printTurnLog(terminal, battle);

    if (battle.winner === null) {
      endTurn(battle);
    }

    // Pause with content visible
    await delay(175);
  }
}

// ── Display helpers ──

function printTurnLog(terminal: Terminal, battle: BattleState): void {
  const logLines = battle.currentTurnLog.map((msg) => {
    if (msg.includes("hits for")) return `<div class="t-red">${esc(msg)}</div>`;
    if (msg.includes("destroyed")) return `<div class="t-red t-bold">${esc(msg)}</div>`;
    return `<div>${esc(msg)}</div>`;
  }).join("");
  terminal.printHTML(`<div class="panel" style="margin-top:8px"><div class="t-yellow t-bold">Turn Resolution</div>${logLines}</div>`);
}

function printBattleStatus(terminal: Terminal, battle: BattleState): void {
  const p = battle.player;
  const e = battle.enemy;
  const pMaxHp = getEffectiveMaxHealth(p.robot);
  const eMaxHp = getEffectiveMaxHealth(e.robot);
  const pMaxEn = getEffectiveMaxEnergy(p.robot);
  const eMaxEn = getEffectiveMaxEnergy(e.robot);

  terminal.printHTML(`<div class="t-yellow t-bold">FIGHT #${battle.fightNumber}: vs ${esc(e.robot.name)} &mdash; Turn ${battle.turnNumber}</div>`);

  const lastTurnHtml = battle.lastTurnLog.length > 0
    ? `<div class="t-dim" style="margin-top:6px;font-size:13px">${battle.lastTurnLog.map((m) => esc(m)).join("<br>")}</div>`
    : "";

  terminal.printHTML(`
    <div class="battle-layout">
      <div class="panel">
        <div class="t-magenta t-bold">${esc(p.robot.name)} (You)</div>
        <div class="t-cyan">HP: ${hpBar(p.currentHealth, pMaxHp)} ${p.currentHealth}/${pMaxHp}</div>
        <div class="t-yellow">EN: ${hpBar(p.currentEnergy, pMaxEn)} ${p.currentEnergy}/${pMaxEn}</div>
      </div>
      <div class="panel">
        <div class="t-magenta t-bold">${esc(e.robot.name)} (Enemy)</div>
        <div class="t-cyan">HP: ${hpBar(e.currentHealth, eMaxHp)} ${e.currentHealth}/${eMaxHp}</div>
        <div class="t-yellow">EN: ${hpBar(e.currentEnergy, eMaxEn)} ${e.currentEnergy}/${eMaxEn}</div>
      </div>
    </div>
    ${lastTurnHtml}
  `);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function hpBar(current: number, max: number, width = 20): string {
  if (max === 0) return "[" + "░".repeat(width) + "]";
  const ratio = Math.min(1, Math.max(0, current / max));
  const filled = Math.round(ratio * width);
  return "[" + "█".repeat(filled) + "░".repeat(width - filled) + "]";
}

// ── Player turn ──

async function playerTurn(
  terminal: Terminal,
  battle: BattleState,
): Promise<"continue" | "surrendered" | "auto"> {
  const player = battle.player;
  const suggested = aiPlanAction(battle, true);

  function redrawBattle(): void {
    terminal.clear();
    terminal.print("");
    printBattleStatus(terminal, battle);
    terminal.print("");
  }

  while (true) {
    const hasWeapons = getWeapons(player.robot).length > 0;
    const hasConsumables = getConsumables(player.robot).some(
      (c) => !player.consumablesUsed.includes(c.name),
    );

    const choices: Choice[] = [];
    choices.push({ label: "Auto", value: "auto" });
    choices.push({ label: hasWeapons ? "Attack" : "Attack (none)", value: "attack" });
    choices.push({ label: hasConsumables ? "Item" : "Item (none)", value: "item" });
    choices.push({ label: "Rest", value: "rest" });
    choices.push({ label: "Surrender", value: "surrender" });

    const choice = await terminal.promptChoice("", choices, "row");

    if (choice === "auto") return "auto";

    if (choice === "surrender") {
      const confirmed = await terminal.promptConfirm("Surrender this fight?", "Yes", "No");
      if (confirmed) {
        battle.winner = "enemy";
        return "surrendered";
      }
      redrawBattle();
      continue;
    }

    if (choice === "attack") {
      if (!hasWeapons) {
        redrawBattle();
        terminal.print("You have no weapons!", "t-red");
        continue;
      }
      const planned = await playerPlanAttack(terminal, battle, suggested);
      if (planned) return "continue";
      redrawBattle();
    } else if (choice === "item") {
      if (!hasConsumables) {
        redrawBattle();
        terminal.print("No usable items!", "t-red");
        continue;
      }
      await playerUseItem(terminal, battle);
      if (battle.winner) return "continue";
      redrawBattle();
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

  // If only one weapon, auto-select it
  if (weapons.length === 1) {
    const result = planAttack(battle, [weapons[0]], true);
    if (!result.success) {
      terminal.print(result.message, "t-red");
      return false;
    }
    terminal.print(`You prepare to attack with ${weapons[0].name}...`);
    return true;
  }

  // Multiple weapons — let player toggle which ones to use
  const selected = new Set<number>();
  // Pre-select what the AI would pick
  for (const sw of suggested.weapons) {
    const idx = weapons.indexOf(sw);
    if (idx !== -1) selected.add(idx);
  }

  const availableHands = getEffectiveHands(player.robot);

  while (true) {
    const choices: Choice[] = [];
    for (let i = 0; i < weapons.length; i++) {
      const w = weapons[i];
      const check = selected.has(i) ? "[x]" : "[ ]";
      const notes: string[] = [];
      if (w.energyCost > player.currentEnergy) notes.push("no energy");
      for (const req of w.requirements) {
        if (!player.robot.inventory.some((it) => it.name === req)) notes.push(`needs ${req}`);
      }
      const status = notes.length ? ` (${notes.join(", ")})` : "";
      choices.push({
        label: `${check} ${w.name} - ${w.damage} dmg, ${w.hands}h, ${w.energyCost} energy${status}`,
        value: `toggle-${i}`,
      });
    }

    const usedHands = [...selected].reduce((s, i) => s + weapons[i].hands, 0);
    const usedEnergy = [...selected].reduce((s, i) => s + weapons[i].energyCost, 0);

    choices.push({
      label: `>> Attack (${usedHands}/${availableHands} hands, ${usedEnergy} energy)`,
      value: "confirm",
    });
    choices.push({ label: "Back", value: "back" });

    const choice = await terminal.promptChoice("Select weapons:", choices);

    if (choice === "back") return false;

    if (choice.startsWith("toggle-")) {
      const idx = parseInt(choice.slice(7), 10);
      if (selected.has(idx)) {
        selected.delete(idx);
      } else {
        selected.add(idx);
      }
      continue;
    }

    if (choice === "confirm") {
      const selectedWeapons = [...selected].map((i) => weapons[i]);
      if (selectedWeapons.length === 0) {
        terminal.print("Select at least one weapon!", "t-red");
        continue;
      }
      const result = planAttack(battle, selectedWeapons, true);
      if (!result.success) {
        terminal.print(result.message, "t-red");
        continue;
      }
      terminal.print(`You prepare to attack with ${selectedWeapons.map((w) => w.name).join(", ")}...`);
      return true;
    }
  }
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
