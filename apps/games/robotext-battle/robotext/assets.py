"""Asset loading and registry for Robo Text Battle."""

from pathlib import Path
from typing import Union

import yaml

from robotext.models import (
    Consumable,
    Enemy,
    Gear,
    Item,
    ItemType,
    Robot,
    Weapon,
)


class AssetRegistry:
    """Registry for all game assets loaded from YAML."""

    def __init__(self):
        self.weapons: dict[str, Weapon] = {}
        self.gear: dict[str, Gear] = {}
        self.consumables: dict[str, Consumable] = {}
        self.enemies: dict[str, Enemy] = {}
        self.default_robot_stats: dict = {}
        self.starting_money: int = 100

    def get_item(self, name: str) -> Item | None:
        """Get any item by name."""
        if name in self.weapons:
            return self.weapons[name]
        if name in self.gear:
            return self.gear[name]
        if name in self.consumables:
            return self.consumables[name]
        return None

    def get_all_items(self) -> list[Item]:
        """Get all items in the registry."""
        items: list[Item] = []
        items.extend(self.weapons.values())
        items.extend(self.gear.values())
        items.extend(self.consumables.values())
        return items

    def get_items_for_level(self, level: int) -> list[Item]:
        """Get all items available at a given level."""
        return [item for item in self.get_all_items() if item.level <= level]

    def create_enemy_robot(self, enemy_name: str) -> Robot | None:
        """Create a Robot instance from an enemy definition."""
        enemy = self.enemies.get(enemy_name)
        if not enemy:
            return None

        # Copy default stats and override level with enemy's level
        stats = dict(self.default_robot_stats)
        stats["level"] = enemy.level

        robot = Robot(
            name=enemy.name,
            **stats,
        )

        # Add weapons
        for weapon_name in enemy.weapons:
            weapon = self.weapons.get(weapon_name)
            if weapon:
                robot.inventory.append(weapon)

        # Add gear
        for gear_name in enemy.gear:
            gear_item = self.gear.get(gear_name)
            if gear_item:
                robot.inventory.append(gear_item)

        # Add consumables
        for consumable_name in enemy.consumables:
            consumable = self.consumables.get(consumable_name)
            if consumable:
                robot.inventory.append(consumable)

        return robot


def load_weapon(name: str, data: dict) -> Weapon:
    """Load a weapon from YAML data."""
    return Weapon(
        name=name,
        item_type=ItemType.WEAPON,
        level=data.get("level", 0),
        money_cost=data.get("money_cost", 0),
        description=data.get("description", ""),
        requirements=data.get("requirements", []),
        damage=data.get("damage", 1),
        energy_cost=data.get("energy_cost", 1),
        accuracy=data.get("accuracy", 100),
        hands=data.get("hands", 1),
    )


def load_gear(name: str, data: dict) -> Gear:
    """Load gear from YAML data."""
    return Gear(
        name=name,
        item_type=ItemType.GEAR,
        level=data.get("level", 0),
        money_cost=data.get("money_cost", 0),
        description=data.get("description", ""),
        requirements=data.get("requirements", []),
        health_bonus=data.get("health_bonus", 0),
        energy_bonus=data.get("energy_bonus", 0),
        defence_bonus=data.get("defence_bonus", 0),
        attack_bonus=data.get("attack_bonus", 0),
        hands_bonus=data.get("hands_bonus", 0),
        dodge_bonus=data.get("dodge_bonus", 0),
        money_bonus_percent=data.get("money_bonus_percent", 0),
    )


def load_consumable(name: str, data: dict) -> Consumable:
    """Load a consumable from YAML data."""
    return Consumable(
        name=name,
        item_type=ItemType.CONSUMABLE,
        level=data.get("level", 0),
        money_cost=data.get("money_cost", 0),
        description=data.get("description", ""),
        requirements=data.get("requirements", []),
        health_restore=data.get("health_restore", 0),
        energy_restore=data.get("energy_restore", 0),
        temp_defence=data.get("temp_defence", 0),
        temp_attack=data.get("temp_attack", 0),
        damage=data.get("damage", 0),
        enemy_dodge_reduction=data.get("enemy_dodge_reduction", 0),
    )


def load_enemy(name: str, data: dict) -> Enemy:
    """Load an enemy from YAML data."""
    return Enemy(
        name=name,
        level=data.get("level", 1),
        weapons=data.get("weapons", []),
        gear=data.get("gear", []),
        consumables=data.get("consumables", []),
        reward=data.get("reward", 0),
        exp_reward=data.get("exp_reward", 1),
        description=data.get("description", ""),
    )


def load_items_yaml(path: Path, registry: AssetRegistry) -> None:
    """Load items from a YAML file into the registry."""
    with open(path) as f:
        data = yaml.safe_load(f)

    if "weapons" in data:
        for name, weapon_data in data["weapons"].items():
            registry.weapons[name] = load_weapon(name, weapon_data)

    if "gear" in data:
        for name, gear_data in data["gear"].items():
            registry.gear[name] = load_gear(name, gear_data)

    if "consumables" in data:
        for name, consumable_data in data["consumables"].items():
            registry.consumables[name] = load_consumable(name, consumable_data)


def load_enemies_yaml(path: Path, registry: AssetRegistry) -> None:
    """Load enemies from a YAML file into the registry."""
    with open(path) as f:
        data = yaml.safe_load(f)

    if "enemies" in data:
        for name, enemy_data in data["enemies"].items():
            registry.enemies[name] = load_enemy(name, enemy_data)


def load_config_yaml(path: Path, registry: AssetRegistry) -> None:
    """Load config from a YAML file into the registry."""
    with open(path) as f:
        data = yaml.safe_load(f)

    if "default_robot_stats" in data:
        registry.default_robot_stats = data["default_robot_stats"]

    if "starting_money" in data:
        registry.starting_money = data["starting_money"]


def load_assets(assets_dir: Path) -> AssetRegistry:
    """Load all assets from a directory."""
    registry = AssetRegistry()

    items_path = assets_dir / "items.yaml"
    enemies_path = assets_dir / "enemies.yaml"
    config_path = assets_dir / "config.yaml"

    if config_path.exists():
        load_config_yaml(config_path, registry)

    if items_path.exists():
        load_items_yaml(items_path, registry)

    if enemies_path.exists():
        load_enemies_yaml(enemies_path, registry)

    return registry

