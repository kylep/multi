// Generated from tests/spec/index.feature — do not edit directly.
import { test, expect } from '@playwright/test';

test('Page loads with post list', async ({ page }) => {
  await page.goto('/');
  // Post title links contain a paragraph child; nav links don't
  await expect(page.locator('a:has(p)').first()).toBeVisible();
});

test('each post has a title, date, and summary', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a:has(p)').first()).toBeVisible();
  await expect(page.locator('text=/Created:/').first()).toBeVisible();
});

test('Posts link to their detail page', async ({ page }) => {
  await page.goto('/');
  await page.locator('a:has(p)').first().click();
  await expect(page).toHaveURL(/\.html$/);
  // nth(1) skips the site title "Kyle Pericak" h1
  await expect(page.locator('h1').nth(1)).toBeVisible();
  await expect(page.locator('text=/Created:/').first()).toBeVisible();
});

test('Pagination controls are present', async ({ page }) => {
  await page.goto('/');
  // Custom pagination renders page numbers as clickable divs
  await expect(page.getByText('2', { exact: true })).toBeVisible();
});
