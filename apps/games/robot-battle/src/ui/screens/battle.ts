/** Battle screen — combat UI. */

import type { Terminal, Choice } from "../terminal";
import type { GameState } from "../../engine/state";
import type { BattleState, Enemy, Rng, Weapon } from "../../engine/types";
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
  getAmmoSummary,
  getConsumables,
  getEffectiveHands,
  getEffectiveMaxEnergy,
  getEffectiveMaxHealth,
  getWeaponEnergyCost,
  getWeapons,
  hasItem,
} from "../../engine/robot";
import { awardExp, awardInterest, awardMoney, getXpToLevel, recordFight } from "../../engine/state";
import { buyItem, canBuy } from "../../engine/shop";
import { shouldShowLootBox } from "../../engine/battle";
import type { SoundPlayer } from "../sound";
import type { SaveStorage } from "../../engine/save";
import { addLeaderboardEntry, loadLeaderboard } from "../../engine/save";
import factsData from "../../data/facts.json";

function getRandomFact(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RestockResult {
  bought: string[];
  bankWithdraw: number;
}

/** Try to rebuy consumed consumables, cheapest first. Withdraws from bank if needed. */
function restockConsumables(state: GameState, usedNames: string[]): RestockResult {
  const player = state.player!;
  if (!player.settings.restockConsumables || usedNames.length === 0) return { bought: [], bankWithdraw: 0 };

  // Count how many of each consumable were used
  const counts = new Map<string, number>();
  for (const name of usedNames) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  // Resolve to registry items and sort cheapest first
  const toBuy: Array<{ name: string; qty: number; cost: number }> = [];
  for (const [name, qty] of counts) {
    const item = state.registry.getItem(name);
    if (item && item.itemType === "consumable") toBuy.push({ name, qty, cost: item.moneyCost });
  }
  toBuy.sort((a, b) => a.cost - b.cost);

  let bankWithdraw = 0;
  const bought: string[] = [];
  for (const { name, qty } of toBuy) {
    const item = state.registry.getItem(name);
    if (!item) continue;
    for (let i = 0; i < qty; i++) {
      // If we can't afford it but bank has funds, withdraw the difference
      const sandbox = player.settings.mode === "sandbox";
      if (!sandbox && player.money < item.moneyCost && player.bank > 0) {
        const shortfall = item.moneyCost - player.money;
        const withdraw = Math.min(shortfall, player.bank);
        player.bank -= withdraw;
        player.money += withdraw;
        bankWithdraw += withdraw;
      }
      const check = canBuy(state, item);
      if (!check.ok) break;
      buyItem(state, item);
      bought.push(item.name);
    }
  }
  return { bought, bankWithdraw };
}

function restockSummaryHtml(state: GameState, result: RestockResult): string {
  const restockCounts = new Map<string, number>();
  let restockTotal = 0;
  for (const name of result.bought) {
    restockCounts.set(name, (restockCounts.get(name) ?? 0) + 1);
    const item = state.registry.getItem(name);
    if (item) restockTotal += item.moneyCost;
  }
  const restockList = [...restockCounts.entries()].map(([name, count]) => count > 1 ? `${name} ×${count}` : name).join(", ");
  let html = `<div><span class="t-dim">Restocked: ${esc(restockList)} (-$${restockTotal})</span>`;
  if (result.bankWithdraw > 0) {
    html += ` <span class="t-cyan">($${result.bankWithdraw} withdrawn from bank)</span>`;
  }
  html += `</div>`;
  return html;
}

export async function battleScreen(
  terminal: Terminal,
  state: GameState,
  enemyName: string,
  sound?: SoundPlayer,
  storage?: SaveStorage,
): Promise<"continue" | "fight-again" | "shop"> {
  const player = state.player!;
  const enemyDef = state.registry.enemies.get(enemyName)!;
  const enemyRobot = state.registry.createEnemyRobot(enemyName);
  if (!enemyRobot) {
    terminal.print("Error creating enemy!", "t-red");
    return "continue";
  }

  // Oliver's EXTRA CHALLENGE: enemies get 3x HP per level
  const isChallenge = player.settings.oliverChallenge;
  if (isChallenge) {
    enemyRobot.maxHealth += enemyRobot.level * 4;
  }

  // Use challenge name during combat if available
  const displayName = isChallenge && enemyDef.challengeName ? enemyDef.challengeName : enemyName;
  const nameClass = isChallenge && enemyDef.challengeName ? "t-purple" : "t-magenta";
  enemyRobot.name = displayName;

  const fightNumber = player.fights + 1;
  const battle = createBattle(player, enemyRobot, fightNumber);

  // Battle loop
  while (battle.winner === null) {
    terminal.clear();
    terminal.print("");
    printBattleStatus(terminal, battle, undefined, nameClass);
    terminal.print("");

    const result = await playerTurn(terminal, battle, nameClass);

    if (result === "auto") {
      await autoBattle(terminal, battle, nameClass);
      if (battle.winner) break;
      continue; // stalemate — return to manual control
    }

    if (result === "surrendered" || battle.winner) break;

    const enemyAction = aiPlanAction(battle, false);
    battle.enemyAction = enemyAction;

    const rng = createRng();
    resolveTurn(battle, rng);

    terminal.clear();
    terminal.print("");
    const anims = animsFromLog(battle);
    printBattleStatus(terminal, battle, anims, nameClass);
    terminal.print("");
    printTurnLog(terminal, battle);

    // Play sound for hits/misses
    if (sound) {
      const log = battle.currentTurnLog;
      if (log.some((l) => l.includes("hits for"))) sound.hit();
      else if (log.some((l) => l.includes("misses"))) sound.miss();
    }

    if (battle.winner === null) {
      endTurn(battle);
    }

    await terminal.promptContinue(0);
  }

  // Battle ended — capture final turn log and snapshot
  recordTurnSnapshot(battle);
  if (battle.currentTurnLog.length > 0) {
    battle.turnLogs.push([...battle.currentTurnLog]);
  }

  const turns = battle.turnHistory.length;
  const playerHp = Math.max(0, battle.player.currentHealth);
  const playerMax = getEffectiveMaxHealth(player);

  if (battle.winner === "player") {
    recordFight(state, true);
    sound?.victory();
    // Easy enemies (below player level) give 50% gold and 50% XP
    const isEasy = enemyDef.level < player.level;
    const xpReward = isEasy ? Math.floor(enemyDef.expReward / 2) : enemyDef.expReward;
    let goldReward = isEasy ? Math.floor(enemyDef.reward / 2) : enemyDef.reward;

    // Challenge mode bonuses
    const isChallenge = player.settings.oliverChallenge;
    const firstChallengeWin = isChallenge && !player.challengeDefeatedEnemies.includes(enemyName);
    if (isChallenge) {
      if (firstChallengeWin) goldReward *= 2;
      goldReward = Math.floor(goldReward * 1.2);
    }

    const leveled = awardExp(state, xpReward);
    const actual = awardMoney(state, goldReward);
    if (player.settings.autoDeposit && actual > 0) {
      player.money -= actual;
      player.bank += actual;
    }
    const interest = awardInterest(player);

    // Restock consumables used during the fight
    const restocked = restockConsumables(state, battle.player.consumablesUsed);

    // Track defeated enemies (not in sandbox — badges are a normal-mode reward)
    if (player.settings.mode !== "sandbox") {
      if (!player.defeatedEnemies.includes(enemyName)) {
        player.defeatedEnemies.push(enemyName);
      }
      if (isChallenge && !player.challengeDefeatedEnemies.includes(enemyName)) {
        player.challengeDefeatedEnemies.push(enemyName);
      }
    }

    if (leveled) sound?.levelUp();

    // 100% Game Complete check — only show once per achievement
    const totalEnemies = state.registry.enemies.size;
    const justCompleted100 = player.settings.mode !== "sandbox"
      && isChallenge && firstChallengeWin
      && player.challengeDefeatedEnemies.length >= totalEnemies;
    if (justCompleted100) {
      // Record to leaderboard
      if (storage) {
        addLeaderboardEntry(storage, {
          name: player.name,
          fights: player.fights,
          newGamePlusLevel: player.newGamePlusLevel,
          date: new Date().toISOString().slice(0, 10),
          cheatsUsed: player.cheatsUsed,
        });
      }
      terminal.clear();
      terminal.printHTML(`
        <div class="title-center" style="min-height:0;margin:24px 0">
          <div class="t-yellow t-bold">╔═════════════════════════════════════════════╗</div>
          <div class="t-yellow t-bold" style="font-size:26px">★ 100% GAME COMPLETE ★</div>
          <div class="t-yellow t-bold">╚═════════════════════════════════════════════╝</div>
          <div class="t-green" style="margin-top:12px">You have defeated every enemy on Challenge Mode!</div>
          <div class="t-cyan" style="margin-top:8px">You are the ultimate Robot Battle champion.</div>
          <div class="t-dim" style="margin-top:8px">Try New Game + from the title screen for an even bigger challenge!</div>
        </div>
      `);
      // Show leaderboard
      if (storage) {
        const board = loadLeaderboard(storage);
        if (board.length > 0) {
          let lbHtml = `<div class="t-yellow t-bold" style="margin-top:12px">LEADERBOARD</div>`;
          for (let i = 0; i < board.length; i++) {
            const e = board[i];
            const ngp = e.newGamePlusLevel > 0 ? ` [+${e.newGamePlusLevel}]` : "";
            const cheat = e.cheatsUsed ? ` <span class="t-red">✘</span>` : "";
            lbHtml += `<div class="t-dim">${i + 1}. ${e.name}${ngp}${cheat} — ${e.fights} fights (${e.date})</div>`;
          }
          terminal.printHTML(`<div class="panel" style="padding:8px 12px">${lbHtml}</div>`);
        }
      }
      await terminal.promptContinue(0);
    }

    // Loot box check (victory only)
    const lootRng = createRng();
    if (shouldShowLootBox(turns, lootRng)) {
      sound?.lootBox();
      await showLootBox(terminal, state, enemyDef, lootRng);
    }

    // Show victory screen in a loop (re-render after viewing battle log)
    while (true) {
      terminal.clear();
      if (enemyName === "TITAN" && !player.titanDefeated) {
        player.titanDefeated = true;
        const hardMode = player.settings.oliverChallenge;
        const msg = hardMode ? "YOU WON THE GAME... ON HARD MODE!" : "YOU WON THE GAME!";
        terminal.printHTML(`<div class="title-center" style="min-height:0;margin:24px 0"><div class="t-yellow t-bold">╔═══════════════════════════════════════╗</div><div class="t-yellow t-bold" style="font-size:26px">${msg}</div><div class="t-yellow t-bold">╚═══════════════════════════════════════╝</div></div>`);
        terminal.printHTML(`<div class="t-dim" style="margin:0 0 8px 0">Try New Game + from the main menu!</div>`);
      } else {
        terminal.printHTML(`<div class="title-center" style="min-height:0;margin:16px 0"><div class="t-green t-bold">╔═══════════════════════════════╗</div><div class="t-green t-bold" style="font-size:22px">VICTORY!</div><div class="t-green t-bold">╚═══════════════════════════════╝</div></div>`);
      }

      const victoryNameClass = isChallenge && enemyDef.challengeName ? "t-purple" : "t-yellow";
      let rewardsHtml = `<div>Defeated <span class="${victoryNameClass} t-bold">${esc(displayName)}</span> in <span class="t-cyan">${turns}</span> ${turns === 1 ? "turn" : "turns"}</div>`;
      rewardsHtml += `<div>HP remaining: <span class="t-cyan">${playerHp}/${playerMax}</span></div>`;
      let challengeTag = "";
      if (firstChallengeWin) challengeTag = ` <span class="t-purple">(2x + 20% challenge bonus!)</span>`;
      else if (isChallenge) challengeTag = ` <span class="t-purple">(+20% challenge bonus)</span>`;
      rewardsHtml += `<div style="margin-top:8px"><span class="t-green t-bold">+ $${actual}</span>${challengeTag}${player.settings.autoDeposit ? ` <span class="t-cyan">→ bank</span>` : ""} &nbsp; <span class="t-magenta t-bold">+ ${xpReward} XP</span></div>`;
      if (interest > 0) {
        rewardsHtml += `<div><span class="t-green">+ $${interest} bank interest</span></div>`;
      }
      if (restocked.bought.length > 0) {
        rewardsHtml += restockSummaryHtml(state, restocked);
      }
      if (leveled) {
        rewardsHtml += `<div style="margin-top:8px" class="t-yellow t-bold">*** LEVEL UP! Now level ${player.level}! ***</div>`;
        const unlocked = getLevelUnlockPreview(state, player.level);
        if (unlocked) rewardsHtml += `<div class="t-yellow">Unlocked: ${unlocked}</div>`;
      }
      rewardsHtml += `<div style="margin-top:8px" class="t-cyan">$${player.money} &nbsp; Lv.${player.level} &nbsp; XP ${player.exp}/${getXpToLevel(player.level)} &nbsp; ${player.wins}W / ${player.fights}F</div>`;
      if (!leveled) {
        const nextPreview = getLevelUnlockPreview(state, player.level + 1);
        if (nextPreview) rewardsHtml += `<div style="margin-top:4px" class="t-dim">Next level: ${nextPreview}</div>`;
      }
      terminal.printHTML(`<div class="panel" style="padding:12px 16px">${rewardsHtml}</div>`);

      const fact = getRandomFact(factsData.victory);
      terminal.printHTML(`<div class="panel" style="padding:8px 12px;margin-top:8px"><span class="t-cyan t-bold">Did you know?</span> <span class="t-dim">${esc(fact)}</span></div>`);

      const choice = await terminal.promptChoice("", [
        { label: "Continue", value: "continue" },
        { label: "Fight Again", value: "fight-again" },
        { label: "Shop", value: "shop" },
        { label: "Battle Log", value: "log" },
      ], "row");
      if (choice === "log") { await showBattleLog(terminal, battle, player.name, enemyName); continue; }
      player.health = getEffectiveMaxHealth(player);
      player.energy = getEffectiveMaxEnergy(player);
      return choice as "continue" | "fight-again" | "shop";
    }
  } else {
    recordFight(state, false);
    const surrendered = battle.player.currentHealth > 0;
    if (!surrendered) {
      player.money += 10;
      sound?.defeat();
    }
    const defeatInterest = awardInterest(player);
    const defeatRestocked = restockConsumables(state, battle.player.consumablesUsed);

    while (true) {
      terminal.clear();
      if (surrendered) {
        terminal.printHTML(`<div class="title-center" style="min-height:0;margin:16px 0"><div class="t-yellow t-bold">╔═══════════════════════════════╗</div><div class="t-yellow t-bold" style="font-size:22px">SURRENDERED</div><div class="t-yellow t-bold">╚═══════════════════════════════╝</div></div>`);
      } else {
        terminal.printHTML(`<div class="title-center" style="min-height:0;margin:16px 0"><div class="t-red t-bold">╔═══════════════════════════════╗</div><div class="t-red t-bold" style="font-size:22px">DEFEATED</div><div class="t-red t-bold">╚═══════════════════════════════╝</div></div>`);
      }

      let infoHtml = surrendered
        ? `<div>Surrendered to <span class="${nameClass} t-bold">${esc(displayName)}</span></div>`
        : `<div>Destroyed by <span class="${nameClass} t-bold">${esc(displayName)}</span> after <span class="t-cyan">${turns}</span> ${turns === 1 ? "turn" : "turns"}</div>`;
      if (!surrendered) infoHtml += `<div style="margin-top:4px"><span class="t-green">+$10 consolation</span></div>`;
      if (defeatInterest > 0) infoHtml += `<div><span class="t-green">+ $${defeatInterest} bank interest</span></div>`;
      if (defeatRestocked.bought.length > 0) {
        infoHtml += restockSummaryHtml(state, defeatRestocked);
      }
      infoHtml += `<div style="margin-top:8px" class="t-cyan">$${player.money} &nbsp; Lv.${player.level} &nbsp; XP ${player.exp}/${getXpToLevel(player.level)} &nbsp; ${player.wins}W / ${player.fights}F</div>`;
      const nextPreview = getLevelUnlockPreview(state, player.level + 1);
      if (nextPreview) infoHtml += `<div style="margin-top:4px" class="t-dim">Next level: ${nextPreview}</div>`;
      terminal.printHTML(`<div class="panel" style="padding:12px 16px">${infoHtml}</div>`);

      if (!surrendered) {
        const fact = getRandomFact(factsData.defeat);
        terminal.printHTML(`<div class="panel" style="padding:8px 12px;margin-top:8px"><span class="t-cyan t-bold">Keep going!</span> <span class="t-dim">${esc(fact)}</span></div>`);
      }

      const choice = await terminal.promptChoice("", [
        { label: "Continue", value: "continue" },
        { label: "Fight Again", value: "fight-again" },
        { label: "Shop", value: "shop" },
        { label: "Battle Log", value: "log" },
      ], "row");
      if (choice === "log") { await showBattleLog(terminal, battle, player.name, enemyName); continue; }
      // Reset health/energy before returning
      player.health = getEffectiveMaxHealth(player);
      player.energy = getEffectiveMaxEnergy(player);
      return choice as "continue" | "fight-again" | "shop";
    }
  }

  // Reset health/energy (fallback, should not reach here)
  player.health = getEffectiveMaxHealth(player);
  player.energy = getEffectiveMaxEnergy(player);
  return "continue";
}

function getLevelUnlockPreview(state: GameState, level: number): string | null {
  const items = state.registry.getAllItems().filter((i) => i.level === level);
  if (items.length === 0) return null;
  return items.map((i) => i.name).join(", ");
}

async function showBattleLog(
  terminal: Terminal,
  battle: BattleState,
  playerName: string,
  enemyName: string,
): Promise<void> {
  terminal.clear();

  terminal.printHTML(`<div class="panel-header"><span class="t-yellow t-bold">BATTLE LOG</span> &nbsp; <span class="t-dim">${playerName} vs ${enemyName}</span></div>`);

  // Continue at top
  const topChoices: Choice[] = [{ label: "Continue", value: "continue" }];
  // We can't have two interactive prompts, so render top as static text and bottom as interactive

  for (let t = 0; t < battle.turnLogs.length; t++) {
    const logs = battle.turnLogs[t];
    const snapshot = battle.turnHistory[t];

    let turnHtml = `<div class="t-yellow t-bold" style="margin-bottom:4px">Turn ${t + 1}</div>`;
    for (const line of logs) {
      const isHit = line.includes("hits for") || line.includes("destroyed");
      const isMiss = line.includes("misses!");
      const cls = isHit ? "t-red" : isMiss ? "t-dim" : "";
      turnHtml += `<div class="${cls}">${line.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
    }
    if (snapshot) {
      turnHtml += `<div style="margin-top:4px" class="t-dim">${playerName}: ${Math.max(0, snapshot.playerHp)}/${snapshot.playerMaxHp} HP &nbsp; ${enemyName}: ${Math.max(0, snapshot.enemyHp)}/${snapshot.enemyMaxHp} HP</div>`;
    }
    terminal.printHTML(`<div class="panel" style="padding:8px 12px;margin:4px 0">${turnHtml}</div>`);
  }

  // Continue at bottom
  await terminal.promptChoice("", topChoices, "row");
}

// ── Auto-Battle ──

async function autoBattle(terminal: Terminal, battle: BattleState, enemyNameClass?: string): Promise<void> {
  let turnDelay = 250;
  let autoTurns = 0;
  while (battle.winner === null) {
    autoTurns++;
    if (autoTurns > 50) {
      terminal.print("");
      terminal.print("Auto-battle cancelled after 50 turns — stalemate!", "t-yellow t-bold");
      await terminal.promptContinue(0);
      break;
    }
    const playerAction = aiPlanAction(battle, true);
    battle.playerAction = playerAction;
    const enemyAction = aiPlanAction(battle, false);
    battle.enemyAction = enemyAction;

    const rng = createRng();
    resolveTurn(battle, rng);

    terminal.clear();
    terminal.print("");
    printBattleStatus(terminal, battle, undefined, enemyNameClass);
    terminal.print("");
    terminal.print("[AUTO-BATTLE]", "t-yellow t-bold");
    terminal.print("");
    printTurnLog(terminal, battle);

    if (battle.winner === null) {
      endTurn(battle);
    }

    await delay(turnDelay);
    turnDelay = Math.max(150, turnDelay - 5);
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

interface BattleAnims {
  playerPanel?: string;
  enemyPanel?: string;
}

function animsFromLog(battle: BattleState): BattleAnims {
  const log = battle.currentTurnLog;
  const pName = battle.player.robot.name;
  const eName = battle.enemy.robot.name;
  let playerPanel = "";
  let enemyPanel = "";
  for (const line of log) {
    if (line.includes("hits for")) {
      // The target of the hit gets the shake
      if (line.startsWith(eName)) playerPanel = "anim-shake";
      else if (line.startsWith(pName)) enemyPanel = "anim-shake";
    }
    if (line.includes("misses")) {
      if (line.startsWith(eName)) enemyPanel ||= "anim-flash";
      else if (line.startsWith(pName)) playerPanel ||= "anim-flash";
    }
  }
  if (battle.winner === "player") { enemyPanel = "anim-fadeout"; playerPanel = "anim-pulse"; }
  else if (battle.winner === "enemy") { playerPanel = "anim-fadeout"; enemyPanel = "anim-pulse"; }
  return { playerPanel, enemyPanel };
}

function printBattleStatus(terminal: Terminal, battle: BattleState, anims?: BattleAnims, enemyNameClass?: string): void {
  const p = battle.player;
  const e = battle.enemy;
  const pMaxHp = getEffectiveMaxHealth(p.robot);
  const eMaxHp = getEffectiveMaxHealth(e.robot);
  const pMaxEn = getEffectiveMaxEnergy(p.robot);
  const eMaxEn = getEffectiveMaxEnergy(e.robot);
  const barWidth = window.innerWidth < 500 ? 10 : 20;

  terminal.printHTML(`<div class="t-yellow t-bold">FIGHT #${battle.fightNumber}: vs <span class="${enemyNameClass ?? "t-yellow"}">${esc(e.robot.name)}</span> &mdash; Turn ${battle.turnNumber}</div>`);

  const pAnim = anims?.playerPanel ?? "";
  const eAnim = anims?.enemyPanel ?? "";

  const lastTurnHtml = battle.lastTurnLog.length > 0
    ? `<div class="t-dim" style="margin-top:6px;font-size:13px">${battle.lastTurnLog.map((m) => esc(m)).join("<br>")}</div>`
    : "";

  const pAmmo = getAmmoSummary(p.robot);
  const pAmmoHtml = pAmmo.length > 0
    ? `<div class="t-dim" style="font-size:13px">${pAmmo.map((a) => `${a.name}: ${a.count}`).join(" &nbsp; ")}</div>`
    : "";
  const eAmmo = getAmmoSummary(e.robot);
  const eAmmoHtml = eAmmo.length > 0
    ? `<div class="t-dim" style="font-size:13px">${eAmmo.map((a) => `${a.name}: ${a.count}`).join(" &nbsp; ")}</div>`
    : "";

  terminal.printHTML(`
    <div class="battle-layout">
      <div class="panel ${pAnim}">
        <div class="t-magenta t-bold">${esc(p.robot.name)} (You)</div>
        <div class="t-cyan">HP: ${hpBar(p.currentHealth, pMaxHp, barWidth)} ${p.currentHealth}/${pMaxHp}</div>
        <div class="t-yellow">EN: ${hpBar(p.currentEnergy, pMaxEn, barWidth)} ${p.currentEnergy}/${pMaxEn}</div>
        ${pAmmoHtml}
      </div>
      <div class="panel ${eAnim}">
        <div class="${enemyNameClass ?? "t-magenta"} t-bold">${esc(e.robot.name)} (Enemy)</div>
        <div class="t-cyan">HP: ${hpBar(e.currentHealth, eMaxHp, barWidth)} ${e.currentHealth}/${eMaxHp}</div>
        <div class="t-yellow">EN: ${hpBar(e.currentEnergy, eMaxEn, barWidth)} ${e.currentEnergy}/${eMaxEn}</div>
        ${eAmmoHtml}
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
  enemyNameClass?: string,
): Promise<"continue" | "surrendered" | "auto"> {
  const player = battle.player;
  const suggested = aiPlanAction(battle, true);

  function redrawBattle(): void {
    terminal.clear();
    terminal.print("");
    printBattleStatus(terminal, battle, undefined, enemyNameClass);
    terminal.print("");
  }

  while (true) {
    const weapons = getWeapons(player.robot);
    const hasWeapons = weapons.length > 0;
    const canAffordAny = hasWeapons && weapons.some((w) => getWeaponEnergyCost(w, player.robot) <= player.currentEnergy);
    const hasAmmoForAny = hasWeapons && weapons.some((w) =>
      w.requirements.length === 0 || w.requirements.every((req) => hasItem(player.robot, req))
    );
    const usedCounts = new Map<string, number>();
    for (const n of player.consumablesUsed) usedCounts.set(n, (usedCounts.get(n) ?? 0) + 1);
    const hasConsumables = !player.consumableUsedThisTurn && getConsumables(player.robot).some((c) => {
      const owned = player.robot.inventory.filter((i) => i.name === c.name).length;
      const used = usedCounts.get(c.name) ?? 0;
      return used < owned;
    });

    let attackLabel = "Attack";
    if (!hasWeapons) attackLabel = "Attack (none)";
    else if (!hasAmmoForAny && !canAffordAny) attackLabel = "Attack (no ammo/energy!)";
    else if (!hasAmmoForAny) attackLabel = "Attack (no ammo!)";
    else if (!canAffordAny) attackLabel = "Attack (no energy!)";

    const choices: Choice[] = [];
    choices.push({ label: "Auto", value: "auto" });
    choices.push({ label: attackLabel, value: "attack" });
    const itemLabel = player.consumableUsedThisTurn ? "Item (used)" : hasConsumables ? "Item" : "Item (none)";
    choices.push({ label: itemLabel, value: "item" });
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
      if (!hasAmmoForAny && !canAffordAny) {
        redrawBattle();
        terminal.print("Out of ammo and energy! Rest to recover energy.", "t-red");
        continue;
      }
      if (!hasAmmoForAny) {
        redrawBattle();
        terminal.print("Out of ammo! All your weapons need ammo you don't have.", "t-red");
        continue;
      }
      if (!canAffordAny) {
        redrawBattle();
        terminal.print("Not enough energy! Rest to recover.", "t-red");
        continue;
      }
      const planned = await playerPlanAttack(terminal, battle, suggested, enemyNameClass);
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
  enemyNameClass?: string,
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
    // Fresh screen for weapon selection
    terminal.clear();
    terminal.print("");
    printBattleStatus(terminal, battle, undefined, enemyNameClass);
    terminal.print("");

    const usedHands = [...selected].reduce((s, i) => s + weapons[i].hands, 0);
    const usedEnergy = [...selected].reduce((s, i) => s + getWeaponEnergyCost(weapons[i], player.robot), 0);

    // Deselect weapons that no longer have ammo
    for (const i of [...selected]) {
      const w = weapons[i];
      if (w.requirements.length > 0 && !w.requirements.every((req) => hasItem(player.robot, req))) {
        selected.delete(i);
      }
    }

    // Weapon toggles as grid cards
    const weaponChoices: Choice[] = [];
    for (let i = 0; i < weapons.length; i++) {
      const w = weapons[i];
      const check = selected.has(i) ? "[x]" : "[ ]";
      const missingAmmo = w.requirements.length > 0 && !w.requirements.every((req) => hasItem(player.robot, req));
      const ammoStr = w.requirements.length > 0 ? ` [${w.requirements[0]}: ${player.robot.inventory.filter((it) => w.requirements.includes(it.name)).length}]` : "";
      weaponChoices.push({
        label: `${check} ${w.name}${missingAmmo ? " (no ammo)" : ""}`,
        value: `toggle-${i}`,
        subtitle: `${w.damage} dmg, ${w.hands}h, ${getWeaponEnergyCost(w, player.robot)} en${ammoStr}`,
        disabled: missingAmmo,
      });
    }
    // Attack and Back as extra cards in the grid
    const canAttack = selected.size > 0 && usedHands <= availableHands && usedEnergy <= player.currentEnergy;
    weaponChoices.push({
      label: `Attack (${usedHands}/${availableHands}h, ${usedEnergy} en)`,
      value: "confirm",
      disabled: !canAttack,
    });
    weaponChoices.push({ label: "Back", value: "back" });

    const choice = await terminal.promptChoice("Select weapons:", weaponChoices, "grid");

    if (choice === "back") return false;

    if (choice.startsWith("toggle-")) {
      const idx = parseInt(choice.slice(7), 10);
      if (selected.has(idx)) selected.delete(idx);
      else selected.add(idx);
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
  const allConsumables = getConsumables(player.robot);

  // Group by name, count remaining (owned - used)
  const groups = new Map<string, { consumable: typeof allConsumables[0]; remaining: number }>();
  for (const c of allConsumables) {
    const existing = groups.get(c.name);
    if (existing) existing.remaining++;
    else groups.set(c.name, { consumable: c, remaining: 1 });
  }
  // Subtract used counts
  for (const name of player.consumablesUsed) {
    const g = groups.get(name);
    if (g) g.remaining--;
  }
  // Filter to usable
  const usable = [...groups.values()].filter((g) => g.remaining > 0);

  if (usable.length === 0) {
    terminal.print("You have no usable consumables!", "t-red");
    return;
  }

  terminal.print("");
  const choices: Choice[] = [{ label: "Back", value: "back" }];
  for (let i = 0; i < usable.length; i++) {
    const { consumable, remaining } = usable[i];
    const countStr = remaining > 1 ? ` (${remaining})` : "";
    choices.push({
      label: `${i + 1}. ${consumable.name}${countStr} - ${consumable.description}`,
      value: String(i),
    });
  }

  const choice = await terminal.promptChoice("Select a consumable:", choices);
  if (choice === "back") return;

  const idx = parseInt(choice, 10);
  if (idx >= 0 && idx < usable.length) {
    const result = useConsumable(battle, battle.player, battle.enemy, usable[idx].consumable, createRng());
    if (result.success) {
      terminal.print(result.message, "t-green");
    } else {
      terminal.print(result.message, "t-red");
    }
  }
}

// ── Loot Box ──

async function showLootBox(
  terminal: Terminal,
  state: GameState,
  enemyDef: Enemy,
  rng: Rng,
): Promise<void> {
  const player = state.player!;

  // Randomly assign rewards to 3 boxes
  const tiers: Array<"diamond" | "gold" | "silver"> = ["diamond", "gold", "silver"];
  // Fisher-Yates shuffle
  for (let i = tiers.length - 1; i > 0; i--) {
    const j = Math.floor(rng.random() * (i + 1));
    [tiers[i], tiers[j]] = [tiers[j], tiers[i]];
  }

  terminal.clear();
  terminal.printHTML(`
    <div class="title-center" style="min-height:0;margin:16px 0">
      <div class="t-yellow t-bold" style="font-size:22px">★ LOOT BOX! ★</div>
      <div class="t-dim">Choose a box!</div>
    </div>
  `);

  const boxArt = [
    "┌─────┐\n│ ??? │\n│  1  │\n└─────┘",
    "┌─────┐\n│ ??? │\n│  2  │\n└─────┘",
    "┌─────┐\n│ ??? │\n│  3  │\n└─────┘",
  ];

  const choice = await terminal.promptChoice("", [
    { label: "Box 1", value: "0", subtitle: boxArt[0], btnClass: "" },
    { label: "Box 2", value: "1", subtitle: boxArt[1], btnClass: "" },
    { label: "Box 3", value: "2", subtitle: boxArt[2], btnClass: "" },
  ], "row");

  const tier = tiers[parseInt(choice, 10)];

  // Get level-appropriate consumables based on enemy level
  const eligibleConsumables = state.registry.getAllItems()
    .filter((i) => i.itemType === "consumable" && i.level <= enemyDef.level);

  terminal.clear();

  // Show what all 3 boxes were
  const tierLabels: Record<string, string> = { diamond: "Diamond", gold: "Gold", silver: "Silver" };
  const tierColors: Record<string, string> = { diamond: "t-cyan", gold: "t-yellow", silver: "t-dim" };
  const revealHtml = tiers.map((t, i) => {
    const picked = i === parseInt(choice, 10);
    const cls = picked ? `${tierColors[t]} t-bold` : "t-dim";
    return `<span class="${cls}">[Box ${i + 1}: ${tierLabels[t]}${picked ? " ◄" : ""}]</span>`;
  }).join(" &nbsp; ");
  terminal.printHTML(`<div style="margin:8px 0">${revealHtml}</div>`);

  function grantConsumable(): string | null {
    // Try to find a consumable that isn't at max stack
    const shuffled = [...eligibleConsumables].sort(() => rng.random() - 0.5);
    for (const item of shuffled) {
      const c = item as import("../../engine/types").Consumable;
      if (c.maxStack > 0) {
        const owned = player.inventory.filter((inv) => inv.name === c.name).length;
        if (owned >= c.maxStack) continue;
      }
      player.inventory.push({ ...item });
      return item.name;
    }
    return null; // all consumables at max
  }

  if (tier === "diamond") {
    const money = enemyDef.reward;
    player.money += money;
    terminal.printHTML(`<div class="panel" style="padding:12px 16px"><div class="t-cyan t-bold" style="font-size:18px">Diamond!</div><div class="t-green t-bold" style="margin-top:8px">You found $${money.toLocaleString()}!</div></div>`);
  } else {
    const count = tier === "gold" ? 3 : 1;
    const label = tier === "gold" ? "Gold!" : "Silver!";
    const color = tier === "gold" ? "t-yellow" : "t-dim";
    const items: string[] = [];
    let fallbackMoney = 0;

    for (let i = 0; i < count; i++) {
      const granted = grantConsumable();
      if (granted) {
        items.push(granted);
      } else {
        // All full — give money instead
        fallbackMoney += enemyDef.reward;
      }
    }

    if (fallbackMoney > 0) player.money += fallbackMoney;

    let rewardHtml = items.map((n) => `<div class="t-green" style="margin-top:4px">+ ${esc(n)}</div>`).join("");
    if (fallbackMoney > 0) rewardHtml += `<div class="t-green t-bold" style="margin-top:4px">+ $${fallbackMoney.toLocaleString()} (inventory full)</div>`;

    terminal.printHTML(`<div class="panel" style="padding:12px 16px"><div class="${color} t-bold" style="font-size:18px">${label}</div>${rewardHtml}</div>`);
  }

  await terminal.promptContinue(0);
}
