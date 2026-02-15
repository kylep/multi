Feature: Delete Silly Things
  As a signed-in user
  I want to delete my own Silly Things
  So that I can remove content I no longer want shared

  Background:
    Given I am signed in as "Alice"
    And "Alice" has a text Silly Thing "Embarrassing moment"
    And "Alice" has a photo Silly Thing "silly_photo.jpg"
    And "Bob" has a Silly Thing "Bob's moment"

  # --- Swipe to Delete (Feed) ---

  Scenario: Delete own text Silly Thing via swipe
    When I am viewing the Feed
    And I swipe left on "Embarrassing moment"
    Then I see a red "Delete" button
    When I tap "Delete"
    Then I see a confirmation alert "Delete this Silly Thing? This can't be undone."
    When I tap "Delete" on the confirmation
    Then "Embarrassing moment" is removed from the feed
    And the Silly Thing is deleted from Firestore
    And all ratings for this Silly Thing are deleted
    And all hearts for this Silly Thing are deleted
    And the Silly Thing is removed from local cache

  Scenario: Delete own photo Silly Thing via swipe
    When I am viewing the Feed
    And I swipe left on "silly_photo.jpg"
    And I tap "Delete"
    And I confirm the deletion
    Then the photo is deleted from Cloud Storage
    And the Silly Thing document is deleted from Firestore
    And associated ratings and hearts are deleted

  Scenario: Cancel deletion via swipe
    When I am viewing the Feed
    And I swipe left on "Embarrassing moment"
    And I tap "Delete"
    And I tap "Cancel" on the confirmation
    Then "Embarrassing moment" remains in the feed
    And nothing is deleted

  # --- Delete from Detail View ---

  Scenario: Delete via detail view menu
    When I tap on "Embarrassing moment" to view its detail
    And I tap the "..." menu button
    Then I see a "Delete" option
    When I tap "Delete"
    Then I see a confirmation alert "Delete this Silly Thing? This can't be undone."
    When I tap "Delete" on the confirmation
    Then the Silly Thing is deleted
    And I am navigated back to the Feed

  Scenario: Menu options for own Silly Thing
    When I tap on "Embarrassing moment" to view its detail
    And I tap the "..." menu button
    Then I see "Delete" in the menu options

  # --- Cannot Delete Others' Content ---

  Scenario: Cannot swipe-delete another user's Silly Thing
    When I am viewing the Feed
    Then "Bob's moment" does not show a swipe-to-delete action

  Scenario: No delete option in detail view for others' content
    When I tap on "Bob's moment" to view its detail
    And I tap the "..." menu button
    Then I do not see a "Delete" option

  # --- Cascade Deletion ---

  Scenario: Deleting a Silly Thing removes all associated data
    Given "Embarrassing moment" has the following data:
      | Data Type | Count |
      | Ratings   | 3     |
      | Hearts    | 5     |
    When I delete "Embarrassing moment"
    Then all 3 ratings are deleted from Firestore
    And all 5 hearts are deleted from Firestore
    And the Silly Thing document is deleted
    And if it had a photo, the photo is deleted from Cloud Storage
