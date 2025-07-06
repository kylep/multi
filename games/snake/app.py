#!/usr/bin/env python3
"""
Snake Game V2 - A simple game to learn Python programming!

This game teaches:
- How to use pygame for graphics
- How to handle keyboard input
- How to create a game loop
- How to work with coordinates and movement
- How to organize code into functions
- How to handle collisions and scoring
- How to create game states (playing, game over, restart)
- How to implement lives system and timer
- How to create flashing effects and special items

Created for learning purposes - perfect for beginners!
"""

import pygame
import sys
import random
import time
import os
from typing import List, Tuple

# Game settings - these are easy to understand and change!
GRID_WIDTH = 100
GRID_HEIGHT = 60
GRID_SIZE = 10  # Size of each square in pixels
BASE_SNAKE_SPEED = 20  # Base speed (frames per second)
SPEED_INCREASE_PER_SCORE = 2  # How much speed increases per score point
TIMER_DURATION = 100  # Game timer in seconds
LIVES_START = 3  # Starting number of lives
MAX_LIVES = 10  # Maximum number of lives

# Colors - using simple color names
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
YELLOW = (255, 255, 0)
GREEN = (0, 255, 0)
RED = (255, 0, 0)
PINK = (255, 192, 203)  # Pink for hearts
GRAY = (128, 128, 128)

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
        pygame.display.set_caption("Snake Game V2 - Press Q to quit!")
        
        # Set up the game clock to control speed
        self.clock = pygame.time.Clock()
        
        # Set up font for displaying score and game over text
        self.font = pygame.font.Font(None, 36)  # Default font, size 36
        self.big_font = pygame.font.Font(None, 72)  # Big font for game over
        
        # Initialize sound effects
        self.init_sounds()
        
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
        self.lives = LIVES_START
        self.win = False
        self.timeout = False
        self.lives_lost = False
        
        # High score
        self.high_score = self.load_high_score()
        
        # Timer
        self.game_start_time = time.time()
        self.time_bonus = 0  # Track time bonuses from green food
        
        # Initialize obstacles first (empty list)
        self.red_obstacles = []  # No red obstacles until first green square is eaten
        
        # Food (generate after obstacles are initialized)
        self.green_food = self.generate_random_2x2_position()
        self.yellow_food = None  # Special flashing yellow food
        
        # Flashing effect for yellow food
        self.flash_timer = 0
        self.flash_visible = True
    
    def get_timer_remaining(self):
        """Get remaining time in seconds"""
        elapsed = time.time() - self.game_start_time
        remaining = TIMER_DURATION + self.time_bonus - elapsed
        return max(0, remaining)
    
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
    
    def init_sounds(self):
        """Initialize sound effects"""
        try:
            # Create simple sound effects using pygame's sound generation
            # Ding sound (high frequency, short duration)
            self.ding_sound = self.generate_ding_sound()
            
            # Buzzer sound (low frequency, longer duration)
            self.buzzer_sound = self.generate_buzzer_sound()
        except Exception as e:
            print(f"Warning: Could not initialize sounds: {e}")
            self.ding_sound = None
            self.buzzer_sound = None
    
    def generate_ding_sound(self):
        """Generate a pleasing ding sound"""
        # Create a simple ding sound using sine wave
        sample_rate = 44100
        duration = 0.2  # 200ms
        frequency = 800  # 800 Hz for a pleasant ding
        
        # Generate sine wave
        num_samples = int(sample_rate * duration)
        samples = []
        
        for i in range(num_samples):
            sample = int(32767 * 0.3 * pygame.math.sin(2 * pygame.math.pi * frequency * i / sample_rate))
            samples.append(sample)
        
        # Convert to 16-bit signed integers
        sound_array = pygame.sndarray.array(samples)
        return pygame.sndarray.make_sound(sound_array)
    
    def generate_buzzer_sound(self):
        """Generate a buzzer sound for life loss"""
        # Create a buzzer sound using square wave
        sample_rate = 44100
        duration = 0.3  # 300ms
        frequency = 200  # 200 Hz for buzzer
        
        # Generate square wave
        num_samples = int(sample_rate * duration)
        samples = []
        
        for i in range(num_samples):
            # Square wave: positive for first half of cycle, negative for second half
            cycle_position = (frequency * i / sample_rate) % 1.0
            sample = 16383 if cycle_position < 0.5 else -16383
            samples.append(sample)
        
        # Convert to 16-bit signed integers
        sound_array = pygame.sndarray.array(samples)
        return pygame.sndarray.make_sound(sound_array)
    
    def play_sound(self, sound):
        """Play a sound effect if available"""
        if sound:
            try:
                sound.play()
            except Exception as e:
                print(f"Warning: Could not play sound: {e}")
    
    def load_high_score(self):
        """Load high score from file"""
        try:
            if os.path.exists('high_score.txt'):
                with open('high_score.txt', 'r') as f:
                    return int(f.read().strip())
            return 0
        except Exception as e:
            print(f"Warning: Could not load high score: {e}")
            return 0
    
    def save_high_score(self, score):
        """Save high score to file"""
        try:
            with open('high_score.txt', 'w') as f:
                f.write(str(score))
        except Exception as e:
            print(f"Warning: Could not save high score: {e}")
    
    def check_and_update_high_score(self):
        """Check if current score is a new high score and update if needed"""
        if self.score > self.high_score:
            self.high_score = self.score
            self.save_high_score(self.high_score)
            return True
        return False
    
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
    
    def generate_edge_position(self):
        """Generate a position along the edge of the screen"""
        edge = random.choice(['top', 'bottom', 'left', 'right'])
        
        if edge == 'top':
            return (random.randint(0, GRID_WIDTH - 1), 0)
        elif edge == 'bottom':
            return (random.randint(0, GRID_WIDTH - 1), GRID_HEIGHT - 1)
        elif edge == 'left':
            return (0, random.randint(0, GRID_HEIGHT - 1))
        else:  # right
            return (GRID_WIDTH - 1, random.randint(0, GRID_HEIGHT - 1))
    
    def generate_adjacent_position(self):
        """Generate a position adjacent to an existing red obstacle"""
        if not self.red_obstacles:
            return self.generate_random_position()
        
        # Pick a random red obstacle
        obstacle = random.choice(self.red_obstacles)
        ox, oy = obstacle
        
        # Try positions adjacent to this obstacle
        adjacent_positions = [
            (ox + 1, oy), (ox - 1, oy), (ox, oy + 1), (ox, oy - 1)
        ]
        
        # Filter valid positions
        valid_positions = []
        for pos in adjacent_positions:
            x, y = pos
            if (0 <= x < GRID_WIDTH and 0 <= y < GRID_HEIGHT and 
                pos not in self.snake and pos not in self.red_obstacles):
                valid_positions.append(pos)
        
        if valid_positions:
            return random.choice(valid_positions)
        else:
            return self.generate_random_position()
    
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
    
    def reverse_snake_direction(self):
        """Reverse the snake's direction (180 degree turn)"""
        if self.direction == UP:
            self.direction = DOWN
        elif self.direction == DOWN:
            self.direction = UP
        elif self.direction == LEFT:
            self.direction = RIGHT
        elif self.direction == RIGHT:
            self.direction = LEFT
    
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
            # Snake hit itself - lose a life
            self.lose_life()
            return
        
        if new_head in self.red_obstacles:
            # Snake hit red obstacle - lose a life and remove the obstacle
            self.red_obstacles.remove(new_head)
            self.lose_life()
            return
        
        # Check timer
        if self.get_timer_remaining() <= 0:
            # Timer ran out - lose a life
            self.timeout = True
            self.lose_life()
            return
        
        # Add new head to the front of the snake
        self.snake.insert(0, new_head)
        
        # Check if snake ate green food (check if head is in the 2x2 food area)
        food_x, food_y = self.green_food
        if (food_x <= new_head_x <= food_x + 1 and 
            food_y <= new_head_y <= food_y + 1):
            # Play ding sound
            self.play_sound(self.ding_sound)
            
            # Increase score
            self.score += 1
            
            # Add 5 seconds to timer
            self.time_bonus += 5
            
            # Generate new green food
            self.green_food = self.generate_random_2x2_position()
            
            # Check for win condition (no valid food position)
            if self.green_food is None:
                self.game_state = GAME_OVER
                self.win = True
                self.check_and_update_high_score()
                return
            
            # Add red obstacles after first green square is eaten
            # Spawn SCORE number of red obstacles (1, then 2, then 3, etc.)
            for _ in range(self.score):
                # After score 3, use edge placement logic
                if self.score >= 3 and random.random() < 0.33:
                    new_obstacle = self.generate_edge_position()
                # After score 3, use adjacent placement logic
                elif self.score >= 3 and random.random() < 0.75:
                    new_obstacle = self.generate_adjacent_position()
                else:
                    new_obstacle = self.generate_random_position()
                
                if new_obstacle and new_obstacle not in self.red_obstacles:
                    self.red_obstacles.append(new_obstacle)
            
            # After score 5, chance to spawn yellow food
            if self.score >= 5 and random.random() < 0.20:
                self.yellow_food = self.generate_random_position()
                self.flash_timer = 0
                self.flash_visible = True
            
            # Snake grows (don't remove tail when eating)
        else:
            # Check if snake ate yellow food
            if self.yellow_food and new_head == self.yellow_food:
                # Play ding sound (same as green food)
                self.play_sound(self.ding_sound)
                
                # Increase score by 5
                self.score += 5
                
                # Add 1 life (up to maximum)
                if self.lives < MAX_LIVES:
                    self.lives += 1
                
                # Clear both foods and respawn
                self.yellow_food = None
                self.green_food = self.generate_random_2x2_position()
                
                # Check for win condition
                if self.green_food is None:
                    self.game_state = GAME_OVER
                    self.win = True
                    self.check_and_update_high_score()
                    return
            else:
                # Remove the tail (only when not eating)
                self.snake.pop()
    
    def lose_life(self):
        """Handle losing a life"""
        # Play buzzer sound
        self.play_sound(self.buzzer_sound)
        
        self.lives -= 1
        
        if self.lives <= 0:
            # Game over
            self.lives_lost = True
            self.check_and_update_high_score()
            self.game_state = GAME_OVER
    
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
            
            # Draw black border around tail segments (not head)
            if i > 0:
                pygame.draw.rect(
                    self.screen,
                    BLACK,
                    (pixel_x, pixel_y, GRID_SIZE, GRID_SIZE),
                    1  # Border width of 1 pixel
                )
            
            # Draw direction arrow on head
            if i == 0:
                self.draw_direction_arrow(pixel_x, pixel_y)
    
    def draw_direction_arrow(self, x, y):
        """Draw a small arrow showing the snake's direction"""
        center_x = x + GRID_SIZE // 2
        center_y = y + GRID_SIZE // 2
        
        # Arrow size
        arrow_size = 3
        
        if self.direction == UP:
            points = [(center_x, center_y - arrow_size), 
                     (center_x - arrow_size, center_y + arrow_size),
                     (center_x + arrow_size, center_y + arrow_size)]
        elif self.direction == DOWN:
            points = [(center_x, center_y + arrow_size),
                     (center_x - arrow_size, center_y - arrow_size),
                     (center_x + arrow_size, center_y - arrow_size)]
        elif self.direction == LEFT:
            points = [(center_x - arrow_size, center_y),
                     (center_x + arrow_size, center_y - arrow_size),
                     (center_x + arrow_size, center_y + arrow_size)]
        else:  # RIGHT
            points = [(center_x + arrow_size, center_y),
                     (center_x - arrow_size, center_y - arrow_size),
                     (center_x - arrow_size, center_y + arrow_size)]
        
        pygame.draw.polygon(self.screen, BLACK, points)
    
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
        
        # Draw yellow food (flashing)
        if self.yellow_food and self.flash_visible:
            yellow_x, yellow_y = self.yellow_food
            pixel_x = yellow_x * GRID_SIZE
            pixel_y = yellow_y * GRID_SIZE
            pygame.draw.rect(
                self.screen,
                YELLOW,
                (pixel_x, pixel_y, GRID_SIZE, GRID_SIZE)
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
    
    def draw_lives(self):
        """Draw the lives as pink hearts in the top right"""
        heart_size = GRID_SIZE - 2  # Slightly smaller than snake head
        
        for i in range(self.lives):
            # Calculate position (top right, going left)
            x = self.window_width - 10 - (heart_size + 5) * (self.lives - i)
            y = 10
            
            # Draw a heart shape using multiple rectangles
            self.draw_heart(x, y, heart_size, PINK)
    
    def draw_heart(self, x, y, size, color):
        """Draw a simple, symmetrical heart shape"""
        # Calculate center and radius for better symmetry
        center_x = x + size // 2
        center_y = y + size // 2
        radius = size // 4
        
        # Draw two circles for the top curves
        left_circle_x = center_x - radius
        right_circle_x = center_x + radius
        circle_y = center_y - radius // 2
        
        pygame.draw.circle(self.screen, color, (left_circle_x, circle_y), radius)
        pygame.draw.circle(self.screen, color, (right_circle_x, circle_y), radius)
        
        # Draw a square for the bottom (simpler than triangle)
        square_size = radius
        square_x = center_x - square_size // 2
        square_y = center_y + radius // 2
        
        pygame.draw.rect(self.screen, color, (square_x, square_y, square_size, square_size))
    
    def draw_timer(self):
        """Draw the timer in the bottom right"""
        remaining_time = int(self.get_timer_remaining())
        timer_text = f"Time: {remaining_time}s"
        timer_surface = self.font.render(timer_text, True, WHITE)
        
        # Position in bottom right
        text_rect = timer_surface.get_rect()
        text_rect.bottomright = (self.window_width - 10, self.window_height - 10)
        self.screen.blit(timer_surface, text_rect)
    
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
            
            # Draw "Ran out of time" if timer ran out
            if self.timeout:
                timeout_text = self.font.render("Ran out of time", True, WHITE)
                timeout_rect = timeout_text.get_rect(center=(self.window_width // 2, self.window_height // 2 - 10))
                self.screen.blit(timeout_text, timeout_rect)
            # Draw "Ran out of lives" if lives ran out
            elif self.lives_lost:
                lives_text = self.font.render("Ran out of lives", True, WHITE)
                lives_rect = lives_text.get_rect(center=(self.window_width // 2, self.window_height // 2 - 10))
                self.screen.blit(lives_text, lives_rect)
        
        # Draw the score below
        score_text = self.font.render(f"Score: {self.score}", True, WHITE)
        score_rect = score_text.get_rect(center=(self.window_width // 2, self.window_height // 2 + 50))
        self.screen.blit(score_text, score_rect)
        
        # Draw the high score below the score
        high_score_text = self.font.render(f"High score: {self.high_score}", True, WHITE)
        high_score_rect = high_score_text.get_rect(center=(self.window_width // 2, self.window_height // 2 + 80))
        self.screen.blit(high_score_text, high_score_rect)
        
        # Draw restart instruction
        restart_text = self.font.render("Press any key to restart (Q to quit)", True, WHITE)
        restart_rect = restart_text.get_rect(center=(self.window_width // 2, self.window_height // 2 + 110))
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
            
            # Draw UI elements
            self.draw_score()
            self.draw_lives()
            self.draw_timer()
        
        # Update the display
        pygame.display.flip()
    
    def run(self):
        """The main game loop - this runs the whole game!"""
        print("Snake Game V2 Started!")
        print("Use arrow keys to move the snake")
        print("Eat the large green squares (2x2) to grow and score points")
        print("Avoid red squares - they cost you lives!")
        print("Collect flashing yellow squares for bonus points!")
        print("Fill the board to win!")
        print("Press Q to quit")
        
        running = True
        while running:
            # Handle any input (keyboard, mouse, etc.)
            running = self.handle_input()
            
            # Move the snake (only when playing)
            if self.game_state == PLAYING:
                self.move_snake()
                
                # Update flash timer for yellow food
                if self.yellow_food:
                    self.flash_timer += 1
                    if self.flash_timer >= 10:  # Flash every 10 frames
                        self.flash_visible = not self.flash_visible
                        self.flash_timer = 0
            
            # Draw everything
            self.draw()
            
            # Control game speed (increases with score)
            current_speed = BASE_SNAKE_SPEED + (self.score * SPEED_INCREASE_PER_SCORE)
            self.clock.tick(current_speed)
        
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