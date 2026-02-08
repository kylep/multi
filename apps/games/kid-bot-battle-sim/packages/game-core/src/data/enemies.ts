export interface StaticEnemy {
  name: string;
  level: number;
  weapons: string[];
  gear: string[];
  consumables: string[];
  reward: number;
  expReward: number;
  description: string;
}

export const ENEMIES: StaticEnemy[] = [
  {
    name: "MiniBot",
    level: 1,
    weapons: ["Stick"],
    gear: ["Cardboard Armor", "Propeller"],
    consumables: [],
    reward: 50,
    expReward: 2,
    description:
      "A shoebox sized cardboard box robot with a stick and propeller. He's gonna whack you!",
  },
  {
    name: "Sparky",
    level: 3,
    weapons: ["Shock Rod"],
    gear: ["Small Battery", "Small Computer Chip"],
    consumables: [],
    reward: 80,
    expReward: 3,
    description:
      "A hyperactive robot that crackles with electricity. Zap zap!",
  },
  {
    name: "Firebot",
    level: 5,
    weapons: ["Flame Thrower"],
    gear: ["Gold Computer Chip"],
    consumables: [],
    reward: 150,
    expReward: 5,
    description: "A shiny robot with a flame thrower.",
  },
];
