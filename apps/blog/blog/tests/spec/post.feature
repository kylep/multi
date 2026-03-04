# tests/spec/post.feature

Feature: Blog post detail page

  Scenario: Post renders with metadata
    Given I navigate to the playwright-mcp post
    Then I see the post title
    And I see the created date
    And I see at least one tag

  Scenario: Post has readable content
    Given I navigate to the playwright-mcp post
    Then I see at least one heading in the post body
    And I see at least one code block

  Scenario: No console errors on post load
    Given I navigate to the playwright-mcp post
    Then there are no console errors
