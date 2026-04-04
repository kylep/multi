/** Settings screen — game options. */

import type { Terminal, Choice } from "../terminal";
import type { GameState } from "../../engine/state";

export async function settingsScreen(terminal: Terminal, state: GameState): Promise<void> {
  const player = state.player!;

  while (true) {
    terminal.clear();
    terminal.printHTML(
      `<div class="panel-header"><span class="t-yellow t-bold">SETTINGS</span></div>`
    );

    const isSandbox = player.settings.mode === "sandbox";
    const isOliver = player.settings.mode === "oliver";

    if (isSandbox) {
      terminal.printHTML(`<div class="panel" style="padding:6px 10px"><span class="t-yellow t-bold">Sandbox mode</span> <span class="t-dim">— everything free, no level cap, no badges</span></div>`);
      const choice = await terminal.promptChoice("", [{ label: "Back", value: "back" }], "row");
      if (choice === "back") return;
      continue;
    }

    const desc = isOliver
      ? "Oliver mode: normal gameplay — energy costs apply"
      : "Lucas mode: all weapon energy costs are 0";
    terminal.printHTML(`<div class="panel" style="padding:6px 10px"><span class="t-dim">${desc}</span></div>`);

    const challengeDesc = player.settings.oliverChallenge
      ? "EXTRA CHALLENGE is ON — enemies have 3x HP per level!"
      : "";
    if (challengeDesc) {
      terminal.printHTML(`<div class="panel" style="padding:6px 10px"><span class="t-purple t-bold">${challengeDesc}</span></div>`);
    }

    const choices: Choice[] = [
      {
        label: "Oliver",
        value: "oliver",
        subtitle: "Normal gameplay — energy costs apply",
        disabled: isOliver,
        active: isOliver,
      },
      {
        label: "Lucas",
        value: "lucas",
        subtitle: "All weapon energy costs are 0",
        disabled: !isOliver,
        active: !isOliver,
      },
      {
        label: player.settings.oliverChallenge ? "EXTRA CHALLENGE: ON" : "EXTRA CHALLENGE: OFF",
        value: "challenge",
        subtitle: "Enemies get 3x HP per level. For Oliver only!",
      },
      { label: "Back", value: "back" },
    ];

    const choice = await terminal.promptChoice("", choices, "grid");

    if (choice === "back") return;

    if (choice === "oliver" || choice === "lucas") {
      player.settings.mode = choice;
    } else if (choice === "challenge") {
      player.settings.oliverChallenge = !player.settings.oliverChallenge;
    }
  }
}
