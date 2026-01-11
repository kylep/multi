# Game Design: Robo Text Battle

## Game Mechanics

### Robot Stats

Any robot has the following stats
- Health: Hit points, if this gets to 0 the robot is destroyed
  - Default Value: 10
- Energy: The robot uses this to move and power items. If this is 0 the robot cannot move or act.
  - Default Value: 20
- Defence: Subtracts from the damage dealt to the robot 
  - Default Value: 0
- Attack: Percentage multiplier for weapon damage. Attack 10 means your attacks deal 10% more damage.
  - Default Value: 0
  - Formula: damage = base_damage * (1 + attack/100) - defence
- Hands: Number of arms or hands that the robot has. A 3 armed robot could use a 2h weapon + a 1h weapon in one turn.
  - Default Value: 2
- Dodge: Chance of taking 0 damage from an attack
  - Default Value: 0
- Level: Robots can use stronger items from the shop depending on their level
  - Default Value: 0
- Exp: Robots gain exp when they fight. Exp is used to level up. 
  - 10 exp required per level
- Inventory Size: How many items the robot can hold total across Weapons, Gear, Consumables
  - 4
- Money: Total money
- Wins: Tracking of how many fights were won
- Fights: Tracking of how many fights were lost


### How Battles Work

- Two robots initiate a battle in a hypothetical "arena"
- Both robots choose their actions simultaneously each turn
- Actions are then resolved in random order

On each turn:
1. Player selects their action (with AI-suggested defaults shown in brackets)
2. Enemy AI selects its action
3. Both actions are resolved in random order
4. Results are displayed showing what each robot did

Actions:
- Attack: Using weapons across the hands. If a robot has 4 hands, they could attack with two 1h weapons and 1 2h weapon, for example.
  - Each turn that the robot attacks, the player gets to choose which of the robot's weapons are used for that attack
  - Each weapon can only be used once per attack (no duplicates)
- Item: Consume ("Eat") or use an item that grants temporary stats for this battle such as health, energy, defense, hands, etc
- Rest: The robot does nothing, and passively regenerates some energy. Items can improve resting.

Each action may cost energy to perform. Any weapon or item has an energy cost of 0 or higher required to use. If the robot has no energy, they must rest. 

### Items

Every robot has an inventory of items, which starts out empty. 
There is a maximum inventory size that can be expanded with other items.

#### Shop Phase
- Before a battle, both players get to shop. 
- The shop will list all available items in the game every time
- Items can be purchased more than once, no limit
- Items have level restrictions. Players can only buy items their robot is high enough level for.
- Items can be sold back to the shop for half of what you paid
- Items cannot be purchased if your inventory is full, but you can sell during the shop phase to make space
- Items can only be purchased if you have enough Money for them, and your Money is updated immediately upon purchase
- Robots are automatically healed to full health/energy while in the shop


## Items Glossary

### Weapons

#### Stick
Level: 0
Damage: 1
Money Cost: 10
Energy Cost: 1
Effects: None
Accuracy: 80
Hands: 1
Requirements: None
Description: It's just a stick. Hard to use and not very strong.

#### Sword
Level: 2
Damage: 10
Money Cost: 50
Energy Cost: 5
Effects: None
Accuracy: 100
Hands: 2
Requirements: None
Description: Metal single-edged longsword with a sharp blade. 

#### Sawed-off Shotgun
Level: 5
Damage: 15
Money Cost: 100
Energy Cost: 0
Effects: None
Accuracy: 150
Hands: 1
Requirements: 1 Shotgun Shell
Description: A small guage shotgun. Loud!

#### Flame Thrower
Level: 5
Damage: 10
Money Cost: 150
Energy Cost: 0
Effects: None
Accuracy: 90
Hands: 2
Requirements: None
Description: Fire hot

#### Shock Rod
Level: 3
Damage: 5
Money Cost: 40
Energy Cost: 3
Effects: None
Accuracy: 95
Hands: 1
Requirements: None
Description: An electrified rod that delivers a shocking blow. Zap!

#### Lightsabre
Level: 10
Damage: 30
Money Cost: 1000
Energy Cost: 20
Effects: None
Accuracy: 90
Hands: 2
Requirements: 1 Shotgun Shell
Description: A laser sword. Very expensive! Bzzzzt.

### Gear

Gear does not stack - you can not have more than one of each.

#### Shotgun Shell
Level: 5
Money Cost: 30
Requirements: None
Effects: None
Description: Allows you to fire a Shotgun weapon once. Consumed when fired.

#### Cardboard Armor
Level: 0
Money Cost: 10
Effects: +5 Health
Requirements: None
Description: Cheapest possible armor for a robot. Even a stick could break it.

#### Third Arm
Level: 2
Money Cost: 150
Effects: +1 Hand
Requirements: None
Description: More hands, more weapons

#### Fourth Arm
Level: 5
Money Cost: 250
Effects: +1 Hand
Requirements: Third Arm
Description: Even more arms, even more weapons

#### Fifth Arm
Level: 5
Money Cost: 350
Effects: +1 Hand
Requirements: Fourth Arm
Description: This is just silly. Who needs 5 arms?

#### Gold Computer Chip
Level: 3
Money Cost: 40
Effects: +1 Defence
Requirements: None
Description: A computer chip that teaches the robot how to defend itself. Protect the face!

#### Small Computer Chip
Level: 3
Money Cost: 40
Effects: +10 Dodge
Requirements: None
Description: A computer chip that teaches the robot how to dodge. If you can dodge a wrench...

#### Power Chip
Level: 3
Money Cost: 60
Effects: +10% Attack
Requirements: None
Description: A computer chip that boosts attack power. Your attacks deal 10% more damage!

#### Money Maker
Level: 0
Money Cost: 100
Effects: +20% Money Prize on win
Requirements: None
Description: Earn more money from winning. It takes money to make money!

#### Propeller
Level: 1
Money Cost: 50
Effects: +10 Dodge
Requirements: None

#### Small Battery
Level: 1
Money Cost: 50
Effects: +5 Energy
Requirements: None

#### Medium Battery
Level: 4
Money Cost: 150
Effects: +20 Energy
Requirements: None

#### Big Battery
Level: 7
Money Cost: 350
Effects: +25 Energy
Requirements: None


### Consumables

#### Repair Kit
Level: 2
Money Cost: 30
Requirements: Health below 100%
Effects: Grant 10 temporary Health
Description: Repairs the robot. Can even leave it stronger than it started (for one battle).


#### Grenade
Level: 8
Money Cost: 100
Requirements: None
Description: A small bomb you can launched at the enemy.
Effects: Deal 30 damage to the enemy

#### Throwing Net
Level: 4
Money Cost: 100
Requirements: None
Description: It's a net. You throw it. Destroys the net.
Effects: -30 Dodge to the enemy



## Static Enemies

The game can have pre-designed enemies to battle. 

### MiniBot
Level: 1
Weapons: Stick
Gear: Cardboard Armor, Propeller
Consumables: None
Money Reward: $50
Exp Reward: 1
Description: A shoebox sized cardboard box robot with a stick and propeller. He's gonna whack you!

### Sparky
Level: 3
Weapons: Shock Rod
Gear: Small Battery, Small Computer Chip
Consumables: None
Money Reward: $80
Exp Reward: 3
Description: A hyperactive robot that crackles with electricity. Zap zap!

### Firebot
Level: 5
Weapons: Flame Thrower
Gear: Gold Computer Chip
Consumables: None
Money Reward: $150
Exp Reward: 5
Description: A shiny robot with a flame thrower. 



## Gameplay

### Start the Game
When the game launches, the player is presented with a text field and a prompt to "Name your robot:".
The player submits their name.

The player's robot stats are printed to the screen. By default, these are just the starting stats.
The player starts at level 0 with 100 money.

The player is prompted with options:
1. Fight
2. Shop
3. Inspect Robot
4. Quit

### Shopping
When the shop is opened, the player sees a menu-driven interface:

#### Main Shop Menu
```
=== SHOP ===
Level: 0 | Money: $100 | Inventory: 1/6

1. Buy
2. Sell
3. Inventory
4. Back
```

#### Buy Sub-Menu
Shows available items at the player's level. Enter a number to buy, or B to go back.
```
=== BUY ===
Level: 0 | Money: $100 | Inventory: 1/6

B. Back
1. Stick - $5
2. Cardboard Armor - $10
3. Small Battery - $50 (Requires level 1)
```

You can also type `s1` or `show 1` to see item details before buying.

#### Sell Sub-Menu
Shows inventory items with their sell prices (half of buy price). Enter a number to sell, or B to go back.
```
=== SELL ===
Level: 0 | Money: $100 | Inventory: 1/6

B. Back
1. Stick - $2
2. Cardboard Armor - $5
```

#### Buying Rules
When buying an item, the following are checked in order:
- Money (must have enough)
- Inventory Space (must have room)
- Level (item level must be ≤ player level)
- Requirements (must own required items)
- Gear Stacking (can't own duplicate gear)

Each purchased item is a unique instance, so you can buy multiple copies of the same weapon.

#### Selling
Selling returns half the item's buy price. The item is removed from inventory.


### Battling
If the player selects that they want to battle, let them choose from the configured Static Enemies. Example:

#### Opponent Selection

Choose your opponent
1. Minibot
2. Firebot

#### Simultaneous Turns
Both robots choose their actions at the same time. The order in which actions resolve is random each turn.

#### Turn Mechanism
Each turn:
1. Battle status is displayed (health bars, energy, last turn's combat log)
2. Player chooses an action:
   - `1` Attack
   - `2` Use Item
   - `3` Rest
   - `4` Surrender (or `q` to quit)
3. AI-suggested defaults shown in brackets: `[1]>` - press Enter to accept
4. Enemy AI chooses its action
5. Both actions resolve in random order
6. Results are displayed

Using a consumable item executes immediately and doesn't end your turn - you still pick a main action (attack or rest).

#### AI-Suggested Defaults
The game suggests optimal actions based on the current situation:
- When attacking, suggested weapons are shown: `[1]>` or `[1,2]>`
- Player can press Enter to accept the suggestion or type their own choice
- On the first battle, a tip is shown: "TIP: You can just hit Enter to let the AI pick your move"

#### Opponent AI Logic
When the opponent plans their action, they:
- Plan to use any consumables they have
- Plan to attack if they have energy and weapons (each weapon used only once)
- Plan to rest if they have no energy or weapons

#### Attack Mechanics
When attacks "hit" they subtract from their enemy's health.
The chance to hit is (weapon accuracy - enemy dodge) / 100%
Damage formula: base_damage * (1 + attack/100) - defence

Attack log format:
```
RobotName attacks!
  Weapon 1 hits for X damage
  Weapon 2 misses!
```

Note: Each weapon can only be used once per attack. Selecting the same weapon twice (e.g., "1,1") will show an error.


#### Surrender
Players can surrender at any time during battle:
- Select option `4` from the action menu
- Or use shortcuts: `q`, `quit`, `surrender`, `forfeit`, `give up`
- A confirmation prompt appears: "Are you sure you want to surrender? (y/n)"
- If confirmed, the battle ends immediately as a loss
- No rewards are given
- The fight is recorded as a loss

#### Victory and Defeat
If the player loses (destroyed or surrendered), they go back to the main screen with no rewards.

If the player wins, they receive both rewards automatically:
- Experience: The opponent's exp reward value
- Money: The opponent's money reward value (with any bonus from Money Maker gear)

A victory summary screen is shown:
```
*** VICTORY! ***

── Battle Summary ──
Turn 1: PlayerName 15/15, MiniBot 13/15
Turn 2: PlayerName 14/15, MiniBot 11/15
Turn 3: PlayerName 13/15, MiniBot 0/15

── Rewards ──
+2 exp
+$50 (+$10 bonus) = $60

── Your Robot ──
=== PlayerName ===
Level: 0 (Exp: 2/10)
Health: 13/15
...
```

#### Leveling Up
- Each level requires 10 exp
- When a player earns enough exp, they automatically level up
- Level up message is shown on the victory screen
- Higher levels unlock access to more powerful items in the shop


## UI Features

### Visual Enhancements
- **Box drawing characters**: Unicode borders and separators (`═══`, `║`, `────`)
- **HP bars**: Visual health bars like `[████████░░░░░░░] 8/10`
- **ASCII icons**: `♥` for health, `⚡` for energy
- **Turn counter**: `════════════ TURN 3 ════════════`
- **Color coding**:
  - Purple: Money amounts, robot names
  - Red: Damage numbers, defeat messages
  - Green: Success messages, victory
  - Yellow: Turn headers, section headers
  - Cyan: Health/Energy stats

### Combat Log
- Shows what happened in the previous turn at the start of each new turn
- Attack format shows weapon slot numbers:
```
RobotName attacks!
  Weapon 1 hits for X damage
  Weapon 2 misses!
```

### Clear Screen
- Screen clears between menus and turns for cleaner display
