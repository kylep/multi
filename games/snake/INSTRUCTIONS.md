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

**Game Rules (Version 0):**
- The snake starts as a 2-square long snake (1 yellow head + 1 white body)
- Use arrow keys to control the snake's direction
- The snake moves continuously at a fixed speed
- If the snake goes off the edge of the screen, it appears on the opposite side
- The snake doesn't grow in this version (that's coming in v1!)

**What You'll See:**
- A black screen with a 100x60 grid
- A yellow square (the snake's head)
- A white square (the snake's body)
- The snake moving around the screen

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

Once you're comfortable with this version, look forward to v1 which will add:
- Food for the snake to eat
- Snake growth when eating
- Score tracking
- Game over conditions

Have fun coding! 🐍 