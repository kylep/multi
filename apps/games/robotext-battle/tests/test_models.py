"""Tests for game models."""

import pytest

from robotext.models import (
    BattleRobot,
    BattleState,
    Consumable,
    Gear,
    Item,
    ItemType,
    Robot,
    Weapon,
)


class TestRobot:
    """Tests for the Robot class."""

    def test_create_robot_with_defaults(self):
        robot = Robot(name="TestBot")
        assert robot.name == "TestBot"
        assert robot.health == 10
        assert robot.max_health == 10
        assert robot.energy == 20
        assert robot.hands == 2
        assert robot.level == 1
        assert robot.money == 100
        assert robot.inventory == []

    def test_get_weapons(self):
        robot = Robot(name="TestBot")
        weapon = Weapon(
            name="Sword",
            item_type=ItemType.WEAPON,
            level=1,
            money_cost=50,
            description="A sword",
            damage=10,
        )
        gear = Gear(
            name="Armor",
            item_type=ItemType.GEAR,
            level=1,
            money_cost=30,
            description="Armor",
            health_bonus=5,
        )
        robot.inventory = [weapon, gear]

        weapons = robot.get_weapons()
        assert len(weapons) == 1
        assert weapons[0].name == "Sword"

    def test_get_gear(self):
        robot = Robot(name="TestBot")
        gear = Gear(
            name="Armor",
            item_type=ItemType.GEAR,
            level=1,
            money_cost=30,
            description="Armor",
            health_bonus=5,
        )
        robot.inventory = [gear]

        gear_list = robot.get_gear()
        assert len(gear_list) == 1
        assert gear_list[0].name == "Armor"

    def test_effective_stats_with_gear(self):
        robot = Robot(name="TestBot", max_health=10, max_energy=20, dodge=0)
        gear = Gear(
            name="Armor",
            item_type=ItemType.GEAR,
            level=1,
            money_cost=30,
            description="Armor",
            health_bonus=5,
            energy_bonus=10,
            dodge_bonus=15,
            hands_bonus=1,
        )
        robot.inventory = [gear]

        assert robot.get_effective_max_health() == 15
        assert robot.get_effective_max_energy() == 30
        assert robot.get_effective_dodge() == 15
        assert robot.get_effective_hands() == 3

    def test_has_item(self):
        robot = Robot(name="TestBot")
        weapon = Weapon(
            name="Sword",
            item_type=ItemType.WEAPON,
            level=1,
            money_cost=50,
            description="A sword",
        )
        robot.inventory = [weapon]

        assert robot.has_item("Sword") is True
        assert robot.has_item("Shield") is False


class TestWeapon:
    """Tests for the Weapon class."""

    def test_create_weapon(self):
        weapon = Weapon(
            name="Stick",
            item_type=ItemType.WEAPON,
            level=0,
            money_cost=10,
            description="A stick",
            damage=1,
            energy_cost=1,
            accuracy=80,
            hands=1,
        )
        assert weapon.name == "Stick"
        assert weapon.damage == 1
        assert weapon.accuracy == 80
        assert weapon.hands == 1

    def test_weapon_with_requirements(self):
        weapon = Weapon(
            name="Shotgun",
            item_type=ItemType.WEAPON,
            level=5,
            money_cost=100,
            description="Bang!",
            requirements=["Shotgun Shell"],
        )
        assert "Shotgun Shell" in weapon.requirements


class TestGear:
    """Tests for the Gear class."""

    def test_create_gear(self):
        gear = Gear(
            name="Cardboard Armor",
            item_type=ItemType.GEAR,
            level=0,
            money_cost=10,
            description="Cheap armor",
            health_bonus=5,
        )
        assert gear.name == "Cardboard Armor"
        assert gear.health_bonus == 5


class TestConsumable:
    """Tests for the Consumable class."""

    def test_create_consumable(self):
        consumable = Consumable(
            name="Repair Kit",
            item_type=ItemType.CONSUMABLE,
            level=2,
            money_cost=30,
            description="Repairs robot",
            health_restore=10,
        )
        assert consumable.name == "Repair Kit"
        assert consumable.health_restore == 10


class TestBattleRobot:
    """Tests for the BattleRobot class."""

    def test_from_robot(self):
        robot = Robot(name="TestBot", max_health=10, max_energy=20)
        battle_robot = BattleRobot.from_robot(robot)

        assert battle_robot.robot == robot
        assert battle_robot.current_health == 10
        assert battle_robot.current_energy == 20
        assert battle_robot.temp_defence == 0

    def test_from_robot_with_gear_bonuses(self):
        robot = Robot(name="TestBot", max_health=10, max_energy=20)
        gear = Gear(
            name="Armor",
            item_type=ItemType.GEAR,
            level=1,
            money_cost=30,
            description="Armor",
            health_bonus=5,
            energy_bonus=10,
        )
        robot.inventory = [gear]
        battle_robot = BattleRobot.from_robot(robot)

        # Should start with effective max stats
        assert battle_robot.current_health == 15
        assert battle_robot.current_energy == 30

    def test_is_alive(self):
        robot = Robot(name="TestBot")
        battle_robot = BattleRobot.from_robot(robot)

        assert battle_robot.is_alive() is True
        battle_robot.current_health = 0
        assert battle_robot.is_alive() is False

    def test_effective_dodge_with_reduction(self):
        robot = Robot(name="TestBot", dodge=20)
        battle_robot = BattleRobot.from_robot(robot)
        battle_robot.temp_dodge_reduction = 30

        # Should not go below 0
        assert battle_robot.get_effective_dodge() == 0


class TestBattleState:
    """Tests for the BattleState class."""

    def test_create_battle_state(self):
        player = Robot(name="Player")
        enemy = Robot(name="Enemy")
        player_battle = BattleRobot.from_robot(player)
        enemy_battle = BattleRobot.from_robot(enemy)

        battle = BattleState(
            player=player_battle,
            enemy=enemy_battle,
            player_turn=True,
        )

        assert battle.player_turn is True
        assert battle.turn_number == 1
        assert battle.winner is None

    def test_get_current_fighter(self):
        player = Robot(name="Player")
        enemy = Robot(name="Enemy")
        player_battle = BattleRobot.from_robot(player)
        enemy_battle = BattleRobot.from_robot(enemy)

        battle = BattleState(
            player=player_battle,
            enemy=enemy_battle,
            player_turn=True,
        )

        assert battle.get_current_fighter() == player_battle
        battle.player_turn = False
        assert battle.get_current_fighter() == enemy_battle

    def test_battle_log(self):
        player = Robot(name="Player")
        enemy = Robot(name="Enemy")
        player_battle = BattleRobot.from_robot(player)
        enemy_battle = BattleRobot.from_robot(enemy)

        battle = BattleState(
            player=player_battle,
            enemy=enemy_battle,
            player_turn=True,
        )

        battle.log("Test message")
        assert "Test message" in battle.battle_log

