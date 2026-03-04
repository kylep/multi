// Generated from tests/spec/navigation.feature — do not edit directly.
import { test, expect } from '@playwright/test';

test('Home link returns to index', async ({ page }) => {
  await page.goto('/playwright-mcp.html');
  // Home logo is the only link in the banner pointing to /
  await page.locator('header a[href="/"]').click();
  await expect(page).toHaveURL('/');
});

test('Archive link works', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Archive' }).click();
  await expect(page).toHaveURL('/index1.html');
  await expect(page.locator('a:has(p)').first()).toBeVisible();
});

test('About page loads', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL('/about.html');
  await expect(page.locator('h1, h2').first()).toBeVisible();
});
