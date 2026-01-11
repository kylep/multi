"""Shop engine for Robo Text Battle."""

import copy

from robotext.models import Gear, Item, Robot, ShopResult
from robotext.state import GameState


def list_available_items(state: GameState) -> list[Item]:
    """List all items available for purchase at the player's level."""
    player = state.get_player()
    return state.registry.get_items_for_level(player.level)


def check_requirements(robot: Robot, item: Item) -> tuple[bool, str]:
    """Check if a robot meets the requirements to use an item."""
    for req in item.requirements:
        if not robot.has_item(req):
            return False, f"Requires {req}"
    return True, ""


def can_buy(state: GameState, item: Item) -> tuple[bool, str]:
    """Check if the player can buy an item. Returns (can_buy, reason)."""
    player = state.get_player()

    # Check level
    if item.level > player.level:
        return False, f"Requires level {item.level}"

    # Check money
    if player.money < item.money_cost:
        return False, f"Not enough money (need {item.money_cost}, have {player.money})"

    # Check inventory space
    if len(player.inventory) >= player.inventory_size:
        return False, "Inventory is full"

    # Check requirements
    meets_req, req_msg = check_requirements(player, item)
    if not meets_req:
        return False, req_msg

    # Check gear stacking (gear doesn't stack)
    if isinstance(item, Gear):
        if any(existing.name == item.name for existing in player.get_gear()):
            return False, "You already have this gear equipped"

    return True, ""


def buy_item(state: GameState, item: Item) -> ShopResult:
    """Attempt to buy an item. Returns the result."""
    can, reason = can_buy(state, item)
    if not can:
        return ShopResult(success=False, message=reason)

    player = state.get_player()
    player.money -= item.money_cost
    # Create a copy so each purchased item is a unique instance
    player.inventory.append(copy.copy(item))

    return ShopResult(
        success=True,
        message=f"Bought {item.name} for ${item.money_cost}",
        money_spent=item.money_cost,
    )


def get_sell_price(item: Item) -> int:
    """Get the sell price of an item (half of buy price)."""
    return item.money_cost // 2


def sell_item(state: GameState, item: Item) -> ShopResult:
    """Attempt to sell an item. Returns the result."""
    player = state.get_player()

    if item not in player.inventory:
        return ShopResult(success=False, message="Item not in inventory")

    sell_price = get_sell_price(item)
    player.inventory.remove(item)
    player.money += sell_price

    return ShopResult(
        success=True,
        message=f"Sold {item.name} for ${sell_price}",
        money_gained=sell_price,
    )


def get_item_by_index(state: GameState, index: int, from_shop: bool = True) -> Item | None:
    """Get an item by its display index (1-based)."""
    if from_shop:
        items = list_available_items(state)
    else:
        items = state.get_player().inventory

    if 1 <= index <= len(items):
        return items[index - 1]
    return None

