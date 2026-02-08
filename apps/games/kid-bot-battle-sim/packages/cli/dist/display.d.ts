import type { BattleRobot, TurnResult, TurnSnapshot } from "@kid-bot-battle-sim/game-core";
export declare function purple(s: string): string;
export declare function red(s: string): string;
export declare function green(s: string): string;
export declare function yellow(s: string): string;
export declare function cyan(s: string): string;
export declare function bold(s: string): string;
export declare function dim(s: string): string;
export declare function hpBar(current: number, max: number, width?: number): string;
export declare function turnHeader(turn: number): string;
export declare function sectionHeader(title: string): string;
export declare function formatBattleStatus(player: BattleRobot, enemy: BattleRobot): string;
export declare function formatCombatLog(log: TurnResult[]): string;
export declare function formatVictorySummary(turnHistory: TurnSnapshot[], playerName: string, enemyName: string, rewards: {
    money: number;
    exp: number;
    leveledUp: boolean;
    newLevel: number;
}): string;
export declare function formatDefeat(): string;
export declare function clearScreen(): void;
//# sourceMappingURL=display.d.ts.map