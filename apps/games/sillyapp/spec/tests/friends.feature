Feature: Friends — Social Connections
  As a signed-in user
  I want to manage friendships
  So that I can share and view Silly Things with people I know

  Background:
    Given I am signed in as "Alice"

  # --- Invite Friend ---

  Scenario: Send a friend invite to an existing user
    Given "Bob" is a registered user with email "bob@example.com"
    And "Alice" and "Bob" are not friends
    When I navigate to the Friends tab
    And I tap "Invite Friend"
    And I enter "bob@example.com"
    And I tap "Send Invite"
    Then a friendship record is created with status "pending"
    And I see "Invite sent to Bob!"
    And "Bob" appears in my "Pending Sent" section

  Scenario: Invite a non-existent user
    When I navigate to the Friends tab
    And I tap "Invite Friend"
    And I enter "nobody@example.com"
    And I tap "Send Invite"
    Then I see "No user found with that email"
    And no friendship record is created

  Scenario: Cannot invite yourself
    When I navigate to the Friends tab
    And I tap "Invite Friend"
    And I enter Alice's own email address
    And I tap "Send Invite"
    Then I see "You can't invite yourself!"

  Scenario: Cannot send duplicate invite
    Given "Alice" has already sent an invite to "Bob"
    When I try to send another invite to "Bob"
    Then I see "You already have a pending invite to Bob"

  # --- Accept / Decline Invites ---

  Scenario: Accept a friend invite
    Given "Bob" has sent "Alice" a friend invite
    When I navigate to the Friends tab
    Then I see a badge on the Friends tab indicating 1 pending invite
    And I see "Bob" in the "Pending Invites" section
    When I tap "Accept" on Bob's invite
    Then the friendship status is updated to "accepted"
    And "Bob" appears in my friends list
    And "Alice" appears in Bob's friends list

  Scenario: Decline a friend invite
    Given "Bob" has sent "Alice" a friend invite
    When I navigate to the Friends tab
    And I tap "Decline" on Bob's invite
    Then the friendship status is updated to "declined"
    And "Bob" does not appear in my friends list
    And the invite is removed from my pending list

  Scenario: Review multiple pending invites
    Given "Bob" and "Carol" have sent "Alice" friend invites
    When I navigate to the Friends tab
    Then I see a badge showing 2 pending invites
    And I see both "Bob" and "Carol" in the "Pending Invites" section
    When I accept "Bob" and decline "Carol"
    Then "Bob" is in my friends list
    And "Carol" is not in my friends list

  # --- Remove Friend ---

  Scenario: Remove a friend via swipe
    Given "Alice" and "Bob" are friends
    When I navigate to the Friends tab
    And I swipe left on "Bob" in my friends list
    And I tap "Remove"
    Then I see a confirmation alert "Remove Bob as a friend?"
    When I tap "Remove" on the confirmation
    Then "Bob" is removed from my friends list
    And "Alice" is removed from Bob's friends list
    And the friendship record is deleted

  Scenario: Cancel friend removal
    Given "Alice" and "Bob" are friends
    When I navigate to the Friends tab
    And I swipe left on "Bob" in my friends list
    And I tap "Remove"
    And I tap "Cancel" on the confirmation
    Then "Bob" remains in my friends list

  # --- Friends List ---

  Scenario: View friends list
    Given "Alice" has friends "Bob" and "Carol"
    When I navigate to the Friends tab
    Then I see "Bob" and "Carol" with their avatars and names
    And the list is sorted alphabetically

  Scenario: Tap friend to view their feed
    Given "Alice" has a friend "Bob"
    When I navigate to the Friends tab
    And I tap on "Bob"
    Then I am navigated to the Feed filtered to Bob's Silly Things

  Scenario: Empty friends list
    Given "Alice" has no friends and no pending invites
    When I navigate to the Friends tab
    Then I see the empty friends illustration
    And I see "No friends yet!"
    And I see a button "Invite your first friend!"
