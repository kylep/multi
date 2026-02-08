# Combat Mechanics

## Attack Resolution
When a robot attacks, it uses one or more weapons (limited by available hands).
Each weapon resolves independently:

- **Hit chance**: `(weapon accuracy - enemy dodge) / 100`
- **Damage formula**: `base_damage * (1 + attack/100) - defence`
- Minimum damage on hit is 0 (defence cannot cause negative damage)
- Each weapon costs its energy cost to use

### Attack Log Format
```
RobotName attacks!
  Weapon 1 hits for X damage
  Weapon 2 misses!
```

## Weapon Selection
When attacking, the player selects which weapons to use. The total hands required
must not exceed the robot's available hands. Each weapon can only be used once
per turn.

If a weapon has item requirements (e.g., Shotgun Shell), the required item is
consumed when the weapon is fired.

## Energy
Every action may cost energy. If the robot has insufficient energy for a weapon,
that weapon cannot be selected. If the robot has no energy at all, they must rest.

## Resting
Resting does nothing for the turn. The robot passively regenerates some energy.
Items can improve resting.

# Interfaces

## CLI
- Show numbered weapon list when attacking: `Select weapons (e.g. 1,2): [1]>`
- Display hit/miss/damage per weapon in the combat log
- Show energy cost next to each weapon option
- Error message if selecting too many hands or duplicate weapons

## Web
- Clickable weapon cards for selection during attack
- Weapons gray out if not enough energy or hands
- Animated damage numbers and miss indicators
- Combat log with color-coded hit (green) and miss (red)

## Mobile
- Tap weapons to toggle selection, with hand count indicator
- Shake animation on hit, dodge animation on miss
- Inline energy cost shown on each weapon

## API
- Attack action in turn endpoint accepts `weaponSlots: number[]`
- Response includes per-weapon results: `{ weaponId, hit: boolean, damage: number }`
- Returns error if weapon selection violates hand or duplicate rules
