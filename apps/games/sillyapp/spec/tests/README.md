# Silly App — Gherkin Test Specifications

Human-readable acceptance criteria for every feature in the Silly App.  
These `.feature` files define the expected behavior and serve as the source of truth for test implementation.

## Files

| File | Feature | Scenarios |
|---|---|---|
| `identity.feature` | Authentication & Session Management | 7 |
| `track-silly-things.feature` | Create Content (Text, Photo, Share) | 10 |
| `review-silly-things.feature` | Feed, Filtering, STOTD, Detail View | 12 |
| `rate-silly-things.feature` | Rating (0-100) & Hearts | 11 |
| `friends.feature` | Invites, Accept/Decline, Remove, List | 12 |
| `leaderboard.feature` | Rankings by Hearts & Rating | 9 |
| `delete-silly-things.feature` | Swipe Delete, Detail Delete, Cascade | 8 |

**Total: 69 scenarios**

## How to Use

These Gherkin specs are **not** executed directly (Swift has no native Gherkin runner).  
They serve as:

1. **Acceptance criteria** — each scenario maps to one or more UI tests or unit tests.
2. **Implementation checklist** — implement features until all scenarios pass.
3. **Code review reference** — verify PRs against scenario expectations.

### Mapping to Swift Tests

| Gherkin Layer | Swift Test Layer | Framework |
|---|---|---|
| Scenario (UI flow) | `sillyappUITests/` | XCTest / XCUIApplication |
| Scenario (logic) | `sillyappTests/ViewModels/` | Swift Testing (`@Test`) |
| Background (data setup) | Test fixtures / mocks | Swift Testing |

### Naming Convention

For each scenario, the corresponding Swift test should be named:

```
test_<feature>_<scenarioSummary>
```

Example:  
- Gherkin: `Scenario: Successful Google OAuth sign-in (first time)`
- Swift: `@Test func identity_successfulGoogleSignIn_firstTime()`
