# Start Game
Upon launching the game, Kid Bot Battle Sim is displayed as a header in a bold and
prominent way.

A prompt is provided to the user: `Player Name:` and a text input.

# Interfaces

## CLI
- Print "Kid Bot Battle Sim" as ASCII art on launch
- Prompt `Player Name: ` and wait for text input
- Validate that the name is non-empty before proceeding

## Web
- Display "Kid Bot Battle Sim" as a styled heading (`<h1>`)
- Render a form with a labeled text input for player name and a "Start" button
- Disable the button until the input is non-empty

## Mobile
- Show "Kid Bot Battle Sim" as a large, bold title centered at the top of the screen
- Present a text field with placeholder "Player Name" and a "Start" button below it
- Auto-focus the text field and show the keyboard on launch

## API
- `POST /game/start` with body `{ "playerName": string }`
- Returns `{ "gameId": string, "playerName": string }`
- Returns `400` if `playerName` is missing or empty
