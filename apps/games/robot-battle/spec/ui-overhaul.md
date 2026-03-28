# UI Overhaul Spec — v0.3.0

## Problems identified from playtesting

1. **Buttons stuck at bottom of screen** — the CSS grid puts output in
   a `1fr` area and input in an `auto` area at the bottom. With little
   content, there's a huge empty black gap between text and buttons.
   Every screen suffers from this.

2. **No keyboard navigation** — arrow keys don't work. You can only
   click buttons or Tab between them. Kids expect arrow keys + Enter.

3. **Shop has duplicate content** — items are listed as text in the
   output area, then repeated as buttons at the bottom. Information
   shown twice, disconnected.

4. **"Press Enter to continue" gets stuck** — the text input loses
   focus if you click the page background. Once focus is lost, Enter
   stops working and you're stuck. No mouse alternative exists.

5. **No number key shortcuts** — buttons show "1. Fight" but pressing
   the `1` key does nothing. Only clicking or Tab+Enter works.

## Solution: inline choices + keyboard nav

### Core change: move choices into the output flow

Instead of a separate input area pinned to the bottom, choices render
**inline in the output area** as a vertical list. Each choice is a
styled div (not a button in a separate grid area). The currently
selected choice has a highlight marker (`>`) and a distinct background.

```
=== SHOP ===
Level: 1 | Money: $100 | Inventory: 1/4

> 1. Stick - $50            ← highlighted (green bg)
     1 dmg, 80% acc, 1 energy, 1h
  2. Wrench - $75
     2 dmg, 90% acc, 2 energy, 1h
  3. Cardboard Armor - $100
     +5 HP
  B. Back
```

This eliminates:
- The text/button duplication in the shop
- The empty gap (choices are right below the header)
- The need for a separate input grid area for choices

### Keyboard navigation

All choice prompts support:
- **Arrow Up / Arrow Down** — move selection highlight
- **Enter** — confirm selection
- **Number keys** — jump directly to numbered choice (1-9)
- **Escape** — select "Back" if present (convenience)

The choice list captures keyboard events on the document level
(not on individual buttons) so it works regardless of focus.

### Mouse support

Each choice is still clickable. Hovering highlights the choice.
Clicking confirms it. This is the same as before but the choices
are now inline instead of pinned to the bottom.

### "Press Enter to continue" replacement

Replace the text input `promptText("Press Enter to continue...")`
with a new terminal method: `promptContinue()`.

Behavior:
- Shows a `[Continue]` button inline in the output (clickable)
- Starts a 5-second countdown: `[Continue 5]` → `[Continue 4]` → ... → auto-dismisses
- Enter key dismisses immediately (document-level listener)
- Click on the button dismisses immediately
- The countdown is visible in the button text so kids see it ticking

This fixes both bugs:
- Enter works via document listener (no focus needed)
- Mouse works via clickable button
- Auto-dismiss means you can never get stuck

### CSS changes

**Remove the grid split.** The terminal becomes a single scrollable
column. Everything — text, choices, continue buttons — flows top to
bottom in the same container.

```css
#terminal {
  min-height: 100vh;
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
  overflow-y: auto;
}
```

**Inline choice styling:**
```css
.terminal-choice-item {
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 2px;
}

.terminal-choice-item.selected {
  background: #1a3a1a;
  color: #33ff33;
  font-weight: bold;
}

.terminal-choice-item:hover {
  background: #1a3a1a;
}
```

**Continue button styling:**
```css
.terminal-continue {
  display: inline-block;
  padding: 4px 12px;
  border: 1px solid #33ff33;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 8px;
}
```

### Terminal interface changes

```typescript
interface Terminal {
  print(text: string, cssClass?: string): void;
  clear(): void;
  promptText(prompt: string): Promise<string>;
  promptChoice(prompt: string, choices: Choice[]): Promise<string>;
  promptContinue(seconds?: number): Promise<void>;  // NEW
}
```

`promptChoice` changes:
- Renders choices inline in the output area (not in a separate grid area)
- Adds document-level keydown listener for arrows/enter/numbers
- Returns the selected value on Enter/click
- Cleans up listener on resolve

`promptContinue` is new:
- Renders a `[Continue 5]` button inline
- Counts down each second, updating the button text
- Resolves on: Enter key, click, or countdown reaching 0
- Cleans up listener + interval on resolve

`promptText` stays mostly the same but adds a document-level Enter
listener as fallback so it works even without input focus.

### Shop buy menu simplification

With inline choices, the shop buy menu no longer needs to print items
as text AND show them as buttons. Each choice item becomes:

```
> 1. Stick - $50
     1 dmg, 80% acc, 1 energy, 1h
  2. Wrench - $75
     2 dmg, 90% acc, 2 energy, 1h
```

The stat line is part of the choice item's DOM (a sub-line). When the
choice is selected/highlighted, both the name and stat line highlight.

### Screens affected

- **terminal.ts** — rewrite `promptChoice`, add `promptContinue`, update CSS
- **terminal.css** — remove grid split, add inline choice/continue styles
- **battle.ts** — replace `promptText("Press Enter...")` with `promptContinue()`
- **shop.ts** — remove duplicate text printing in buy menu (choices now show stats inline)
- **All other screens** — work automatically since they use `promptChoice`

### What stays the same

- `promptText` for name input (still needs a real text input)
- `data-testid` attributes on choices (for Playwright)
- The Terminal interface (additive change — `promptContinue` is new)
- All engine code (zero changes)

## Test updates

- Update E2E tests that use `promptText("Press Enter...")` to use
  the new continue button (`choice-continue` testid)
- Add E2E test: keyboard arrow nav works on main menu
- Add E2E test: number key shortcut selects correct choice
- Add E2E test: continue countdown auto-dismisses

## Version

Bump to v0.3.0 — this is a minor release (new UI feature, no save break).
