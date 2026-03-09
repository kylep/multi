// Generated from tests/spec/post.feature — do not edit directly.
import { test, expect } from '@playwright/test';

const POST_URL = '/playwright-mcp.html';

test('Post renders with metadata', async ({ page }) => {
  await page.goto(POST_URL);
  // nth(1) skips the site title "Kyle Pericak" h1
  await expect(page.locator('h1').nth(1)).toContainText('Playwright MCP');
  await expect(page.locator('text=/Created:/').first()).toBeVisible();
  await expect(page.locator('a[href^="/tag/"]').first()).toBeVisible();
});

test('Post has readable content', async ({ page }) => {
  await page.goto(POST_URL);
  // Markdown sections render as h1; subsections as h2
  await expect(page.locator('h2').first()).toBeVisible();
  await expect(page.locator('pre').first()).toBeVisible();
});

test('Heading anchor IDs match heading text', async ({ page }) => {
  await page.goto(POST_URL);
  const heading = page.locator('h2', { hasText: 'browser_navigate' });
  await expect(heading).toBeVisible();
  await expect(heading).toHaveAttribute('id', 'browser_navigate');
});

test('Hash URL scrolls to a heading far down the page', async ({ page }) => {
  await page.goto(POST_URL);
  const heading = page.locator('h2', { hasText: 'Playwright Config for the Blog' });
  await expect(heading).not.toBeInViewport();
  await page.goto(`${POST_URL}#playwright-config-for-the-blog`);
  await expect(heading).toBeInViewport();
});

test('No console errors on post load', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto(POST_URL);
  expect(errors).toHaveLength(0);
});
