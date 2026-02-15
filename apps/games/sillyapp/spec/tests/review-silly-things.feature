Feature: Review Silly Things — Feed & Browsing
  As a signed-in user
  I want to browse Silly Things from myself and my friends
  So that I can enjoy and interact with silly content

  Background:
    Given I am signed in as "Alice"
    And "Alice" has friends "Bob" and "Carol"
    And the following Silly Things exist:
      | Author | Type  | Content                  | Created          |
      | Alice  | text  | Cat on keyboard          | 2026-02-15 10:00 |
      | Bob    | photo | silly_face.jpg           | 2026-02-15 09:00 |
      | Carol  | text  | Wore mismatched shoes    | 2026-02-14 18:00 |
      | Alice  | text  | Talked to a plant        | 2025-02-15 12:00 |

  # --- Chronological Feed ---

  Scenario: View feed in chronological order
    When I navigate to the Feed tab
    Then I see Silly Things ordered newest first:
      | Content                  |
      | Cat on keyboard          |
      | silly_face.jpg           |
      | Wore mismatched shoes    |
    And each card shows the author name and avatar
    And each card shows a relative timestamp
    And each card shows the heart count

  Scenario: Pull to refresh feed
    When I am viewing the Feed
    And a new Silly Thing is created by "Bob"
    And I pull to refresh
    Then I see Bob's new Silly Thing at the top

  Scenario: Paginate feed on scroll
    Given there are 50 Silly Things in the feed
    When I scroll to the bottom of the feed
    Then 20 more Silly Things are loaded
    And I can continue scrolling

  # --- Filter by Friend ---

  Scenario: Filter feed to a specific friend
    When I am viewing the Feed
    And I tap the filter control
    And I select "Bob"
    Then I only see Silly Things authored by "Bob"
    And the filter shows "Bob" as active

  Scenario: Filter feed to my own Silly Things
    When I am viewing the Feed
    And I tap the filter control
    And I select "Mine"
    Then I only see Silly Things authored by "Alice"

  Scenario: Clear feed filter
    Given the feed is filtered to "Bob"
    When I tap the filter control
    And I select "All"
    Then I see Silly Things from all friends and myself

  # --- Silly Thing of the Day ---

  Scenario: Silly Thing of the Day shows prior year content
    Given today is February 15, 2026
    And "Alice" created "Talked to a plant" on February 15, 2025
    When I view the Silly Thing of the Day section
    Then I see "Talked to a plant" with label "From 1 year ago!"

  Scenario: Silly Thing of the Day with no matches
    Given there are no Silly Things from this calendar day in prior years
    When I view the Silly Thing of the Day section
    Then I see "No silly memories from this day yet."

  Scenario: Silly Thing of the Day push notification
    Given "Alice" has push notifications enabled
    And there are matching Silly Things from this day in prior years
    Then "Alice" receives a push notification at 9:00 AM local time
    And the notification says "You have a silly memory from this day!"
    When I tap the notification
    Then I am navigated to the Silly Thing of the Day view

  # --- Detail View ---

  Scenario: View Silly Thing detail (text)
    When I tap on a text Silly Thing "Cat on keyboard"
    Then I see the full text content
    And I see the author name and avatar
    And I see the timestamp
    And I see the rating slider
    And I see the heart button
    And I see a "Heart History" link

  Scenario: View Silly Thing detail (photo)
    When I tap on a photo Silly Thing
    Then I see the photo displayed full-screen
    And I can pinch to zoom the photo
    And I see the caption (if any)
    And I see the rating slider and heart button

  # --- Empty States ---

  Scenario: Empty feed (no Silly Things)
    Given "Alice" has no friends
    And "Alice" has created no Silly Things
    When I navigate to the Feed tab
    Then I see the empty feed illustration
    And I see "No Silly Things yet!"
    And I see a button "Add your first Silly Thing!"
    When I tap "Add your first Silly Thing!"
    Then I am navigated to the Create tab
