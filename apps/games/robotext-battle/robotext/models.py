"""Data models for Robo Text Battle."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class ItemType(Enum):
    """Types of items in the game."""
    WEAPON = "weapon"
    GEAR = "gear"
    CONSUMABLE = "consumable"


@dataclass
class Item:
    """Base class for all items."""
    name: str
    item_type: ItemType
    level: int
    money_cost: int
    description: str
    requirements: list[str] = field(default_factory=list)


@dataclass
class Weapon(Item):
    """A weapon that can be used to attack."""
    damage: int = 1
    energy_cost: int = 1
    accuracy: int = 100
    hands: int = 1

    def __post_init__(self):
        self.item_type = ItemType.WEAPON


@dataclass
class Gear(Item):
    """Equipment that provides passive stat bonuses."""
    health_bonus: int = 0
    energy_bonus: int = 0
    defence_bonus: int = 0
    attack_bonus: int = 0
    hands_bonus: int = 0
    dodge_bonus: int = 0
    money_bonus_percent: int = 0  # Percentage bonus to money rewards

    def __post_init__(self):
        self.item_type = ItemType.GEAR


@dataclass
class Consumable(Item):
    """Single-use items that can be used during battle."""
    # Effects on self
    health_restore: int = 0
    energy_restore: int = 0
    temp_defence: int = 0
    temp_attack: int = 0
    # Effects on enemy
    damage: int = 0
    enemy_dodge_reduction: int = 0

    def __post_init__(self):
        self.item_type = ItemType.CONSUMABLE


@dataclass
class Robot:
    """A robot fighter."""
    name: str
    # Core stats
    health: int = 10
    max_health: int = 10
    energy: int = 20
    max_energy: int = 20
    defence: int = 0
    attack: int = 0
    hands: int = 2
    dodge: int = 0
    # Progression
    level: int = 1
    exp: int = 0
    money: int = 100
    wins: int = 0
    fights: int = 0
    # Inventory
    inventory_size: int = 4
    inventory: list[Item] = field(default_factory=list)

    def get_weapons(self) -> list[Weapon]:
        """Get all weapons in inventory."""
        return [item for item in self.inventory if isinstance(item, Weapon)]

    def get_gear(self) -> list[Gear]:
        """Get all gear in inventory."""
        return [item for item in self.inventory if isinstance(item, Gear)]

    def get_consumables(self) -> list[Consumable]:
        """Get all consumables in inventory."""
        return [item for item in self.inventory if isinstance(item, Consumable)]

    def get_effective_hands(self) -> int:
        """Get total hands including gear bonuses."""
        bonus = sum(g.hands_bonus for g in self.get_gear())
        return self.hands + bonus

    def get_effective_dodge(self) -> int:
        """Get total dodge including gear bonuses."""
        bonus = sum(g.dodge_bonus for g in self.get_gear())
        return self.dodge + bonus

    def get_effective_defence(self) -> int:
        """Get total defence including gear bonuses."""
        bonus = sum(g.defence_bonus for g in self.get_gear())
        return self.defence + bonus

    def get_effective_max_health(self) -> int:
        """Get total max health including gear bonuses."""
        bonus = sum(g.health_bonus for g in self.get_gear())
        return self.max_health + bonus

    def get_effective_max_energy(self) -> int:
        """Get total max energy including gear bonuses."""
        bonus = sum(g.energy_bonus for g in self.get_gear())
        return self.max_energy + bonus

    def get_money_bonus_percent(self) -> int:
        """Get total money bonus percentage from gear."""
        return sum(g.money_bonus_percent for g in self.get_gear())

    def get_effective_attack(self) -> int:
        """Get total attack percentage including gear bonuses."""
        bonus = sum(g.attack_bonus for g in self.get_gear())
        return self.attack + bonus

    def has_item(self, item_name: str) -> bool:
        """Check if robot has an item by name."""
        return any(item.name == item_name for item in self.inventory)


@dataclass
class Enemy:
    """A static enemy definition."""
    name: str
    level: int
    weapons: list[str]  # Item names
    gear: list[str]  # Item names
    consumables: list[str]  # Item names
    reward: int
    exp_reward: int
    description: str


@dataclass
class BattleRobot:
    """A robot's state during battle (includes temporary effects)."""
    robot: Robot
    current_health: int
    current_energy: int
    temp_defence: int = 0
    temp_attack: int = 0
    temp_dodge_reduction: int = 0  # Applied by enemy
    consumables_used: list[str] = field(default_factory=list)

    @classmethod
    def from_robot(cls, robot: Robot) -> "BattleRobot":
        """Create a battle robot from a robot."""
        return cls(
            robot=robot,
            current_health=robot.get_effective_max_health(),
            current_energy=robot.get_effective_max_energy(),
        )

    def get_effective_dodge(self) -> int:
        """Get dodge accounting for temporary reductions."""
        return max(0, self.robot.get_effective_dodge() - self.temp_dodge_reduction)

    def get_effective_defence(self) -> int:
        """Get defence accounting for temporary bonuses."""
        return self.robot.get_effective_defence() + self.temp_defence

    def is_alive(self) -> bool:
        """Check if robot is still alive."""
        return self.current_health > 0


@dataclass
class PlannedAction:
    """A planned action for simultaneous turn resolution."""
    action_type: str  # "attack", "rest", "consumable"
    weapons: list[Weapon] = field(default_factory=list)
    consumable: Optional[Consumable] = None


@dataclass
class TurnSnapshot:
    """A snapshot of health at a specific turn."""
    turn: int
    player_hp: int
    player_max_hp: int
    enemy_hp: int
    enemy_max_hp: int


@dataclass
class BattleState:
    """The state of an ongoing battle."""
    player: BattleRobot
    enemy: BattleRobot
    player_turn: bool  # True if it's the player's turn (legacy, used for get_current_fighter)
    fight_number: int = 1  # Which fight this is (for display)
    turn_number: int = 1
    battle_log: list[str] = field(default_factory=list)
    last_turn_log: list[str] = field(default_factory=list)  # Combat log from the previous turn
    current_turn_log: list[str] = field(default_factory=list)  # Combat log for current turn
    winner: Optional[str] = None  # "player", "enemy", or None if ongoing
    # Planned actions for simultaneous turn resolution
    player_action: Optional[PlannedAction] = None
    enemy_action: Optional[PlannedAction] = None
    # Turn history for summary screen
    turn_history: list[TurnSnapshot] = field(default_factory=list)

    def get_current_fighter(self) -> BattleRobot:
        """Get the robot whose turn it is."""
        return self.player if self.player_turn else self.enemy

    def get_opponent(self) -> BattleRobot:
        """Get the robot who is not currently acting."""
        return self.enemy if self.player_turn else self.player

    def log(self, message: str) -> None:
        """Add a message to the battle log."""
        self.battle_log.append(message)
        self.current_turn_log.append(message)

    def clear_planned_actions(self) -> None:
        """Clear planned actions for a new turn."""
        self.player_action = None
        self.enemy_action = None


@dataclass
class ActionResult:
    """Result of a battle action."""
    success: bool
    message: str
    damage_dealt: int = 0
    energy_spent: int = 0
    turn_ended: bool = True


@dataclass
class ShopResult:
    """Result of a shop transaction."""
    success: bool
    message: str
    money_spent: int = 0
    money_gained: int = 0

