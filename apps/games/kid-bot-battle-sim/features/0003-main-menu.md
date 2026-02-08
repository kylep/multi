# Main Menu

After the player names their robot, their robot's stats are printed to the screen.
The player is then presented with the main menu:

1. Fight
2. Shop
3. Inspect Robot
4. Quit

Selecting an option navigates to the corresponding feature. After completing a fight
or leaving the shop, the player returns to this menu.

# Interfaces

## CLI
- Print robot stats summary after game start
- Display numbered menu options
- Accept numeric input (1-4) to select
- Re-prompt on invalid input

## Web
- Show robot stats panel alongside four action buttons
- Buttons are styled distinctly (Fight is prominent)
- Disable Fight if no enemies are available

## Mobile
- Full-screen menu with large tap targets for each option
- Robot stats displayed in a collapsible header
- Swipe down to refresh stats view

## API
- `GET /game/:gameId/actions` returns available menu actions
- `POST /game/:gameId/action` with body `{ "action": "fight" | "shop" | "inspect" | "quit" }`
