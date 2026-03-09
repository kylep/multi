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

test('Heading anchor IDs are generated from heading text', async ({ page }) => {
  await page.goto(POST_URL);
  const h2 = page.locator('h2[id]').first();
  await expect(h2).toBeVisible();
  const id = await h2.getAttribute('id');
  expect(id).toBeTruthy();
  expect(id).toMatch(/^[a-z0-9_-]+$/);
});

test('Hash URL scrolls to the target heading', async ({ page }) => {
  await page.goto(POST_URL);
  const h2 = page.locator('h2[id]').first();
  const id = await h2.getAttribute('id');
  await page.goto(`${POST_URL}#${id}`);
  await expect(h2).toBeInViewport();
});

test('No console errors on post load', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto(POST_URL);
  expect(errors).toHaveLength(0);
});
