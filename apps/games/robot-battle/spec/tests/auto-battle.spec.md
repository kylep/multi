# Auto-Battle Test Spec

## Unit Tests

No new unit tests needed. Auto-battle uses `aiPlanAction` which is already
tested via the AI and battle test suites. The feature is purely UI-layer.

## E2E Tests (tests/e2e/combat.spec.ts — added to existing combat suite)

### Auto-Battle button visible
- Enter battle with MiniBot
- Verify: "Auto" button is visible alongside other actions

### Auto-Battle runs to completion
- Enter battle with a weapon equipped
- Click Auto-Battle
- Wait for battle to end (victory or defeat text appears)
- Verify: either "VICTORY" or "DEFEAT" is visible (resolves within
  seconds — turns accelerate from 250ms to 150ms)

### Auto-Battle shows turn resolution
- Enter battle, click Auto-Battle
- Wait for battle end
- Verify: at least one "Turn Resolution" message appeared in the output
  (confirms turns actually executed, not just skipped)

### Rewards shown after auto-battle win
- Enter battle with strong enough setup to reliably win (buy Stick, fight MiniBot)
- Click Auto-Battle, wait for completion
- If victory: verify rewards text visible (+exp, +$)
- Press Enter to continue, verify return to main menu
