/** Main menu screen. */

import type { Terminal, Choice } from "../terminal";
import type { GameState } from "../../engine/state";
import {
  getEffectiveDefence,
  getEffectiveDodge,
  getEffectiveMaxHealth,
  getWeapons,
} from "../../engine/robot";
import { showRobotStats } from "./inspect";
import { shopScreen } from "./shop";
import { battleScreen } from "./battle";

export async function mainMenu(
  terminal: Terminal,
  state: GameState,
  save?: () => void,
): Promise<void> {
  while (true) {
    terminal.clear();
    const player = state.player!;

    // Player stats header panel
    terminal.printHTML(`
      <div class="panel-header">
        <span class="t-blue t-bold">${player.name}</span>
        &nbsp;&nbsp;
        <span class="t-yellow">$${player.money}</span>
        &nbsp;&nbsp;
        <span class="t-magenta">Lv.${player.level} XP ${player.exp}/10</span>
        &nbsp;&nbsp;
        <span class="t-dim">${player.wins}W / ${player.fights}F</span>
      </div>
    `);

    const choice = await terminal.promptChoice("", [
      { label: "Fight", value: "fight", subtitle: "Battle enemies" },
      { label: "Shop", value: "shop", subtitle: "Buy & sell gear" },
      { label: "Inspect Robot", value: "inspect", subtitle: "View stats & inventory" },
      { label: "Quit", value: "quit", subtitle: "Return to title" },
    ], "grid");

    if (choice === "quit") break;

    if (choice === "fight") {
      await fightMenu(terminal, state);
      save?.();
    } else if (choice === "shop") {
      await shopScreen(terminal, state);
      save?.();
    } else if (choice === "inspect") {
      await showRobotStats(terminal, state);
      await terminal.promptContinue(0);
    }
  }
}

function getDifficulty(playerLevel: number, enemyLevel: number): string {
  const diff = enemyLevel - playerLevel;
  if (diff < 0) return "Easy";
  if (diff === 0) return "Fair";
  if (diff <= 2) return "Hard";
  return "Deadly";
}

async function fightMenu(terminal: Terminal, state: GameState): Promise<void> {
  const player = state.player!;
  const enemies = Array.from(state.registry.enemies.entries());

  if (enemies.length === 0) {
    terminal.print("No enemies available!", "t-red");
    return;
  }

  while (true) {
    terminal.clear();
    terminal.printHTML(`<div class="panel-header">CHOOSE YOUR OPPONENT</div>`);

    const choices: Choice[] = [];
    for (const [name, enemy] of enemies) {
      const tag = getDifficulty(player.level, enemy.level);
      choices.push({
        label: `${name} (Lv.${enemy.level})`,
        value: name,
        subtitle: `[${tag}] $${enemy.reward}, ${enemy.expReward} XP`,
      });
    }
    choices.push({ label: "Back", value: "back", subtitle: "Return to menu" });

    const choice = await terminal.promptChoice("", choices, "grid");

    if (choice === "back") return;

    const shouldFight = await enemyDetailScreen(terminal, state, choice);
    if (shouldFight) {
      await battleScreen(terminal, state, choice);
      return;
    }
  }
}

async function enemyDetailScreen(
  terminal: Terminal,
  state: GameState,
  enemyName: string,
): Promise<boolean> {
  const enemyDef = state.registry.enemies.get(enemyName)!;
  const bot = state.registry.createEnemyRobot(enemyName);
  if (!bot) return false;

  const player = state.player!;
  const tag = getDifficulty(player.level, enemyDef.level);
  const hp = getEffectiveMaxHealth(bot);
  const dodge = getEffectiveDodge(bot);
  const def = getEffectiveDefence(bot);
  const weapons = getWeapons(bot);
  const weaponStr = weapons.length > 0
    ? weapons.map((w) => `${w.name} (${w.damage} dmg)`).join(", ")
    : "None";

  terminal.clear();
  terminal.printHTML(`
    <div class="panel">
      <div class="t-yellow t-bold" style="font-size:18px">${enemyName}</div>
      <div class="t-dim">Level ${enemyDef.level} &bull; [${tag}]</div>
      <div style="margin-top:8px">${enemyDef.description}</div>
      <div style="margin-top:8px">
        <span class="t-cyan">HP: ${hp}</span> &nbsp;
        <span>Dodge: ${dodge}</span> &nbsp;
        <span>Defence: ${def}</span>
      </div>
      <div>Weapons: ${weaponStr}</div>
      <div class="t-magenta" style="margin-top:4px">Reward: $${enemyDef.reward} &nbsp; XP: ${enemyDef.expReward}</div>
    </div>
  `);

  const choice = await terminal.promptChoice("", [
    { label: "Fight!", value: "fight" },
    { label: "Back", value: "back" },
  ], "row");

  return choice === "fight";
}
