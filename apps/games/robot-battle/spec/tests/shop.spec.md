# Shop Test Spec

## Unit Tests (tests/unit/shop.test.ts)

### List Available Items
- Returns only items at or below player level

### Can Buy
- Allows buying affordable items at player level
- Rejects items above player level
- Rejects when not enough money
- Rejects when inventory full
- Rejects duplicate gear

### Buy Item
- Deducts money and adds item to inventory

### Sell Item
- Returns half of buy price
- Removes item from inventory

### Get Sell Price
- Returns floor(moneyCost / 2)

## E2E Tests (tests/e2e/shop.spec.ts)

### Open Shop
- Navigate to shop, verify Buy/Sell/Back buttons visible

### Buy menu shows item descriptions
- Open Buy menu
- Verify: item descriptions and stat summaries visible in the list
  (e.g. "1 dmg, 80% acc" for Stick)

### Buy menu includes Wrench
- Open Buy menu at level 0
- Verify: Wrench listed with "2 dmg, 90% acc, 2 energy, 1h"

### Buy a Stick
- Click Buy → click Stick button
- Verify: "Bought Stick for $50" message

### Sell After Buying
- Buy a Stick, go back, click Sell, click Stick
- Verify: "Sold Stick for $25" message

### Bottom Back card returns to main menu
- Open shop, scroll to bottom of buy tab
- Click the bottom Back card (.card.card-back)
- Verify: returns to main menu (Fight button visible)

### Shop scrolls to top when opened
- Open shop
- Verify: tab bar (Buy/Sell/Inventory/Back) is visible at top of viewport

### Filter toggle hides level-restricted items
- Open shop (Buy tab, filter defaults to On)
- Verify: only items at or below player level are shown
- Click "Filter: On" to toggle off
- Verify: all items shown including level-restricted ones with "[Requires level X]"
- Click "Filter: Off" to toggle back on
- Verify: level-restricted items hidden again
