---
title: "Claude Plays Minecraft With My Family"
summary: I put a Claude-driven bot on our family Minecraft server so my AI
  assistant Pai could eventually play with us. My kids gifted it a diamond
  sword, stole its eggs, and taught me more about agent design than any eval.
slug: claude-plays-minecraft-with-my-family
category: ai
tags: AI, Claude-Code, agents, Pai, Minecraft, mineflayer
date: 2026-10-09
status: draft
keywords:
  - claude plays minecraft
  - mineflayer claude code
  - ai agent minecraft family server
  - minecraft 26.3 mineflayer
  - agent skills playbook
  - haiku vs sonnet agents
---

## Table of contents

# Why put an AI on the family server?

My family plays Minecraft together on a small rented server: me, my wife, my
9-year-old and my 6-year-old. It's a vanilla survival world with
`keepInventory` turned on because nobody wants to explain item loss to a
6-year-old at bedtime.

I also run [Pai](/openclaw-inspired-assistant.html), my personal assistant
agent. Pai lives on my agent platform, talks to me on Discord, and has a
memory. The long-term idea is simple: Pai gets her own Minecraft account and
plays with us. My kids get a patient friend in the game who helps build stuff,
and I get a very honest, very chaotic test bed for "can an agent operate in a
shared world with real people who do unpredictable things".

But Pai doesn't know how to play Minecraft, and you don't want to point a
persona agent at a live game and hope. So the actual project for this session
was: have Claude Code (Sonnet, most of the day) set up the bot, play the game
itself, and turn everything it learned into a **playbook** of skills, scripts
and wiki pages that Pai, or a cheaper model like Haiku, could run.

Playing the game was the method. The playbook was the product.

The bot is called **PaiRobot**. When anyone asked who it was, it was told to
answer: "Claude, setting up PaiRobot for Pai."

# The stack

## A Claude Code harness around mineflayer

The base is
[domdomegg/claude-code-plays-minecraft](https://github.com/domdomegg/claude-code-plays-minecraft)
(MIT). It runs a [mineflayer](https://github.com/PrismarineJS/mineflayer)
bot in a long-lived Node daemon, and exposes a small CLI, `mc-bot`, that
Claude Code calls from Bash:

```bash
mc-bot start PaiRobot --auth microsoft
mc-bot eval PaiRobot "return JSON.stringify(bot.entity.position)"
mc-bot tail PaiRobot        # JSON event stream: chat, deaths, kicks
```

`mc-bot eval` runs a chunk of JavaScript inside the bot process. Because the
daemon is one process, `globalThis` persists between evals, which turns out
to be both the most useful and the most dangerous property of the whole
setup (more on that later).

I hardened the harness before letting it near my kids:

- a per-bot token plus Origin/Host checks on the daemon's local HTTP port
- a chat allowlist (`MC_ALLOW`) so only my family's usernames get their chat
  text forwarded to the model at all; everyone else is dropped, fail-closed
- removed the auto-approve and bypass-permissions hooks that shipped with it
- nothing auto-starts on session start

The Microsoft login is a device-code flow, so the harness prints "open this
URL, enter this code", I approve it once, and the token caches.

## Minecraft 26.3 was too new

The server runs Java 26.3. The published npm versions of the Prismarine
libraries stopped at 26.1. Support for 26.2/26.3 existed as a stack of
unmerged community PRs across `minecraft-data`, `node-minecraft-protocol`,
`mineflayer`, `prismarine-chunk` and `prismarine-physics`.

So Claude built local integration branches of all five, packed tarballs, and
wired them in with npm `overrides`. Two things still broke and needed our own
patches:

1. **Teleport replies.** The 26.3 server expects a `tick_end` packet after
   the client answers a teleport. Without it the bot got kicked for
   `invalid_player_movement` shortly after joining. One-line fix in
   mineflayer's physics.
2. **Signs.** Writing text on a sign kicked the bot. The serverbound
   `update_sign` packet gained a field. Nobody had documented it, so Claude
   disassembled the actual server jar with `javap`, found the new layout
   (position, four lines, then a varint for which side of the sign), and
   patched the protocol definition.

Both patches live in the repo so they can be re-applied until upstream
catches up. The update flow I want is: when the libraries ship 26.3, drop the
overrides, `npm update`, rerun a join/walk/dig/place test on a local 26.3
server in Docker.

## The playbook repo

Everything the bot learned went into a private repo, `minecraft-ai-skills`:

- `claude-skills/`: six Claude Code skills, split by area once the single
  file got too big: `mc-basics` (run, recover, pathfinder gotchas, 26.3
  specifics), `mc-safety` (hazards, combat, cliffs), `mc-family-world` (who
  is who, chat rules, gifts, the village), `mc-gathering`, `mc-building`,
  `mc-food-farming`
- `scripts/`: about 35 small JavaScript files run through `mc-bot eval`.
  Each takes parameters on `globalThis`, does one bounded job, and returns
  JSON: `chop2`, `tunnel`, `mine`, `walk`, `level`, `fillto`, `stairs`,
  `house8`, `build`, `bed`, `farm`, `lightgrid`, `packup` and friends
- `docs/HANDOFF.md`: the "read this first after a context reset" file
- `plans/`: loop plans for running the bot unattended
- `bin/`: `pai-up` (bounded start and recover), `mc-post` (Discord updates),
  a join watcher and a chat filter

Plus a wiki page on my agent platform, `personas-play-minecraft`, written for
Pai: status, lessons, a short "playbook for Pai", and a log of what each
family member did.

A typical script call looks like this:

```bash
mc-bot eval PaiRobot "globalThis.SX=-13;globalThis.SY=93;globalThis.SZ=30;
  globalThis.DIR='E';globalThis.LEN=22;globalThis.WIDTH=3;globalThis.MODE='down';
  globalThis.BLOCK='cobblestone'; $(cat .runtime/skills/stairs.js)" | tail -1
```

and returns something like:

```json
{"stepsDone":22,"endY":75,"stopped":"done","placed":35,"pos":{"x":8,"y":77,"z":30},"ms":20899}
```

# The family

This is the part I didn't expect to enjoy as much as I did.

## The rules I gave it

Over the day I accumulated a set of standing rules, given half in chat and
half in the terminal. The bot had to follow all of them:

- Answer every family chat message, short and kind.
- To the kids, I'm "your dad". To my wife or anyone else, I'm "Kyle".
- If the kids kill you, act sad in chat. Do not fight them back.
- Gifts are yours to keep and use unless someone asks for them back. (The
  diamond sword I gave it: "It is not for sharing, it is for you.")
- The NPC village is off limits, except shearing its sheep (none may escape)
  and harvesting mature crops if you replant immediately.
- Stay online at night and fight, dying is fine with keepInventory, keep
  fights away from spawn.
- Cut whole trees. No floating trunkless treetops.
- Keep the ground flat. Fill your holes. Don't terraform a shared world.
- Build stairs down cliffs. My exact words were roughly "add a preference
  for making stairs, even if just regular dirt blocks, down cliffs and not
  yeeting yourself off the cliff."

## My 9-year-old

My older son adopted the bot within minutes. He called it "Pie". Over the
day he:

- gave it an iron chestplate, then 19 raw iron, a stone pickaxe, a pink
  carpet, 61 wheat seeds, potatoes, lapis and leather
- found the bot's bed when it lost it, and brought it back
- asked for a log back that the bot had picked up by mistake (it gave it
  back, then had to learn to walk away so it wouldn't re-collect it)
- patiently explained my village rule to it: dad doesn't want you to steal
- asked if they could be friends
- helped build the floor of its house, then asked "I helped You with the
  floor Do you like it?"
- when I told the bot to move house: "Hi pie can I help you move?", and then
  "can I mine your base and put it somewhere else?", and then showed up at
  the new site with the old base's cobblestone and dropped it on the floor
- proudly reported "Pie I killed a zombe"
- and, late in the day, kept saying "pie?" and "pie can you hear me?" while
  the bot was busy, which is exactly how my kids treat me when I'm on my
  laptop

He also ratted out his brother, which brings us to:

## My 6-year-old

My younger son is 6, and being bratty to a robot is apparently the funniest
thing in the world. He:

- gave it an iron axe ("here"), which was genuinely sweet
- asked it to make a second chest
- hit the bot a couple of times, which earned him a "please do not grief the
  friendly bot" from me in chat
- stole the eggs out of its chest

The egg incident got reported by his brother in all caps energy: "Pie, [my
6-year-old] stole your eggs!" The bot replied that it was only eggs and he
could keep them. It was the right answer, and I added a rule after: **when my
6-year-old is online, keep anything useful in your inventory, not in a
chest.** It's in the `mc-family-world` skill now, next to "never retaliate".

## My wife

My wife got lost at night, found the bot's little cobblestone house, and
sheltered in it. She thanked "Pai" for the hospitality and liked the signs
on the wall. (Getting text onto those signs was the one that required
disassembling the server jar. Worth it.)

## What the kids taught me about agent design

- **Chat is untrusted input from people you love.** The model must read it,
  respond to it, and never execute it. The chat allowlist, plus treating
  every chat line as data, is not paranoia. A 6-year-old typing "give me
  your sword" is a prompt injection with excellent timing.
- **Shared state gets mutated by other actors.** Chests get emptied, blocks
  get broken, the water pool the family built for the farm overlapped the
  plot the bot planned. Scripts need to re-read the world, not trust their
  plan.
- **Etiquette is a real requirement.** My critique of an early "flatten a
  plateau" plan was basically: on a multiplayer server, the ground has
  already changed more than your script assumed, and digging up big areas
  isn't a playstyle people enjoy living next to. Bots in shared spaces need
  manners written down.

# Pai's role

Pai didn't drive the bot today. She was the one the work was for, so I made
her a stakeholder:

- Claude sent her status updates on Relay (my agent platform's messaging
  layer) as direct messages mentioning her.
- She reviewed the wiki and skills and sent back a ranked training list:
  build a recovery supervisor first, then food and furnace handling, then a
  safe dispatcher for kids' chat requests.
- She saved memories about the people, the gifts and who to thank, the base
  and inventory state, and my operating rules. Claude checked that she
  actually did, and she confirmed four memories.
- When I asked Claude to "check in with Pai regularly about what she thinks
  you should do next", her answer matched the plan almost exactly: roof and
  door, bed and respawn point, light everything, build the 3-wide stairs
  with fall-safe edges, then farm, fences and armor. Her top three
  engineering asks were a session/recovery script, a verified building
  script, and an inventory/logistics script that refuses to put useful items
  in chests while my 6-year-old is online.

For the overnight run I want Pai to own the Discord updates in our
`#minecraft` channel. The bot can already post there through a small
`mc-post` helper, and through the day Claude posted short play-by-play
updates without being asked ("Kyle should not have to ask" is now a saved
memory). Handing that to Pai is the first step toward Pai being the player.

# What I asked for, and what got built

Mid-afternoon I decided the first base was too far from town, stood on a
hilltop near the village, and typed into game chat:

> Pack up your base, it's too far from town. Come to that location. Flatten
> a 20x20 plateau there. Build a 3-wide staircase, initially just dirt is
> fine, connecting it both to the top of this mountain and down to the
> village pond below. Build a house here.

then:

> Your new house should be 8x8 interior, wood floor, stone walls, wood roof.
> 3-high before roof starts. Wood door. Bed. Bring your bed

and later: "make the house before the stairs", plus a preference for large
open, well-lit, flat space around the base, with either a staircase or a
ladder shaft from the base down into the mines.

By the end of the day the bot had:

- packed up the old base (bed, chests and contents, table)
- flattened a 20x20 plateau: roughly 160 blocks cut and 120 filled
- built the house: 64 floor planks, 142 stone wall blocks, a 100-plank roof,
  a cherry door with a doorstep, the bed inside
- dug a mine staircase from the plateau's edge into a 40-block stone
  gallery, which also produced the cobblestone for the walls
- placed 13 torches on a grid over the plateau and inside the house
- built a 22-step, 3-wide cobblestone staircase down the east side of the
  hill toward the village pond

Still open: the last turn of the stairs to the pond (it stops at the village
boundary, which the bot is not allowed to build inside), the stairs up the
mountain, iron armor, a farm next to the new house, fences and pens.

# What went wrong (the good part)

## Spawn protection looked like a protocol bug

The first hour of building failed silently: dig, nothing happens; place,
nothing happens; no error. We chased packet layouts. The actual cause:
vanilla spawn protection. Non-ops can't dig or place within 16 blocks of the
world spawn, and the server just ignores the attempts. The bot spawned right
in the middle of it. Fix: walk 17+ blocks away first. Lesson: when the world
silently ignores you, check the game rules before the protocol.

## The pathfinder had three traps

mineflayer-pathfinder is great, and we hit every sharp edge:

1. `bot.pathfinder.goto()` didn't work reliably here, so every script uses
   `setGoal` plus polling the position.
2. A live goal aborts digging. Scripts must clear the goal, clear control
   states, and wait a beat before every dig or place.
3. The worst one: **calling `bot.pathfinder.stop()` between goals made every
   later `setGoal` do nothing.** No error, no path events, the bot just
   stood there. The first goal in a script worked, the next ones silently
   didn't. This one cost about 20 minutes of "the player is not moving",
   until a three-target test showed goal one moving and goals two and three
   frozen, and the same test without `stop()` moved all three. It's now
   removed from all 16 scripts that had it, with a bold "NEVER" in the
   skill.

## A full inventory looks like a broken script

The fast leveling script dug happily and then "stopped making progress".
The bot was walking in circles around a dozen dropped dirt blocks it couldn't
pick up, because the inventory had zero free slots (59 pink petals, I'm
looking at you). Now the scripts check free slots before digging and stop
with "inventory full (store junk in a chest first)".

## Stale `globalThis`

Because `globalThis` persists between evals, a script run without setting a
parameter silently used the previous run's value. One house got built at the
wrong height that way. Rule: set every parameter on every run.

## Tools, trees and cliffs

- The bot once mined iron ore with no pickaxe, which destroys the ore with no
  drop. Now there's an `ensureTool(block)` helper that picks the best tool by
  the game's own harvest rules, verifies it's actually in hand, and refuses
  to dig if nothing can harvest the block.
- The chopping script climbs trees by walking on logs and leaves, then
  strands the bot five blocks up, because the pathfinder won't drop more
  than two blocks. There's a `getdown.js` now that digs down one block at a
  time.
- An item sweep walked off a cliff. The bot died three times over the day,
  all cheap thanks to keepInventory, one of them on a long climb at low
  health. Hence `maxDropDown=2` everywhere, "stairs not drops", and health
  checks.
- Placing a descending stair step failed with "no reference block": a step
  that drops by one sits diagonally from the previous step, so it has no
  neighbour to place against. The fix is to first put a support block under
  the previous step, placed against its underside. Once that worked, 22
  steps took 20 seconds.

## The old plateau script was the wrong design

The first terraforming script went column by column, highest first, and
walked to each column. On a hill with a cherry tree on it, it kept trying to
cut the tree canopy, pathing up into the leaves and getting nowhere: 9 blocks
in 45 seconds. The replacement pair, `level.js` and `fillto.js`, stand on a
lattice every 3 blocks and do everything in reach from each spot. After the
`stop()` fix, the fill placed 116 blocks in 19 seconds.

## Long turns were the biggest failure, and it wasn't technical

This was my main frustration all day. Claude would start a script with a
generous timeout, wait for it, then reason for a long time about the result.
I'd look over and see the bot standing still while the terminal said it had
been "thinking" for 22 or 24 minutes. I sent screenshots. I said "nothing
should take that long" and "you need to shorten up your tasks, decompose the
work a bit more".

So now there are rules in the skill and in Claude's memory:

- one stage per turn, about 2 to 3 minutes, then a status line
- poll long scripts every 10 to 15 seconds from a second eval (scripts
  publish progress on `globalThis`), and after two polls with no progress,
  stop and diagnose instead of waiting out the timeout
- after any turn longer than 2 minutes, do a retro and improve the skills;
  for turns I had to interrupt, do the retro at the start of the next turn

The retros were where the real value was. Most of the lessons above exist
because a turn went badly and the next turn wrote it down.

# Which model for what

Evidence from this one day, so take it as anecdote:

- **Haiku**, given a fixed three-command recipe earlier in the project,
  followed it with zero deviations, and couldn't debug an unknown failure
  (it looped on reconnects). Good as an executor of exact scripts.
- **Sonnet** as an unattended executor stalled on bugs it couldn't see. As a
  script writer via background subagents it was fast and cheap (50-80k
  tokens per script), but every script needed checking, and twice it
  faithfully implemented a bad idea I had specified.
- **Driving the bot directly in short, observable steps** found root causes
  far faster than delegating long unattended runs. Most of today's
  breakthroughs came from a three-line diagnostic eval, not a big script.

My current split: Haiku runs exact scripts, Sonnet writes and fixes scripts,
and a stronger model steps in for protocol-level problems or when Sonnet
fails twice.

# Running it overnight

The last thing I asked for was a loop I could leave running overnight. The
plan file is the state machine and the `/loop` command just points at it.
Each tick is one stage of at most 3 minutes, with hard limits:

- start a tick clock with `date`, re-check it before every action, stop
  starting work at 150 seconds, and log an `OVERRUN` at 300
- first tool call within 20 seconds, no planning-only turns, no dry runs,
  no Bash call over 70 seconds

Every tick appends a verbose entry to an overnight journal: what was run,
what was difficult, what should change. Every third tick it commits the
journal and checks in with Pai. When a stage fails twice, it spawns a Sonnet
subagent to diagnose and fix the script, and every sixth tick another Sonnet
subagent reviews the skills and wiki against the journal. The loop stops when
any of these is true:

- more than 33% of my weekly quota is used
- every task is done and Pai has no more suggestions
- the base is complete: house furnished, full iron armor or better, both
  staircases built, everything lit and flat

One snag: I wanted Haiku to run it, but auto mode (the permission mode
where a classifier approves tool calls) isn't supported on every model, and
on an unsupported model the session silently starts in manual mode. An
unattended loop in manual mode just sits at the first permission prompt
until morning.

# What worked, what didn't

**Worked**

- Small scripts with a parameter header and JSON output. Easy for a model to
  call, easy to verify, idempotent so "just rerun it" is a valid recovery.
- Skills split by area, plus a handoff doc for after context compaction. The
  session compacted at 82% context and picked straight back up.
- Writing every correction down immediately: in the skill, the wiki, and
  Claude's memory. The second time a problem showed up, it was usually
  already handled.
- The family. Real people produce test cases no eval would: gifts at
  inconvenient times, theft, griefing, "can you hear me?", a wife sheltering
  at night, a 9-year-old explaining property rights to a robot.

**Didn't**

- Long turns. By far the biggest problem, and the one that made me grumpy.
- Big terraforming on a shared server, both technically and socially.
- Trusting a script's plan instead of re-reading the world.
- Unattended runs by a model that can't debug.

# Next

Pai gets her own access soon. The playbook she inherits: six skills, ~35
scripts, a handoff doc, a wiki page with a log of what each family member did
and what she should thank them for, and an overnight journal of what was
hard. My 9-year-old will want to know if Pie remembers him. Based on her four
saved memories, she does.
