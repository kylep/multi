# UI Enhancements

Visual features that apply across the game interfaces.

## Box Drawing and Formatting
- Unicode borders and separators: `═══`, `║`, `────`
- Section headers with decorative borders

## Health and Energy Bars
- Visual bars: `[████████░░░░░░░] 8/10`
- Icons: `♥` for health, `⚡` for energy

## Turn Counter
- Turn headers: `════════════ TURN 3 ════════════`

## Color Coding
- **Purple**: Money amounts, robot names
- **Red**: Damage numbers, defeat messages
- **Green**: Success messages, victory
- **Yellow**: Turn headers, section headers
- **Cyan**: Health/Energy stats

## Combat Log
- Displayed at the start of each new turn showing previous turn's events
- Attack format includes weapon slot numbers:
  ```
  RobotName attacks!
    Weapon 1 hits for X damage
    Weapon 2 misses!
  ```

## Clear Screen
- Screen clears between menus and turns for a cleaner display

# Interfaces

## CLI
- ANSI color codes for all color coding
- Box drawing characters for borders and separators
- ASCII health/energy bars with numeric values
- `console.clear()` between screens

## Web
- CSS-styled equivalents of all visual elements
- Animated health bars with CSS transitions
- Color classes matching the CLI color scheme
- Smooth page transitions instead of clear screen

## Mobile
- Native styled components matching the color scheme
- Animated health/energy bars
- Screen transitions with navigation animations

## API
- Not applicable — UI enhancements are client-side only
- Battle state responses include raw data; formatting is client responsibility
