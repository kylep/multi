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
A green square renders in a random place
The head colliding with the green square causes it to move to a new place, and the tail to grow by one.
A score is printed on the top left showing how many green squares have been collected. Score starts at 0.
Starting after the first green square is collected, render red squares, too. There should be one red square for each green square collected - score = red square count
If the snake eats a red square, the game is over. Clear the screen. Show "Great work!" in big letters, with the numeric score below it. Pressing any key (except q, which quits) lets you start over.

V2 Goals:
A 2x2 green square renders in a random place (easier to hit than 1x1)
Starting after the first green square is collected, render red squares, too. There should be SCORE number of red squares spawned each time (1, then 2, then 3, etc.)
Green squares never spawn over red squares - if no valid spawn location exists, show "Great work!" with "You Win!" and the numeric score below it.
The snake speed increases with the score, making the game progressively more challenging.
Start with 3 lives. 3 red hearts display on the top right. Each is a bit smaller than the snake's head. Hitting a red square pauses the game for a second, turns the snake around 180 degrees, and removes that red square, then the game resumes.
After score 3, for each red square, have a 33% chance of placing the square along an edge until the edges are full. Also have a 75% chance of placing the next square adjacent to one that's already placed.
After score 5, each score increase, have a 20% chance of also spawning a 1x1 green square that flashes yellow at half the speed the snake moves. Collecting it works like collecting the green one, but gives you 5 points. It clears itself and the green one away to be respawned.
Add a small arrow in the snakes head directing which direction it is currently moving.
Draw a timer on the bottom right with 100 seconds. When it hits zero, run the same behaviour as hitting a red square. 
Draw a small black border around each tail segment to differentiate them.
Add sound. Add a pleasing "ding" for each green one and a buzzer for each life lost.
Save a high score to a local gitignored file each time someone gets game over. show the high score below the score, like "High score: 5"
Each time you get a green box, add 5 seconds to the time.
Each time you get the small flashing square, add 1 life. Max 10 life total.