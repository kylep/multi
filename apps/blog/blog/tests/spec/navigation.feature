# tests/spec/navigation.feature

Feature: Site navigation

  Scenario: Home link returns to index
    Given I navigate to the playwright-mcp post
    When I click the home logo
    Then I am on the blog homepage

  Scenario: Blog link works
    Given I navigate to the blog homepage
    When I click the Blog link
    Then I see a list of posts

  Scenario: About page loads
    Given I navigate to the blog homepage
    When I click the About link
    Then I am on the about page
    And I see some content
