/** Main menu screen. */

import type { Terminal, Choice } from "../terminal";
import type { SoundPlayer } from "../sound";
import type { GameState } from "../../engine/state";
import type { SaveStorage } from "../../engine/save";
import type { GameSettings } from "../../engine/save";
import { createRng } from "../../engine/rng";
import {
  getConsumables,
  getEffectiveDefence,
  getEffectiveDodge,
  getEffectiveMaxHealth,
  getGear,
  getWeapons,
} from "../../engine/robot";
import { getXpToLevel } from "../../engine/state";
import { shopScreen } from "./shop";
import { upgradesScreen } from "./upgrades";
import { bankScreen } from "./bank";
import { settingsScreen } from "./settings";
import { battleScreen } from "./battle";
import packageJson from "../../../package.json";

export async function mainMenu(
  terminal: Terminal,
  state: GameState,
  save?: () => void,
  sound?: SoundPlayer,
  settings?: GameSettings,
  storage?: SaveStorage,
): Promise<void> {
  while (true) {
    terminal.clear();
    const player = state.player!;

    // Player stats header panel
    const ngpTag = player.newGamePlusLevel > 0 ? ` <span class="t-yellow">[+${player.newGamePlusLevel}]</span>` : "";
    const cheatTag = player.cheatsUsed ? ` <span class="t-red">✘</span>` : "";
    const borderClass = player.godMode ? "t-red" : "";
    const panelStyle = player.godMode ? "border-color:#ff4444" : "";
    terminal.printHTML(`<div class="panel-header" style="${panelStyle}"><span class="t-blue t-bold">${player.name}</span>${ngpTag} &nbsp;&nbsp; <span class="t-yellow">$${player.money}</span> &nbsp;&nbsp; <span class="t-magenta">Lv.${player.level} XP ${player.exp}/${getXpToLevel(player.level)}</span> &nbsp;&nbsp; <span class="t-dim">${player.wins}W / ${player.fights}F</span>${cheatTag}</div>`);


    const menuChoices: Choice[] = [
      { label: "Fight", value: "fight", subtitle: "Battle enemies" },
      { label: "Shop", value: "shop", subtitle: "Buy & sell gear" },
      { label: "Upgrades", value: "upgrades", subtitle: "Permanent buffs" },
      { label: "Bank", value: "bank", subtitle: "Deposit & earn interest" },
      { label: "Cheat Codes", value: "cheats", subtitle: "Enter a secret code" },
      { label: "Settings", value: "settings", subtitle: "Sound & options" },
      { label: "Change Log", value: "changelog", subtitle: "Version history" },
      { label: "Quit", value: "quit", subtitle: "Return to title" },
    ];

    const choice = await terminal.promptChoice("", menuChoices, "grid");

    if (choice === "quit") break;

    if (choice === "fight") {
      await fightMenu(terminal, state, sound, storage);
      save?.();
    } else if (choice === "shop") {
      await shopScreen(terminal, state, sound);
      save?.();
    } else if (choice === "upgrades") {
      await upgradesScreen(terminal, state);
      save?.();
    } else if (choice === "bank") {
      await bankScreen(terminal, state);
      save?.();
    } else if (choice === "settings") {
      await settingsScreen(terminal, state);
      save?.();
    } else if (choice === "cheats") {
      await cheatCodeScreen(terminal, state, sound, storage);
      save?.();
    } else if (choice === "changelog") {
      await changeLogScreen(terminal);
    }
  }
}

async function cheatCodeScreen(
  terminal: Terminal,
  state: GameState,
  sound?: SoundPlayer,
  storage?: SaveStorage,
): Promise<void> {
  const player = state.player!;

  while (true) {
    terminal.clear();
    terminal.printHTML(`<div class="panel-header"><span class="t-yellow t-bold">CHEAT CODES</span></div>`);
    if (player.cheatsUsed) {
      terminal.printHTML(`<div class="t-dim" style="margin:4px 0">This save has used cheat codes <span class="t-red">✘</span></div>`);
    }
    if (player.godMode) {
      terminal.printHTML(`<div class="t-red t-bold" style="margin:4px 0">GOD MODE IS ON</div>`);
    }

    const code = await terminal.promptText("Enter cheat code:");
    if (!code || code.trim() === "") return;

    const trimmed = code.trim().toLowerCase();

    if (trimmed === "omnomnom") {
      player.cheatsUsed = true;
      // Find strongest defeated enemy for scaling
      const enemies = Array.from(state.registry.enemies.values());
      const defeated = enemies.filter((e) => player.defeatedEnemies.includes(e.name));
      const strongest = defeated.length > 0
        ? defeated.reduce((a, b) => a.level > b.level ? a : b)
        : enemies[0];
      sound?.lootBox();
      // Inline loot box
      const rng = createRng();
      const tiers: Array<"diamond" | "gold" | "silver"> = ["diamond", "gold", "silver"];
      for (let i = tiers.length - 1; i > 0; i--) {
        const j = Math.floor(rng.random() * (i + 1));
        [tiers[i], tiers[j]] = [tiers[j], tiers[i]];
      }
      terminal.clear();
      terminal.printHTML(`<div class="title-center" style="min-height:0;margin:16px 0"><div class="t-yellow t-bold" style="font-size:22px">★ LOOT BOX! ★</div><div class="t-dim">Choose a box!</div></div>`);
      const boxChoice = await terminal.promptChoice("", [
        { label: "Box 1", value: "0" },
        { label: "Box 2", value: "1" },
        { label: "Box 3", value: "2" },
      ], "row");
      const tier = tiers[parseInt(boxChoice, 10)];
      const eligibleConsumables = state.registry.getAllItems()
        .filter((i) => i.itemType === "consumable" && i.level <= strongest.level);
      terminal.clear();
      const tierLabels: Record<string, string> = { diamond: "Diamond", gold: "Gold", silver: "Silver" };
      const tierColors: Record<string, string> = { diamond: "t-cyan", gold: "t-yellow", silver: "t-dim" };
      const revealHtml = tiers.map((t, i) => {
        const picked = i === parseInt(boxChoice, 10);
        const cls = picked ? `${tierColors[t]} t-bold` : "t-dim";
        return `<span class="${cls}">[Box ${i + 1}: ${tierLabels[t]}${picked ? " ◄" : ""}]</span>`;
      }).join(" &nbsp; ");
      terminal.printHTML(`<div style="margin:8px 0">${revealHtml}</div>`);
      if (tier === "diamond") {
        const money = strongest.reward;
        player.money += money;
        terminal.printHTML(`<div class="panel" style="padding:12px 16px"><div class="t-cyan t-bold" style="font-size:18px">Diamond!</div><div class="t-green t-bold" style="margin-top:8px">You found $${money.toLocaleString()}!</div></div>`);
      } else {
        const count = tier === "gold" ? 3 : 1;
        const label = tier === "gold" ? "Gold!" : "Silver!";
        const color = tier === "gold" ? "t-yellow" : "t-dim";
        const items: string[] = [];
        for (let i = 0; i < count; i++) {
          if (eligibleConsumables.length > 0) {
            const item = rng.choice(eligibleConsumables);
            player.inventory.push({ ...item });
            items.push(item.name);
          }
        }
        terminal.printHTML(`<div class="panel" style="padding:12px 16px"><div class="${color} t-bold" style="font-size:18px">${label}</div>${items.map((n) => `<div class="t-green" style="margin-top:4px">+ ${esc(n)}</div>`).join("")}</div>`);
      }
      await terminal.promptContinue(0);
    } else if (trimmed === "the quick brown fox jumps over the lazy dog") {
      player.cheatsUsed = true;
      player.godMode = !player.godMode;
      terminal.clear();
      if (player.godMode) {
        terminal.printHTML(`<div class="t-red t-bold" style="font-size:20px;margin:16px 0">GOD MODE ON</div>`);
      } else {
        terminal.printHTML(`<div class="t-green t-bold" style="font-size:20px;margin:16px 0">GOD MODE OFF</div>`);
      }
      await terminal.promptContinue(0);
    } else {
      terminal.print("Invalid cheat code!", "t-red");
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

async function fightMenu(terminal: Terminal, state: GameState, sound?: SoundPlayer, storage?: SaveStorage): Promise<void> {
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
    const challengeOn = player.settings.oliverChallenge;
    for (const [name, enemy] of enemies) {
      const tag = getDifficulty(player.level, enemy.level);
      const challengeCleared = player.challengeDefeatedEnemies.includes(name);
      const normalCleared = player.defeatedEnemies.includes(name);
      const displayName = challengeOn && enemy.challengeName ? enemy.challengeName : name;
      const isEasy = enemy.level < player.level;
      const displayReward = isEasy ? Math.floor(enemy.reward / 2) : enemy.reward;
      const displayXp = isEasy ? Math.floor(enemy.expReward / 2) : enemy.expReward;
      const easyTag = isEasy ? " (halved)" : "";
      choices.push({
        label: `${displayName} (Lv.${enemy.level})`,
        value: name,
        subtitle: `[${tag}] $${displayReward}${easyTag}, ${displayXp} XP`,
        badge: challengeCleared ? "★" : normalCleared ? "✔" : undefined,
        badgeClass: challengeCleared ? "badge-challenge" : normalCleared ? "badge-cleared" : undefined,
        labelClass: challengeOn && enemy.challengeName ? "t-purple" : undefined,
      });
    }
    choices.push({ label: "Back", value: "back", subtitle: "Return to menu" });

    const choice = await terminal.promptChoice("", choices, "grid");

    if (choice === "back") return;

    const shouldFight = await enemyDetailScreen(terminal, state, choice);
    if (shouldFight) {
      let opponent = choice;
      while (true) {
        const result = await battleScreen(terminal, state, opponent, sound, storage);
        if (result === "shop") {
          await shopScreen(terminal, state, sound);
          return;
        }
        if (result !== "fight-again") return;
      }
    }
  }
}

async function enemyDetailScreen(
  terminal: Terminal,
  state: GameState,
  enemyName: string,
): Promise<boolean> {
  const player = state.player!;
  const enemyDef = state.registry.enemies.get(enemyName)!;

  while (true) {
    const bot = state.registry.createEnemyRobot(enemyName);
    if (!bot) return false;

    if (player.settings.oliverChallenge) {
      bot.maxHealth += bot.level * 4;
    }

    const tag = getDifficulty(player.level, enemyDef.level);
    const hp = getEffectiveMaxHealth(bot);
    const dodge = getEffectiveDodge(bot);
    const def = getEffectiveDefence(bot);
    const weapons = getWeapons(bot);
    const weaponStr = weapons.length > 0
      ? weapons.map((w) => `${w.name} (${w.damage} dmg)`).join(", ")
      : "None";
    const gearItems = getGear(bot);
    const gearStr = gearItems.length > 0
      ? gearItems.map((g) => g.name).join(", ")
      : "None";
    const consumableItems = getConsumables(bot);
    const conStr = consumableItems.length > 0
      ? consumableItems.map((c) => c.name).join(", ")
      : "None";

    const challengeLabel = player.settings.oliverChallenge ? "Challenge: ON" : "Challenge: OFF";
    const isChallenge = player.settings.oliverChallenge;
    const displayName = isChallenge && enemyDef.challengeName ? enemyDef.challengeName : enemyName;
    const nameClass = isChallenge && enemyDef.challengeName ? "t-purple" : "t-yellow";

    terminal.clear();
    terminal.printHTML(`
      <div class="panel">
        <div class="${nameClass} t-bold" style="font-size:18px">${esc(displayName)}</div>
        <div class="t-dim">Level ${enemyDef.level} &bull; [${tag}]</div>
        ${enemyDef.appearance ? `<div style="margin-top:8px" class="t-dim">${esc(enemyDef.appearance)}</div>` : ""}
        ${enemyDef.backstory ? `<div class="t-dim">${esc(enemyDef.backstory)}</div>` : ""}
        <div style="margin-top:8px">${enemyDef.description}</div>
        <div style="margin-top:8px">
          <span class="t-cyan">HP: ${hp}</span> &nbsp;
          <span>Dodge: ${dodge}</span> &nbsp;
          <span>Defence: ${def}</span>
        </div>
        <div>Weapons: ${weaponStr}</div>
        <div>Gear: ${gearStr}</div>
        <div>Items: ${conStr}</div>
        <div class="t-magenta" style="margin-top:4px">Reward: $${isChallenge ? Math.floor(enemyDef.reward * (player.challengeDefeatedEnemies.includes(enemyName) ? 1.2 : 2.4)) : enemyDef.reward}${isChallenge ? ` <span class="t-purple">(challenge)</span>` : ""} &nbsp; XP: ${enemyDef.expReward}</div>
      </div>
    `);

    const choice = await terminal.promptChoice("", [
      { label: "Fight!", value: "fight" },
      { label: "Back", value: "back" },
      { label: challengeLabel, value: "challenge", btnClass: "btn-challenge" },
    ], "row");

    if (choice === "challenge") {
      player.settings.oliverChallenge = !player.settings.oliverChallenge;
      continue;
    }
    return choice === "fight";
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const CHANGELOG: { version: string; date: string; notes: string[] }[] = [
  {
    version: "0.10.0", date: "2026-04-04", notes: [
      "Level cap raised to 100",
      "Cheat Codes: 'omnomnom' for free loot box, pangram for god mode",
      "Cheat indicator: red ✘ on saves that used cheats",
      "God Mode: red border, enemy attacks deal 0 damage",
      "New Game +: restart with higher bank interest after beating all enemies",
      "Yellow [+N] tag shows New Game + level next to name",
      "Leaderboard: records fastest 100% challenge completions across saves",
      "TITAN/100% win screens only show on first achievement (not every time)",
      "Blast shield damage absorption shown in combat log",
      "Loot boxes: full consumable stacks fall back to money reward",
      "Quantity purchase for consumables and ammo in shop",
      "Cannot sell consumables",
      "Balance: Nuke max 5 ($15,000 each)",
      "New enemy: Warblade (Lv.18) — melee fighter bridging Laserface to Thunderbot",
      "Consumables limited to one use per turn",
      "Easy enemies show actual halved payout in fight menu",
    ],
  },
  {
    version: "0.9.3", date: "2026-04-04", notes: [
      "Fix: Using one consumable no longer blocks all copies of that item",
      "Consumable stack limits (Grenades max 10, Nukes max 1, etc.)",
      "Battle item menu groups duplicate consumables with count",
      "Shop enforces consumable max stack on purchase",
    ],
  },
  {
    version: "0.9.2", date: "2026-04-04", notes: [
      "Fix: Loading old saves no longer breaks accuracy (all attacks missed)",
      "Fix: Loot boxes are now blind picks — rewards randomly assigned to 3 mystery boxes",
      "Loot box reveal shows what was in all 3 boxes after picking",
      "Fix: Inventory groups duplicate consumables and weapons with count",
      "Fix: Challenge mode text in settings is purple",
      "Balance: Loot box chance reduced from 5% to 2.5% per turn",
    ],
  },
  {
    version: "0.9.1", date: "2026-04-04", notes: [
      "Fix: Challenge mode names now show in purple on fight selection grid",
      "Fix: Enemy reward display updates when toggling challenge mode",
      "Fix: Auto-battle cancels after 50 turns to prevent stalemate loops",
      "Fix: Bank withdraw/deposit clears screen before showing confirmation",
      "Fix: Bank withdraw message grammar (Withdrew instead of Withdrawed)",
      "Balance: Arm upgrade prices scaled up (Third $1k, Fourth $5k, Fifth $25k, Sixth $100k)",
    ],
  },
  {
    version: "0.9.0", date: "2026-04-04", notes: [
      "Bank: deposit money and earn 1% interest per fight",
      "Arms are now permanent upgrades (no longer take inventory slots)",
      "Consumables no longer take inventory slots",
      "New upgrades: Targeting System, Advanced Targeting, Evasion Boosters, Phantom Protocol, Reinforced Plating, HP Boost I & II",
      "Repeatable upgrades unlock after all normal upgrades (+HP, +Dmg, +Def, +Acc, +Dodge)",
      "Consumable use-text: descriptive messages when using items in battle",
      "100% Game Complete screen for defeating all enemies on Challenge mode",
      "Post-battle loot boxes (5% chance per turn, victory only)",
      "Enhanced enemy detail: gear, consumables, appearance, backstory",
      "Shop categories: gear broken into Armor, Battery, Chip, Booster, Ammo",
      "Accuracy-boosting gear and upgrades",
      "Evasion-boosting upgrades",
      "Challenge mode gives +20% money on all wins",
      "Ammo system: Shotgun Shells (max 20), Missiles (max 10), Antimatter Missiles (max 1)",
      "Ammo weapons use little or no energy — ammo is the cost",
      "Missile Launcher now requires Missile ammo",
      "Ammo shown in battle status panels",
      "Challenge mode names: enemies have alternate names shown in purple",
      "Balance: Sword energy 4→2, Death Ray damage 100→75",
      "New items: Targeting Scope, Auto-Aim Module, Targeting Lock, Missile",
      "Full enemy rebalance with new upgrades, gear, and ammo",
    ],
  },
  {
    version: "0.8.0", date: "2026-03-29", notes: [
      "Sandbox mode: everything free, no level cap, no defeated badges",
      "Blast Shield consumable (blocks all damage for 1 turn)",
      "Shredder enemy (level 8)",
      "Dodge Circuits and Energy Core upgrades",
      "Inventory 7 upgrade",
      "Shop button on victory/defeat screens",
      "Extra Challenge toggle on enemy detail screen",
      "Level-up screen shows unlocked items",
      "Balance: Laser energy 8→10, Lightsabre energy 15→10",
      "Easy enemies give 50% XP instead of 0",
      "Sell price is full buy price (was 50%)",
      "AI waits to heal until sufficiently hurt",
    ],
  },
  {
    version: "0.7.0", date: "2026-03-29", notes: [
      "Fight Again button after battles (rematch same opponent)",
      "Defeated badges: white ✔ for cleared, yellow ★ for challenge mode",
      "Challenge mode first-win bonus: double money payout",
      "XP to level up now scales: 10 + 2*(level-1)",
      "Level cap at 50",
      "Buzzblade payout increased to $75",
    ],
  },
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
