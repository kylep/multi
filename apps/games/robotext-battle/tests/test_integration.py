"""Integration tests for Robo Text Battle."""

import random
from pathlib import Path

import pytest

from robotext.assets import load_assets
from robotext.battle import (
    create_battle,
    end_turn,
    enemy_ai_turn,
    execute_attack,
    execute_rest,
    use_consumable,
)
from robotext.cli import CLI, create_game
from robotext.shop import buy_item, list_available_items, sell_item
from robotext.state import GameState


@pytest.fixture
def game_state():
    """Create a game state with the real assets."""
    assets_dir = Path(__file__).parent.parent / "assets"
    return create_game(assets_dir)


class TestFullGameFlow:
    """Integration tests for complete game scenarios."""

    def test_create_player_and_shop(self, game_state):
        """Test creating a player and buying items."""
        # Create player
        player = game_state.create_player("TestBot")
        assert player.name == "TestBot"
        assert player.money == 100
        assert player.level == 0  # Players start at level 0

        # List available items (level 0)
        items = list_available_items(game_state)
        item_names = [item.name for item in items]

        # Should have level 0 items only
        assert "Stick" in item_names
        assert "Cardboard Armor" in item_names
        assert "Money Maker" in item_names
        # Level 1 items should NOT be available at level 0
        assert "Propeller" not in item_names
        assert "Small Battery" not in item_names

        # Buy a stick
        stick = game_state.registry.get_item("Stick")
        result = buy_item(game_state, stick)
        assert result.success is True
        assert player.money == 90
        assert len(player.inventory) == 1

        # Buy cardboard armor
        armor = game_state.registry.get_item("Cardboard Armor")
        result = buy_item(game_state, armor)
        assert result.success is True
        assert player.money == 80
        assert player.get_effective_max_health() == 15  # 10 + 5 bonus

    def test_battle_against_minibot(self, game_state):
        """Test a complete battle against MiniBot."""
        rng = random.Random(42)

        # Create player with a sword
        player = game_state.create_player("TestBot")
        player.level = 2  # Need level 2 for sword
        player.money = 200

        sword = game_state.registry.get_item("Sword")
        buy_item(game_state, sword)

        # Create enemy
        enemy = game_state.registry.create_enemy_robot("MiniBot")
        assert enemy is not None

        # Start battle
        battle = create_battle(player, enemy, rng)

        # Fight until someone wins
        turn_count = 0
        max_turns = 50

        while battle.winner is None and turn_count < max_turns:
            if battle.player_turn:
                # Player attacks with sword
                weapons = battle.player.robot.get_weapons()
                if weapons and battle.player.current_energy >= weapons[0].energy_cost:
                    execute_attack(battle, weapons, rng)
                else:
                    execute_rest(battle)
            else:
                # Enemy AI turn
                enemy_ai_turn(battle, rng)

            if battle.winner is None:
                end_turn(battle)
            turn_count += 1

        # Battle should end
        assert battle.winner is not None
        assert turn_count < max_turns

    def test_battle_with_consumables(self, game_state):
        """Test using consumables in battle."""
        rng = random.Random(123)

        # Create player with repair kit
        player = game_state.create_player("TestBot")
        player.level = 2

        # Manually add a repair kit (normally need level 2)
        repair_kit = game_state.registry.get_item("Repair Kit")
        player.inventory.append(repair_kit)

        # Add a weapon
        stick = game_state.registry.get_item("Stick")
        player.inventory.append(stick)

        # Create enemy
        enemy = game_state.registry.create_enemy_robot("MiniBot")

        # Start battle
        battle = create_battle(player, enemy, rng)
        battle.player_turn = True

        # Damage player - max health is 10, so start at 5
        battle.player.current_health = 5

        # Use repair kit - restores 10 but capped at max health (10)
        result = use_consumable(battle, repair_kit)
        assert result.success is True
        assert battle.player.current_health == 10  # Capped at max health

        # Repair kit should be consumed
        assert repair_kit not in player.inventory

    def test_shop_sell_and_rebuy(self, game_state):
        """Test selling and rebuying items."""
        player = game_state.create_player("TestBot")

        # Buy stick
        stick = game_state.registry.get_item("Stick")
        buy_item(game_state, stick)
        assert player.money == 90

        # Sell stick (half price)
        result = sell_item(game_state, stick)
        assert result.success is True
        assert player.money == 95  # 90 + 5

        # Buy again
        stick = game_state.registry.get_item("Stick")
        result = buy_item(game_state, stick)
        assert result.success is True
        assert player.money == 85

    def test_gear_requirements_chain(self, game_state):
        """Test buying gear with requirements."""
        player = game_state.create_player("TestBot")
        player.level = 5
        player.money = 1000

        # Can't buy Fourth Arm without Third Arm
        fourth_arm = game_state.registry.get_item("Fourth Arm")
        result = buy_item(game_state, fourth_arm)
        assert result.success is False
        assert "Third Arm" in result.message

        # Buy Third Arm first
        third_arm = game_state.registry.get_item("Third Arm")
        result = buy_item(game_state, third_arm)
        assert result.success is True
        assert player.get_effective_hands() == 3

        # Now can buy Fourth Arm
        result = buy_item(game_state, fourth_arm)
        assert result.success is True
        assert player.get_effective_hands() == 4

    def test_money_bonus_from_gear(self, game_state):
        """Test that Money Maker gear increases rewards."""
        player = game_state.create_player("TestBot")

        # Buy Money Maker
        money_maker = game_state.registry.get_item("Money Maker")
        buy_item(game_state, money_maker)

        # Award money should be +20%
        actual = game_state.award_money(100)
        assert actual == 120  # 100 + 20%

    def test_full_inventory_prevents_purchase(self, game_state):
        """Test that full inventory prevents buying."""
        player = game_state.create_player("TestBot")
        player.money = 500

        # Fill inventory (size 4)
        stick = game_state.registry.get_item("Stick")
        for _ in range(4):
            result = buy_item(game_state, stick)
            # Get fresh stick each time since we're adding same reference
            stick = game_state.registry.get_item("Stick")

        assert len(player.inventory) == 4

        # Try to buy another
        result = buy_item(game_state, stick)
        assert result.success is False
        assert "full" in result.message.lower()


class TestCLIIntegration:
    """Integration tests for the CLI interface."""

    def test_cli_create_player(self, game_state):
        """Test CLI player creation."""
        inputs = iter(["TestBot", "4"])  # Name, then quit
        outputs = []

        cli = CLI(
            game_state,
            input_fn=lambda _: next(inputs),
            print_fn=lambda x: outputs.append(x),
        )

        cli.run()

        # Check player was created
        assert game_state.player is not None
        assert game_state.player.name == "TestBot"

        # Check welcome message was printed
        output_text = "\n".join(outputs)
        assert "Welcome" in output_text
        assert "TestBot" in output_text

    def test_cli_shop_flow(self, game_state):
        """Test CLI shopping flow."""
        inputs = iter([
            "TestBot",  # Name
            "2",        # Shop (now option 2)
            "1",        # Buy sub-menu
            "1",        # Buy first item
            "",         # Press Enter to continue
            "b",        # Back to shop menu
            "4",        # Back to main menu
            "4",        # Quit
        ])
        outputs = []

        cli = CLI(
            game_state,
            input_fn=lambda _: next(inputs),
            print_fn=lambda x: outputs.append(x),
        )

        cli.run()

        # Check player bought something
        assert len(game_state.player.inventory) == 1

    def test_cli_inspect_robot(self, game_state):
        """Test CLI robot inspection."""
        inputs = iter([
            "TestBot",  # Name
            "3",        # Inspect
            "",         # Press Enter to continue
            "4",        # Quit
        ])
        outputs = []

        cli = CLI(
            game_state,
            input_fn=lambda _: next(inputs),
            print_fn=lambda x: outputs.append(x),
        )

        cli.run()

        output_text = "\n".join(outputs)
        assert "Health" in output_text
        assert "Energy" in output_text
        assert "Money" in output_text


class TestAssetLoading:
    """Test that all assets load correctly."""

    def test_all_weapons_load(self, game_state):
        """Test that all weapons from game design are loaded."""
        weapons = game_state.registry.weapons
        assert "Stick" in weapons
        assert "Sword" in weapons
        assert "Sawed-off Shotgun" in weapons
        assert "Flame Thrower" in weapons
        assert "Shock Rod" in weapons
        assert "Lightsabre" in weapons

    def test_all_gear_load(self, game_state):
        """Test that all gear from game design are loaded."""
        gear = game_state.registry.gear
        assert "Cardboard Armor" in gear
        assert "Third Arm" in gear
        assert "Fourth Arm" in gear
        assert "Fifth Arm" in gear
        assert "Gold Computer Chip" in gear
        assert "Small Computer Chip" in gear
        assert "Money Maker" in gear
        assert "Propeller" in gear
        assert "Small Battery" in gear
        assert "Medium Battery" in gear
        assert "Big Battery" in gear
        assert "Shotgun Shell" in gear

    def test_all_consumables_load(self, game_state):
        """Test that all consumables from game design are loaded."""
        consumables = game_state.registry.consumables
        assert "Repair Kit" in consumables
        assert "Grenade" in consumables
        assert "Throwing Net" in consumables

    def test_all_enemies_load(self, game_state):
        """Test that all enemies from game design are loaded."""
        enemies = game_state.registry.enemies
        assert "MiniBot" in enemies
        assert "Sparky" in enemies
        assert "Firebot" in enemies

    def test_enemy_robots_have_correct_items(self, game_state):
        """Test that enemy robots are created with correct items."""
        minibot = game_state.registry.create_enemy_robot("MiniBot")
        assert minibot is not None

        weapon_names = [w.name for w in minibot.get_weapons()]
        gear_names = [g.name for g in minibot.get_gear()]

        assert "Stick" in weapon_names
        assert "Cardboard Armor" in gear_names
        assert "Propeller" in gear_names

        firebot = game_state.registry.create_enemy_robot("Firebot")
        assert firebot is not None

        weapon_names = [w.name for w in firebot.get_weapons()]
        gear_names = [g.name for g in firebot.get_gear()]

        assert "Flame Thrower" in weapon_names
        assert "Gold Computer Chip" in gear_names

        # Test Sparky
        sparky = game_state.registry.create_enemy_robot("Sparky")
        assert sparky is not None

        weapon_names = [w.name for w in sparky.get_weapons()]
        gear_names = [g.name for g in sparky.get_gear()]

        assert "Shock Rod" in weapon_names
        assert "Small Battery" in gear_names
        assert "Small Computer Chip" in gear_names


class TestExpSystem:
    """Tests for the experience and leveling system."""

    def test_award_exp_no_level_up(self, game_state):
        """Test awarding exp without leveling up."""
        player = game_state.create_player("TestBot")
        assert player.level == 0
        assert player.exp == 0

        leveled_up = game_state.award_exp(5)
        assert leveled_up is False
        assert player.exp == 5
        assert player.level == 0

    def test_award_exp_level_up(self, game_state):
        """Test awarding exp that causes a level up."""
        player = game_state.create_player("TestBot")
        assert player.level == 0

        leveled_up = game_state.award_exp(10)
        assert leveled_up is True
        assert player.level == 1
        assert player.exp == 0

    def test_award_exp_multiple_levels(self, game_state):
        """Test awarding exp that causes multiple level ups."""
        player = game_state.create_player("TestBot")

        leveled_up = game_state.award_exp(25)
        assert leveled_up is True
        assert player.level == 2
        assert player.exp == 5

    def test_enemy_exp_rewards(self, game_state):
        """Test that enemies have correct exp rewards."""
        minibot = game_state.registry.enemies["MiniBot"]
        assert minibot.exp_reward == 2

        firebot = game_state.registry.enemies["Firebot"]
        assert firebot.exp_reward == 5

    def test_power_chip_attack_bonus(self, game_state):
        """Test that Power Chip provides attack bonus."""
        power_chip = game_state.registry.get_item("Power Chip")
        assert power_chip is not None
        assert power_chip.attack_bonus == 10

        player = game_state.create_player("TestBot")
        player.level = 3
        player.inventory.append(power_chip)

        assert player.get_effective_attack() == 10

