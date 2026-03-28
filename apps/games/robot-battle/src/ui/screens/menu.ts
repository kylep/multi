/** Main menu screen. */

import type { Terminal, Choice } from "../terminal";
import type { GameState } from "../../engine/state";
import type { Weapon } from "../../engine/types";
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
    terminal.print("");

    const choice = await terminal.promptChoice("What would you like to do?", [
      { label: "1. Fight", value: "fight" },
      { label: "2. Shop", value: "shop" },
      { label: "3. Inspect Robot", value: "inspect" },
      { label: "4. Quit", value: "quit" },
    ]);

    if (choice === "quit") {
      break;
    }

    if (choice === "fight") {
      await fightMenu(terminal, state);
      save?.();
    } else if (choice === "shop") {
      await shopScreen(terminal, state);
      save?.();
    } else if (choice === "inspect") {
      await showRobotStats(terminal, state);
      await terminal.promptContinue();
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

function difficultyClass(tag: string): string {
  if (tag === "Easy") return "t-green";
  if (tag === "Fair") return "t-yellow";
  return "t-red";
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
    terminal.print("");
    terminal.print("=== CHOOSE YOUR OPPONENT ===", "t-yellow t-bold");
    terminal.print("");

    const choices: Choice[] = [{ label: "Back", value: "back" }];
    for (let i = 0; i < enemies.length; i++) {
      const [name, enemy] = enemies[i];
      const tag = getDifficulty(player.level, enemy.level);
      choices.push({
        label: `${i + 1}. ${name} (Lv${enemy.level}) [${tag}]`,
        value: name,
      });
    }

    const choice = await terminal.promptChoice("", choices);
    if (choice === "back") return;

    const shouldFight = await enemyDetailScreen(terminal, state, choice);
    if (shouldFight) {
      await battleScreen(terminal, state, choice);
      return;
    }
    // else loop back to enemy list
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
  terminal.print("");
  terminal.print(`=== ${enemyName} ===`, "t-yellow t-bold");
  terminal.print(`Level ${enemyDef.level}`, difficultyClass(tag));
  terminal.print("");
  terminal.print(enemyDef.description, "t-dim");
  terminal.print("");
  terminal.print(`HP: ${hp} | Dodge: ${dodge} | Defence: ${def}`, "t-cyan");
  terminal.print(`Weapons: ${weaponStr}`);
  terminal.print(`Reward: $${enemyDef.reward} | XP: ${enemyDef.expReward}`, "t-magenta");
  terminal.print("");

  const choice = await terminal.promptChoice("", [
    { label: "Fight!", value: "fight" },
    { label: "Back", value: "back" },
  ]);

  return choice === "fight";
}
