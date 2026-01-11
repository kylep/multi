"""Tests for asset loading."""

import tempfile
from pathlib import Path

import pytest
import yaml

from robotext.assets import (
    AssetRegistry,
    load_assets,
    load_consumable,
    load_enemies_yaml,
    load_gear,
    load_items_yaml,
    load_weapon,
)
from robotext.models import ItemType


class TestAssetRegistry:
    """Tests for the AssetRegistry class."""

    def test_empty_registry(self):
        registry = AssetRegistry()
        assert len(registry.weapons) == 0
        assert len(registry.gear) == 0
        assert len(registry.consumables) == 0
        assert len(registry.enemies) == 0

    def test_get_item(self):
        registry = AssetRegistry()
        weapon = load_weapon("Stick", {"damage": 1, "money_cost": 10})
        registry.weapons["Stick"] = weapon

        assert registry.get_item("Stick") == weapon
        assert registry.get_item("NonExistent") is None

    def test_get_all_items(self):
        registry = AssetRegistry()
        weapon = load_weapon("Stick", {"damage": 1, "money_cost": 10})
        gear = load_gear("Armor", {"health_bonus": 5, "money_cost": 20})
        registry.weapons["Stick"] = weapon
        registry.gear["Armor"] = gear

        all_items = registry.get_all_items()
        assert len(all_items) == 2

    def test_get_items_for_level(self):
        registry = AssetRegistry()
        weapon1 = load_weapon("Stick", {"level": 0, "damage": 1})
        weapon2 = load_weapon("Sword", {"level": 5, "damage": 10})
        registry.weapons["Stick"] = weapon1
        registry.weapons["Sword"] = weapon2

        level_0_items = registry.get_items_for_level(0)
        assert len(level_0_items) == 1
        assert level_0_items[0].name == "Stick"

        level_5_items = registry.get_items_for_level(5)
        assert len(level_5_items) == 2


class TestLoadFunctions:
    """Tests for individual load functions."""

    def test_load_weapon(self):
        data = {
            "level": 2,
            "damage": 10,
            "money_cost": 50,
            "energy_cost": 5,
            "accuracy": 100,
            "hands": 2,
            "description": "A sword",
            "requirements": ["Shield"],
        }
        weapon = load_weapon("Sword", data)

        assert weapon.name == "Sword"
        assert weapon.level == 2
        assert weapon.damage == 10
        assert weapon.money_cost == 50
        assert weapon.energy_cost == 5
        assert weapon.accuracy == 100
        assert weapon.hands == 2
        assert weapon.description == "A sword"
        assert "Shield" in weapon.requirements

    def test_load_gear(self):
        data = {
            "level": 1,
            "money_cost": 100,
            "health_bonus": 5,
            "energy_bonus": 10,
            "dodge_bonus": 15,
            "hands_bonus": 1,
            "description": "Good gear",
        }
        gear = load_gear("SuperArmor", data)

        assert gear.name == "SuperArmor"
        assert gear.health_bonus == 5
        assert gear.energy_bonus == 10
        assert gear.dodge_bonus == 15
        assert gear.hands_bonus == 1

    def test_load_consumable(self):
        data = {
            "level": 2,
            "money_cost": 30,
            "health_restore": 10,
            "damage": 5,
            "description": "Heals and hurts",
        }
        consumable = load_consumable("HealBomb", data)

        assert consumable.name == "HealBomb"
        assert consumable.health_restore == 10
        assert consumable.damage == 5


class TestYamlLoading:
    """Tests for YAML file loading."""

    def test_load_items_yaml(self):
        items_data = {
            "weapons": {
                "Stick": {
                    "level": 0,
                    "damage": 1,
                    "money_cost": 10,
                    "description": "A stick",
                }
            },
            "gear": {
                "Armor": {
                    "level": 0,
                    "money_cost": 10,
                    "health_bonus": 5,
                    "description": "Armor",
                }
            },
            "consumables": {
                "Potion": {
                    "level": 1,
                    "money_cost": 20,
                    "health_restore": 5,
                    "description": "Heals",
                }
            },
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            items_path = Path(tmpdir) / "items.yaml"
            with open(items_path, "w") as f:
                yaml.dump(items_data, f)

            registry = AssetRegistry()
            load_items_yaml(items_path, registry)

            assert "Stick" in registry.weapons
            assert "Armor" in registry.gear
            assert "Potion" in registry.consumables

    def test_load_enemies_yaml(self):
        enemies_data = {
            "enemies": {
                "MiniBot": {
                    "level": 1,
                    "weapons": ["Stick"],
                    "gear": ["Armor"],
                    "consumables": [],
                    "reward": 50,
                    "exp_reward": 2,
                    "description": "A tiny robot",
                }
            }
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            enemies_path = Path(tmpdir) / "enemies.yaml"
            with open(enemies_path, "w") as f:
                yaml.dump(enemies_data, f)

            registry = AssetRegistry()
            load_enemies_yaml(enemies_path, registry)

            assert "MiniBot" in registry.enemies
            enemy = registry.enemies["MiniBot"]
            assert enemy.level == 1
            assert enemy.reward == 50
            assert enemy.exp_reward == 2

    def test_load_assets_full(self):
        items_data = {
            "weapons": {
                "Stick": {"level": 0, "damage": 1, "money_cost": 10}
            },
            "gear": {
                "Armor": {"level": 0, "money_cost": 10, "health_bonus": 5}
            },
        }
        enemies_data = {
            "enemies": {
                "Bot": {"level": 1, "weapons": ["Stick"], "gear": ["Armor"], "consumables": [], "reward": 50, "exp_reward": 1}
            }
        }
        config_data = {
            "default_robot_stats": {
                "health": 15,
                "max_health": 15,
                "energy": 25,
                "max_energy": 25,
            },
            "starting_money": 200,
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            tmppath = Path(tmpdir)
            with open(tmppath / "items.yaml", "w") as f:
                yaml.dump(items_data, f)
            with open(tmppath / "enemies.yaml", "w") as f:
                yaml.dump(enemies_data, f)
            with open(tmppath / "config.yaml", "w") as f:
                yaml.dump(config_data, f)

            registry = load_assets(tmppath)

            assert "Stick" in registry.weapons
            assert "Bot" in registry.enemies
            assert registry.starting_money == 200
            assert registry.default_robot_stats["health"] == 15


class TestCreateEnemyRobot:
    """Tests for creating enemy robots from definitions."""

    def test_create_enemy_robot(self):
        items_data = {
            "weapons": {
                "Stick": {"level": 0, "damage": 1, "money_cost": 10}
            },
            "gear": {
                "Armor": {"level": 0, "money_cost": 10, "health_bonus": 5}
            },
        }
        enemies_data = {
            "enemies": {
                "MiniBot": {
                    "level": 1,
                    "weapons": ["Stick"],
                    "gear": ["Armor"],
                    "consumables": [],
                    "reward": 50,
                    "exp_reward": 1,
                    "description": "Tiny",
                }
            }
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
            with open(tmppath / "enemies.yaml", "w") as f:
                yaml.dump(enemies_data, f)
            with open(tmppath / "config.yaml", "w") as f:
                yaml.dump(config_data, f)

            registry = load_assets(tmppath)
            robot = registry.create_enemy_robot("MiniBot")

            assert robot is not None
            assert robot.name == "MiniBot"
            assert robot.level == 1
            assert len(robot.get_weapons()) == 1
            assert len(robot.get_gear()) == 1
            assert robot.get_weapons()[0].name == "Stick"

