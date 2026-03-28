/** Main menu screen. */

import type { Terminal, Choice } from "../terminal";
import type { GameState } from "../../engine/state";
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
      await terminal.promptText("Press Enter to continue...");
    }
  }
}

async function fightMenu(terminal: Terminal, state: GameState): Promise<void> {
  const player = state.player!;
  const enemies = Array.from(state.registry.enemies.entries());

  if (enemies.length === 0) {
    terminal.print("No enemies available!", "t-red");
    return;
  }

  terminal.print("");
  terminal.print("=== CHOOSE YOUR OPPONENT ===", "t-yellow t-bold");

  const choices: Choice[] = [{ label: "Back", value: "back" }];
  for (let i = 0; i < enemies.length; i++) {
    const [name, enemy] = enemies[i];
    choices.push({
      label: `${i + 1}. ${name} (Lv${enemy.level}) - $${enemy.reward}, ${enemy.expReward} exp`,
      value: name,
    });
    terminal.print(`   ${enemy.description}`, "t-dim");
  }

  const choice = await terminal.promptChoice("", choices);
  if (choice === "back") return;

  await battleScreen(terminal, state, choice);
}
