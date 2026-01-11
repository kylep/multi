"""Tests for the battle engine."""

import random
import tempfile
from pathlib import Path

import pytest
import yaml

from robotext.assets import load_assets
from robotext.battle import (
    calculate_damage,
    calculate_hit_chance,
    check_victory,
    create_battle,
    end_turn,
    enemy_ai_turn,
    execute_attack,
    execute_rest,
    get_battle_status,
    use_consumable,
)
from robotext.models import (
    BattleRobot,
    BattleState,
    Consumable,
    Gear,
    ItemType,
    Robot,
    Weapon,
)
from robotext.state import GameState


@pytest.fixture
def player():
    """Create a test player robot."""
    robot = Robot(name="Player", health=20, max_health=20, energy=30, max_energy=30)
    weapon = Weapon(
        name="Sword",
        item_type=ItemType.WEAPON,
        level=1,
        money_cost=50,
        description="A sword",
        damage=10,
        energy_cost=5,
        accuracy=100,
        hands=2,
    )
    robot.inventory.append(weapon)
    return robot


@pytest.fixture
def enemy():
    """Create a test enemy robot."""
    robot = Robot(name="Enemy", health=15, max_health=15, energy=20, max_energy=20)
    weapon = Weapon(
        name="Stick",
        item_type=ItemType.WEAPON,
        level=0,
        money_cost=10,
        description="A stick",
        damage=3,
        energy_cost=1,
        accuracy=80,
        hands=1,
    )
    robot.inventory.append(weapon)
    return robot


class TestCreateBattle:
    """Tests for battle creation."""

    def test_create_battle(self, player, enemy):
        rng = random.Random(42)
        battle = create_battle(player, enemy, rng)

        assert battle.player.robot == player
        assert battle.enemy.robot == enemy
        assert battle.winner is None
        assert battle.turn_number == 1
        assert len(battle.battle_log) > 0

    def test_simultaneous_turns(self, player, enemy):
        # Test that battle starts with simultaneous turn system
        rng = random.Random(42)
        battle = create_battle(player, enemy, rng)
        
        # player_turn is now just used for get_current_fighter compatibility
        assert battle.player_turn is True
        # Both action slots should be empty
        assert battle.player_action is None
        assert battle.enemy_action is None


class TestHitChance:
    """Tests for hit chance calculation."""

    def test_perfect_accuracy_no_dodge(self):
        assert calculate_hit_chance(100, 0) == 1.0

    def test_accuracy_minus_dodge(self):
        assert calculate_hit_chance(100, 30) == 0.7

    def test_dodge_higher_than_accuracy(self):
        assert calculate_hit_chance(50, 100) == 0.0

    def test_over_100_accuracy(self):
        # Accuracy 150 vs dodge 30 = 120% capped at 100%
        assert calculate_hit_chance(150, 30) == 1.0


class TestCalculateDamage:
    """Tests for damage calculation."""

    def test_basic_damage(self, player, enemy):
        weapon = player.get_weapons()[0]
        player_battle = BattleRobot.from_robot(player)
        enemy_battle = BattleRobot.from_robot(enemy)

        damage = calculate_damage(weapon, player_battle, enemy_battle)
        assert damage == 10  # Base damage, no attack bonus, no defence

    def test_damage_with_defence(self, player, enemy):
        weapon = player.get_weapons()[0]
        player_battle = BattleRobot.from_robot(player)
        enemy.defence = 3
        enemy_battle = BattleRobot.from_robot(enemy)

        damage = calculate_damage(weapon, player_battle, enemy_battle)
        assert damage == 7  # 10 - 3 defence

    def test_damage_minimum_zero(self, player, enemy):
        weapon = player.get_weapons()[0]
        player_battle = BattleRobot.from_robot(player)
        enemy.defence = 100
        enemy_battle = BattleRobot.from_robot(enemy)

        damage = calculate_damage(weapon, player_battle, enemy_battle)
        assert damage == 0


class TestExecuteAttack:
    """Tests for attack execution."""

    def test_attack_hits(self, player, enemy):
        rng = random.Random(42)
        battle = create_battle(player, enemy, rng)
        battle.player_turn = True

        weapon = player.get_weapons()[0]
        initial_health = battle.enemy.current_health
        initial_energy = battle.player.current_energy

        result = execute_attack(battle, [weapon], rng)

        assert result.success is True
        assert result.turn_ended is True
        assert battle.player.current_energy == initial_energy - weapon.energy_cost

    def test_attack_no_weapons(self, player, enemy):
        rng = random.Random(42)
        battle = create_battle(player, enemy, rng)
        battle.player_turn = True

        result = execute_attack(battle, [], rng)

        assert result.success is False
        assert result.turn_ended is False

    def test_attack_not_enough_energy(self, player, enemy):
        rng = random.Random(42)
        battle = create_battle(player, enemy, rng)
        battle.player_turn = True
        battle.player.current_energy = 1

        weapon = player.get_weapons()[0]  # Costs 5 energy
        result = execute_attack(battle, [weapon], rng)

        assert result.success is False
        assert "energy" in result.message.lower()

    def test_attack_not_enough_hands(self, player, enemy):
        rng = random.Random(42)
        battle = create_battle(player, enemy, rng)
        battle.player_turn = True

        # Add another 2-hand weapon
        weapon2 = Weapon(
            name="Axe",
            item_type=ItemType.WEAPON,
            level=1,
            money_cost=50,
            description="An axe",
            damage=8,
            energy_cost=3,
            accuracy=90,
            hands=2,
        )
        player.inventory.append(weapon2)

        weapons = player.get_weapons()  # Both 2-hand weapons
        result = execute_attack(battle, weapons, rng)

        assert result.success is False
        assert "hands" in result.message.lower()

    def test_attack_same_weapon_twice_blocked(self, player, enemy):
        """Test that using the same weapon twice (1,1 exploit) is blocked."""
        rng = random.Random(42)
        battle = create_battle(player, enemy, rng)
        battle.player_turn = True

        weapon = player.get_weapons()[0]
        
        # Try to use the same weapon twice by passing duplicate indices
        result = execute_attack(battle, [weapon, weapon], rng, weapon_indices=[1, 1])

        assert result.success is False
        assert "only use each weapon once" in result.message.lower()


class TestExecuteRest:
    """Tests for rest action."""

    def test_rest_recovers_energy(self, player, enemy):
        rng = random.Random(42)
        battle = create_battle(player, enemy, rng)
        battle.player_turn = True
        battle.player.current_energy = 10

        result = execute_rest(battle)

        assert result.success is True
        assert result.turn_ended is True
        assert battle.player.current_energy == 15  # +5 energy

    def test_rest_caps_at_max(self, player, enemy):
        rng = random.Random(42)
        battle = create_battle(player, enemy, rng)
        battle.player_turn = True
        # Already at max
        battle.player.current_energy = battle.player.robot.get_effective_max_energy()

        result = execute_rest(battle)

        assert result.success is True
        assert battle.player.current_energy == battle.player.robot.get_effective_max_energy()


class TestUseConsumable:
    """Tests for consumable usage."""

    def test_use_health_consumable(self, player, enemy):
        rng = random.Random(42)
        consumable = Consumable(
            name="Repair Kit",
            item_type=ItemType.CONSUMABLE,
            level=1,
            money_cost=30,
            description="Heals",
            health_restore=10,
        )
        player.inventory.append(consumable)

        battle = create_battle(player, enemy, rng)
        battle.player_turn = True
        battle.player.current_health = 5

        result = use_consumable(battle, consumable)

        assert result.success is True
        assert result.turn_ended is False  # Consumables don't end turn
        assert battle.player.current_health == 15

    def test_use_damage_consumable(self, player, enemy):
        rng = random.Random(42)
        consumable = Consumable(
            name="Grenade",
            item_type=ItemType.CONSUMABLE,
            level=1,
            money_cost=100,
            description="Boom",
            damage=30,
        )
        player.inventory.append(consumable)

        battle = create_battle(player, enemy, rng)
        battle.player_turn = True
        initial_enemy_health = battle.enemy.current_health

        result = use_consumable(battle, consumable)

        assert result.success is True
        assert battle.enemy.current_health == initial_enemy_health - 30

    def test_cannot_use_consumable_twice(self, player, enemy):
        rng = random.Random(42)
        consumable = Consumable(
            name="Repair Kit",
            item_type=ItemType.CONSUMABLE,
            level=1,
            money_cost=30,
            description="Heals",
            health_restore=10,
        )
        player.inventory.append(consumable)

        battle = create_battle(player, enemy, rng)
        battle.player_turn = True

        # Use once
        use_consumable(battle, consumable)

        # Try to use again
        result = use_consumable(battle, consumable)
        assert result.success is False


class TestCheckVictory:
    """Tests for victory checking."""

    def test_no_winner(self, player, enemy):
        rng = random.Random(42)
        battle = create_battle(player, enemy, rng)

        result = check_victory(battle)

        assert result is None
        assert battle.winner is None

    def test_player_wins(self, player, enemy):
        rng = random.Random(42)
        battle = create_battle(player, enemy, rng)
        battle.enemy.current_health = 0

        result = check_victory(battle)

        assert result == "player"
        assert battle.winner == "player"

    def test_enemy_wins(self, player, enemy):
        rng = random.Random(42)
        battle = create_battle(player, enemy, rng)
        battle.player.current_health = 0

        result = check_victory(battle)

        assert result == "enemy"
        assert battle.winner == "enemy"


class TestEndTurn:
    """Tests for turn ending."""

    def test_end_turn_increments_turn_number(self, player, enemy):
        rng = random.Random(42)
        battle = create_battle(player, enemy, rng)
        initial_turn = battle.turn_number

        end_turn(battle)

        assert battle.turn_number == initial_turn + 1

    def test_end_turn_clears_planned_actions(self, player, enemy):
        rng = random.Random(42)
        battle = create_battle(player, enemy, rng)
        
        # Set some planned actions
        from robotext.models import PlannedAction
        battle.player_action = PlannedAction(action_type="rest")
        battle.enemy_action = PlannedAction(action_type="rest")
        
        end_turn(battle)
        
        # Should be cleared
        assert battle.player_action is None
        assert battle.enemy_action is None


class TestEnemyAI:
    """Tests for enemy AI."""

    def test_enemy_attacks_when_possible(self, player, enemy):
        rng = random.Random(42)
        battle = create_battle(player, enemy, rng)
        battle.player_turn = False

        results = enemy_ai_turn(battle, rng)

        # Should attack (has weapon and energy)
        assert len(results) >= 1
        assert results[-1].turn_ended is True

    def test_enemy_rests_when_no_energy(self, player, enemy):
        rng = random.Random(42)
        battle = create_battle(player, enemy, rng)
        battle.player_turn = False
        battle.enemy.current_energy = 0

        results = enemy_ai_turn(battle, rng)

        # Should rest (no energy for weapons)
        assert len(results) == 1
        assert "energy" in results[0].message.lower() or results[0].turn_ended is True

    def test_enemy_uses_consumables(self, player, enemy):
        rng = random.Random(42)
        consumable = Consumable(
            name="Repair Kit",
            item_type=ItemType.CONSUMABLE,
            level=1,
            money_cost=30,
            description="Heals",
            health_restore=10,
        )
        enemy.inventory.append(consumable)

        battle = create_battle(player, enemy, rng)
        battle.player_turn = False
        battle.enemy.current_health = 5

        results = enemy_ai_turn(battle, rng)

        # Should use consumable first, then attack
        assert len(results) >= 1

    def test_enemy_cannot_use_same_weapon_twice(self, player, enemy):
        """Test that enemy AI cannot use the same weapon multiple times (MiniBot bug fix)."""
        rng = random.Random(42)
        
        # Give enemy a single 1-hand weapon but 2 hands
        # Before the fix, AI would use this weapon twice
        single_weapon = Weapon(
            name="SingleStick",
            item_type=ItemType.WEAPON,
            level=0,
            money_cost=10,
            description="A single stick",
            damage=5,
            energy_cost=1,
            accuracy=100,
            hands=1,
        )
        enemy.inventory = [single_weapon]  # Only one weapon
        enemy.hands = 2  # But two hands
        
        battle = create_battle(player, enemy, rng)
        battle.player_turn = False
        
        initial_health = battle.player.current_health
        results = enemy_ai_turn(battle, rng)
        
        # Count how many times the weapon was used by checking damage
        # With 1 weapon at 5 damage and 100% accuracy, should only hit once
        damage_dealt = initial_health - battle.player.current_health
        
        # Should only use the weapon once (5 damage max, not 10)
        assert damage_dealt <= 5, f"Enemy dealt {damage_dealt} damage, expected max 5 (weapon used more than once)"


class TestBattleStatus:
    """Tests for battle status display."""

    def test_get_battle_status(self, player, enemy):
        rng = random.Random(42)
        battle = create_battle(player, enemy, rng)

        status = get_battle_status(battle)

        assert "Player" in status
        assert "Enemy" in status
        assert "Health" in status
        assert "Energy" in status
        assert "TURN 1" in status or "Turn 1" in status  # Handles both fancy and plain modes

