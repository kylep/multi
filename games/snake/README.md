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

V1 Goals:
A 2x2 green square renders in a random place (easier to hit than 1x1)
The head colliding with the green square causes it to move to a new place, and the tail to grow by one.
A score is printed on the top left showing how many green squares have been collected. Score starts at 0.
Starting after the first green square is collected, render red squares, too. There should be one red square for each green square collected - score = red square count
Green squares never spawn over red squares - if no valid spawn location exists, show "Great work!" with "You Win!" and the numeric score below it.
If the snake eats a red square, the game is over. Clear the screen. Show "Great work!" in big letters, with the numeric score below it. Pressing any key (except q, which quits) lets you start over.