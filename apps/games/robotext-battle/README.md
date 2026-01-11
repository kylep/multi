# Robo Text Battle
This is a text-based game written for Oliver (age 8) and Lucas (age 6) Pericak.
The kids provided the product management. They designed the game mechanics, assets, stats, so on. I worked with Cursor while learning plan mode to build it. We built this whole thing in basically a few hours, including playing around with it.

## Installing

Requires Python 3.11+ and Poetry.

```bash
cd apps/games/robotext-battle
poetry install
```

## Running the Game

```bash
poetry run python main.py
```

## Running Tests

```bash
poetry run pytest -v
```

## How to Play

1. Name your robot
2. Visit the **Shop** to buy weapons and gear
3. **Fight** enemies to earn money and get stronger
4. Use the money to buy better equipment

### Battle Controls
- **Attack**: Select weapons to use (costs energy)
- **Use Item**: Consume items for healing or damage (doesn't end turn)
- **Rest**: Recover energy

### Tips
- Start by buying a Stick and Cardboard Armor
- Watch your energy - rest when low
- Gear bonuses stack (health, dodge, hands)
- Some items require other items first (e.g., Fourth Arm needs Third Arm)
