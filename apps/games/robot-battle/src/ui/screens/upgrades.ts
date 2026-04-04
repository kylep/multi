/** Upgrades screen — permanent robot buffs. */

import type { Terminal, Choice } from "../terminal";
import type { GameState } from "../../engine/state";
import {
  listUpgrades,
  canBuyUpgrade,
  buyUpgrade,
  allNormalUpgradesPurchased,
  listRepeatableUpgrades,
  canBuyRepeatableUpgrade,
  buyRepeatableUpgrade,
  getRepeatableUpgradeCost,
} from "../../engine/upgrades";

const SECTION_ORDER: Array<{ key: string; label: string }> = [
  { key: "arms", label: "--- Arms ---" },
  { key: "combat", label: "--- Combat ---" },
  { key: "utility", label: "--- Utility ---" },
];

export async function upgradesScreen(terminal: Terminal, state: GameState): Promise<void> {
  const player = state.player!;

  while (true) {
    terminal.clear();
    terminal.printHTML(
      `<div class="panel-header"><span class="t-yellow t-bold">UPGRADES</span> &nbsp; <span class="t-yellow">$${player.money.toLocaleString()}</span></div>`
    );

    const upgrades = listUpgrades();
    const choices: Choice[] = [];

    // Group by section
    for (const section of SECTION_ORDER) {
      const sectionUpgrades = upgrades.filter((u) => u.section === section.key);
      if (sectionUpgrades.length === 0) continue;

      choices.push({ label: section.label, value: `header-${section.key}`, disabled: true, group: "header" });

      for (const upgrade of sectionUpgrades) {
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
    }

    // Repeatable upgrades (only when all normal upgrades purchased or sandbox)
    if (allNormalUpgradesPurchased(player) || player.settings.mode === "sandbox") {
      const repeatables = listRepeatableUpgrades();
      choices.push({ label: "--- Repeatable ---", value: "header-repeatable", disabled: true, group: "header" });

      for (const rep of repeatables) {
        const level = player.repeatableUpgrades[rep.id] ?? 0;
        const cost = getRepeatableUpgradeCost(rep, level);
        const check = canBuyRepeatableUpgrade(player, rep);

        const levelStr = level > 0 ? ` (Lv.${level})` : "";
        let subtitle = rep.description;
        if (!check.ok) subtitle = `${rep.description} [${check.reason}]`;

        choices.push({
          label: `${rep.name}${levelStr} — $${cost.toLocaleString()}`,
          value: `rep-${rep.id}`,
          subtitle,
          disabled: !check.ok,
        });
      }
    }

    choices.push({ label: "Back", value: "back" });

    const choice = await terminal.promptChoice("", choices, "grid");

    if (choice === "back") return;

    if (choice.startsWith("rep-")) {
      const repId = choice.slice(4);
      const rep = listRepeatableUpgrades().find((r) => r.id === repId);
      if (rep) {
        const level = player.repeatableUpgrades[rep.id] ?? 0;
        const cost = getRepeatableUpgradeCost(rep, level);
        const confirmed = await terminal.promptConfirm(
          `Buy ${rep.name} (Lv.${level + 1}) for $${cost.toLocaleString()}?`,
          "Buy",
          "Cancel",
        );
        if (confirmed) buyRepeatableUpgrade(player, rep);
      }
    } else {
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
}
