/** Status effects — Pokémon-style conditions inflicted by weapons and consumables. */

import type { BattleRobot, BattleState, Rng } from "./types";
import { log } from "./battle";

// ── Types ──

export type StatusType = "burn" | "shock" | "corrode" | "radiation" | "dazzle";

/** The item-side declaration, normalised by the data loader. */
export interface StatusEffectSpec {
  type: StatusType;
  chance: number;
}

/** A status currently riding on a robot for this battle only. */
export interface ActiveStatus {
  type: StatusType;
  /** Infinity for effects that last the rest of the battle. */
  turnsLeft: number;
  /** Per-tick base damage. Zero for effects that do not deal damage. */
  potency: number;
  /** How many ticks have run — radiation scales its damage with this. */
  ticks: number;
}

export interface StatusRule {
  /** Emoji shown on the battle-panel badge. */
  icon: string;
  /** Short uppercase name used on badges and in cure messages. */
  label: string;
  /** Terminal colour class for the badge. */
  colour: string;
  /** Turns the effect lasts. Infinity means the rest of the battle. */
  duration: number;
  /** Share of the source's base damage dealt per tick. Zero means no tick damage. */
  damageFraction: number;
  /** Whether tick damage grows with each tick (radiation). */
  escalates: boolean;
  /** Noun used in the per-tick damage line. */
  damageWord: string;
  /** Past participle used in the inflict and expiry lines. */
  participle: string;
}

// ── Tuning ──

/** Inflict chance used when an item does not override it. */
export const DEFAULT_INFLICT_CHANCE = 0.2;

/** Chance a shocked robot's action fizzles. */
export const SHOCK_FIZZLE_CHANCE = 0.25;

/** Defence multiplier while corroded. */
export const CORRODE_DEFENCE_MULTIPLIER = 0.75;

/** Dodge multiplier while dazzled. */
export const DAZZLE_DODGE_MULTIPLIER = 0.5;

/** Accuracy multiplier while dazzled. */
export const DAZZLE_ACCURACY_MULTIPLIER = 0.8;

// ── Effect table ──

export const STATUS_RULES: Record<StatusType, StatusRule> = {
  burn: {
    icon: "🔥",
    label: "BURN",
    colour: "t-red",
    duration: 3,
    // 15%, not 25%: the balance pass found a quarter of a big weapon's damage
    // per turn, undefended, swung several matchups by 10+ points on its own.
    damageFraction: 0.15,
    escalates: false,
    damageWord: "burn",
    participle: "burned",
  },
  shock: {
    icon: "⚡",
    label: "SHOCK",
    colour: "t-yellow",
    duration: 2,
    damageFraction: 0,
    escalates: false,
    damageWord: "shock",
    participle: "shocked",
  },
  corrode: {
    icon: "🧪",
    label: "CORRODE",
    colour: "t-green",
    duration: 3,
    damageFraction: 0,
    escalates: false,
    damageWord: "acid",
    participle: "corroded",
  },
  radiation: {
    icon: "☢",
    label: "RADIATION",
    colour: "t-magenta",
    duration: Infinity,
    damageFraction: 0.1,
    escalates: true,
    damageWord: "radiation",
    participle: "irradiated",
  },
  dazzle: {
    icon: "✨",
    label: "DAZZLE",
    colour: "t-cyan",
    duration: 3,
    damageFraction: 0,
    escalates: false,
    damageWord: "dazzle",
    participle: "dazzled",
  },
};

// ── Queries ──

export function hasStatus(br: BattleRobot, type: StatusType): boolean {
  return br.statuses.some((s) => s.type === type);
}

// ── Inflict ──

/** Anything that can inflict a status: a weapon, or a consumable that lands. */
export interface StatusSource {
  statusEffect: StatusEffectSpec | null;
  damage: number;
}

/** Roll for a status effect from a landed hit. Returns true when it lands. */
export function tryInflict(
  battle: BattleState,
  target: BattleRobot,
  source: StatusSource,
  rng: Rng,
): boolean {
  const spec = source.statusEffect;
  if (!spec) return false;
  if (target.robot.godMode) return false;
  if (rng.random() >= spec.chance) return false;

  const rule = STATUS_RULES[spec.type];
  const potency = source.damage * rule.damageFraction;
  const existing = target.statuses.find((s) => s.type === spec.type);

  if (existing) {
    existing.turnsLeft = rule.duration;
    if (potency > existing.potency) existing.potency = potency;
  } else {
    target.statuses.push({ type: spec.type, turnsLeft: rule.duration, potency, ticks: 0 });
  }

  log(battle, `${target.robot.name} is ${rule.participle.toUpperCase()}!`);
  return true;
}

// ── Per-turn processing ──

/** Apply one turn of damage for every active effect. Ignores defence. */
export function tickStatuses(battle: BattleState, br: BattleRobot): void {
  if (br.robot.godMode) return;

  for (const status of br.statuses) {
    status.ticks += 1;
    const rule = STATUS_RULES[status.type];
    if (rule.damageFraction === 0) continue;

    const scaled = rule.escalates ? status.potency * status.ticks : status.potency;
    const damage = Math.floor(scaled);
    if (damage <= 0) continue;

    br.currentHealth -= damage;
    log(battle, `${br.robot.name} takes ${damage} ${rule.damageWord} damage`);
  }
}

/** Count down every active effect and drop the ones that ran out. */
export function decrementStatuses(battle: BattleState, br: BattleRobot): void {
  const survivors: ActiveStatus[] = [];

  for (const status of br.statuses) {
    if (!Number.isFinite(status.turnsLeft)) {
      survivors.push(status);
      continue;
    }
    status.turnsLeft -= 1;
    if (status.turnsLeft > 0) {
      survivors.push(status);
    } else {
      log(battle, `${br.robot.name} is no longer ${STATUS_RULES[status.type].participle}`);
    }
  }

  br.statuses = survivors;
}

/** Clear every active effect. Returns the types that were cured. */
export function cureStatuses(
  battle: BattleState,
  br: BattleRobot,
  sourceName: string,
): StatusType[] {
  const cured = br.statuses.map((s) => s.type);
  if (cured.length === 0) return cured;

  br.statuses = [];
  log(battle, `${sourceName} cured ${cured.map((t) => STATUS_RULES[t].label).join(", ")}`);
  return cured;
}

/** Shock roll — true when the robot seizes up and loses its action. */
export function shouldFizzle(br: BattleRobot, rng: Rng): boolean {
  if (!hasStatus(br, "shock")) return false;
  return rng.random() < SHOCK_FIZZLE_CHANCE;
}
