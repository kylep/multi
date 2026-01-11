"""Battle engine for Robo Text Battle."""

import random
from typing import Optional

from robotext.models import (
    ActionResult,
    BattleRobot,
    BattleState,
    Consumable,
    PlannedAction,
    Robot,
    TurnSnapshot,
    Weapon,
)


def record_turn_snapshot(battle: BattleState) -> None:
    """Record the current health state as a turn snapshot."""
    snapshot = TurnSnapshot(
        turn=battle.turn_number,
        player_hp=battle.player.current_health,
        player_max_hp=battle.player.robot.get_effective_max_health(),
        enemy_hp=battle.enemy.current_health,
        enemy_max_hp=battle.enemy.robot.get_effective_max_health(),
    )
    battle.turn_history.append(snapshot)


def create_battle(player: Robot, enemy: Robot, rng: Optional[random.Random] = None, fight_number: int = 1) -> BattleState:
    """Create a new battle between two robots."""
    if rng is None:
        rng = random.Random()

    player_battle = BattleRobot.from_robot(player)
    enemy_battle = BattleRobot.from_robot(enemy)

    battle = BattleState(
        player=player_battle,
        enemy=enemy_battle,
        player_turn=True,  # Used for get_current_fighter compatibility
        fight_number=fight_number,
    )

    battle.log(f"Battle begins! Both robots choose their actions simultaneously.")

    return battle


def calculate_hit_chance(accuracy: int, dodge: int) -> float:
    """Calculate the chance to hit (0.0 to 1.0)."""
    hit_chance = (accuracy - dodge) / 100.0
    return max(0.0, min(1.0, hit_chance))


def calculate_damage(
    weapon: Weapon,
    attacker: BattleRobot,
    defender: BattleRobot,
) -> int:
    """Calculate damage dealt by a weapon.
    
    Attack is a percentage multiplier: damage = base_damage * (1 + attack/100) - defence
    """
    base_damage = weapon.damage
    # Attack is a percentage bonus (e.g., 10 = +10% damage)
    attack_percent = attacker.robot.get_effective_attack() + attacker.temp_attack
    defence = defender.get_effective_defence()

    # Apply percentage multiplier to base damage
    modified_damage = base_damage * (1 + attack_percent / 100)
    damage = int(modified_damage) - defence
    return max(0, damage)


def execute_attack(
    battle: BattleState,
    weapons: list[Weapon],
    rng: Optional[random.Random] = None,
    *,
    weapon_indices: list[int] | None = None,
) -> ActionResult:
    """Execute an attack using the specified weapons.
    
    Args:
        battle: The current battle state
        weapons: List of weapon objects to use
        rng: Random number generator for hit calculations
        weapon_indices: Original inventory indices for each weapon (for display)
    """
    if rng is None:
        rng = random.Random()

    attacker = battle.get_current_fighter()
    defender = battle.get_opponent()

    if not weapons:
        return ActionResult(
            success=False,
            message="No weapons selected",
            turn_ended=False,
        )

    # Check for duplicate weapon indices (same weapon used twice)
    if weapon_indices is not None:
        if len(weapon_indices) != len(set(weapon_indices)):
            return ActionResult(
                success=False,
                message="You can only use each weapon once per attack",
                turn_ended=False,
            )

    # Check hands requirement
    total_hands_needed = sum(w.hands for w in weapons)
    available_hands = attacker.robot.get_effective_hands()
    if total_hands_needed > available_hands:
        return ActionResult(
            success=False,
            message=f"Not enough hands (need {total_hands_needed}, have {available_hands})",
            turn_ended=False,
        )

    # Check energy requirement
    total_energy_needed = sum(w.energy_cost for w in weapons)
    if total_energy_needed > attacker.current_energy:
        return ActionResult(
            success=False,
            message=f"Not enough energy (need {total_energy_needed}, have {attacker.current_energy})",
            turn_ended=False,
        )

    # Check weapon requirements (e.g., shotgun shells)
    for weapon in weapons:
        for req in weapon.requirements:
            if not attacker.robot.has_item(req):
                return ActionResult(
                    success=False,
                    message=f"{weapon.name} requires {req}",
                    turn_ended=False,
                )

    # Spend energy
    attacker.current_energy -= total_energy_needed

    # Consume requirements (like shotgun shells)
    for weapon in weapons:
        for req in weapon.requirements:
            # Find and remove the required item
            for item in attacker.robot.inventory:
                if item.name == req:
                    attacker.robot.inventory.remove(item)
                    battle.log(f"{attacker.robot.name} used {req}")
                    break

    # Log attack header first
    battle.log(f"{attacker.robot.name} attacks!")
    
    # Execute attacks and log individual weapon results
    total_damage = 0
    messages = []

    for i, weapon in enumerate(weapons, 1):
        hit_chance = calculate_hit_chance(weapon.accuracy, defender.get_effective_dodge())
        roll = rng.random()

        if roll <= hit_chance:
            damage = calculate_damage(weapon, attacker, defender)
            total_damage += damage
            defender.current_health -= damage
            msg = f"  {weapon.name} {i} hits for {damage} damage"
            messages.append(msg)
            battle.log(msg)
        else:
            msg = f"  {weapon.name} {i} misses!"
            messages.append(msg)
            battle.log(msg)

    # Check for victory
    check_victory(battle)

    return ActionResult(
        success=True,
        message="\n".join(messages),
        damage_dealt=total_damage,
        energy_spent=total_energy_needed,
        turn_ended=True,
    )


def execute_rest(battle: BattleState) -> ActionResult:
    """Execute a rest action to regenerate energy."""
    attacker = battle.get_current_fighter()

    # Restore some energy (base 5)
    energy_restored = 5
    max_energy = attacker.robot.get_effective_max_energy()
    actual_restored = min(energy_restored, max_energy - attacker.current_energy)
    attacker.current_energy += actual_restored

    battle.log(f"{attacker.robot.name} rests and recovers {actual_restored} energy")

    return ActionResult(
        success=True,
        message=f"Recovered {actual_restored} energy",
        turn_ended=True,
    )


def use_consumable(battle: BattleState, consumable: Consumable) -> ActionResult:
    """Use a consumable item during battle."""
    attacker = battle.get_current_fighter()
    defender = battle.get_opponent()

    # Check if we have the consumable
    if consumable.name in attacker.consumables_used:
        return ActionResult(
            success=False,
            message="Already used this consumable",
            turn_ended=False,
        )

    if not attacker.robot.has_item(consumable.name):
        return ActionResult(
            success=False,
            message="Don't have this consumable",
            turn_ended=False,
        )

    # Mark as used and remove from inventory
    attacker.consumables_used.append(consumable.name)
    for item in attacker.robot.inventory:
        if item.name == consumable.name:
            attacker.robot.inventory.remove(item)
            break

    effects = []

    # Apply self effects
    if consumable.health_restore > 0:
        max_health = attacker.robot.get_effective_max_health()
        actual_restore = min(consumable.health_restore, max_health - attacker.current_health)
        attacker.current_health += actual_restore
        effects.append(f"+{actual_restore} health")

    if consumable.energy_restore > 0:
        max_energy = attacker.robot.get_effective_max_energy()
        actual_restore = min(consumable.energy_restore, max_energy - attacker.current_energy)
        attacker.current_energy += actual_restore
        effects.append(f"+{actual_restore} energy")

    if consumable.temp_defence > 0:
        attacker.temp_defence += consumable.temp_defence
        effects.append(f"+{consumable.temp_defence} temp defence")

    if consumable.temp_attack > 0:
        attacker.temp_attack += consumable.temp_attack
        effects.append(f"+{consumable.temp_attack} temp attack")

    # Apply enemy effects
    if consumable.damage > 0:
        defender.current_health -= consumable.damage
        effects.append(f"{consumable.damage} damage to enemy")

    if consumable.enemy_dodge_reduction > 0:
        defender.temp_dodge_reduction += consumable.enemy_dodge_reduction
        effects.append(f"-{consumable.enemy_dodge_reduction} enemy dodge")

    battle.log(f"{attacker.robot.name} uses {consumable.name}: {', '.join(effects)}")

    # Check for victory
    check_victory(battle)

    # Using items does NOT end turn
    return ActionResult(
        success=True,
        message=f"Used {consumable.name}: {', '.join(effects)}",
        turn_ended=False,
    )


def check_victory(battle: BattleState) -> Optional[str]:
    """Check if the battle has ended. Returns winner or None."""
    if not battle.player.is_alive():
        battle.winner = "enemy"
        battle.log(f"{battle.player.robot.name} has been destroyed!")
        return "enemy"

    if not battle.enemy.is_alive():
        battle.winner = "player"
        battle.log(f"{battle.enemy.robot.name} has been destroyed!")
        return "player"

    return None


def end_turn(battle: BattleState) -> None:
    """End the current turn and prepare for the next."""
    # Record turn snapshot before incrementing
    record_turn_snapshot(battle)
    
    # Save current turn's log as last turn's log before switching
    battle.last_turn_log = battle.current_turn_log.copy()
    battle.current_turn_log = []
    
    # Clear planned actions
    battle.clear_planned_actions()
    
    battle.turn_number += 1


def plan_attack(battle: BattleState, weapons: list[Weapon], is_player: bool) -> ActionResult:
    """Plan an attack action (doesn't execute yet).
    
    Returns ActionResult indicating if the plan is valid.
    """
    fighter = battle.player if is_player else battle.enemy
    
    if not weapons:
        return ActionResult(
            success=False,
            message="No weapons selected",
            turn_ended=False,
        )

    # Check hands requirement
    total_hands_needed = sum(w.hands for w in weapons)
    available_hands = fighter.robot.get_effective_hands()
    if total_hands_needed > available_hands:
        return ActionResult(
            success=False,
            message=f"Not enough hands (need {total_hands_needed}, have {available_hands})",
            turn_ended=False,
        )

    # Check energy requirement
    total_energy_needed = sum(w.energy_cost for w in weapons)
    if total_energy_needed > fighter.current_energy:
        return ActionResult(
            success=False,
            message=f"Not enough energy (need {total_energy_needed}, have {fighter.current_energy})",
            turn_ended=False,
        )

    # Check weapon requirements (e.g., shotgun shells)
    for weapon in weapons:
        for req in weapon.requirements:
            if not fighter.robot.has_item(req):
                return ActionResult(
                    success=False,
                    message=f"{weapon.name} requires {req}",
                    turn_ended=False,
                )

    # Store the planned action
    action = PlannedAction(action_type="attack", weapons=weapons)
    if is_player:
        battle.player_action = action
    else:
        battle.enemy_action = action

    return ActionResult(
        success=True,
        message=f"Planned attack with {', '.join(w.name for w in weapons)}",
        turn_ended=True,
    )


def plan_rest(battle: BattleState, is_player: bool) -> ActionResult:
    """Plan a rest action."""
    action = PlannedAction(action_type="rest")
    if is_player:
        battle.player_action = action
    else:
        battle.enemy_action = action

    return ActionResult(
        success=True,
        message="Planned to rest",
        turn_ended=True,
    )


def plan_consumable(battle: BattleState, consumable: Consumable, is_player: bool) -> ActionResult:
    """Plan to use a consumable."""
    fighter = battle.player if is_player else battle.enemy
    
    if consumable.name in fighter.consumables_used:
        return ActionResult(
            success=False,
            message="Already used this consumable",
            turn_ended=False,
        )

    if not fighter.robot.has_item(consumable.name):
        return ActionResult(
            success=False,
            message="Don't have this consumable",
            turn_ended=False,
        )

    action = PlannedAction(action_type="consumable", consumable=consumable)
    if is_player:
        battle.player_action = action
    else:
        battle.enemy_action = action

    return ActionResult(
        success=True,
        message=f"Planned to use {consumable.name}",
        turn_ended=True,
    )


def execute_planned_action(
    battle: BattleState,
    action: PlannedAction,
    is_player: bool,
    rng: random.Random,
) -> ActionResult:
    """Execute a single planned action."""
    # Temporarily set player_turn so get_current_fighter/get_opponent work correctly
    battle.player_turn = is_player
    
    if action.action_type == "attack":
        return execute_attack(battle, action.weapons, rng)
    elif action.action_type == "rest":
        return execute_rest(battle)
    elif action.action_type == "consumable" and action.consumable:
        return use_consumable(battle, action.consumable)
    else:
        return ActionResult(success=False, message="Invalid action", turn_ended=True)


def resolve_turn(battle: BattleState, rng: Optional[random.Random] = None) -> list[tuple[str, ActionResult]]:
    """Resolve both planned actions in random order.
    
    Returns list of (actor_name, result) tuples in the order they were executed.
    """
    if rng is None:
        rng = random.Random()

    results: list[tuple[str, ActionResult]] = []
    
    # Determine order randomly
    player_first = rng.choice([True, False])
    
    if player_first:
        order = [
            ("player", battle.player_action, True),
            ("enemy", battle.enemy_action, False),
        ]
    else:
        order = [
            ("enemy", battle.enemy_action, False),
            ("player", battle.player_action, True),
        ]

    for name, action, is_player in order:
        if battle.winner:
            break  # Battle already ended
            
        if action is None:
            # Default to rest if no action planned
            action = PlannedAction(action_type="rest")
        
        result = execute_planned_action(battle, action, is_player, rng)
        actor = battle.player.robot.name if is_player else battle.enemy.robot.name
        results.append((actor, result))

    return results


def enemy_ai_turn(battle: BattleState, rng: Optional[random.Random] = None) -> list[ActionResult]:
    """Execute the enemy AI's turn (legacy). Returns list of actions taken.
    
    This is kept for backwards compatibility with tests.
    """
    if rng is None:
        rng = random.Random()

    results = []
    enemy = battle.enemy

    # First, use any consumables
    for consumable in enemy.robot.get_consumables():
        if consumable.name not in enemy.consumables_used:
            result = use_consumable(battle, consumable)
            results.append(result)
            if battle.winner:
                return results

    # Then, attack if we have energy and weapons
    weapons = enemy.robot.get_weapons()
    if weapons and enemy.current_energy > 0:
        selected_weapons = ai_select_weapons(enemy)

        if selected_weapons:
            result = execute_attack(battle, selected_weapons, rng)
            results.append(result)
            return results

    # If we can't attack, rest
    result = execute_rest(battle)
    results.append(result)
    return results


def ai_select_weapons(fighter: BattleRobot) -> list[Weapon]:
    """AI logic to select weapons for an attack."""
    weapons = fighter.robot.get_weapons()
    if not weapons or fighter.current_energy <= 0:
        return []
    
    available_hands = fighter.robot.get_effective_hands()
    available_energy = fighter.current_energy

    # Sort weapons by damage-per-hand ratio (best efficiency first)
    usable_weapons = []
    for weapon in weapons:
        has_requirements = all(
            fighter.robot.has_item(req) for req in weapon.requirements
        )
        if has_requirements and weapon.energy_cost <= available_energy:
            usable_weapons.append(weapon)

    # Sort by damage per hand (descending)
    usable_weapons.sort(key=lambda w: w.damage / w.hands, reverse=True)

    # Select weapons - each weapon can only be used once per attack
    selected_weapons = []
    used_weapon_ids = set()
    for weapon in usable_weapons:
        weapon_id = id(weapon)  # Unique per instance
        if weapon_id not in used_weapon_ids:
            if weapon.hands <= available_hands and weapon.energy_cost <= available_energy:
                selected_weapons.append(weapon)
                used_weapon_ids.add(weapon_id)
                available_hands -= weapon.hands
                available_energy -= weapon.energy_cost

    return selected_weapons


def ai_plan_action(battle: BattleState, is_player: bool) -> PlannedAction:
    """AI logic to plan an action for a robot.
    
    Used for enemy AI and for suggesting defaults to the player.
    """
    fighter = battle.player if is_player else battle.enemy
    
    # First, check if we should use a consumable
    for consumable in fighter.robot.get_consumables():
        if consumable.name not in fighter.consumables_used:
            return PlannedAction(action_type="consumable", consumable=consumable)

    # Then, try to attack
    selected_weapons = ai_select_weapons(fighter)
    if selected_weapons:
        return PlannedAction(action_type="attack", weapons=selected_weapons)

    # Default to rest
    return PlannedAction(action_type="rest")


def get_battle_status(battle: BattleState, use_fancy: bool = True) -> str:
    """Get a formatted status string for the battle.
    
    Args:
        battle: The current battle state
        use_fancy: Whether to use fancy box drawing characters
    """
    player = battle.player
    enemy = battle.enemy
    
    # Calculate HP bar values
    player_hp_pct = int((player.current_health / player.robot.get_effective_max_health()) * 100) if player.robot.get_effective_max_health() > 0 else 0
    enemy_hp_pct = int((enemy.current_health / enemy.robot.get_effective_max_health()) * 100) if enemy.robot.get_effective_max_health() > 0 else 0
    
    def hp_bar(current: int, maximum: int, width: int = 30) -> str:
        if maximum == 0:
            return "[" + "░" * width + "]"
        filled = int((current / maximum) * width)
        empty = width - filled
        return "[" + "█" * filled + "░" * empty + "]"
    
    def energy_bar(current: int, maximum: int, width: int = 30) -> str:
        if maximum == 0:
            return "[" + "░" * width + "]"
        filled = int((current / maximum) * width)
        empty = width - filled
        return "[" + "▓" * filled + "░" * empty + "]"
    
    if use_fancy:
        lines = [
            f"╔══════════════════════════════════════════════╗",
            f"║  ⚔ FIGHT #{battle.fight_number}: vs {enemy.robot.name}",
            f"╚══════════════════════════════════════════════╝",
            f"",
            f"════════════ TURN {battle.turn_number} ════════════",
            f"",
            f"♥ {player.robot.name} (You)",
            f"  Health: {hp_bar(player.current_health, player.robot.get_effective_max_health())} {player.current_health}/{player.robot.get_effective_max_health()}",
            f"  Energy: {energy_bar(player.current_energy, player.robot.get_effective_max_energy())} ⚡ {player.current_energy}/{player.robot.get_effective_max_energy()}",
            f"",
            f"────────────────────────────────────────────────",
            f"",
            f"♥ {enemy.robot.name} (Enemy)",
            f"  Health: {hp_bar(enemy.current_health, enemy.robot.get_effective_max_health())} {enemy.current_health}/{enemy.robot.get_effective_max_health()}",
            f"  Energy: {energy_bar(enemy.current_energy, enemy.robot.get_effective_max_energy())} ⚡ {enemy.current_energy}/{enemy.robot.get_effective_max_energy()}",
        ]
    else:
        lines = [
            f"FIGHT #{battle.fight_number}: vs {enemy.robot.name}",
            f"",
            f"=== Turn {battle.turn_number} ===",
            f"",
            f"{player.robot.name} (You)",
            f"  Health: {player.current_health}/{player.robot.get_effective_max_health()}",
            f"  Energy: {player.current_energy}/{player.robot.get_effective_max_energy()}",
            f"",
            f"{enemy.robot.name} (Enemy)",
            f"  Health: {enemy.current_health}/{enemy.robot.get_effective_max_health()}",
            f"  Energy: {enemy.current_energy}/{enemy.robot.get_effective_max_energy()}",
        ]
    
    # Add last turn's combat log if available
    if battle.last_turn_log:
        lines.append("")
        if use_fancy:
            lines.append("──── Last Turn ────")
        else:
            lines.append("--- Last Turn ---")
        for entry in battle.last_turn_log:
            lines.append(f"  {entry}")

    return "\n".join(lines)

