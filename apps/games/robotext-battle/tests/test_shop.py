"""Tests for the shop engine."""

import tempfile
from pathlib import Path

import pytest
import yaml

from robotext.assets import AssetRegistry, load_assets
from robotext.models import Gear, ItemType, Weapon
from robotext.shop import (
    buy_item,
    can_buy,
    check_requirements,
    get_sell_price,
    list_available_items,
    sell_item,
)
from robotext.state import GameState


@pytest.fixture
def game_state():
    """Create a game state with test assets."""
    items_data = {
        "weapons": {
            "Stick": {
                "level": 0,
                "damage": 1,
                "money_cost": 10,
                "energy_cost": 1,
                "accuracy": 80,
                "hands": 1,
                "description": "A stick",
            },
            "Sword": {
                "level": 2,
                "damage": 10,
                "money_cost": 50,
                "energy_cost": 5,
                "accuracy": 100,
                "hands": 2,
                "description": "A sword",
            },
            "Shotgun": {
                "level": 5,
                "damage": 15,
                "money_cost": 100,
                "requirements": ["Shotgun Shell"],
                "description": "Bang!",
            },
        },
        "gear": {
            "Cardboard Armor": {
                "level": 0,
                "money_cost": 10,
                "health_bonus": 5,
                "description": "Cheap armor",
            },
            "Third Arm": {
                "level": 2,
                "money_cost": 150,
                "hands_bonus": 1,
                "description": "More hands",
            },
            "Fourth Arm": {
                "level": 5,
                "money_cost": 250,
                "hands_bonus": 1,
                "requirements": ["Third Arm"],
                "description": "Even more hands",
            },
            "Shotgun Shell": {
                "level": 5,
                "money_cost": 30,
                "description": "Ammo",
            },
        },
        "consumables": {
            "Repair Kit": {
                "level": 2,
                "money_cost": 30,
                "health_restore": 10,
                "description": "Heals",
            },
        },
    }
    config_data = {
        "default_robot_stats": {
            "health": 10,
            "max_health": 10,
            "energy": 20,
            "max_energy": 20,
        },
        "starting_money": 100,
    }

    with tempfile.TemporaryDirectory() as tmpdir:
        tmppath = Path(tmpdir)
        with open(tmppath / "items.yaml", "w") as f:
            yaml.dump(items_data, f)
        with open(tmppath / "config.yaml", "w") as f:
            yaml.dump(config_data, f)

        registry = load_assets(tmppath)
        state = GameState(registry=registry)
        state.create_player("TestPlayer")
        yield state


class TestListAvailableItems:
    """Tests for listing available items."""

    def test_list_items_at_level_1(self, game_state):
        # Ensure player is at level 1 for this test
        game_state.player.level = 1
        items = list_available_items(game_state)
        names = [item.name for item in items]

        assert "Stick" in names
        assert "Cardboard Armor" in names
        assert "Sword" not in names  # Level 2
        assert "Shotgun" not in names  # Level 5

    def test_list_items_at_higher_level(self, game_state):
        game_state.player.level = 5
        items = list_available_items(game_state)
        names = [item.name for item in items]

        assert "Stick" in names
        assert "Sword" in names
        assert "Shotgun" in names
        assert "Fourth Arm" in names


class TestCanBuy:
    """Tests for checking if items can be purchased."""

    def test_can_buy_affordable_item(self, game_state):
        stick = game_state.registry.get_item("Stick")
        can, reason = can_buy(game_state, stick)
        assert can is True

    def test_cannot_buy_too_expensive(self, game_state):
        game_state.player.money = 5
        stick = game_state.registry.get_item("Stick")
        can, reason = can_buy(game_state, stick)
        assert can is False
        assert "money" in reason.lower()

    def test_cannot_buy_too_high_level(self, game_state):
        sword = game_state.registry.get_item("Sword")
        can, reason = can_buy(game_state, sword)
        assert can is False
        assert "level" in reason.lower()

    def test_cannot_buy_full_inventory(self, game_state):
        game_state.player.inventory_size = 1
        stick = game_state.registry.get_item("Stick")
        game_state.player.inventory.append(stick)

        can, reason = can_buy(game_state, stick)
        assert can is False
        assert "full" in reason.lower()

    def test_cannot_buy_without_requirements(self, game_state):
        game_state.player.level = 5
        game_state.player.money = 500
        fourth_arm = game_state.registry.get_item("Fourth Arm")
        can, reason = can_buy(game_state, fourth_arm)
        assert can is False
        assert "Third Arm" in reason

    def test_can_buy_with_requirements_met(self, game_state):
        game_state.player.level = 5
        game_state.player.money = 500
        third_arm = game_state.registry.get_item("Third Arm")
        fourth_arm = game_state.registry.get_item("Fourth Arm")
        game_state.player.inventory.append(third_arm)

        can, reason = can_buy(game_state, fourth_arm)
        assert can is True

    def test_cannot_buy_duplicate_gear(self, game_state):
        armor = game_state.registry.get_item("Cardboard Armor")
        game_state.player.inventory.append(armor)

        can, reason = can_buy(game_state, armor)
        assert can is False
        assert "already have" in reason.lower()


class TestBuyItem:
    """Tests for buying items."""

    def test_buy_item_success(self, game_state):
        stick = game_state.registry.get_item("Stick")
        initial_money = game_state.player.money

        result = buy_item(game_state, stick)

        assert result.success is True
        assert game_state.player.money == initial_money - 10
        assert stick in game_state.player.inventory

    def test_buy_item_failure(self, game_state):
        game_state.player.money = 0
        stick = game_state.registry.get_item("Stick")

        result = buy_item(game_state, stick)

        assert result.success is False
        assert stick not in game_state.player.inventory


class TestSellItem:
    """Tests for selling items."""

    def test_get_sell_price(self, game_state):
        stick = game_state.registry.get_item("Stick")
        assert get_sell_price(stick) == 5  # Half of 10

    def test_sell_item_success(self, game_state):
        stick = game_state.registry.get_item("Stick")
        game_state.player.inventory.append(stick)
        initial_money = game_state.player.money

        result = sell_item(game_state, stick)

        assert result.success is True
        assert game_state.player.money == initial_money + 5
        assert stick not in game_state.player.inventory

    def test_sell_item_not_in_inventory(self, game_state):
        stick = game_state.registry.get_item("Stick")

        result = sell_item(game_state, stick)

        assert result.success is False


class TestCheckRequirements:
    """Tests for requirement checking."""

    def test_no_requirements(self, game_state):
        stick = game_state.registry.get_item("Stick")
        meets, msg = check_requirements(game_state.player, stick)
        assert meets is True

    def test_requirement_not_met(self, game_state):
        fourth_arm = game_state.registry.get_item("Fourth Arm")
        meets, msg = check_requirements(game_state.player, fourth_arm)
        assert meets is False
        assert "Third Arm" in msg

    def test_requirement_met(self, game_state):
        third_arm = game_state.registry.get_item("Third Arm")
        fourth_arm = game_state.registry.get_item("Fourth Arm")
        game_state.player.inventory.append(third_arm)

        meets, msg = check_requirements(game_state.player, fourth_arm)
        assert meets is True

