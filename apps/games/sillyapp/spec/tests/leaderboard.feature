Feature: Leaderboard — Rankings
  As a signed-in user
  I want to see which Silly Things are the most popular
  So that I can celebrate the silliest moments

  Background:
    Given I am signed in as "Alice"
    And "Alice" has friends "Bob" and "Carol"
    And the following Silly Things exist with stats:
      | Author | Content              | Hearts | Avg Rating | Created          |
      | Alice  | Cat on keyboard      | 15     | 82.5       | 2026-02-10 10:00 |
      | Bob    | Dancing in the rain  | 25     | 91.0       | 2026-02-08 14:00 |
      | Carol  | Mismatched socks     | 8      | 45.0       | 2026-02-12 09:00 |
      | Alice  | Cereal for dinner    | 30     | 78.0       | 2026-01-20 18:00 |
      | Bob    | Talked to a squirrel | 5      | 95.0       | 2025-06-15 12:00 |

  # --- Most Hearts ---

  Scenario: View Most Hearts leaderboard (All Time)
    When I navigate to the Leaderboard tab
    And the "Most Hearts" segment is selected
    And the time period is "All Time"
    Then I see the following ranking:
      | Rank | Content              | Hearts |
      | 1    | Cereal for dinner    | 30     |
      | 2    | Dancing in the rain  | 25     |
      | 3    | Cat on keyboard      | 15     |
      | 4    | Mismatched socks     | 8      |
      | 5    | Talked to a squirrel | 5      |
    And rank 1 shows a gold trophy icon
    And rank 2 shows a silver trophy icon
    And rank 3 shows a bronze trophy icon

  Scenario: View Most Hearts leaderboard (This Month)
    Given today is February 15, 2026
    When I navigate to the Leaderboard tab
    And the "Most Hearts" segment is selected
    And I select the time period "Month"
    Then I only see Silly Things created in February 2026:
      | Rank | Content              | Hearts |
      | 1    | Cat on keyboard      | 15     |
      | 2    | Dancing in the rain  | 25     |
      | 3    | Mismatched socks     | 8      |

  Scenario: View Most Hearts leaderboard (This Week)
    Given today is February 15, 2026
    When I navigate to the Leaderboard tab
    And I select the time period "Week"
    Then I only see Silly Things created in the current week
    And the ranking is ordered by heart count descending

  Scenario: View Most Hearts leaderboard (This Year)
    Given today is February 15, 2026
    When I navigate to the Leaderboard tab
    And I select the time period "Year"
    Then I only see Silly Things created in 2026
    And "Talked to a squirrel" (2025) is excluded

  # --- Most Silly (by Rating) ---

  Scenario: View Most Silly leaderboard (All Time)
    When I navigate to the Leaderboard tab
    And I tap the "Most Silly" segment
    And the time period is "All Time"
    Then I see the following ranking:
      | Rank | Content              | Avg Rating |
      | 1    | Talked to a squirrel | 95.0       |
      | 2    | Dancing in the rain  | 91.0       |
      | 3    | Cat on keyboard      | 82.5       |
      | 4    | Cereal for dinner    | 78.0       |
      | 5    | Mismatched socks     | 45.0       |

  Scenario: Switch between Most Hearts and Most Silly
    When I navigate to the Leaderboard tab
    And I see the "Most Hearts" ranking
    And I tap "Most Silly"
    Then the ranking reorders by average rating
    When I tap "Most Hearts"
    Then the ranking reorders by heart count

  # --- Leaderboard Scope ---

  Scenario: Leaderboard only shows own and friends' content
    Given "Dave" is a registered user but not Alice's friend
    And "Dave" has a Silly Thing with 100 hearts
    When I view the Leaderboard
    Then I do not see Dave's Silly Thing

  # --- Empty State ---

  Scenario: Leaderboard with no Silly Things
    Given "Alice" has no friends
    And "Alice" has no Silly Things
    When I navigate to the Leaderboard tab
    Then I see "No Silly Things to rank yet!"
    And I see a button "Start being silly!"

  # --- Leaderboard Card Details ---

  Scenario: Tap leaderboard entry to view detail
    When I view the Leaderboard
    And I tap on "Dancing in the rain"
    Then I am navigated to the Silly Thing detail view
    And I can rate it and give it a heart
