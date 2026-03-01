# TTRPG Campaign Copilot — Architecture

## Overview

A locally-hosted D&D campaign assistant that uses Retrieval-Augmented Generation
(RAG) to keep an LLM grounded in campaign-specific knowledge. The DM interacts
with it at the table to generate narrative, track state, and answer rules
questions. Designed as a DM tool initially, with a clear path to exposing
read-only player queries later.

---

## Hardware Baseline

- **Machine**: Gaming PC, Windows
- **GPU**: NVIDIA RTX 3070, 8GB VRAM
- **LLM**: Mistral Nemo Instruct 12B (Q4_K_L, ~7.98GB) via llama.cpp
  - Fully GPU-offloaded via CUDA on the 3070
  - Chosen for instruction-following quality and writing style (see bakeoff results)
  - Close other GPU-heavy applications before running (leaves ~200MB headroom)
- **Embedding model**: `nomic-embed-text` via Ollama (CPU, small footprint)

---

## Components

```
┌─────────────────────────────────────────────────────────┐
│                      Gaming PC                          │
│                                                         │
│  ┌─────────────┐    ┌──────────────┐   ┌────────────┐  │
│  │ llama-server│    │  ChromaDB    │   │  saves/    │  │
│  │  :8080      │    │  (vector DB) │   │  campaign  │  │
│  │ Mistral Nemo│    │  catalog     │   │  state     │  │
│  │ 12B Q4_K_L  │    │  embeddings  │   │  JSON      │  │
│  └──────┬──────┘    └──────┬───────┘   └─────┬──────┘  │
│         │                  │                 │          │
│         └──────────────────┴─────────────────┘          │
│                            │                            │
│                  ┌─────────┴─────────┐                  │
│                  │  RAG Orchestrator │                  │
│                  │  (Python service) │                  │
│                  └─────────┬─────────┘                  │
│                            │                            │
│                  ┌─────────┴─────────┐                  │
│                  │   CLI / Web UI    │                  │
│                  └───────────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

### llama-server
- Runs `llama-server` from llama.cpp exposing an OpenAI-compatible HTTP API
- Endpoint: `http://localhost:8080/v1/chat/completions`
- All GPU layers offloaded (`-ngl 99`)
- Context window: 8192 tokens (sufficient when RAG keeps context lean)
- Can be accessed from other devices on the LAN (tablets at the table)

```bash
llama-server \
  -m ~/models/mistral-nemo-12b/Mistral-Nemo-Instruct-2407-Q4_K_L.gguf \
  -ngl 99 -c 8192 --host 0.0.0.0 --port 8080
```

### ChromaDB
- Embedded Python library, no separate server process
- Stores vector embeddings of catalog documents (item lore, monster stat blocks,
  location descriptions, spell references, house rules)
- Also indexes completed session summaries for campaign history retrieval
- **Does NOT index live game state** — that is always injected directly

### Campaign State (JSON files)
- Canonical source of truth for all live game data
- Read directly by the orchestrator, never via RAG
- Lives in `saves/{campaign-slug}/` (gitignored)
- See `data-schema.md` for full schemas

### RAG Orchestrator
- Python service (FastAPI)
- Handles all prompt assembly and LLM communication
- On each request:
  1. Reads current campaign state directly from JSON
  2. Embeds the user's input
  3. Queries ChromaDB for relevant catalog/session chunks
  4. Assembles final prompt (see Prompt Assembly below)
  5. Streams response from llama-server back to UI

### CLI / Web UI
- Initial implementation: CLI (rich terminal output, good for one operator)
- Future: minimal FastAPI web UI for player-facing read-only queries
- DM commands modify state; query commands are read-only
- See `commands.md` for full reference

---

## Prompt Assembly

Each LLM call is stateless. Context is rebuilt fresh every turn from:

```
┌─────────────────────────────────────────────────────┐
│ SYSTEM PERSONA                                      │
│ "You are a DnD narrator for a home campaign..."    │
│ tone, style guidelines, length constraints          │
├─────────────────────────────────────────────────────┤
│ PARTY STATE  (always injected, direct JSON read)   │
│ Theron (Rogue 5): HP 28/38, poisoned               │
│   equipped: shortsword+1, leather armor            │
│   inventory: thieves-tools, 2x healing-potion      │
│ Aria (Cleric 5): HP 40/40, full spell slots        │
│ ...                                                 │
├─────────────────────────────────────────────────────┤
│ ENCOUNTER STATE  (if in combat)                    │
│ Round 3, initiative order, active effects          │
├─────────────────────────────────────────────────────┤
│ RETRIEVED CONTEXT  (RAG — 2-4 chunks, ~800 tokens) │
│ Only fetched when semantically relevant:           │
│ - Item lore for items mentioned                    │
│ - Location description for current area           │
│ - Recent session summary chunks                   │
│ - NPC backstory if NPC is present                 │
├─────────────────────────────────────────────────────┤
│ SHORT-TERM MEMORY  (last 5 exchanges verbatim)     │
│ Maintains turn-to-turn narrative coherence         │
├─────────────────────────────────────────────────────┤
│ CURRENT INPUT                                      │
│ DM: "The goblin shaman raises its staff..."        │
└─────────────────────────────────────────────────────┘
```

**Token budget estimate (8192 total):**
- System persona: ~200 tokens
- Party state: ~300–500 tokens (scales with party size)
- Encounter state: ~150 tokens (only during combat)
- RAG chunks: ~600–900 tokens
- Short-term memory: ~800 tokens (5 exchanges)
- Current input + response: ~1500 tokens
- **Total: ~3500–4000 tokens** — comfortable headroom

This directly addresses the context exhaustion problem encountered when running
long narratives without RAG. State never grows unbounded; only what's relevant
is included.

---

## Solving the Context Window Problem

The blog post that inspired this project hit the 8192 token limit running
"Choose Your Own Adventure" style continuity. RAG solves this structurally:

- **Character state** is always current from JSON — no drift, no hallucination
- **Campaign history** lives in session summary documents, retrieved only when
  relevant (not stuffed in wholesale)
- **Short-term memory** gives turn-to-turn coherence without carrying the full
  conversation
- **Encounter state** is ephemeral and discarded when combat ends

---

## State Lifecycle

Three tiers of data with different persistence:

| Tier | Examples | Lifetime |
|------|----------|----------|
| **Persistent** | Character XP, inventory, world flags, NPC relationships | Full campaign |
| **Semi-persistent** | HP, spell slots, conditions, attunement | Until next rest |
| **Ephemeral** | Initiative order, combat conditions, active AoE | Until encounter ends |

Persistent and semi-persistent data lives in character/world JSON files.
Ephemeral data lives only in `encounter.json`, which is wiped by `/encounter end`.

---

## Multi-Campaign Support

Each campaign is a self-contained directory under `saves/`:

```
saves/
  shattered-crown/        ← active campaign
  solo-aria-adventure/    ← second save / alternate campaign
```

The active campaign is set in a local config file or passed as a CLI argument.
Switching campaigns never touches another campaign's data.

---

## Future: Player-Facing Access

The orchestrator exposes two endpoint categories from day one:

- **DM endpoints** (write + query): full access, runs on localhost only
- **Query endpoints** (read-only): can be optionally exposed on LAN

When `player_queries: true` is set in `campaign.json`, a simple web UI
becomes accessible to other devices on the network. Players can ask
"what's in my backpack?" or "what are my spell slots?" without DM
involvement. The LLM is not involved in query responses — they are
direct JSON reads formatted as readable text.
