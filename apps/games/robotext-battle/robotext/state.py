"""Game state management for Robo Text Battle."""

from dataclasses import dataclass, field

from robotext.assets import AssetRegistry
from robotext.models import Item, Robot


@dataclass
class GameState:
    """The overall state of a game session."""
    registry: AssetRegistry
    player: Robot | None = None

    def create_player(self, name: str) -> Robot:
        """Create a new player robot with default stats."""
        self.player = Robot(
            name=name,
            money=self.registry.starting_money,
            **self.registry.default_robot_stats,
        )
        # Sync health/energy to effective max
        self.player.health = self.player.get_effective_max_health()
        self.player.energy = self.player.get_effective_max_energy()
        return self.player

    def get_player(self) -> Robot:
        """Get the player robot, raising if not created."""
        if self.player is None:
            raise ValueError("Player not created yet")
        return self.player

    def add_item_to_inventory(self, item: Item) -> bool:
        """Add an item to the player's inventory if there's space."""
        player = self.get_player()
        if len(player.inventory) >= player.inventory_size:
            return False
        player.inventory.append(item)
        return True

    def remove_item_from_inventory(self, item: Item) -> bool:
        """Remove an item from the player's inventory."""
        player = self.get_player()
        if item in player.inventory:
            player.inventory.remove(item)
            return True
        return False

    def get_inventory_space(self) -> int:
        """Get remaining inventory space."""
        player = self.get_player()
        return player.inventory_size - len(player.inventory)

    def award_money(self, base_amount: int) -> int:
        """Award money to the player, applying any bonuses. Returns actual amount."""
        player = self.get_player()
        bonus_percent = player.get_money_bonus_percent()
        actual_amount = base_amount + (base_amount * bonus_percent // 100)
        player.money += actual_amount
        return actual_amount

    def spend_money(self, amount: int) -> bool:
        """Spend money if the player has enough. Returns success."""
        player = self.get_player()
        if player.money >= amount:
            player.money -= amount
            return True
        return False

    def record_fight(self, won: bool) -> None:
        """Record a fight result."""
        player = self.get_player()
        player.fights += 1
        if won:
            player.wins += 1

    def award_exp(self, amount: int) -> bool:
        """Award experience to the player. Returns True if leveled up."""
        player = self.get_player()
        player.exp += amount
        leveled_up = False

        # Level up every 10 exp
        while player.exp >= 10:
            player.exp -= 10
            player.level += 1
            leveled_up = True

        return leveled_up

