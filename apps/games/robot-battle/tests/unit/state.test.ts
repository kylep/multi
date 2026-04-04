import { describe, expect, it } from "vitest";
import { awardExp, awardInterest, awardMoney, calculateInterest, createGameState, createPlayer, depositMoney, recordFight, withdrawMoney } from "../../src/engine/state";
import { loadAssets } from "../../src/engine/data";

function setup() {
  const registry = loadAssets();
  const state = createGameState(registry);
  createPlayer(state, "TestBot");
  return state;
}

describe("createPlayer", () => {
  it("creates player with starting money and default stats", () => {
    const state = setup();
    const p = state.player!;
    expect(p.name).toBe("TestBot");
    expect(p.money).toBe(100);
    expect(p.maxHealth).toBe(10);
    expect(p.hands).toBe(2);
    expect(p.level).toBe(1);
  });

  it("initializes upgrades and settings with defaults", () => {
    const state = setup();
    const p = state.player!;
    expect(p.upgrades).toEqual([]);
    expect(p.settings).toEqual({ mode: "oliver", oliverChallenge: false });
  });

  it("gives player a free Stick", () => {
    const state = setup();
    const p = state.player!;
    expect(p.inventory.length).toBe(1);
    expect(p.inventory[0].name).toBe("Stick");
  });
});

describe("awardMoney", () => {
  it("awards base amount with no bonus", () => {
    const state = setup();
    const actual = awardMoney(state, 50);
    expect(actual).toBe(50);
    expect(state.player!.money).toBe(150);
  });

  it("applies money bonus percent from gear", () => {
    const state = setup();
    const moneyMaker = state.registry.getItem("Money Maker")!;
    state.player!.inventory.push({ ...moneyMaker });
    const actual = awardMoney(state, 100);
    // 20% bonus: 100 + 20 = 120
    expect(actual).toBe(120);
  });
});

describe("recordFight", () => {
  it("increments fights and wins", () => {
    const state = setup();
    recordFight(state, true);
    expect(state.player!.fights).toBe(1);
    expect(state.player!.wins).toBe(1);

    recordFight(state, false);
    expect(state.player!.fights).toBe(2);
    expect(state.player!.wins).toBe(1);
  });
});

describe("awardExp", () => {
  it("levels up at 10 exp", () => {
    const state = setup();
    const leveled = awardExp(state, 10);
    expect(leveled).toBe(true);
    expect(state.player!.level).toBe(2);
    expect(state.player!.exp).toBe(0);
  });

  it("does not level up below 10", () => {
    const state = setup();
    const leveled = awardExp(state, 5);
    expect(leveled).toBe(false);
    expect(state.player!.level).toBe(1);
    expect(state.player!.exp).toBe(5);
  });

  it("handles multiple level ups", () => {
    // Level 1 needs 10 XP, level 2 needs 12 XP; 25 - 10 - 12 = 3 remaining
    const state = setup();
    awardExp(state, 25);
    expect(state.player!.level).toBe(3);
    expect(state.player!.exp).toBe(3);
  });
});

describe("bank", () => {
  it("deposits money from cash to bank", () => {
    const state = setup();
    state.player!.money = 500;
    expect(depositMoney(state.player!, 200)).toBe(true);
    expect(state.player!.money).toBe(300);
    expect(state.player!.bank).toBe(200);
  });

  it("rejects deposit of more than available", () => {
    const state = setup();
    state.player!.money = 100;
    expect(depositMoney(state.player!, 200)).toBe(false);
    expect(state.player!.money).toBe(100);
  });

  it("rejects deposit of zero or negative", () => {
    const state = setup();
    expect(depositMoney(state.player!, 0)).toBe(false);
    expect(depositMoney(state.player!, -10)).toBe(false);
  });

  it("withdraws money from bank to cash", () => {
    const state = setup();
    state.player!.bank = 500;
    expect(withdrawMoney(state.player!, 200)).toBe(true);
    expect(state.player!.bank).toBe(300);
    expect(state.player!.money).toBe(state.registry.startingMoney + 200);
  });

  it("rejects withdrawal of more than bank balance", () => {
    const state = setup();
    state.player!.bank = 100;
    expect(withdrawMoney(state.player!, 200)).toBe(false);
  });

  it("calculates 1% interest", () => {
    const state = setup();
    state.player!.bank = 10000;
    expect(calculateInterest(state.player!)).toBe(100);
  });

  it("calculates interest floor for small amounts", () => {
    const state = setup();
    state.player!.bank = 50;
    expect(calculateInterest(state.player!)).toBe(0);
  });

  it("awardInterest reinvests interest into bank", () => {
    const state = setup();
    state.player!.bank = 5000;
    state.player!.money = 100;
    const interest = awardInterest(state.player!);
    expect(interest).toBe(50);
    expect(state.player!.money).toBe(100); // cash unchanged
    expect(state.player!.bank).toBe(5050); // interest added to bank
  });
});
