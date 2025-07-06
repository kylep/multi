# Snake Game Instructions

Welcome to the Snake Game! This is a simple Python game perfect for learning how to code.

## Setting Up the Game

### Step 1: Install Poetry (if you don't have it)
First, make sure you have Poetry installed. Poetry helps us manage our Python packages.

**On macOS/Linux:**
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

**On Windows:**
```powershell
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -
```

### Step 2: Navigate to the Game Directory
Open your terminal/command prompt and go to the snake game folder:
```bash
cd games/snake
```

### Step 3: Set Up the Poetry Environment
Create a new virtual environment and install the required packages:
```bash
poetry install
```

This will:
- Create a virtual environment for the game
- Install pygame (the graphics library we use)
- Install any other dependencies

### Step 4: Run the Game
**Option 1: Run directly (Recommended - easiest!)**
```bash
poetry run python app.py
```

**Option 2: Activate environment first**
```bash
poetry env activate
python app.py
```

You'll know the environment is active when you see `(snake-...)` at the beginning of your command line.

## Playing the Game

### Starting the Game
Run one of these commands to start the game:

**Easiest way:**
```bash
poetry run python app.py
```

**Or if you activated the environment:**
```bash
python app.py
```

The game will start in full-screen mode!

### How to Play

**Controls:**
- **Arrow Keys**: Move the snake
  - ↑ Up arrow: Move up
  - ↓ Down arrow: Move down
  - ← Left arrow: Move left
  - → Right arrow: Move right
- **Q key**: Quit the game

**Game Rules (Version 1):**
- The snake starts as a 2-square long snake (1 yellow head + 1 white body)
- Use arrow keys to control the snake's direction
- The snake moves continuously at a fixed speed
- If the snake goes off the edge of the screen, it appears on the opposite side
- **Green squares (2x2)** are food - eat them to grow and score points! (Much easier to hit!)
- **Red squares** are obstacles - avoid them or the game ends
- Red squares appear after you eat your first green square
- Green squares never spawn over red squares
- Score increases with each green square eaten
- If you hit yourself or a red square, the game ends
- **Win condition**: If no space remains for new green squares, you win!
- Press any key to restart after game over

**What You'll See:**
- A black screen with a 100x60 grid
- A yellow square (the snake's head)
- White squares (the snake's body)
- A large green square (2x2 food to eat) - much easier to hit!
- Red squares (obstacles to avoid) - appear after first green square
- Score counter in the top left corner
- The snake moving around the screen
- "You Win!" message when you fill the board

### Exiting the Game
- Press **Q** to quit the game
- Or close the window

## Learning from the Code

This game is designed to be educational! Here's what you can learn:

1. **Game Loop**: How games run continuously
2. **Input Handling**: How to respond to keyboard presses
3. **Graphics**: How to draw shapes on screen
4. **Movement**: How to update positions based on direction
5. **Coordinates**: How to work with x,y positions
6. **Classes**: How to organize code into objects

## Troubleshooting

**If the game doesn't start:**
- Make sure you're in the poetry environment (`poetry env activate`)
- Or use `poetry run python app.py` to run directly
- Make sure pygame is installed (`poetry install`)
- Check that you're running `python app.py` from the snake directory

**If the game is too fast/slow:**
- You can change the speed by editing the `SNAKE_SPEED` variable in `app.py`
- Higher numbers = faster snake
- Lower numbers = slower snake

**If you want to exit full-screen:**
- Press **Q** to quit
- Or use **Alt+F4** (Windows) or **Cmd+Q** (Mac)

## Next Steps

You've completed V1! The game now includes:
- ✅ Food for the snake to eat (2x2 green squares - easier to hit!)
- ✅ Snake growth when eating
- ✅ Score tracking
- ✅ Game over conditions
- ✅ Restart functionality
- ✅ Win condition when board is full
- ✅ Smart spawning (green squares never overlap red obstacles)

Future versions could add:
- Different types of food with different effects
- Power-ups
- Multiple levels
- High score tracking
- Sound effects

Have fun coding! 🐍 