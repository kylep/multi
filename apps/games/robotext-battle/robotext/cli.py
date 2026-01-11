"""Command-line interface for Robo Text Battle."""

from pathlib import Path
from typing import Callable, Optional

from robotext.assets import AssetRegistry, load_assets
from robotext.battle import (
    ai_plan_action,
    ai_select_weapons,
    create_battle,
    end_turn,
    execute_attack,
    execute_rest,
    get_battle_status,
    plan_attack,
    plan_rest,
    record_turn_snapshot,
    resolve_turn,
    use_consumable,
)
from robotext.models import BattleState, Consumable, Gear, Item, PlannedAction, Weapon
from robotext.shop import buy_item, can_buy, get_sell_price, list_available_items, sell_item
from robotext.state import GameState


# ANSI color codes
class Colors:
    """ANSI color codes for terminal output."""
    RESET = "\033[0m"
    BOLD = "\033[1m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    CYAN = "\033[96m"
    MAGENTA = "\033[95m"  # Purple/Magenta for money and names


def colorize(text: str, color: str) -> str:
    """Wrap text in ANSI color codes."""
    return f"{color}{text}{Colors.RESET}"


def red(text: str) -> str:
    """Make text red (for errors, damage, defeat)."""
    return colorize(text, Colors.RED)


def green(text: str) -> str:
    """Make text green (for success, victory)."""
    return colorize(text, Colors.GREEN)


def yellow(text: str) -> str:
    """Make text yellow."""
    return colorize(text, Colors.YELLOW)


def bold_yellow(text: str) -> str:
    """Make text bold and yellow (for turn headers, section headers)."""
    return colorize(text, Colors.BOLD + Colors.YELLOW)


def cyan(text: str) -> str:
    """Make text cyan (for health/energy stats)."""
    return colorize(text, Colors.CYAN)


def purple(text: str) -> str:
    """Make text purple/magenta (for money amounts, robot names)."""
    return colorize(text, Colors.MAGENTA)


def clear_screen() -> str:
    """Return ANSI escape code to clear screen and move cursor to top."""
    return "\033[2J\033[H"


# Box drawing characters
BOX_H = "═"  # Horizontal line
BOX_V = "║"  # Vertical line
BOX_TL = "╔"  # Top-left corner
BOX_TR = "╗"  # Top-right corner
BOX_BL = "╚"  # Bottom-left corner
BOX_BR = "╝"  # Bottom-right corner
BOX_LIGHT_H = "─"  # Light horizontal line


def make_header(text: str, width: int = 40) -> str:
    """Create a centered header with box drawing characters."""
    padding = width - len(text) - 2
    left_pad = padding // 2
    right_pad = padding - left_pad
    return f"{BOX_H * left_pad} {text} {BOX_H * right_pad}"


def make_separator(width: int = 40) -> str:
    """Create a horizontal separator line."""
    return BOX_LIGHT_H * width


def make_hp_bar(current: int, maximum: int, width: int = 20) -> str:
    """Create a visual HP bar like [████████░░] 80%"""
    if maximum == 0:
        percent = 0
    else:
        percent = int((current / maximum) * 100)
    filled = int((current / maximum) * width) if maximum > 0 else 0
    empty = width - filled
    bar = "█" * filled + "░" * empty
    return f"[{bar}] {percent}%"


# ASCII symbols for stats
ICON_HEALTH = "♥"
ICON_ENERGY = "⚡"
ICON_DEFENCE = "🛡"
ICON_ATTACK = "⚔"


class CLI:
    """Interactive command-line interface for the game."""

    def __init__(
        self,
        state: GameState,
        input_fn: Callable[[str], str] = input,
        print_fn: Callable[[str], None] = print,
        use_colors: bool = True,
    ):
        self.state = state
        self.input_fn = input_fn
        self.print_fn = print_fn
        self.use_colors = use_colors
        self.shown_ai_tip = False

    def print(self, message: str = "") -> None:
        """Print a message."""
        self.print_fn(message)

    def clear(self) -> None:
        """Clear the screen."""
        if self.use_colors:
            self.print(clear_screen())

    def print_error(self, message: str) -> None:
        """Print an error message in red."""
        if self.use_colors:
            self.print(red(message))
        else:
            self.print(message)

    def print_success(self, message: str) -> None:
        """Print a success message in green."""
        if self.use_colors:
            self.print(green(message))
        else:
            self.print(message)

    def input(self, prompt: str) -> str:
        """Get input from the user."""
        return self.input_fn(prompt)

    def run(self) -> None:
        """Run the main game loop."""
        self.clear()
        if self.use_colors:
            self.print(bold_yellow("╔" + "═" * 48 + "╗"))
            self.print(bold_yellow("║" + " " * 14 + "ROBO TEXT BATTLE" + " " * 18 + "║"))
            self.print(bold_yellow("╚" + "═" * 48 + "╝"))
        else:
            self.print("=" * 50)
            self.print("  ROBO TEXT BATTLE")
            self.print("=" * 50)
        self.print()

        # Get player name
        name = self.input("Name your robot: ").strip()
        if not name:
            name = "RoboPlayer"

        self.state.create_player(name)
        if self.use_colors:
            self.print(f"\nWelcome, {purple(name)}!")
        else:
            self.print(f"\nWelcome, {name}!")
        self.show_robot_stats()

        # Main game loop
        while True:
            self.clear()
            self.print()
            self.print("What would you like to do?")
            if self.use_colors:
                self.print(f"{yellow('1.')} Fight")
            else:
                self.print("1. Fight")
            self.print("2. Shop")
            self.print("3. Inspect Robot")
            self.print("4. Quit")

            choice = self.input("[1]> ").strip()
            if not choice:
                choice = "1"  # Default to Fight

            if choice == "1":
                self.fight_menu()
            elif choice == "2":
                self.shop_menu()
            elif choice == "3":
                self.show_robot_stats()
                self.input("\nPress Enter to continue...")
            elif choice == "4":
                self.print("\nThanks for playing!")
                break
            else:
                self.print_error("Invalid choice. Please enter 1-4.")

    def show_robot_stats(self) -> None:
        """Display the player's robot stats."""
        player = self.state.get_player()
        self.print()
        name_display = purple(player.name) if self.use_colors else player.name
        money_display = purple(f"${player.money}") if self.use_colors else f"${player.money}"
        health_display = cyan(f"{player.health}/{player.get_effective_max_health()}") if self.use_colors else f"{player.health}/{player.get_effective_max_health()}"
        energy_display = cyan(f"{player.energy}/{player.get_effective_max_energy()}") if self.use_colors else f"{player.energy}/{player.get_effective_max_energy()}"
        
        self.print(f"=== {name_display} ===")
        self.print(f"Level: {player.level} (Exp: {player.exp}/10)")
        self.print(f"Health: {health_display}")
        self.print(f"Energy: {energy_display}")
        self.print(f"Defence: {player.get_effective_defence()}")
        self.print(f"Attack: {player.get_effective_attack()}%")
        self.print(f"Hands: {player.get_effective_hands()}")
        self.print(f"Dodge: {player.get_effective_dodge()}")
        self.print(f"Money: {money_display}")
        self.print(f"Wins: {player.wins} / Fights: {player.fights}")
        self.print(f"Inventory: {len(player.inventory)}/{player.inventory_size}")

        if player.inventory:
            self.print("\nInventory:")
            for i, item in enumerate(player.inventory, 1):
                self.print(f"  {i}. {item.name}")

    def _shop_header(self) -> None:
        """Display the shop header with money and inventory info."""
        player = self.state.get_player()
        header = bold_yellow("=== SHOP ===") if self.use_colors else "=== SHOP ==="
        money_display = purple(f"${player.money}") if self.use_colors else f"${player.money}"
        self.print(header)
        self.print(f"Level: {player.level} | Money: {money_display} | Inventory: {len(player.inventory)}/{player.inventory_size}")
        self.print()

    def shop_menu(self) -> None:
        """Display and handle the shop menu."""
        player = self.state.get_player()

        while True:
            # Sync health/energy to max when in shop (auto-heal)
            player.health = player.get_effective_max_health()
            player.energy = player.get_effective_max_energy()

            self.clear()
            self.print()
            self._shop_header()

            self.print("1. Buy")
            self.print("2. Sell")
            self.print("3. Inventory")
            self.print("4. Back")
            self.print()

            choice = self.input("> ").strip().lower()

            if choice in ("4", "b", "back"):
                break
            elif choice == "1":
                self._shop_buy_menu()
            elif choice == "2":
                self._shop_sell_menu()
            elif choice in ("3", "i"):
                self.show_robot_stats()
                self.input("\nPress Enter to continue...")
            else:
                self.print_error("Invalid choice. Enter 1-4.")

    def _shop_buy_menu(self) -> None:
        """Display and handle the buy sub-menu."""
        player = self.state.get_player()

        while True:
            self.clear()
            self.print()
            buy_header = bold_yellow("=== BUY ===") if self.use_colors else "=== BUY ==="
            money_display = purple(f"${player.money}") if self.use_colors else f"${player.money}"
            self.print(buy_header)
            self.print(f"Level: {player.level} | Money: {money_display} | Inventory: {len(player.inventory)}/{player.inventory_size}")
            self.print()

            self.print("B. Back")
            available = list_available_items(self.state)
            for i, item in enumerate(available, 1):
                can, reason = can_buy(self.state, item)
                status = "" if can else f" ({reason})"
                price_display = purple(f"${item.money_cost}") if self.use_colors else f"${item.money_cost}"
                self.print(f"{i}. {item.name} - {price_display}{status}")

            self.print()
            choice = self.input("> ").strip().lower()

            if choice in ("b", "back"):
                break

            # Check for "show" prefix (e.g., "s1" or "show 1")
            if choice.startswith("s") or choice.startswith("show"):
                num_str = choice.lstrip("show").lstrip("s").strip()
                if num_str.isdigit():
                    self.show_item(num_str, available)
                    self.input("\nPress Enter to continue...")
                    continue

            try:
                num = int(choice)
                if 1 <= num <= len(available):
                    item = available[num - 1]
                    result = buy_item(self.state, item)
                    if result.success:
                        self.print_success(result.message)
                    else:
                        self.print_error(result.message)
                    self.input("\nPress Enter to continue...")
                else:
                    self.print_error("Invalid item number.")
            except ValueError:
                self.print_error("Enter a number to buy, or B to go back.")

    def _shop_sell_menu(self) -> None:
        """Display and handle the sell sub-menu."""
        player = self.state.get_player()

        while True:
            self.clear()
            self.print()
            sell_header = bold_yellow("=== SELL ===") if self.use_colors else "=== SELL ==="
            money_display = purple(f"${player.money}") if self.use_colors else f"${player.money}"
            self.print(sell_header)
            self.print(f"Level: {player.level} | Money: {money_display} | Inventory: {len(player.inventory)}/{player.inventory_size}")
            self.print()

            self.print("B. Back")
            if player.inventory:
                for i, item in enumerate(player.inventory, 1):
                    sell_price = get_sell_price(item)
                    price_display = purple(f"${sell_price}") if self.use_colors else f"${sell_price}"
                    self.print(f"{i}. {item.name} - {price_display}")
            else:
                self.print("(No items to sell)")

            self.print()
            choice = self.input("> ").strip().lower()

            if choice in ("b", "back"):
                break

            if not player.inventory:
                self.print_error("No items to sell.")
                continue

            try:
                num = int(choice)
                if 1 <= num <= len(player.inventory):
                    item = player.inventory[num - 1]
                    result = sell_item(self.state, item)
                    if result.success:
                        self.print_success(result.message)
                    else:
                        self.print_error(result.message)
                    self.input("\nPress Enter to continue...")
                else:
                    self.print_error("Invalid item number.")
            except ValueError:
                self.print_error("Enter a number to sell, or B to go back.")

    def show_item(self, num_str: str, available: list[Item]) -> None:
        """Show details of an item."""
        try:
            num = int(num_str)
            if 1 <= num <= len(available):
                item = available[num - 1]
                self.print()
                self.print(f"=== {item.name} ===")
                self.print(f"Level: {item.level}")
                self.print(f"Cost: ${item.money_cost}")
                self.print(f"Description: {item.description}")

                if isinstance(item, Weapon):
                    self.print(f"Damage: {item.damage}")
                    self.print(f"Energy Cost: {item.energy_cost}")
                    self.print(f"Accuracy: {item.accuracy}")
                    self.print(f"Hands: {item.hands}")
                    if item.requirements:
                        self.print(f"Requires: {', '.join(item.requirements)}")
                    self.print("Effects: None")

                elif isinstance(item, Gear):
                    if item.requirements:
                        self.print(f"Requires: {', '.join(item.requirements)}")
                    effects = self._get_gear_effects(item)
                    self.print(f"Effects: {effects}")

                elif isinstance(item, Consumable):
                    effects = self._get_consumable_effects(item)
                    self.print(f"Effects: {effects}")

            else:
                self.print_error("Invalid item number.")
        except ValueError:
            self.print_error("Please enter a number.")

    def _get_gear_effects(self, gear: Gear) -> str:
        """Get a string describing gear effects."""
        effects = []
        if gear.health_bonus:
            effects.append(f"+{gear.health_bonus} Health")
        if gear.energy_bonus:
            effects.append(f"+{gear.energy_bonus} Energy")
        if gear.defence_bonus:
            effects.append(f"+{gear.defence_bonus} Defence")
        if gear.attack_bonus:
            effects.append(f"+{gear.attack_bonus}% Attack")
        if gear.hands_bonus:
            effects.append(f"+{gear.hands_bonus} Hand{'s' if gear.hands_bonus > 1 else ''}")
        if gear.dodge_bonus:
            effects.append(f"+{gear.dodge_bonus} Dodge")
        if gear.money_bonus_percent:
            effects.append(f"+{gear.money_bonus_percent}% Money on win")
        return ", ".join(effects) if effects else "None"

    def _get_consumable_effects(self, consumable: Consumable) -> str:
        """Get a string describing consumable effects."""
        effects = []
        if consumable.health_restore:
            effects.append(f"+{consumable.health_restore} Health")
        if consumable.energy_restore:
            effects.append(f"+{consumable.energy_restore} Energy")
        if consumable.temp_defence:
            effects.append(f"+{consumable.temp_defence} Temp Defence")
        if consumable.temp_attack:
            effects.append(f"+{consumable.temp_attack}% Temp Attack")
        if consumable.damage:
            effects.append(f"{consumable.damage} Damage to enemy")
        if consumable.enemy_dodge_reduction:
            effects.append(f"-{consumable.enemy_dodge_reduction} Enemy Dodge")
        return ", ".join(effects) if effects else "None"

    def fight_menu(self) -> None:
        """Display and handle the fight menu."""
        enemies = list(self.state.registry.enemies.keys())

        if not enemies:
            self.print_error("No enemies available to fight!")
            return

        # Find default opponent (highest level <= player level)
        player_level = self.state.get_player().level
        default_idx = 1
        for i, enemy_name in enumerate(enemies, 1):
            enemy = self.state.registry.enemies[enemy_name]
            if enemy.level <= player_level:
                default_idx = i

        self.print()
        header = bold_yellow("=== CHOOSE YOUR OPPONENT ===") if self.use_colors else "=== CHOOSE YOUR OPPONENT ==="
        self.print(header)
        for i, enemy_name in enumerate(enemies, 1):
            enemy = self.state.registry.enemies[enemy_name]
            name_display = purple(enemy_name) if self.use_colors else enemy_name
            money_display = purple(f"${enemy.reward}") if self.use_colors else f"${enemy.reward}"
            # Highlight default opponent number in yellow
            if i == default_idx and self.use_colors:
                num_display = yellow(f"{i}.")
            else:
                num_display = f"{i}."
            self.print(f"{num_display} {name_display} (Level {enemy.level}) - Reward: {money_display}, {enemy.exp_reward} exp")
            self.print(f"   {enemy.description}")

        self.print()
        choice = self.input(f"[{default_idx}]> ").strip()

        if choice.lower() in ("back", "b"):
            return

        # Default to level-appropriate enemy if empty
        if not choice:
            choice = str(default_idx)

        try:
            num = int(choice)
            if 1 <= num <= len(enemies):
                enemy_name = enemies[num - 1]
                self.start_battle(enemy_name)
            else:
                self.print_error("Invalid choice.")
        except ValueError:
            self.print_error("Please enter a number.")

    def start_battle(self, enemy_name: str) -> None:
        """Start a battle with the specified enemy."""
        player = self.state.get_player()
        enemy_def = self.state.registry.enemies[enemy_name]
        enemy_robot = self.state.registry.create_enemy_robot(enemy_name)

        if not enemy_robot:
            self.print_error("Error creating enemy!")
            return

        self.print()
        # Fight number is current fights + 1 (will be incremented after battle)
        fight_number = player.fights + 1
        
        battle = create_battle(player, enemy_robot, fight_number=fight_number)

        # Show battle start message
        for msg in battle.battle_log:
            self.print(msg)

        # Battle loop - simultaneous turns
        while battle.winner is None:
            self.clear()
            self.print()
            self.print(self._colorize_battle_status(get_battle_status(battle, use_fancy=self.use_colors)))
            self.print()

            # 1. Player picks action
            surrendered = self.player_turn(battle)
            if battle.winner:
                break  # Surrender, consumable, or other end condition

            # 2. Enemy AI picks action
            enemy_action = ai_plan_action(battle, is_player=False)
            battle.enemy_action = enemy_action

            # 3. Resolve turn (random order)
            import random
            rng = random.Random()
            results = resolve_turn(battle, rng)

            # 4. Display what happened
            self.print()
            self.print(bold_yellow("──── Turn Resolution ────") if self.use_colors else "--- Turn Resolution ---")
            for actor, result in results:
                if battle.winner:
                    break
            
            # Show the current turn log
            for msg in battle.current_turn_log:
                if "attacks!" in msg:
                    self.print(msg)
                elif "hits for" in msg:
                    if self.use_colors:
                        self.print(red(msg))
                    else:
                        self.print(msg)
                elif "misses!" in msg:
                    self.print(msg)
                elif "rests" in msg or "uses" in msg:
                    self.print(msg)
                elif "destroyed" in msg:
                    self.print(msg)

            # 5. End turn
            if battle.winner is None:
                end_turn(battle)

        # Battle ended - record final turn snapshot
        record_turn_snapshot(battle)
        
        self.print()
        if battle.winner == "player":
            self.print_success("*** VICTORY! ***")
            self._show_battle_summary(battle)
            self.state.record_fight(won=True)

            # Award both XP and money
            self.print()
            rewards_header = bold_yellow("── Rewards ──") if self.use_colors else "-- Rewards --"
            self.print(rewards_header)
            
            # Award and display XP
            leveled_up = self.state.award_exp(enemy_def.exp_reward)
            self.print_success(f"+{enemy_def.exp_reward} exp")
            
            # Award and display money with bonus
            bonus_percent = player.get_money_bonus_percent()
            base_money = enemy_def.reward
            actual_money = self.state.award_money(base_money)
            if bonus_percent > 0:
                bonus_amount = actual_money - base_money
                if self.use_colors:
                    self.print_success(f"+{purple(f'${base_money}')} (+${bonus_amount} bonus) = {purple(f'${actual_money}')}")
                else:
                    self.print_success(f"+${base_money} (+${bonus_amount} bonus) = ${actual_money}")
            else:
                money_display = purple(f"${actual_money}") if self.use_colors else f"${actual_money}"
                self.print_success(f"+{money_display}")
            
            # Show level up if applicable
            if leveled_up:
                self.print()
                self.print_success(f"*** LEVEL UP! You are now level {player.level}! ***")
            
            # Show robot stats
            self.print()
            robot_header = bold_yellow("── Your Robot ──") if self.use_colors else "-- Your Robot --"
            self.print(robot_header)
            self.show_robot_stats()
            
            self.input("\nPress Enter to continue...")
        else:
            # Check if it was a surrender (player still alive) or actual defeat
            if battle.player.is_alive():
                self.print(yellow("*** SURRENDERED ***") if self.use_colors else "*** SURRENDERED ***")
                self.print("You retreated from battle. No rewards earned.")
            else:
                self.print_error("*** DEFEAT ***")
                self._show_battle_summary(battle)
                self.print("Your robot was destroyed... but it's been rebuilt!")
            self.state.record_fight(won=False)

        # Reset player health/energy after battle
        player.health = player.get_effective_max_health()
        player.energy = player.get_effective_max_energy()

    def _show_battle_summary(self, battle: BattleState) -> None:
        """Display a turn-by-turn summary of the battle."""
        if not battle.turn_history:
            return
        
        self.print()
        header = bold_yellow("── Battle Summary ──") if self.use_colors else "-- Battle Summary --"
        self.print(header)
        
        player_name = battle.player.robot.name
        enemy_name = battle.enemy.robot.name
        
        for snapshot in battle.turn_history:
            player_hp = f"{snapshot.player_hp}/{snapshot.player_max_hp}"
            enemy_hp = f"{snapshot.enemy_hp}/{snapshot.enemy_max_hp}"
            
            if self.use_colors:
                line = f"Turn {snapshot.turn}: {purple(player_name)} {cyan(player_hp)}, {purple(enemy_name)} {cyan(enemy_hp)}"
            else:
                line = f"Turn {snapshot.turn}: {player_name} {player_hp}, {enemy_name} {enemy_hp}"
            self.print(line)

    def _colorize_battle_status(self, status: str) -> str:
        """Add colors to battle status."""
        if not self.use_colors:
            return status

        lines = status.split("\n")
        result = []
        for line in lines:
            if line.startswith("╔") or line.startswith("╚"):
                result.append(bold_yellow(line))
            elif line.startswith("║") and "FIGHT" in line:
                result.append(bold_yellow(line))
            elif line.startswith("═") or line.startswith("=== Turn") or "TURN" in line:
                result.append(bold_yellow(line))
            elif line.startswith("────") or line.startswith("──── Last"):
                result.append(yellow(line))
            elif "Health:" in line:
                result.append(cyan(line))
            elif "Energy:" in line:
                result.append(yellow(line))
            elif "(You)" in line or "(Enemy)" in line:
                # Color robot names in purple
                result.append(purple(line))
            elif "hits for" in line:
                result.append(red(line))
            else:
                result.append(line)
        return "\n".join(result)

    def player_turn(self, battle: BattleState) -> bool:
        """Handle the player's turn - plan an action.
        
        Returns True if player surrendered.
        """
        player = battle.player
        
        # Show one-time AI tip
        if not self.shown_ai_tip:
            tip = cyan("TIP: You can just hit Enter to let the AI pick your move") if self.use_colors else "TIP: You can just hit Enter to let the AI pick your move"
            self.print(tip)
            self.print()
            self.shown_ai_tip = True
        
        # Get AI suggestion for default
        suggested_action = ai_plan_action(battle, is_player=True)
        
        # Determine default choice based on AI suggestion
        if suggested_action.action_type == "attack":
            default_choice = "1"
        elif suggested_action.action_type == "consumable":
            default_choice = "2"
        else:
            default_choice = "3"

        while True:
            self.print("Choose your action:")
            self.print("1. Attack")
            self.print("2. Use Item")
            self.print("3. Rest")
            self.print("4. Surrender (q)")

            choice = self.input(f"[{default_choice}]> ").strip().lower()
            
            # Use default if empty
            if not choice:
                choice = default_choice

            # Check for surrender shortcuts
            if choice in ("4", "q", "quit", "surrender", "forfeit", "give up"):
                if self.confirm_surrender():
                    battle.winner = "enemy"
                    return True  # Signal surrender
                continue

            if choice == "1":
                if self.player_plan_attack(battle, suggested_action):
                    break
            elif choice == "2":
                # Using items executes immediately (before main action resolution)
                self.player_use_item(battle)
                if battle.winner:
                    break
                # After using item, still need to pick main action
                # Recalculate suggestion after using item
                suggested_action = ai_plan_action(battle, is_player=True)
                if suggested_action.action_type == "attack":
                    default_choice = "1"
                else:
                    default_choice = "3"
            elif choice == "3":
                result = plan_rest(battle, is_player=True)
                self.print("You prepare to rest...")
                break
            else:
                self.print_error("Invalid choice. Enter 1, 2, 3, or 4 (q to quit).")
        
        return False  # Did not surrender

    def confirm_surrender(self) -> bool:
        """Ask for confirmation before surrendering. Returns True if confirmed."""
        self.print()
        choice = self.input("Are you sure you want to surrender? (y/n) ").strip().lower()
        return choice in ("y", "yes")

    def player_plan_attack(self, battle: BattleState, suggested_action: PlannedAction | None = None) -> bool:
        """Handle player attack planning. Returns True if action was planned."""
        player = battle.player
        weapons = player.robot.get_weapons()

        if not weapons:
            self.print_error("You have no weapons!")
            return False

        self.print()
        self.print("Select weapons to attack with:")
        for i, weapon in enumerate(weapons, 1):
            can_use = True
            notes = []
            if weapon.energy_cost > player.current_energy:
                notes.append("not enough energy")
                can_use = False
            for req in weapon.requirements:
                if not player.robot.has_item(req):
                    notes.append(f"needs {req}")
                    can_use = False
            status = f" ({', '.join(notes)})" if notes else ""
            self.print(f"  {i}. {weapon.name} - {weapon.damage} dmg, {weapon.hands}h, {weapon.energy_cost} energy{status}")

        self.print()
        self.print(f"Available hands: {player.robot.get_effective_hands()}")
        
        # Calculate default weapon selection from AI suggestion
        default_indices = []
        if suggested_action and suggested_action.action_type == "attack" and suggested_action.weapons:
            # Map suggested weapons to indices
            for suggested_weapon in suggested_action.weapons:
                for i, weapon in enumerate(weapons, 1):
                    if weapon is suggested_weapon and i not in default_indices:
                        default_indices.append(i)
                        break
        
        default_str = ",".join(str(i) for i in default_indices) if default_indices else ""
        
        self.print("Enter weapon numbers separated by commas (e.g., '1,2'), or 'back':")

        if default_str:
            choice = self.input(f"[{default_str}]> ").strip()
        else:
            choice = self.input("> ").strip()

        if choice.lower() == "back":
            return False
        
        # Use default if empty
        if not choice and default_str:
            choice = default_str

        try:
            indices = [int(x.strip()) for x in choice.split(",")]
            selected_weapons = []
            weapon_indices = []
            for idx in indices:
                if 1 <= idx <= len(weapons):
                    selected_weapons.append(weapons[idx - 1])
                    weapon_indices.append(idx)
                else:
                    self.print_error(f"Invalid weapon number: {idx}")
                    return False

            # Check for duplicate weapon indices
            if len(weapon_indices) != len(set(weapon_indices)):
                self.print_error("You can only use each weapon once per attack")
                return False

            # Plan the attack (validate but don't execute)
            result = plan_attack(battle, selected_weapons, is_player=True)

            if not result.success:
                self.print_error(result.message)
                return False

            self.print(f"You prepare to attack with {', '.join(w.name for w in selected_weapons)}...")
            return True

        except ValueError:
            self.print_error("Please enter numbers separated by commas.")
            return False

    def player_use_item(self, battle: BattleState) -> None:
        """Handle player using a consumable."""
        player = battle.player
        consumables = [c for c in player.robot.get_consumables() 
                       if c.name not in player.consumables_used]

        if not consumables:
            self.print_error("You have no usable consumables!")
            return

        self.print()
        self.print("Select a consumable to use:")
        for i, consumable in enumerate(consumables, 1):
            self.print(f"  {i}. {consumable.name} - {consumable.description}")

        self.print("Enter number, or 'back':")
        choice = self.input("> ").strip()

        if choice.lower() == "back":
            return

        try:
            idx = int(choice)
            if 1 <= idx <= len(consumables):
                consumable = consumables[idx - 1]
                result = use_consumable(battle, consumable)
                if result.success:
                    self.print_success(result.message)
                else:
                    self.print_error(result.message)
            else:
                self.print_error("Invalid number.")
        except ValueError:
            self.print_error("Please enter a number.")



def create_game(assets_dir: Path | None = None) -> GameState:
    """Create a new game with loaded assets."""
    if assets_dir is None:
        # Default to assets directory relative to this file
        assets_dir = Path(__file__).parent.parent / "assets"

    registry = load_assets(assets_dir)
    return GameState(registry=registry)


def main() -> None:
    """Main entry point for the game."""
    state = create_game()
    cli = CLI(state)
    cli.run()


if __name__ == "__main__":
    main()
