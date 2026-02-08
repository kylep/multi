import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import {
  startGame,
  formatRobotStats,
  enterShop,
  getShopCatalog,
  buyItem,
  sellItem,
  healRobot,
  getAvailableEnemies,
  startBattle,
  resolveTurn,
  endBattle,
  suggestPlayerAction,
  validateWeaponSelection,
  lookupItem,
  ENEMIES,
  type GameState,
  type TurnAction,
} from "@kid-bot-battle-sim/game-core";
import {
  purple,
  red,
  green,
  yellow,
  cyan,
  bold,
  dim,
  sectionHeader,
  turnHeader,
  formatBattleStatus,
  formatCombatLog,
  formatVictorySummary,
  formatDefeat,
  clearScreen,
  hpBar,
} from "./display.js";

const TITLE = `
 _  ___     _   ____        _
| |/ (_) __| | | __ )  ___ | |_
| ' /| |/ _\` | |  _ \\ / _ \\| __|
| . \\| | (_| | | |_) | (_) | |_
|_|\\_\\_|\\__,_| |____/ \\___/ \\__|

 ____        _   _   _        ____  _
| __ )  __ _| |_| |_| | ___  / ___|(_)_ __ ___
|  _ \\ / _\` | __| __| |/ _ \\ \\___ \\| | '_ \` _ \\
| |_) | (_| | |_| |_| |  __/  ___) | | | | | | |
|____/ \\__,_|\\__|\\__|_|\\___| |____/|_|_| |_| |_|
`;

let rl: readline.Interface;

async function ask(prompt: string): Promise<string> {
  return rl.question(prompt);
}

async function main() {
  rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    console.log(TITLE);

    // Start game - get player name
    let playerName = "";
    while (!playerName.trim()) {
      playerName = await ask("Player Name: ");
      if (!playerName.trim()) {
        console.log("Name cannot be empty. Try again.");
      }
    }

    let state = startGame(playerName);
    console.log("\n" + formatRobotStats(state.robot, state.playerName));

    // Main game loop
    let running = true;
    while (running) {
      console.log("\n" + sectionHeader("MAIN MENU"));
      console.log("1. Fight");
      console.log("2. Shop");
      console.log("3. Inspect Robot");
      console.log("4. Quit");

      const choice = (await ask("\n> ")).trim();

      switch (choice) {
        case "1":
          state = await battleLoop(state);
          break;
        case "2":
          state = await shopLoop(state);
          break;
        case "3":
          clearScreen();
          console.log("\n" + formatRobotStats(state.robot, state.playerName));
          if (state.robot.inventory.length > 0) {
            console.log("\n" + yellow("── Inventory ──"));
            for (let i = 0; i < state.robot.inventory.length; i++) {
              const inv = state.robot.inventory[i];
              const prefix = inv.type === "weapon" ? "[W]" : inv.type === "gear" ? "[G]" : "[C]";
              console.log(`  ${i + 1}. ${prefix} ${inv.itemName}`);
            }
          }
          break;
        case "4":
          running = false;
          console.log("\nThanks for playing!");
          break;
        default:
          console.log("Invalid choice.");
      }
    }
  } finally {
    rl.close();
  }
}

// ─── Shop ──────────────────────────────────────────

async function shopLoop(state: GameState): Promise<GameState> {
  let robot = enterShop(state.robot);
  state = { ...state, robot };

  let inShop = true;
  while (inShop) {
    clearScreen();
    console.log("\n" + sectionHeader("SHOP"));
    console.log(`Level: ${robot.level} | Money: ${purple("$" + robot.money)} | Inventory: ${robot.inventory.length}/${4 + robot.inventory.filter(i => i.type === "gear").length}`);
    console.log("\n1. Buy");
    console.log("2. Sell");
    console.log("3. Inventory");
    console.log("4. Back");

    const choice = (await ask("\n> ")).trim();

    switch (choice) {
      case "1":
        state = { ...state, robot };
        robot = await buyLoop(state);
        state = { ...state, robot };
        break;
      case "2":
        robot = await sellLoop(robot);
        state = { ...state, robot };
        break;
      case "3":
        showInventory(robot);
        await ask("\nPress Enter to continue...");
        break;
      case "4":
      case "b":
      case "B":
        inShop = false;
        break;
      default:
        console.log("Invalid choice.");
    }
  }

  return { ...state, robot };
}

async function buyLoop(state: GameState): Promise<GameState["robot"]> {
  let robot = state.robot;

  while (true) {
    clearScreen();
    console.log("\n" + sectionHeader("BUY"));
    console.log(`Level: ${robot.level} | Money: ${purple("$" + robot.money)} | Inventory: ${robot.inventory.length}/4`);
    console.log("\nB. Back");

    const catalog = getShopCatalog(robot);
    for (let i = 0; i < catalog.length; i++) {
      const item = catalog[i];
      const price = `$${item.moneyCost}`;
      const status = item.canBuy ? "" : dim(` (${item.reason})`);
      console.log(`${i + 1}. ${item.name} - ${purple(price)}${status}`);
    }

    const input = (await ask("\n> ")).trim().toLowerCase();

    if (input === "b") break;

    // Show item details
    if (input.startsWith("s") || input.startsWith("show ")) {
      const num = parseInt(input.replace(/^(s|show\s*)/, ""), 10);
      if (num >= 1 && num <= catalog.length) {
        const item = catalog[num - 1];
        console.log(`\n${bold(item.name)} (${item.type})`);
        console.log(`Level: ${item.level} | Cost: ${purple("$" + item.moneyCost)}`);
        if (item.type === "weapon") {
          console.log(`Damage: ${item.damage} | Accuracy: ${item.accuracy} | Energy: ${item.energyCost} | Hands: ${item.hands}`);
        }
        console.log(item.description);
        await ask("\nPress Enter to continue...");
      }
      continue;
    }

    const num = parseInt(input, 10);
    if (num >= 1 && num <= catalog.length) {
      const result = buyItem(robot, catalog[num - 1].name);
      if (result.success) {
        robot = result.robot;
        console.log(green(`Bought ${catalog[num - 1].name}!`));
      } else {
        console.log(red(result.error ?? "Cannot buy"));
      }
      await ask("\nPress Enter to continue...");
    }
  }

  return robot;
}

async function sellLoop(robot: GameState["robot"]): Promise<GameState["robot"]> {
  while (true) {
    clearScreen();
    console.log("\n" + sectionHeader("SELL"));
    console.log(`Money: ${purple("$" + robot.money)} | Inventory: ${robot.inventory.length}`);
    console.log("\nB. Back");

    if (robot.inventory.length === 0) {
      console.log(dim("\nInventory is empty."));
      await ask("\nPress Enter to go back...");
      break;
    }

    for (let i = 0; i < robot.inventory.length; i++) {
      const inv = robot.inventory[i];
      const itemDef = lookupItem(inv.itemName);
      const sellPrice = itemDef ? Math.floor(itemDef.moneyCost / 2) : 0;
      console.log(`${i + 1}. ${inv.itemName} - ${purple("$" + sellPrice)}`);
    }

    const input = (await ask("\n> ")).trim().toLowerCase();
    if (input === "b") break;

    const num = parseInt(input, 10);
    if (num >= 1 && num <= robot.inventory.length) {
      const inv = robot.inventory[num - 1];
      const result = sellItem(robot, inv.instanceId);
      if (result.success) {
        robot = result.robot;
        console.log(green(`Sold ${inv.itemName} for ${purple("$" + result.refund)}!`));
      } else {
        console.log(red(result.error ?? "Cannot sell"));
      }
      await ask("\nPress Enter to continue...");
    }
  }

  return robot;
}

function showInventory(robot: GameState["robot"]): void {
  if (robot.inventory.length === 0) {
    console.log(dim("\nInventory is empty."));
    return;
  }
  console.log("\n" + yellow("── Inventory ──"));
  for (let i = 0; i < robot.inventory.length; i++) {
    const inv = robot.inventory[i];
    const prefix = inv.type === "weapon" ? "[W]" : inv.type === "gear" ? "[G]" : "[C]";
    const itemDef = lookupItem(inv.itemName);
    const desc = itemDef ? dim(` - ${itemDef.description}`) : "";
    console.log(`  ${i + 1}. ${prefix} ${inv.itemName}${desc}`);
  }
}

// ─── Battle ────────────────────────────────────────

async function battleLoop(state: GameState): Promise<GameState> {
  clearScreen();
  const enemies = getAvailableEnemies();

  console.log("\n" + sectionHeader("CHOOSE OPPONENT"));
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    console.log(`${i + 1}. ${purple(e.name)} (Lv.${e.level}) - ${dim(e.description)}`);
  }
  console.log("B. Back");

  const input = (await ask("\n> ")).trim().toLowerCase();
  if (input === "b") return state;

  const num = parseInt(input, 10);
  if (isNaN(num) || num < 1 || num > enemies.length) {
    console.log("Invalid choice.");
    return state;
  }

  const enemyName = enemies[num - 1].name;
  state = startBattle(state, enemyName);

  if (state.firstBattle) {
    console.log(cyan("\nTIP: You can just hit Enter to let the AI pick your move"));
    state = { ...state, firstBattle: false };
  }

  // Battle turns
  while (state.battle && state.battle.outcome === "ongoing") {
    clearScreen();
    const battle = state.battle;

    console.log(turnHeader(battle.turn));
    console.log(formatBattleStatus(battle.player, battle.enemy));

    // Show previous combat log
    if (battle.combatLog.length > 0) {
      console.log("\n" + yellow("── Last Turn ──"));
      console.log(formatCombatLog(battle.combatLog));
    }

    // Get player action
    const action = await getPlayerAction(state);
    if (!action) continue; // re-prompt

    state = resolveTurn(state, action);
  }

  // Battle ended
  if (state.battle) {
    if (state.battle.outcome === "victory" && state.battle.rewards) {
      console.log(formatVictorySummary(
        state.battle.turnHistory,
        state.playerName,
        state.battle.enemyName,
        state.battle.rewards
      ));
      console.log("\n" + formatRobotStats(state.robot, state.playerName));
    } else {
      console.log(formatDefeat());
    }
    await ask("\nPress Enter to continue...");
  }

  return endBattle(state);
}

async function getPlayerAction(state: GameState): Promise<TurnAction | null> {
  const battle = state.battle!;
  const player = battle.player;
  const suggestion = suggestPlayerAction(player);

  console.log("\n1. Attack");
  console.log("2. Use Item");
  console.log("3. Rest");
  console.log("4. Surrender");

  const defaultStr = suggestion.mainAction === "attack"
    ? `[1:${suggestion.weaponSlots.map((s) => s + 1).join(",")}]`
    : suggestion.mainAction === "rest" ? "[3]" : "[1]";

  const input = (await ask(`\n${defaultStr}> `)).trim().toLowerCase();

  // Accept default
  if (input === "") {
    return suggestion;
  }

  // Surrender shortcuts
  if (["4", "q", "quit", "surrender", "forfeit", "give up"].includes(input)) {
    const confirm = (await ask("Are you sure you want to surrender? (y/n) ")).trim().toLowerCase();
    if (confirm === "y") {
      return { mainAction: "surrender", weaponSlots: [], consumablesUsed: [] };
    }
    return null;
  }

  if (input === "3") {
    return { mainAction: "rest", weaponSlots: [], consumablesUsed: [] };
  }

  if (input === "2") {
    // Use consumable
    if (player.consumables.length === 0) {
      console.log(dim("No consumables available."));
      return null;
    }
    console.log("\nConsumables:");
    for (let i = 0; i < player.consumables.length; i++) {
      console.log(`  ${i + 1}. ${player.consumables[i].name}`);
    }
    const cInput = (await ask("> ")).trim();
    const cNum = parseInt(cInput, 10);
    if (cNum >= 1 && cNum <= player.consumables.length) {
      // Use consumable, then get main action
      console.log(green(`Used ${player.consumables[cNum - 1].name}!`));
      // Return attack with the consumable used
      const mainAction = await getMainActionAfterConsumable(player, suggestion);
      return { ...mainAction, consumablesUsed: [cNum - 1] };
    }
    return null;
  }

  if (input === "1") {
    // Attack - select weapons
    return await getAttackAction(player, suggestion);
  }

  return null;
}

async function getMainActionAfterConsumable(
  player: GameState["battle"] extends null ? never : NonNullable<GameState["battle"]>["player"],
  suggestion: TurnAction
): Promise<TurnAction> {
  console.log("\n1. Attack");
  console.log("3. Rest");

  const input = (await ask("> ")).trim();
  if (input === "3") {
    return { mainAction: "rest", weaponSlots: [], consumablesUsed: [] };
  }
  if (input === "" || input === "1") {
    return await getAttackAction(player, suggestion);
  }
  return { mainAction: "rest", weaponSlots: [], consumablesUsed: [] };
}

async function getAttackAction(
  player: NonNullable<GameState["battle"]>["player"],
  suggestion: TurnAction
): Promise<TurnAction> {
  if (player.weapons.length === 0) {
    console.log(dim("No weapons! Resting instead."));
    return { mainAction: "rest", weaponSlots: [], consumablesUsed: [] };
  }

  console.log("\nWeapons:");
  for (let i = 0; i < player.weapons.length; i++) {
    const w = player.weapons[i];
    console.log(`  ${i + 1}. ${w.name} (Dmg:${w.damage} Acc:${w.accuracy} ⚡${w.energyCost} ✋${w.hands})`);
  }

  const defaultWeapons = suggestion.weaponSlots.map((s) => s + 1).join(",");
  const wInput = (await ask(`Select weapons (e.g. 1,2) [${defaultWeapons}]> `)).trim();

  let slots: number[];
  if (wInput === "") {
    slots = suggestion.weaponSlots;
  } else {
    slots = wInput.split(",").map((s) => parseInt(s.trim(), 10) - 1);
  }

  const validation = validateWeaponSelection(player, slots);
  if (!validation.valid) {
    console.log(red(validation.error!));
    return { mainAction: "rest", weaponSlots: [], consumablesUsed: [] };
  }

  return { mainAction: "attack", weaponSlots: slots, consumablesUsed: [] };
}

main();
