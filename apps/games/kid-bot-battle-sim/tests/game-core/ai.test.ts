import { describe, it, expect } from "vitest";
import { planAiTurn, type BattleRobot } from "@kid-bot-battle-sim/game-core";

function makeRobot(overrides?: Partial<BattleRobot>): BattleRobot {
  return {
    name: "TestBot",
    health: 10,
    maxHealth: 10,
    energy: 20,
    maxEnergy: 20,
    defence: 0,
    attack: 0,
    hands: 2,
    dodge: 0,
    weapons: [
      { slotIndex: 0, name: "Stick", damage: 1, energyCost: 1, accuracy: 80, hands: 1 },
    ],
    gear: [],
    consumables: [],
    ...overrides,
  };
}

describe("planAiTurn", () => {
  it("attacks when weapons and energy are available", () => {
    const action = planAiTurn(makeRobot());
    expect(action.mainAction).toBe("attack");
    expect(action.weaponSlots).toContain(0);
  });

  it("rests when no energy", () => {
    const action = planAiTurn(makeRobot({ energy: 0 }));
    expect(action.mainAction).toBe("rest");
  });

  it("rests when no weapons", () => {
    const action = planAiTurn(makeRobot({ weapons: [] }));
    expect(action.mainAction).toBe("rest");
  });

  it("uses all consumables", () => {
    const robot = makeRobot({
      consumables: [
        { slotIndex: 0, name: "Repair Kit", effects: { healthRestore: 10 } },
      ],
    });
    const action = planAiTurn(robot);
    expect(action.consumablesUsed).toContain(0);
  });

  it("selects best weapons by damage within hand limit", () => {
    const robot = makeRobot({
      hands: 2,
      weapons: [
        { slotIndex: 0, name: "Stick", damage: 1, energyCost: 1, accuracy: 80, hands: 1 },
        { slotIndex: 1, name: "Sword", damage: 10, energyCost: 5, accuracy: 100, hands: 2 },
      ],
    });
    const action = planAiTurn(robot);
    // Should pick Sword (10 dmg, 2 hands) over Stick (1 dmg, 1 hand)
    expect(action.weaponSlots).toEqual([1]);
  });
});
