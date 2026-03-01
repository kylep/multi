# TTRPG Campaign Copilot — Data Schema

## Directory Structure

```
games/ttrpg/
  catalog/                    ← RAG-indexed reference material (committed to git)
    items/
      shortsword+1.md
      cloak-of-elvenkind.md
      potion-of-healing.md
    monsters/
      goblin.md
      goblin-shaman.md
    spells/
      fireball.md
      cure-wounds.md
    locations/
      crypt-of-malachar.md
    rules/
      house-rules.md
      attunement.md
  spec/                       ← this folder

saves/                        ← gitignored (local only)
  {campaign-slug}/
    campaign.json
    characters/
      {character-name}.json
    containers/
      {container-name}.json
    world/
      npcs.json
      locations.json
      factions.json
      quest-flags.json
    sessions/
      001-summary.md
      002-summary.md
    encounter.json            ← ephemeral, wiped after combat
```

---

## campaign.json

Top-level metadata and settings for a campaign.

```json
{
  "slug": "shattered-crown",
  "name": "The Shattered Crown",
  "system": "dnd5e",
  "created": "2026-02-28",
  "last_played": "2026-03-01",
  "session_count": 4,
  "characters": ["theron", "aria"],
  "containers": ["party-wagon"],
  "settings": {
    "tone": "whimsical",
    "narrator_persona": "You are a narrator for a home D&D 5e campaign with young players. Keep descriptions vivid but age-appropriate. Prefer shorter paragraphs. End narration with an implicit prompt for the players to act.",
    "player_queries": false,
    "llama_server": "http://localhost:8080",
    "short_term_memory_turns": 5,
    "rag_chunks": 3
  }
}
```

**Fields:**
- `characters`: list of character slugs, maps to `characters/{slug}.json`
- `containers`: list of container slugs, maps to `containers/{slug}.json`
- `tone`: passed into the narrator persona prompt
- `player_queries`: when `true`, read-only query endpoints are exposed on LAN
- `short_term_memory_turns`: how many recent DM/narrator exchanges to include verbatim
- `rag_chunks`: how many catalog chunks to retrieve per query

---

## characters/{name}.json

Full character state. Semi-persistent fields (HP, spell slots, conditions) reset
on rest. Inventory and equipment persist across sessions.

```json
{
  "slug": "theron",
  "name": "Theron",
  "player": "Kyle",
  "race": "Half-Elf",
  "class": "Rogue",
  "subclass": "Arcane Trickster",
  "level": 5,
  "background": "Criminal",
  "alignment": "Chaotic Good",

  "stats": {
    "str": 10, "dex": 18, "con": 14,
    "int": 13, "wis": 11, "cha": 14
  },
  "ac": 15,
  "speed": 30,
  "proficiency_bonus": 3,
  "initiative_bonus": 4,

  "hp": {
    "current": 28,
    "max": 38,
    "temp": 0
  },
  "hit_dice": {
    "type": "d8",
    "remaining": 3,
    "total": 5
  },

  "conditions": ["poisoned"],

  "spell_slots": null,

  "attunement_slots": {
    "max": 3,
    "used": 1
  },

  "equipped": {
    "main_hand": "shortsword-plus-1",
    "off_hand": "dagger-1",
    "armor": "leather-armor-1",
    "accessories": ["ring-of-protection-1"]
  },

  "inventory": [
    {
      "id": "shortsword-plus-1",
      "catalog_ref": "shortsword+1",
      "attuned": false,
      "notes": "looted from bandit captain"
    },
    {
      "id": "dagger-1",
      "catalog_ref": "dagger",
      "attuned": false
    },
    {
      "id": "leather-armor-1",
      "catalog_ref": "leather-armor",
      "attuned": false
    },
    {
      "id": "ring-of-protection-1",
      "catalog_ref": "ring-of-protection",
      "attuned": true
    },
    {
      "id": "thieves-tools-1",
      "catalog_ref": "thieves-tools",
      "quantity": 1
    },
    {
      "id": "potion-of-healing-1",
      "catalog_ref": "potion-of-healing",
      "quantity": 2
    },
    {
      "id": "gold-1",
      "catalog_ref": "gold",
      "quantity": 50
    }
  ],

  "proficiencies": {
    "armor": ["light"],
    "weapons": ["simple", "hand-crossbow", "longsword", "rapier", "shortsword"],
    "tools": ["thieves-tools", "disguise-kit"],
    "saving_throws": ["dex", "int"],
    "skills": ["acrobatics", "deception", "insight", "investigation",
               "perception", "sleight-of-hand", "stealth"]
  },

  "features": [
    "sneak-attack-3d6",
    "cunning-action",
    "uncanny-dodge",
    "arcane-trickster-spellcasting"
  ],

  "notes": "Theron has a personal vendetta against the merchant guild. He doesn't talk about his sister."
}
```

**Inventory item fields:**
- `id`: unique instance ID within this character's inventory (slug + number)
- `catalog_ref`: key into the `catalog/items/` directory for lore/rules lookup
- `quantity`: for stackable items (potions, arrows, gold, rations)
- `charges`: `{ "current": N, "max": N }` for charged items
- `attuned`: whether this instance is currently attuned
- `equipped`: set to `true` for items tracked in `equipped` block as well
- `notes`: freeform, shown in state context if present

---

## containers/{name}.json

Containers (wagons, chests, saddlebags) share the same inventory schema as
characters but without stats. They have a location reference instead.

```json
{
  "slug": "party-wagon",
  "name": "The Party Wagon",
  "type": "wagon",
  "location": "outside-the-dungeon-entrance",
  "accessible": false,
  "inventory": [
    {
      "id": "ration-1",
      "catalog_ref": "ration",
      "quantity": 12
    },
    {
      "id": "rope-1",
      "catalog_ref": "hemp-rope-50ft",
      "quantity": 2
    },
    {
      "id": "healing-potion-2",
      "catalog_ref": "potion-of-healing",
      "quantity": 3
    },
    {
      "id": "gold-party-1",
      "catalog_ref": "gold",
      "quantity": 240
    }
  ]
}
```

**Fields:**
- `location`: freeform string, used in state context to remind the LLM where
  the container is relative to the party
- `accessible`: whether the party can currently reach it — included in prompt
  context so the LLM won't have characters pull items from a wagon they left
  three dungeons away

---

## encounter.json

Ephemeral. Created when combat starts, wiped by `/encounter end`.
Never RAG-indexed. Injected directly into prompt if it exists.

```json
{
  "active": true,
  "round": 3,
  "location": "throne-room-level-2",
  "description": "The party faces the goblin shaman and two goblin warriors near the crumbling throne.",
  "initiative": [
    { "name": "Aria", "roll": 18, "type": "pc" },
    { "name": "Goblin Shaman", "roll": 15, "type": "npc" },
    { "name": "Theron", "roll": 14, "type": "pc" },
    { "name": "Goblin Warrior 1", "roll": 9, "type": "npc" },
    { "name": "Goblin Warrior 2", "roll": 6, "type": "npc" }
  ],
  "current_turn": "Theron",
  "combatants": {
    "goblin-shaman": {
      "catalog_ref": "goblin-shaman",
      "hp": { "current": 12, "max": 22 },
      "conditions": ["frightened"]
    },
    "goblin-warrior-1": {
      "catalog_ref": "goblin",
      "hp": { "current": 0, "max": 7 },
      "conditions": ["dead"]
    },
    "goblin-warrior-2": {
      "catalog_ref": "goblin",
      "hp": { "current": 5, "max": 7 },
      "conditions": []
    }
  }
}
```

---

## world/npcs.json

Persistent NPC state — relationships, last known location, quest involvement.
Lore and personality live in `catalog/` and are RAG-retrieved. This file tracks
what has *happened* with each NPC.

```json
{
  "malachar-the-lich": {
    "catalog_ref": "malachar-the-lich",
    "status": "alive",
    "last_known_location": "throne-room-level-3",
    "disposition_theron": "hostile",
    "disposition_aria": "hostile",
    "notes": "Revealed his true name in session 3. Party has not used it yet.",
    "quest_flags": ["true-name-learned"]
  },
  "innkeeper-bram": {
    "catalog_ref": "innkeeper-bram",
    "status": "alive",
    "last_known_location": "the-rusty-flagon-inn",
    "disposition_theron": "friendly",
    "disposition_aria": "neutral",
    "notes": "Owes Theron a favour after the rat cellar incident."
  }
}
```

---

## world/quest-flags.json

Boolean flags tracking campaign progress. Used by the orchestrator to
conditionally include context (e.g., only retrieve the prophecy text if
`prophecy_revealed` is true).

```json
{
  "prophecy_revealed": true,
  "malachar_true_name_learned": true,
  "guild_betrayal_discovered": false,
  "aria_backstory_resolved": false
}
```

---

## sessions/{N}-summary.md

Written (manually or auto-generated) at the end of each session. RAG-indexed
so the LLM can retrieve relevant history without the full transcript taking
up context.

```markdown
---
session: 3
date: 2026-03-08
players: ["Theron", "Aria"]
location: "Crypt of Malachar, Levels 1-2"
---

The party descended into the Crypt after bribing the ferryman Dorin.
Theron disarmed three traps in the entrance hall; Aria destroyed an
undead patrol with Turn Undead. On level 2 they discovered the Shaman's
journal revealing Malachar's true name: Vel'zarath. Goblin Warrior 1
was slain in combat near the throne room entrance. The party camped in
the library alcove before pushing to level 3.

Loot: staff-of-fire (Aria, attuned), 240gp to party wagon, shaman's journal.
```

Keeping summaries concise (100–200 words) ensures they retrieve cleanly
and don't dominate the context budget.

---

## catalog/ — Item Format

Each item in `catalog/items/` is a markdown file. Chunked and embedded
into ChromaDB at startup.

```markdown
---
id: shortsword+1
type: weapon
rarity: uncommon
requires_attunement: false
weight: 2
value_gp: 500
---

# Shortsword +1

A finely balanced blade with a faint blue sheen along its edge. You gain
a +1 bonus to attack and damage rolls made with this magic weapon.

**Damage:** 1d6 piercing
**Properties:** Finesse, light
**Weight:** 2 lb

*This weapon counts as magical for the purpose of overcoming resistance
and immunity to nonmagical attacks and damage.*
```

The frontmatter fields allow structured lookups (e.g., "list all attuned
items Theron is carrying that are uncommon or above"). The body is what
gets embedded and retrieved by the RAG system.
