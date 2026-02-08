# Enemy AI

## Opponent AI Logic
When the AI-controlled opponent plans their turn, they:
1. Plan to use any consumables they have (consumables don't end the turn)
2. Plan to attack if they have energy and weapons
   - Each weapon is used only once per attack
   - AI uses as many weapons as hands allow
3. Plan to rest if they have no energy or no usable weapons

## AI-Suggested Defaults
The game suggests optimal actions for the player based on the current situation:
- When the suggested action is attack, suggested weapon slots are shown:
  `[1]>` or `[1,2]>`
- Player can press Enter to accept the suggestion or type their own choice
- Suggestions follow the same logic as the opponent AI

On the first battle, display a tip:
"TIP: You can just hit Enter to let the AI pick your move"

# Interfaces

## CLI
- AI suggestion shown in brackets before the input prompt
- Enter key accepts the suggestion
- Tip displayed once on first battle

## Web
- Suggested action button highlighted with a glow effect
- "AI recommends" tooltip on the highlighted button
- Tip shown as a dismissible banner on first battle

## Mobile
- Suggested action has a pulsing highlight
- Tip shown as an overlay on first battle, tap to dismiss

## API
- `GET /game/:gameId/battle/suggestion` returns the AI-recommended action
- Returns `{ action: string, weaponSlots?: number[] }`
