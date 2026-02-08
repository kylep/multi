# Game Design – Universal Multi-Interface Game

This game is intended to be novel in two ways
1. Children will define the majorit of the content
1. It will be a common game with 4 interfaces:
  1. CLI
  1. API
  1. Web
  1. Mobile

The web and mobile experiences are than just text input, they use graphics that
are AI-rendered from children's hand-drawn artwork.

Typescript and React Native are selected as common frameworks.

## Core Software Composition Goals

* A **single shared game logic library**
* Multiple interfaces consuming that logic
* Deterministic, testable behavior
* CLI-first development loop

## Non-Goals (for v1)

* Multiplayer
* Persistence beyond local runtime

## Architecture Overview

```
kid-bot-battle-sim/
├── bin/
│   ├── build.sh     # Build the entire project
├── packages/
│   ├── game-core/   # shared logic
│   ├── cli/         # text interface
│   ├── api/         # HTTP / tRPC interface
│   ├── web/         # graphical browser UI
│   └── mobile/      # mobile UI
└── tests/
```

## Game Core (`packages/game-core`)

* Language: **TypeScript**
* Pure logic only
* All game logic lives here, other directories are purely interfaces

### Game Data (`packages/game-core/src/data/`)

All game content (stats, items, enemies) lives as typed TypeScript constants in
`packages/game-core/src/data/`. This data is the source of truth for balancing
and content, imported by all interfaces through `@kid-bot-battle-sim/game-core`.

* `config.ts` — default robot stats, starting money
* `items.ts` — weapons, gear, and consumables with types and stats
* `enemies.ts` — static enemy definitions (loadouts, rewards)

## Game Spec & Features

Each feature is defined as a spec in `features/`. Spec's are the final authority on
how the game works. Tests are AI-generated, and should cover each spec.

## Interfaces (High-Level)

### CLI
* Text-based
* Built in a way Cursor can interact with it
* Primary development & testing surface

### API
* Typed API
* Optional for local play
* Mirrors game-core exactly
* Webserver containerized in Docker
* Build and launch with Docker Compose
* Build creates an SDK that can be independently imported

### Web
* Graphical (not text-only)
* Same game events and state transitions
* Desktop-focused
* Does not use the API, entirely client-side

### Mobile
* Mirrors web behavior
* Optimized for phone screens
* iOS-first is acceptable. Aim for cross-compatibility but only test for iOS.
* React-Native

## Extension Expectations

The architecture must support future additions without refactoring:
* additional game state
* branching logic
* animations
* persistence


# Testing
The game should be written in a TDD style: For each feature
1. Unit tests and Integration tests are written for the common libraries
1. Libraries are written, coded until they pass
1. CLI tests are written, ran until they pass
1. API, Web, Mobile tests are written but not ran

On demand, the slower API, Web and Mobile tests are ran and corrected. CLI testing,
being fastest, is the core e2e validation strategy.


