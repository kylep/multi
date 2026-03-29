/** Upgrades screen — permanent robot buffs. */

import type { Terminal, Choice } from "../terminal";
import type { GameState } from "../../engine/state";
import { listUpgrades, canBuyUpgrade, buyUpgrade } from "../../engine/upgrades";

export async function upgradesScreen(terminal: Terminal, state: GameState): Promise<void> {
  const player = state.player!;

  while (true) {
    terminal.clear();
    terminal.printHTML(
      `<div class="panel-header"><span class="t-yellow t-bold">UPGRADES</span> &nbsp; <span class="t-yellow">$${player.money}</span></div>`
    );

    const upgrades = listUpgrades();
    const choices: Choice[] = [];

    for (const upgrade of upgrades) {
      const owned = player.upgrades.includes(upgrade.id);
      const check = owned ? { ok: false, reason: "Owned" } : canBuyUpgrade(player, upgrade);

      let subtitle = upgrade.description;
      if (owned) {
        subtitle = `OWNED — ${upgrade.description}`;
      } else if (!check.ok) {
        subtitle = `${upgrade.description} [${check.reason}]`;
      }

      choices.push({
        label: owned ? `${upgrade.name} ✓` : `${upgrade.name} — $${upgrade.cost.toLocaleString()}`,
        value: upgrade.id,
        subtitle,
        disabled: !check.ok,
      });
    }

    choices.push({ label: "Back", value: "back" });

    const choice = await terminal.promptChoice("", choices, "grid");

    if (choice === "back") return;

    const upgrade = upgrades.find((u) => u.id === choice);
    if (upgrade) {
      const confirmed = await terminal.promptConfirm(
        `Buy ${upgrade.name} for $${upgrade.cost.toLocaleString()}?`,
        "Buy",
        "Cancel",
      );
      if (confirmed) buyUpgrade(player, upgrade);
    }
  }
}
