# tests/spec/index.feature

Feature: Blog index page

  Scenario: Page loads with post list
    Given I navigate to the blog homepage
    Then I see a list of posts
    And each post has a title, date, and summary

  Scenario: Posts link to their detail page
    Given I navigate to the blog homepage
    When I click the first post title
    Then I am on a post detail page
    And the post has a title and content

  Scenario: Pagination controls are present
    Given I navigate to the blog homepage
    Then I see pagination controls
