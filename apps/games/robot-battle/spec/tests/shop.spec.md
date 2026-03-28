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

### Buy a Stick
- Click Buy → click Stick button
- Verify: "Bought Stick for $50" message

### Sell After Buying
- Buy a Stick, go back, click Sell, click Stick
- Verify: "Sold Stick for $25" message
