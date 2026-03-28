# Save & Load Test Spec

## Unit Tests (tests/unit/save.test.ts)

### saveGame
- Writes JSON to storage under `robot-battle-save` key
- Stored JSON contains `version: 1` and the full `player` Robot object
- Preserves inventory items with correct types (weapon/gear/consumable)

### loadGame
- Returns Robot when valid save exists
- Returns null when no save exists
- Returns null when stored JSON is malformed
- Returns null when version field doesn't match (future-proofing)
- Restores inventory items with all fields intact
- Restores a player with no inventory (empty array)

### deleteSave
- Removes the save key from storage
- No error when key doesn't exist

### hasSave
- Returns true when save exists
- Returns false when no save exists

### Round-trip
- Save then load returns identical Robot (deep equality)
- Save player with mixed inventory (weapon + gear + consumable), load back, verify all item fields

## E2E Tests (tests/e2e/save.spec.ts)

### Fresh start (no save)
- Clear localStorage, navigate to game
- Verify: "Name your robot" prompt shown (no New/Continue choice)

### New game creates save immediately
- Start new game with name "SaveBot"
- Navigate to main menu
- Reload the page
- Verify: Continue option appears showing "Continue: SaveBot Lv.1"

### Continue loads saved game
- Start new game, buy a Stick from the shop, go back to main menu
- Reload the page
- Click Continue
- Navigate to Inspect Robot
- Verify: robot has the Stick in inventory and $50 money (100 - 50)

### Save persists after fight
- Start new game, buy a Stick, fight MiniBot (surrender immediately)
- Reload the page, click Continue
- Verify: fights count is 1

### Save persists after shop
- Start new game, buy a Stick, go back to main menu
- Reload the page, click Continue, inspect
- Verify: Stick in inventory, money is $50

### New Game from Continue screen
- Start a game so save exists, reload page
- Click "New Game" instead of Continue
- Verify: "Name your robot" prompt shown
- Enter new name, verify fresh start (money = 100, no inventory)

### Quit returns to title screen
- Start a game, then choose Quit from main menu
- Verify: back at title screen with New/Continue options
- Click Continue
- Verify: back at main menu with the same robot

### Save survives level-up
- Start new game, earn enough XP to level up (fight and win)
- Reload, Continue, Inspect
- Verify: level matches the post-fight level
