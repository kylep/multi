/** Save/load game state to/from storage with 3 save slots. */

import type { Robot } from "./types";
import { applyAllUpgrades } from "./upgrades";

const SAVE_KEY_PREFIX = "robot-battle-save-";
const LEGACY_SAVE_KEY = "robot-battle-save";
const SAVE_VERSION = 3;
export const NUM_SLOTS = 3;

export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface GameSettings {
  soundEnabled: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = { soundEnabled: true };

interface SaveData {
  version: number;
  player: Robot;
  settings?: GameSettings;
}

function slotKey(slot: number): string {
  return `${SAVE_KEY_PREFIX}${slot}`;
}

function parseSave(raw: string | null): SaveData | null {
  if (raw === null) return null;
  try {
    const data = JSON.parse(raw) as SaveData;
    if (!data.player || typeof data.player.name !== "string") return null;
    // Accept v1, v2, and v3
    if (data.version !== 1 && data.version !== 2 && data.version !== SAVE_VERSION) return null;
    // Soft migration for v1→v2 fields
    if (!data.player.upgrades) data.player.upgrades = [];
    if (!data.player.settings) data.player.settings = { mode: "oliver", oliverChallenge: false, autoDeposit: false, restockConsumables: false };
    if (data.player.settings.oliverChallenge === undefined) data.player.settings.oliverChallenge = false;
    if (data.player.settings.autoDeposit === undefined) data.player.settings.autoDeposit = false;
    if (data.player.settings.restockConsumables === undefined) data.player.settings.restockConsumables = false;
    if (!data.player.defeatedEnemies) data.player.defeatedEnemies = [];
    if (!data.player.challengeDefeatedEnemies) data.player.challengeDefeatedEnemies = [];
    // Soft migration for v2→v3 fields
    if (data.player.bank === undefined) data.player.bank = 0;
    if (!data.player.repeatableUpgrades) data.player.repeatableUpgrades = {};
    if (data.player.accuracy === undefined) data.player.accuracy = 0;
    // Soft migration for v3→v4 fields
    if (data.player.cheatsUsed === undefined) data.player.cheatsUsed = false;
    if (data.player.godMode === undefined) data.player.godMode = false;
    if (data.player.newGamePlusLevel === undefined) data.player.newGamePlusLevel = 0;
    if (data.player.titanDefeated === undefined) data.player.titanDefeated = false;
    // Migrate arm gear items to arm upgrades
    const armGearNames = ["Third Arm", "Fourth Arm", "Fifth Arm", "Sixth Arm"];
    const armUpgradeIds = ["third-arm", "fourth-arm", "fifth-arm", "sixth-arm"];
    for (let i = 0; i < armGearNames.length; i++) {
      const gearIdx = data.player.inventory.findIndex((item: { name: string }) => item.name === armGearNames[i]);
      if (gearIdx !== -1) {
        data.player.inventory.splice(gearIdx, 1);
        // Add this and all prerequisite arm upgrades
        for (let j = 0; j <= i; j++) {
          if (!data.player.upgrades.includes(armUpgradeIds[j])) {
            data.player.upgrades.push(armUpgradeIds[j]);
          }
        }
      }
    }
    // Patch inventory items missing v3 fields
    for (const item of data.player.inventory) {
      const raw = item as unknown as Record<string, unknown>;
      if (item.itemType === "gear") {
        if (raw.accuracyBonus === undefined) raw.accuracyBonus = 0;
        if (raw.maxStack === undefined) raw.maxStack = 0;
        if (raw.category === undefined) raw.category = "";
      }
      if (item.itemType === "consumable") {
        if (raw.useText === undefined) raw.useText = "";
        if (raw.accuracyBonus === undefined) raw.accuracyBonus = 0;
        if (raw.maxStack === undefined) raw.maxStack = 0;
      }
    }
    applyAllUpgrades(data.player);
    return data;
  } catch {
    return null;
  }
}

/** Migrate legacy single-save to slot 1 if it exists. */
export function migrateV1Save(storage: SaveStorage): void {
  const legacy = storage.getItem(LEGACY_SAVE_KEY);
  if (legacy === null) return;
  // Only migrate if slot 1 is empty
  if (storage.getItem(slotKey(1)) !== null) {
    storage.removeItem(LEGACY_SAVE_KEY);
    return;
  }
  const data = parseSave(legacy);
  if (data) {
    const migrated: SaveData = { version: SAVE_VERSION, player: data.player, settings: DEFAULT_SETTINGS };
    storage.setItem(slotKey(1), JSON.stringify(migrated));
  }
  storage.removeItem(LEGACY_SAVE_KEY);
}

export interface SlotInfo {
  slot: number;
  player: Robot | null;
  settings: GameSettings;
}

/** List all 3 save slots. */
export function listSlots(storage: SaveStorage): SlotInfo[] {
  const slots: SlotInfo[] = [];
  for (let i = 1; i <= NUM_SLOTS; i++) {
    const data = parseSave(storage.getItem(slotKey(i)));
    slots.push({
      slot: i,
      player: data?.player ?? null,
      settings: data?.settings ?? { ...DEFAULT_SETTINGS },
    });
  }
  return slots;
}

export function saveSlot(storage: SaveStorage, slot: number, player: Robot, settings?: GameSettings): void {
  const data: SaveData = { version: SAVE_VERSION, player, settings: settings ?? DEFAULT_SETTINGS };
  storage.setItem(slotKey(slot), JSON.stringify(data));
}

export function loadSlot(storage: SaveStorage, slot: number): { player: Robot; settings: GameSettings } | null {
  const data = parseSave(storage.getItem(slotKey(slot)));
  if (!data) return null;
  return { player: data.player, settings: data.settings ?? { ...DEFAULT_SETTINGS } };
}

export function deleteSlot(storage: SaveStorage, slot: number): void {
  storage.removeItem(slotKey(slot));
}

export function hasAnySlot(storage: SaveStorage): boolean {
  for (let i = 1; i <= NUM_SLOTS; i++) {
    if (storage.getItem(slotKey(i)) !== null) return true;
  }
  return false;
}

// ── Leaderboard ──

const LEADERBOARD_KEY = "robot-battle-leaderboard";

export interface LeaderboardEntry {
  name: string;
  fights: number;
  newGamePlusLevel: number;
  date: string;
  cheatsUsed: boolean;
}

export function loadLeaderboard(storage: SaveStorage): LeaderboardEntry[] {
  const raw = storage.getItem(LEADERBOARD_KEY);
  if (!raw) return [];
  try {
    const entries = JSON.parse(raw) as LeaderboardEntry[];
    // Patch old entries missing cheatsUsed
    for (const e of entries) {
      if (e.cheatsUsed === undefined) e.cheatsUsed = false;
    }
    return entries;
  } catch {
    return [];
  }
}

export function addLeaderboardEntry(storage: SaveStorage, entry: LeaderboardEntry): void {
  const board = loadLeaderboard(storage);
  board.push(entry);
  board.sort((a, b) => a.fights - b.fights);
  storage.setItem(LEADERBOARD_KEY, JSON.stringify(board.slice(0, 20)));
}
