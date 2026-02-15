Feature: Track Silly Things — Create Content
  As a signed-in user
  I want to create Silly Things (text and photos)
  So that I can share silly moments with my friends

  Background:
    Given I am signed in as "Alice"
    And I am on the Feed tab

  # --- Text Silly Things ---

  Scenario: Add a text Silly Thing
    When I navigate to the Create tab
    And I see the Create Silly Thing screen
    And I tap the text entry option
    And I type "My cat fell off the table again"
    And I tap "Post"
    Then the Silly Thing is saved to Firestore
    And the Silly Thing is cached locally
    And I am navigated to the Feed tab
    And I see "My cat fell off the table again" in my feed

  Scenario: Text Silly Thing cannot be empty
    When I navigate to the Create tab
    And I tap the text entry option
    And I leave the text field empty
    Then the "Post" button is disabled

  Scenario: Text Silly Thing has max length
    When I navigate to the Create tab
    And I tap the text entry option
    And I type a message exceeding 500 characters
    Then the text is truncated to 500 characters
    And I see a character count indicator showing "500/500"

  # --- Photo Silly Things (Camera) ---

  Scenario: Add a photo Silly Thing from camera
    When I navigate to the Create tab
    And I tap the camera option
    And the camera permission is granted
    And I take a photo
    Then I see a preview of the photo
    When I optionally add a caption "Silly face"
    And I tap "Post"
    Then the photo is compressed to under 1MB
    And the photo is uploaded to Cloud Storage
    And the Silly Thing is saved to Firestore with the photo URL
    And I am navigated to the Feed tab
    And I see the photo Silly Thing in my feed

  Scenario: Camera permission denied
    When I navigate to the Create tab
    And I tap the camera option
    And the camera permission is denied
    Then I see a message "Camera access is required to take photos"
    And I see a button to open Settings

  # --- Photo Silly Things (Photo Library) ---

  Scenario: Add a photo Silly Thing from photo library
    When I navigate to the Create tab
    And I tap the photo library option
    And I select a photo from my library
    Then I see a preview of the selected photo
    When I tap "Post"
    Then the photo is uploaded and saved as a Silly Thing

  # --- Share Extension ---

  Scenario: Add a photo via iOS Share Extension (authenticated)
    Given I am signed in and the app has a shared keychain
    When I share an image from the Photos app to Silly App
    Then the Share Extension opens
    And I see a compose view with the shared image
    When I optionally add a caption
    And I tap "Post"
    Then the photo is uploaded and saved as a Silly Thing

  Scenario: Share Extension when not authenticated
    Given I am not signed in
    When I share an image from the Photos app to Silly App
    Then the Share Extension shows "Please sign in to Silly App first"
    And I see a button to open the main app

  # --- Offline Behavior ---

  Scenario: Create text Silly Thing while offline
    Given the device has no internet connection
    When I navigate to the Create tab
    And I create a text Silly Thing "Offline silly"
    Then the Silly Thing is saved locally
    And I see an "Offline — will sync when connected" banner
    When the device reconnects to the internet
    Then the Silly Thing is synced to Firestore
