# The Silly App

An unserious tool to make life more whimsical and embrace all things silly.

## Key Features

- Track Silly Things (ST): Text, Photo, Video (todo in v2)
- Identity: Log In, Invite Friend, Accept/Decline/Review Invites, Remove Friend, Log Out (google oAuth)
- Review Silly Things: Collection of your own and your friends' content
  - Chronologically
  - Silly Thing of the day: Notification of Silly Things from this day in a prior year
  - Can filter to friend
- Rate Silly Things
  - Each user can assign a score of 0-100 on each Silly Thing. They can change it later.
  - Each user can assign a Heart to a Silly thing. One heart per ST per day.
    - Selecting a Silly Thing to view allows users to access a Heart History
- Leader Board
  - Most Hearts [Week, Month, Year, All Time]
  - Most Silly (by rating)
- Add ST Photo 
  - From in-app UI that opens the camera
  - from iPhone Share feature
- Add text ST 
  - within app UI. Just types a description
- Delete STs: Left-swipe with confirm modal and `...` menu from full-size selected ST. 

---

## Specification Index

This directory contains the complete implementation specification for the Silly App.  
These files are designed to be consumed by the Claude coding agent for iterative implementation.

### Architecture & Design

| File | Description |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Technology stack, mermaid architecture diagrams, data model, project directory structure, test strategy, agent build-verify instructions, image generation pipeline, build tools, and environment variables |
| [`IMPLEMENTATION.md`](IMPLEMENTATION.md) | Detailed feature-by-feature implementation spec with models, services, ViewModels, views, UI/UX spec, migration plan, error handling, and implementation order |
| [`PREFLIGHT-ENV-SETUP.md`](PREFLIGHT-ENV-SETUP.md) | Step-by-step setup guide for every check in `scripts/preflight-check.sh` — CLI tools, API keys, Firebase config, simulators |

### Test Specifications (Gherkin)

All test files are in [`tests/`](tests/).

| File | Feature | Scenarios |
|---|---|---|
| [`tests/README.md`](tests/README.md) | Test overview and Swift mapping guide | — |
| [`tests/identity.feature`](tests/identity.feature) | Authentication: sign-in, sign-out, session persistence | 7 |
| [`tests/track-silly-things.feature`](tests/track-silly-things.feature) | Create content: text, photo, camera, share extension, offline | 10 |
| [`tests/review-silly-things.feature`](tests/review-silly-things.feature) | Feed: chronological, filtering, STOTD, detail view, empty states | 12 |
| [`tests/rate-silly-things.feature`](tests/rate-silly-things.feature) | Rating (0-100), hearts, heart history | 11 |
| [`tests/friends.feature`](tests/friends.feature) | Invite, accept/decline, remove, friends list | 12 |
| [`tests/leaderboard.feature`](tests/leaderboard.feature) | Rankings by hearts and rating, time periods | 9 |
| [`tests/delete-silly-things.feature`](tests/delete-silly-things.feature) | Swipe delete, detail delete, cascade deletion | 8 |

**Total: 69 test scenarios**

### Image Prompts (Nano Banana)

All image prompt files are in [`image-prompts/`](image-prompts/).

| File | Asset | Size |
|---|---|---|
| [`image-prompts/README.md`](image-prompts/README.md) | Generation pipeline docs & script prompt | — |
| [`image-prompts/app-icon.md`](image-prompts/app-icon.md) | App Icon | 1024×1024 |
| [`image-prompts/launch-background.md`](image-prompts/launch-background.md) | Splash Screen Background | 1284×2778 |
| [`image-prompts/empty-feed.md`](image-prompts/empty-feed.md) | Empty Feed Illustration | 600×600 |
| [`image-prompts/empty-friends.md`](image-prompts/empty-friends.md) | Empty Friends Illustration | 600×600 |
| [`image-prompts/stotd-banner.md`](image-prompts/stotd-banner.md) | Silly Thing of the Day Banner | 800×300 |
| [`image-prompts/trophy-gold.md`](image-prompts/trophy-gold.md) | Leaderboard 1st Place Trophy | 200×200 |
| [`image-prompts/trophy-silver.md`](image-prompts/trophy-silver.md) | Leaderboard 2nd Place Trophy | 200×200 |
| [`image-prompts/trophy-bronze.md`](image-prompts/trophy-bronze.md) | Leaderboard 3rd Place Trophy | 200×200 |
| [`image-prompts/heart.md`](image-prompts/heart.md) | Heart Icon | 200×200 |
| [`image-prompts/default-avatar.md`](image-prompts/default-avatar.md) | Default User Avatar | 400×400 |
| [`image-prompts/invite-illustration.md`](image-prompts/invite-illustration.md) | Friend Invite Illustration | 600×600 |
| [`image-prompts/background-pattern.md`](image-prompts/background-pattern.md) | Tileable Background Pattern | 400×400 |
| [`image-prompts/tab-feed.md`](image-prompts/tab-feed.md) | Tab Bar: Feed | 60×60 |
| [`image-prompts/tab-create.md`](image-prompts/tab-create.md) | Tab Bar: Create | 60×60 |
| [`image-prompts/tab-leaderboard.md`](image-prompts/tab-leaderboard.md) | Tab Bar: Leaderboard | 60×60 |
| [`image-prompts/tab-friends.md`](image-prompts/tab-friends.md) | Tab Bar: Friends | 60×60 |
| [`image-prompts/tab-profile.md`](image-prompts/tab-profile.md) | Tab Bar: Profile | 60×60 |
| [`image-prompts/delete-confirmation.md`](image-prompts/delete-confirmation.md) | Delete Confirmation Art | 400×400 |

**Total: 18 image assets**

---

## Quick Start for the Agent

1. Read `ARCHITECTURE.md` first — it defines all technology and structural decisions.
2. Read `IMPLEMENTATION.md` — it specifies every feature in detail with implementation order.
3. Reference `tests/*.feature` — they define the acceptance criteria for each feature.
4. Follow the **Build-Verify Loop** in `ARCHITECTURE.md` §9 at every step.
5. Generate images using the pipeline in `image-prompts/README.md` when ready for Polish phase.
