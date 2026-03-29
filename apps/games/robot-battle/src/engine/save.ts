/** Save/load game state to/from storage. */

import type { Robot } from "./types";
import { applyAllUpgrades } from "./upgrades";

export const SAVE_KEY = "robot-battle-save";
const SAVE_VERSION = 1;

export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface SaveData {
  version: number;
  player: Robot;
}

export function saveGame(storage: SaveStorage, player: Robot): void {
  const data: SaveData = { version: SAVE_VERSION, player };
  storage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function loadGame(storage: SaveStorage): Robot | null {
  const raw = storage.getItem(SAVE_KEY);
  if (raw === null) return null;

  try {
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== SAVE_VERSION) return null;
    if (!data.player || typeof data.player.name !== "string") return null;
    // Soft migration for new fields
    if (!data.player.upgrades) data.player.upgrades = [];
    if (!data.player.settings) data.player.settings = { mode: "oliver", oliverChallenge: false };
    if (data.player.settings.oliverChallenge === undefined) data.player.settings.oliverChallenge = false;
    if (!data.player.defeatedEnemies) data.player.defeatedEnemies = [];
    if (!data.player.challengeDefeatedEnemies) data.player.challengeDefeatedEnemies = [];
    applyAllUpgrades(data.player);
    return data.player;
  } catch {
    return null;
  }
}

export function deleteSave(storage: SaveStorage): void {
  storage.removeItem(SAVE_KEY);
}

export function hasSave(storage: SaveStorage): boolean {
  return storage.getItem(SAVE_KEY) !== null;
}
