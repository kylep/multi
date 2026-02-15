Feature: Rate Silly Things — Scoring & Hearts
  As a signed-in user
  I want to rate Silly Things and give hearts
  So that the silliest content gets recognized

  Background:
    Given I am signed in as "Alice"
    And "Alice" has a friend "Bob"
    And "Bob" has a Silly Thing "Dancing in the rain"

  # --- Rating (0-100) ---

  Scenario: Rate a Silly Thing for the first time
    When I view the detail of "Dancing in the rain"
    And I drag the rating slider to 75
    Then the rating is saved as 75 for "Alice" on "Dancing in the rain"
    And the slider shows "75"
    And the average rating on the Silly Thing is updated

  Scenario: Change an existing rating
    Given "Alice" previously rated "Dancing in the rain" as 75
    When I view the detail of "Dancing in the rain"
    Then the rating slider shows 75
    When I drag the rating slider to 90
    Then the rating is updated to 90
    And the average rating on the Silly Thing is recalculated

  Scenario: Rating persists across sessions
    Given "Alice" rated "Dancing in the rain" as 85
    When I force-quit and relaunch the app
    And I view the detail of "Dancing in the rain"
    Then the rating slider shows 85

  Scenario: Rate own Silly Thing
    Given "Alice" has a Silly Thing "I ate cereal for dinner"
    When I view the detail of "I ate cereal for dinner"
    And I drag the rating slider to 50
    Then the rating is saved as 50

  # --- Hearts ---

  Scenario: Give a heart to a Silly Thing
    When I view the detail of "Dancing in the rain"
    And the heart button shows unfilled
    And I tap the heart button
    Then the heart button animates (scale bounce)
    And the heart button shows filled
    And the heart count increases by 1
    And a heart record is created for today

  Scenario: Remove today's heart
    Given "Alice" hearted "Dancing in the rain" today
    When I view the detail of "Dancing in the rain"
    And the heart button shows filled
    And I tap the heart button
    Then the heart button shows unfilled
    And the heart count decreases by 1
    And today's heart record is removed

  Scenario: One heart per Silly Thing per day
    Given "Alice" hearted "Dancing in the rain" today
    And "Alice" removed the heart
    And "Alice" hearted "Dancing in the rain" again today
    Then only one heart record exists for today

  Scenario: Hearts from prior days are permanent
    Given "Alice" hearted "Dancing in the rain" yesterday
    When I view the detail of "Dancing in the rain"
    Then the heart button shows unfilled (for today)
    And the heart count includes yesterday's heart
    And I cannot remove yesterday's heart

  Scenario: Heart from feed card
    When I am viewing the Feed
    And I tap the heart icon on the "Dancing in the rain" card
    Then the heart is toggled for today
    And the heart count updates on the card

  # --- Heart History ---

  Scenario: View heart history
    Given "Dancing in the rain" has the following hearts:
      | User   | Date       |
      | Alice  | 2026-02-14 |
      | Alice  | 2026-02-15 |
      | Bob    | 2026-02-15 |
    When I view the detail of "Dancing in the rain"
    And I tap "Heart History"
    Then I see hearts grouped by date:
      | Date           | Users       |
      | Feb 15, 2026   | Alice, Bob  |
      | Feb 14, 2026   | Alice       |

  Scenario: Heart history empty state
    Given "Dancing in the rain" has no hearts
    When I view the detail of "Dancing in the rain"
    And I tap "Heart History"
    Then I see "No hearts yet. Be the first!"
