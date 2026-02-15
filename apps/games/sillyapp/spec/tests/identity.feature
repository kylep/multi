Feature: Identity — Authentication & Session Management
  As a user of Silly App
  I want to sign in with my Google account
  So that my Silly Things are tied to my identity and I can interact with friends

  Background:
    Given the app is installed on the device
    And the device has an internet connection

  # --- Sign In ---

  Scenario: Successful Google OAuth sign-in (first time)
    Given I am not signed in
    When I launch the app
    Then I see the Login screen with the app logo
    And I see a "Sign in with Google" button
    When I tap "Sign in with Google"
    And I complete the Google OAuth flow with valid credentials
    Then a new user profile is created in Firestore
    And I am navigated to the Feed tab
    And my display name appears in the Profile tab

  Scenario: Successful Google OAuth sign-in (returning user)
    Given I have previously signed in
    And my user profile exists in Firestore
    When I launch the app
    Then I am automatically signed in
    And I am navigated to the Feed tab

  Scenario: Sign-in cancelled by user
    Given I am not signed in
    When I tap "Sign in with Google"
    And I cancel the Google OAuth flow
    Then I remain on the Login screen
    And I see no error message

  Scenario: Sign-in fails due to network error
    Given I am not signed in
    And the device has no internet connection
    When I tap "Sign in with Google"
    Then I see an error message "Unable to sign in. Check your connection."
    And I remain on the Login screen

  # --- Sign Out ---

  Scenario: Successful sign-out
    Given I am signed in as "Alice"
    When I navigate to the Profile tab
    And I tap "Sign Out"
    Then I am navigated to the Login screen
    And my session is cleared
    And launching the app again shows the Login screen

  # --- Session Persistence ---

  Scenario: Session persists across app restarts
    Given I am signed in as "Alice"
    When I force-quit and relaunch the app
    Then I am automatically signed in as "Alice"
    And I see the Feed tab

  Scenario: Session persists across backgrounding
    Given I am signed in as "Alice"
    When I background the app for 5 minutes
    And I foreground the app
    Then I remain signed in as "Alice"
