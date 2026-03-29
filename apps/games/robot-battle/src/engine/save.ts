/** Save/load game state to/from storage with 3 save slots. */

import type { Robot } from "./types";
import { applyAllUpgrades } from "./upgrades";

const SAVE_KEY_PREFIX = "robot-battle-save-";
const LEGACY_SAVE_KEY = "robot-battle-save";
const SAVE_VERSION = 2;
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
    // Accept both v1 and v2
    if (data.version !== 1 && data.version !== SAVE_VERSION) return null;
    // Soft migration for new fields
    if (!data.player.upgrades) data.player.upgrades = [];
    if (!data.player.settings) data.player.settings = { mode: "oliver", oliverChallenge: false };
    if (data.player.settings.oliverChallenge === undefined) data.player.settings.oliverChallenge = false;
    if (!data.player.defeatedEnemies) data.player.defeatedEnemies = [];
    if (!data.player.challengeDefeatedEnemies) data.player.challengeDefeatedEnemies = [];
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
