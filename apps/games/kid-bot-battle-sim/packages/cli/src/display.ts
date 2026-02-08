import type { BattleRobot, TurnResult, TurnSnapshot } from "@kid-bot-battle-sim/game-core";

// ANSI color helpers
const c = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  purple: "\x1b[35m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

export function purple(s: string) { return `${c.purple}${s}${c.reset}`; }
export function red(s: string) { return `${c.red}${s}${c.reset}`; }
export function green(s: string) { return `${c.green}${s}${c.reset}`; }
export function yellow(s: string) { return `${c.yellow}${s}${c.reset}`; }
export function cyan(s: string) { return `${c.cyan}${s}${c.reset}`; }
export function bold(s: string) { return `${c.bold}${s}${c.reset}`; }
export function dim(s: string) { return `${c.dim}${s}${c.reset}`; }

export function hpBar(current: number, max: number, width = 20): string {
  const ratio = Math.max(0, Math.min(1, current / max));
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  return `[${bar}] ${current}/${max}`;
}

export function turnHeader(turn: number): string {
  return yellow(`════════════ TURN ${turn} ════════════`);
}

export function sectionHeader(title: string): string {
  return yellow(`═══ ${title} ═══`);
}

export function formatBattleStatus(player: BattleRobot, enemy: BattleRobot): string {
  const lines = [
    `${purple(player.name)}  ♥ ${cyan(hpBar(player.health, player.maxHealth))}  ⚡ ${cyan(`${player.energy}/${player.maxEnergy}`)}`,
    `${purple(enemy.name)}   ♥ ${cyan(hpBar(enemy.health, enemy.maxHealth))}  ⚡ ${cyan(`${enemy.energy}/${enemy.maxEnergy}`)}`,
  ];
  return lines.join("\n");
}

export function formatCombatLog(log: TurnResult[]): string {
  const lines: string[] = [];
  for (const entry of log) {
    if (entry.action === "attack" && entry.weaponResults) {
      lines.push(`${purple(entry.actor)} attacks!`);
      for (const wr of entry.weaponResults) {
        if (wr.hit) {
          lines.push(`  ${wr.weaponName} hits for ${red(String(wr.damage))} damage`);
        } else {
          lines.push(`  ${wr.weaponName} ${dim("misses!")}`);
        }
      }
    } else if (entry.action === "rest") {
      lines.push(`${purple(entry.actor)} rests. ${green(`+${entry.energyRestored ?? 0}`)} ⚡`);
    } else if (entry.action === "surrender") {
      lines.push(`${purple(entry.actor)} surrenders!`);
    } else if (entry.action === "consumable") {
      lines.push(`${purple(entry.actor)} uses ${entry.consumableName}! ${entry.consumableEffect}`);
    }
  }
  return lines.join("\n");
}

export function formatVictorySummary(
  turnHistory: TurnSnapshot[],
  playerName: string,
  enemyName: string,
  rewards: { money: number; exp: number; leveledUp: boolean; newLevel: number }
): string {
  const lines = [
    "",
    green(bold("*** VICTORY! ***")),
    "",
    yellow("── Battle Summary ──"),
  ];

  for (const snap of turnHistory) {
    lines.push(`Turn ${snap.turn}: ${playerName} ${snap.playerHp}/${snap.playerMaxHp}, ${enemyName} ${snap.enemyHp}/${snap.enemyMaxHp}`);
  }

  lines.push("");
  lines.push(yellow("── Rewards ──"));
  lines.push(`+${rewards.exp} exp`);
  lines.push(`+${purple("$" + rewards.money)}`);

  if (rewards.leveledUp) {
    lines.push("");
    lines.push(green(bold(`*** LEVEL UP! Now level ${rewards.newLevel}! ***`)));
  }

  return lines.join("\n");
}

export function formatDefeat(): string {
  return red(bold("\n*** DEFEATED ***\n"));
}

export function clearScreen(): void {
  process.stdout.write("\x1b[2J\x1b[H");
}
