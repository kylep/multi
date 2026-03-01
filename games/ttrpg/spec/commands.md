# TTRPG Campaign Copilot — Command Reference

Commands are prefixed with `/` to distinguish them from DM narrative input.
Anything not starting with `/` is treated as a narrative prompt and sent to
the LLM with full RAG context assembled.

---

## Campaign Commands

### `/campaign new <slug> "<name>"`
Create a new campaign directory under `saves/`.

```
/campaign new shattered-crown "The Shattered Crown"
```

### `/campaign load <slug>`
Switch the active campaign.

```
/campaign load shattered-crown
```

### `/campaign list`
List all campaigns in `saves/`.

### `/campaign status`
Print current campaign name, active characters, session count, last played date.

---

## Character Commands

### `/char new <slug>`
Create a new character file with blank template. Opens editor or prompts
field-by-field.

```
/char new theron
```

### `/char show <name>`
Print a formatted character sheet for the given character.

```
/char show theron
→ Theron (Rogue 5) | HP 28/38 | AC 15 | poisoned
  Equipped: shortsword+1, dagger, leather armor, ring-of-protection
  Inventory: thieves-tools, 2x potion-of-healing, 50gp
```

### `/char show all`
Print a compact summary of all characters in the current campaign.

### `/stats <name> <field> <value>`
Directly set a stat on a character. Use for levelling up or corrections.

```
/stats theron level 6
/stats theron ac 16
```

---

## HP and Rest Commands

### `/damage <name> <amount>`
Reduce a character's current HP. Clamps at 0 (does not go negative).

```
/damage theron 10
→ Theron: HP 38 → 28
```

### `/heal <name> <amount>`
Restore HP, up to max. Does not exceed max HP.

```
/heal aria 8
→ Aria: HP 32 → 40
```

### `/temp <name> <amount>`
Grant temporary HP.

```
/temp theron 5
```

### `/rest short <name> [name...]`
Short rest for one or more characters. Prompts for hit dice to spend.

```
/rest short theron aria
```

### `/rest long <name> [name...]`
Long rest. Resets HP to max, restores all spell slots, clears short-rest
conditions for named characters.

```
/rest long theron aria
```

---

## Condition Commands

### `/condition add <name> <condition>`
Apply a condition to a character.

```
/condition add theron poisoned
/condition add aria blinded
```

### `/condition remove <name> <condition>`
Remove a condition.

```
/condition remove theron poisoned
```

### `/condition clear <name>`
Remove all conditions from a character.

---

## Inventory Commands

### `/give <name> <item> [quantity]`
Add an item to a character's inventory. Checks catalog for a matching entry.
If quantity is omitted, defaults to 1.

```
/give theron potion-of-healing 2
/give aria staff-of-fire
```

### `/take <name> <item> [quantity]`
Remove an item from a character's inventory.

```
/take theron potion-of-healing 1
```

### `/equip <name> <item> [slot]`
Move an item to the equipped block. Slot is optional; inferred from item type
if omitted (e.g., a weapon goes to `main_hand` if that slot is free).

```
/equip theron shortsword+1
/equip theron dagger off_hand
```

### `/unequip <name> <slot>`
Remove item from an equipped slot, returning it to inventory.

```
/unequip theron off_hand
```

### `/attune <name> <item>`
Mark an item as attuned. Warns if attunement limit (3) would be exceeded.

```
/attune aria staff-of-fire
```

### `/unattune <name> <item>`
Remove attunement from an item.

### `/charges <item-id> <current>`
Update the current charges on a charged item.

```
/charges staff-of-fire-1 5
```

### `/transfer <from> <to> <item> [quantity]`
Move an item between characters or containers.

```
/transfer theron aria potion-of-healing 1
/transfer party-wagon theron rope
```

### `/loot "<description>"`
Freeform loot entry. Parses the description and distributes to party wagon
by default, then prompts for individual assignment.

```
/loot "50gp, a silver dagger, and a scroll of detect magic"
```

---

## Container Commands

### `/container show <slug>`
Print contents of a container.

```
/container show party-wagon
→ Party Wagon (outside the dungeon entrance, NOT accessible)
  12x ration, 2x hemp-rope-50ft, 3x potion-of-healing, 240gp
```

### `/container accessible <slug> <true|false>`
Mark a container as accessible or not. Affects whether the LLM will
allow characters to retrieve items from it.

```
/container accessible party-wagon false
```

---

## Encounter Commands

### `/encounter start "<description>"`
Create `encounter.json` and begin combat mode. Ephemeral state block
is included in all subsequent prompts.

```
/encounter start "The goblin shaman and two warriors block the throne room entrance"
```

### `/encounter initiative <name> <roll>`
Set initiative roll for a combatant. Call once per combatant after starting.

```
/encounter initiative theron 14
/encounter initiative aria 18
/encounter initiative "goblin-shaman" 15
/encounter initiative "goblin-warrior-1" 9
```

### `/encounter next`
Advance to the next turn in initiative order. Prints who acts next.

### `/encounter hp <combatant> <current>`
Update HP for an NPC combatant during combat.

```
/encounter hp goblin-shaman 12
```

### `/encounter condition add <combatant> <condition>`
Apply a condition to any combatant (PC or NPC).

```
/encounter condition add goblin-shaman frightened
```

### `/encounter end`
Wipe `encounter.json`. Combat is over. Prompts to apply any carry-over
conditions (e.g., poisoned PC) back to the persistent character file.

---

## World Commands

### `/npc show <slug>`
Print current NPC state (disposition, location, flags).

### `/npc update <slug> <field> <value>`
Update a field on an NPC.

```
/npc update malachar-the-lich disposition_theron hostile
/npc update innkeeper-bram status dead
```

### `/flag set <flag>`
Set a quest flag to `true`.

```
/flag set prophecy_revealed
```

### `/flag unset <flag>`
Set a quest flag to `false`.

### `/flag list`
Print all quest flags and their current values.

---

## Session Commands

### `/session start`
Print a brief context recap (party status, last session summary, current location)
to orient the DM before play begins.

### `/session end`
Prompt the DM to write (or auto-generate) a session summary. Saves it to
`sessions/{N}-summary.md` and increments `session_count` in `campaign.json`.

### `/session summary`
Show the most recent session summary.

---

## Query Commands

Read-only. Safe to expose to players when `player_queries: true`.

### `/backpack <name>`
Print a character's full inventory in readable format.

```
/backpack theron
→ Theron's inventory:
  - Shortsword +1 (equipped, main hand)
  - Dagger (equipped, off hand)
  - Leather Armor (equipped)
  - Ring of Protection (equipped, attuned)
  - Thieves' Tools
  - Potion of Healing x2
  - 50 gp
```

### `/spells <name>`
Print a character's spell slots and prepared spells.

### `/party`
Print a compact overview of all characters: HP, conditions, equipped.

### `/item <catalog-ref>`
Look up an item in the catalog. Returns the markdown content (lore + rules).

```
/item staff-of-fire
```

---

## Utility Commands

### `/help [command]`
Print command list, or detailed help for a specific command.

### `/undo`
Revert the last state-modifying command. Backed by a simple JSON snapshot
taken before each write operation.

### `/export`
Print a formatted campaign state summary (all characters, containers,
active flags) suitable for copying to a notes app or printing.

---

## Narrative Input (no slash prefix)

Any input without a `/` prefix is treated as a DM narrative prompt.
The orchestrator assembles full context (party state + encounter state
if active + RAG retrieval) and sends it to the LLM.

```
The party steps through the iron door into the throne room.

→ [LLM response streamed back with narrative]
```

DM narrative can include parenthetical asides for the LLM:

```
Theron attempts to pick the lock (he rolls an 18 on thieves' tools).

→ [LLM incorporates the success into the narrative]
```
