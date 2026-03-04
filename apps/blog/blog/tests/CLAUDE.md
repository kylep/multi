# Test Suite Guidelines

The full test suite should complete in under 1 minute. Keep this in mind when
writing or generating tests.

- Prefer assertions over waits. Don't wait for things that should already be there.
- No sleeps. Use `browser_wait_for` or `waitFor` only when rendering is genuinely async.
- Each scenario should cover one thing. Don't combine unrelated assertions.
- Don't test implementation details. Test what the user sees.
- Avoid test data setup that hits external services or generates large payloads.
