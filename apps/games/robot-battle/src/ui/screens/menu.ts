/** Main menu screen. */

import type { Terminal, Choice } from "../terminal";
import type { GameState } from "../../engine/state";
import {
  getEffectiveDefence,
  getEffectiveDodge,
  getEffectiveMaxHealth,
  getWeapons,
} from "../../engine/robot";
import { shopScreen } from "./shop";
import { upgradesScreen } from "./upgrades";
import { settingsScreen } from "./settings";
import { battleScreen } from "./battle";
import packageJson from "../../../package.json";

export async function mainMenu(
  terminal: Terminal,
  state: GameState,
  save?: () => void,
): Promise<void> {
  while (true) {
    terminal.clear();
    const player = state.player!;

    // Player stats header panel
    terminal.printHTML(`<div class="panel-header"><span class="t-blue t-bold">${player.name}</span> &nbsp;&nbsp; <span class="t-yellow">$${player.money}</span> &nbsp;&nbsp; <span class="t-magenta">Lv.${player.level} XP ${player.exp}/10</span> &nbsp;&nbsp; <span class="t-dim">${player.wins}W / ${player.fights}F</span></div>`);

    const choice = await terminal.promptChoice("", [
      { label: "Fight", value: "fight", subtitle: "Battle enemies" },
      { label: "Shop", value: "shop", subtitle: "Buy & sell gear" },
      { label: "Upgrades", value: "upgrades", subtitle: "Permanent buffs" },
      { label: "Settings", value: "settings", subtitle: "Game options" },
      { label: "Change Log", value: "changelog", subtitle: "Version history" },
      { label: "Quit", value: "quit", subtitle: "Return to title" },
    ], "grid");

    if (choice === "quit") break;

    if (choice === "fight") {
      await fightMenu(terminal, state);
      save?.();
    } else if (choice === "shop") {
      await shopScreen(terminal, state);
      save?.();
    } else if (choice === "upgrades") {
      await upgradesScreen(terminal, state);
      save?.();
    } else if (choice === "settings") {
      await settingsScreen(terminal, state);
      save?.();
    } else if (choice === "changelog") {
      await changeLogScreen(terminal);
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

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const CHANGELOG: { version: string; date: string; notes: string[] }[] = [
  {
    version: "0.6.0", date: "2026-03-29", notes: [
      "Mobile-friendly: responsive battle layout, single-column shop on small screens",
      "Enter button on name input for mobile",
      "Shop Back button at top and bottom",
      "Shop filter toggle — hide items above your level",
      "Shop scrolls to top when opened",
      "Change Log screen",
    ],
  },
  {
    version: "0.5.0", date: "2026-03-28", notes: [
      "Tabbed shop UI (Buy/Sell/Inventory)",
      "Upgrades system (permanent inventory expansion)",
      "Settings screen (Oliver's Challenge, Lucas Mode)",
      "Stackable ammo gear (Shotgun Shells)",
      "Battle log replay after fights",
      "Special TITAN victory screen",
      "18 weapons, 30+ gear items, 11 consumables",
      "17 enemies up to level 50",
    ],
  },
  {
    version: "0.4.0", date: "2026-03-28", notes: [
      "Visual overhaul: card grid layout, bordered panels",
      "Modal confirmation dialogs",
      "Weapon select with toggle checkboxes",
      "Auto-battle with acceleration",
      "Yellow Back buttons throughout",
      "Enemy detail screen with stats preview",
    ],
  },
  {
    version: "0.3.0", date: "2026-03-28", notes: [
      "UI overhaul: inline choices with keyboard navigation",
      "Arrow key and number key shortcuts",
      "Auto-battle feature",
      "Player stats on main menu",
      "Buy confirmation dialogs",
    ],
  },
  {
    version: "0.2.0", date: "2026-03-28", notes: [
      "Version display on title screen",
      "Play link on wiki page",
    ],
  },
  {
    version: "0.1.0", date: "2026-03-28", notes: [
      "Initial release",
      "Turn-based robot combat",
      "Shop with weapons, gear, and consumables",
      "Save/load with localStorage",
      "6 enemies, basic inventory system",
    ],
  },
];

async function changeLogScreen(terminal: Terminal): Promise<void> {
  terminal.clear();
  terminal.printHTML(`<div class="panel-header"><span class="t-yellow t-bold">CHANGE LOG</span> &nbsp; <span class="t-dim">v${packageJson.version}</span></div>`);

  const choices: Choice[] = [{ label: "Back", value: "back" }];

  for (const entry of CHANGELOG) {
    const isCurrent = entry.version === packageJson.version;
    const label = isCurrent ? `v${entry.version} — ${entry.date} (current)` : `v${entry.version} — ${entry.date}`;
    const bullets = entry.notes.map((n) => `<div>• ${esc(n)}</div>`).join("");
    terminal.printHTML(`<div class="panel" style="margin:6px 0"><div class="t-green t-bold">${esc(label)}</div>${bullets}</div>`);
  }

  await terminal.promptChoice("", choices, "row");
}
