# Snake

This is a basic python snake game, we'll just called it `snake`. 

It uses the most popular and straightforward libraries for presenting graphics, collecting input, etc.
It should be written entirely in Python, and run on both macbooks and windows. 
It should render a 2d screen with a black background. The player should start with a 2-square long "snake".
The head of the snake should always be a yellow square. The body should be a series of white squares.
The body starts off 1 white square long. Each body square should always tail behind the square that was ahead of it.

V0 Goals:
The game renders a full-screen window with a 100x60 grid on a black canvas, the snake head, and its tail.
The snake can move around at a fixed speed, the game collects the arrow keys as input, and "q" to quit. 
The snake cannot move off the screen, it just teleports to the opposide side (ex right --> left)
The game is playable by running `python app.py`
The dependencies are managed by poetry.
An INSTRUCTIONS.md file exists and contains the steps to load the poetry venv and how to play the game.