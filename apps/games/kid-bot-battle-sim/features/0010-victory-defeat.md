# Victory and Defeat

## Defeat
If the player's robot is destroyed (health reaches 0) or the player surrenders:
- The battle ends
- No rewards are given
- The fight is recorded as a loss
- The player returns to the main menu

## Victory
If the enemy robot is destroyed, the player wins. Rewards are granted automatically:
- **Experience**: The opponent's exp reward value
- **Money**: The opponent's money reward value, modified by Money Maker gear (+20% per Money Maker)

A victory summary screen is shown:
```
*** VICTORY! ***

── Battle Summary ──
Turn 1: PlayerName 15/15, MiniBot 13/15
Turn 2: PlayerName 14/15, MiniBot 11/15
Turn 3: PlayerName 13/15, MiniBot 0/15

── Rewards ──
+2 exp
+$50 (+$10 bonus) = $60

── Your Robot ──
=== PlayerName ===
Level: 0 (Exp: 2/10)
Health: 13/15
...
```

## Leveling Up
- Each level requires 10 exp
- When a robot earns enough exp, they automatically level up
- Level up message is shown on the victory screen
- Higher levels unlock access to more powerful items in the shop

# Interfaces

## CLI
- Print defeat message and return to main menu
- Print victory summary with turn-by-turn health recap
- Show rewards breakdown with money bonus calculation
- Print updated robot stats
- Show "LEVEL UP!" banner when leveling occurs

## Web
- Defeat: overlay with "Defeated" message and "Return to Menu" button
- Victory: animated summary screen with rewards tallying up
- Level up: celebratory animation with new level displayed

## Mobile
- Defeat: full-screen overlay with return button
- Victory: scrollable summary with share button
- Level up: confetti animation

## API
- Battle result included in final turn response
- `GET /game/:gameId/battle/result` returns `{ outcome, rewards, leveledUp, newLevel, summary }`
