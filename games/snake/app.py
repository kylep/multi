#!/usr/bin/env python3
"""
Snake Game V1 - A simple game to learn Python programming!

This game teaches:
- How to use pygame for graphics
- How to handle keyboard input
- How to create a game loop
- How to work with coordinates and movement
- How to organize code into functions
- How to handle collisions and scoring
- How to create game states (playing, game over, restart)

Created for learning purposes - perfect for beginners!
"""

import pygame
import sys
import random
from typing import List, Tuple

# Game settings - these are easy to understand and change!
GRID_WIDTH = 100
GRID_HEIGHT = 60
GRID_SIZE = 10  # Size of each square in pixels
SNAKE_SPEED = 50  # How fast the snake moves (frames per second)

# Colors - using simple color names
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
YELLOW = (255, 255, 0)
GREEN = (0, 255, 0)
RED = (255, 0, 0)

# Directions - using arrow keys
UP = (0, -1)
DOWN = (0, 1)
LEFT = (-1, 0)
RIGHT = (1, 0)

# Game states
PLAYING = "playing"
GAME_OVER = "game_over"


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
        pygame.display.set_caption("Snake Game V1 - Press Q to quit!")
        
        # Set up the game clock to control speed
        self.clock = pygame.time.Clock()
        
        # Set up font for displaying score and game over text
        self.font = pygame.font.Font(None, 36)  # Default font, size 36
        self.big_font = pygame.font.Font(None, 72)  # Big font for game over
        
        # Initialize the game
        self.reset_game()
    
    def reset_game(self):
        """Reset the game to start over"""
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
        self.game_state = PLAYING
        self.score = 0
        self.win = False
        
        # Initialize obstacles first (empty list)
        self.red_obstacles = []  # No red obstacles until first green square is eaten
        
        # Food (generate after obstacles are initialized)
        self.green_food = self.generate_random_2x2_position()
    
    def generate_random_position(self):
        """Generate a random position that's not occupied by the snake"""
        # Try to find a valid position (max 1000 attempts to avoid infinite loop)
        for attempt in range(1000):
            x = random.randint(0, GRID_WIDTH - 1)
            y = random.randint(0, GRID_HEIGHT - 1)
            position = (x, y)
            
            # Make sure it's not on the snake
            if position not in self.snake:
                return position
        
        # If we can't find a position, return None (this will trigger win condition)
        return None
    
    def generate_random_2x2_position(self):
        """Generate a random 2x2 position that doesn't overlap with snake or red obstacles"""
        # Try to find a valid 2x2 position (max 1000 attempts to avoid infinite loop)
        for attempt in range(1000):
            # Generate top-left corner of 2x2 square
            x = random.randint(0, GRID_WIDTH - 2)  # -2 to ensure 2x2 fits
            y = random.randint(0, GRID_HEIGHT - 2)  # -2 to ensure 2x2 fits
            
            # Check all 4 positions in the 2x2 square
            positions = [(x, y), (x+1, y), (x, y+1), (x+1, y+1)]
            
            # Check if any position overlaps with snake or red obstacles
            valid = True
            for pos in positions:
                if pos in self.snake or pos in self.red_obstacles:
                    valid = False
                    break
            
            if valid:
                return (x, y)  # Return top-left corner
        
        # If we can't find a position, return None (this will trigger win condition)
        return None
    
    def handle_input(self):
        """Check for keyboard input and update direction"""
        for event in pygame.event.get():
            # Check if user wants to quit
            if event.type == pygame.QUIT:
                return False
            
            # Check for key presses
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_q:
                    # Q key quits the game
                    return False
                
                # If game is over, any key (except Q) restarts
                if self.game_state == GAME_OVER:
                    self.reset_game()
                    return True
                
                # Arrow keys change direction (only when playing)
                if self.game_state == PLAYING:
                    if event.key == pygame.K_UP and self.direction != DOWN:
                        self.direction = UP
                    elif event.key == pygame.K_DOWN and self.direction != UP:
                        self.direction = DOWN
                    elif event.key == pygame.K_LEFT and self.direction != RIGHT:
                        self.direction = LEFT
                    elif event.key == pygame.K_RIGHT and self.direction != LEFT:
                        self.direction = RIGHT
        
        return True
    
    def move_snake(self):
        """Move the snake in the current direction"""
        if self.game_state != PLAYING:
            return
        
        # Get the current head position
        head_x, head_y = self.snake[0]
        
        # Calculate new head position based on direction
        new_head_x = head_x + self.direction[0]
        new_head_y = head_y + self.direction[1]
        
        # Wrap around the screen edges (teleport to opposite side)
        new_head_x = new_head_x % GRID_WIDTH
        new_head_y = new_head_y % GRID_HEIGHT
        
        new_head = (new_head_x, new_head_y)
        
        # Check for collisions
        if new_head in self.snake:
            # Snake hit itself - game over
            self.game_state = GAME_OVER
            return
        
        if new_head in self.red_obstacles:
            # Snake hit red obstacle - game over
            self.game_state = GAME_OVER
            return
        
        # Add new head to the front of the snake
        self.snake.insert(0, new_head)
        
        # Check if snake ate green food (check if head is in the 2x2 food area)
        food_x, food_y = self.green_food
        if (food_x <= new_head_x <= food_x + 1 and 
            food_y <= new_head_y <= food_y + 1):
            # Increase score
            self.score += 1
            
            # Generate new green food
            self.green_food = self.generate_random_2x2_position()
            
            # Check for win condition (no valid food position)
            if self.green_food is None:
                self.game_state = GAME_OVER
                self.win = True
                return
            
            # Add red obstacle after first green square is eaten
            if self.score == 1:
                # Add first red obstacle
                new_obstacle = self.generate_random_position()
                if new_obstacle:
                    self.red_obstacles.append(new_obstacle)
            elif self.score > 1:
                # Add another red obstacle for each additional green square
                new_obstacle = self.generate_random_position()
                if new_obstacle:
                    self.red_obstacles.append(new_obstacle)
            
            # Snake grows (don't remove tail when eating)
        else:
            # Remove the tail (only when not eating)
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
    
    def draw_food_and_obstacles(self):
        """Draw the green food and red obstacles"""
        # Draw green food (2x2 square)
        if self.green_food:
            food_x, food_y = self.green_food
            pixel_x = food_x * GRID_SIZE
            pixel_y = food_y * GRID_SIZE
            pygame.draw.rect(
                self.screen,
                GREEN,
                (pixel_x, pixel_y, GRID_SIZE * 2, GRID_SIZE * 2)
            )
        
        # Draw red obstacles
        for obstacle_x, obstacle_y in self.red_obstacles:
            pixel_x = obstacle_x * GRID_SIZE
            pixel_y = obstacle_y * GRID_SIZE
            pygame.draw.rect(
                self.screen,
                RED,
                (pixel_x, pixel_y, GRID_SIZE, GRID_SIZE)
            )
    
    def draw_score(self):
        """Draw the score in the top left corner"""
        score_text = f"Score: {self.score}"
        score_surface = self.font.render(score_text, True, WHITE)
        self.screen.blit(score_surface, (10, 10))
    
    def draw_game_over(self):
        """Draw the game over screen"""
        # Clear the screen
        self.screen.fill(BLACK)
        
        if self.win:
            # Draw "Great work!" in big letters
            great_work_text = self.big_font.render("Great work!", True, WHITE)
            great_work_rect = great_work_text.get_rect(center=(self.window_width // 2, self.window_height // 2 - 80))
            self.screen.blit(great_work_text, great_work_rect)
            
            # Draw "You Win!" below
            win_text = self.big_font.render("You Win!", True, GREEN)
            win_rect = win_text.get_rect(center=(self.window_width // 2, self.window_height // 2 - 20))
            self.screen.blit(win_text, win_rect)
        else:
            # Draw "Great work!" in big letters
            great_work_text = self.big_font.render("Great work!", True, WHITE)
            great_work_rect = great_work_text.get_rect(center=(self.window_width // 2, self.window_height // 2 - 50))
            self.screen.blit(great_work_text, great_work_rect)
        
        # Draw the score below
        score_text = self.font.render(f"Score: {self.score}", True, WHITE)
        score_rect = score_text.get_rect(center=(self.window_width // 2, self.window_height // 2 + 50))
        self.screen.blit(score_text, score_rect)
        
        # Draw restart instruction
        restart_text = self.font.render("Press any key to restart (Q to quit)", True, WHITE)
        restart_rect = restart_text.get_rect(center=(self.window_width // 2, self.window_height // 2 + 100))
        self.screen.blit(restart_text, restart_rect)
    
    def draw(self):
        """Draw everything on the screen"""
        if self.game_state == GAME_OVER:
            self.draw_game_over()
        else:
            # Fill the background with black
            self.screen.fill(BLACK)
            
            # Draw the snake
            self.draw_snake()
            
            # Draw food and obstacles
            self.draw_food_and_obstacles()
            
            # Draw the score
            self.draw_score()
        
        # Update the display
        pygame.display.flip()
    
    def run(self):
        """The main game loop - this runs the whole game!"""
        print("Snake Game V1 Started!")
        print("Use arrow keys to move the snake")
        print("Eat the large green squares (2x2) to grow and score points")
        print("Avoid red squares - they end the game!")
        print("Fill the board to win!")
        print("Press Q to quit")
        
        running = True
        while running:
            # Handle any input (keyboard, mouse, etc.)
            running = self.handle_input()
            
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