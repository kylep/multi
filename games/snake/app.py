#!/usr/bin/env python3
"""
Snake Game - A simple game to learn Python programming!

This game teaches:
- How to use pygame for graphics
- How to handle keyboard input
- How to create a game loop
- How to work with coordinates and movement
- How to organize code into functions

Created for learning purposes - perfect for beginners!
"""

import pygame
import sys
from typing import List, Tuple

# Game settings - these are easy to understand and change!
GRID_WIDTH = 100
GRID_HEIGHT = 60
GRID_SIZE = 10  # Size of each square in pixels
SNAKE_SPEED = 10  # How fast the snake moves (frames per second)

# Colors - using simple color names
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
YELLOW = (255, 255, 0)

# Directions - using arrow keys
UP = (0, -1)
DOWN = (0, 1)
LEFT = (-1, 0)
RIGHT = (1, 0)


class SnakeGame:
    """The main game class - this holds all our game logic!"""
    
    def __init__(self):
        """Set up our game when it starts"""
        # Start pygame
        pygame.init()
        
        # Calculate window size based on grid
        self.window_width = GRID_WIDTH * GRID_SIZE
        self.window_height = GRID_HEIGHT * GRID_SIZE
        
        # Create the game window (full screen)
        self.screen = pygame.display.set_mode((self.window_width, self.window_height), pygame.FULLSCREEN)
        pygame.display.set_caption("Snake Game - Press Q to quit!")
        
        # Set up the game clock to control speed
        self.clock = pygame.time.Clock()
        
        # Start the snake in the middle of the screen
        start_x = GRID_WIDTH // 2
        start_y = GRID_HEIGHT // 2
        
        # The snake is a list of positions (x, y)
        # Head is at the front, tail follows behind
        self.snake = [
            (start_x, start_y),      # Head (yellow)
            (start_x - 1, start_y)   # Body (white)
        ]
        
        # Snake starts moving right
        self.direction = RIGHT
        
        # Game state
        self.running = True
    
    def handle_input(self):
        """Check for keyboard input and update direction"""
        for event in pygame.event.get():
            # Check if user wants to quit
            if event.type == pygame.QUIT:
                self.running = False
            
            # Check for key presses
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_q:
                    # Q key quits the game
                    self.running = False
                
                # Arrow keys change direction
                elif event.key == pygame.K_UP and self.direction != DOWN:
                    self.direction = UP
                elif event.key == pygame.K_DOWN and self.direction != UP:
                    self.direction = DOWN
                elif event.key == pygame.K_LEFT and self.direction != RIGHT:
                    self.direction = LEFT
                elif event.key == pygame.K_RIGHT and self.direction != LEFT:
                    self.direction = RIGHT
    
    def move_snake(self):
        """Move the snake in the current direction"""
        # Get the current head position
        head_x, head_y = self.snake[0]
        
        # Calculate new head position based on direction
        new_head_x = head_x + self.direction[0]
        new_head_y = head_y + self.direction[1]
        
        # Wrap around the screen edges (teleport to opposite side)
        new_head_x = new_head_x % GRID_WIDTH
        new_head_y = new_head_y % GRID_HEIGHT
        
        # Add new head to the front of the snake
        self.snake.insert(0, (new_head_x, new_head_y))
        
        # Remove the tail (for v0, snake doesn't grow)
        self.snake.pop()
    
    def draw_snake(self):
        """Draw the snake on the screen"""
        for i, (x, y) in enumerate(self.snake):
            # Calculate pixel position
            pixel_x = x * GRID_SIZE
            pixel_y = y * GRID_SIZE
            
            # Head is yellow, body is white
            color = YELLOW if i == 0 else WHITE
            
            # Draw the square
            pygame.draw.rect(
                self.screen, 
                color, 
                (pixel_x, pixel_y, GRID_SIZE, GRID_SIZE)
            )
    
    def draw(self):
        """Draw everything on the screen"""
        # Fill the background with black
        self.screen.fill(BLACK)
        
        # Draw the snake
        self.draw_snake()
        
        # Update the display
        pygame.display.flip()
    
    def run(self):
        """The main game loop - this runs the whole game!"""
        print("Snake Game Started!")
        print("Use arrow keys to move the snake")
        print("Press Q to quit")
        
        while self.running:
            # Handle any input (keyboard, mouse, etc.)
            self.handle_input()
            
            # Move the snake
            self.move_snake()
            
            # Draw everything
            self.draw()
            
            # Control game speed
            self.clock.tick(SNAKE_SPEED)
        
        # Clean up when game ends
        pygame.quit()
        print("Thanks for playing!")


def main():
    """Start the game!"""
    try:
        # Create and run the game
        game = SnakeGame()
        game.run()
    except KeyboardInterrupt:
        # Handle Ctrl+C gracefully
        print("\nGame interrupted by user")
        pygame.quit()
    except Exception as e:
        # Handle any other errors
        print(f"An error occurred: {e}")
        pygame.quit()


if __name__ == "__main__":
    main() 