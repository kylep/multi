import { test, expect } from '@playwright/test';

test('Wiki link in header navigates to wiki', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('Nav-Toolbar').getByRole('link', { name: 'Wiki' }).click();
  await expect(page).toHaveURL('/wiki.html');
});

test('Wiki index page shows section links', async ({ page }) => {
  await page.goto('/wiki.html');
  await expect(page.locator('h1').nth(1)).toContainText('Bot-Wiki');
  const tree = page.getByTestId('wiki-tree');
  await expect(tree.getByRole('link', { name: 'AI Tools' })).toBeVisible();
  await expect(tree.getByRole('link', { name: 'MCP Integrations' })).toBeVisible();
  await expect(tree.getByRole('link', { name: 'OpenClaw', exact: true })).toBeVisible();
  await expect(tree.getByRole('link', { name: /DevOps/i })).toBeVisible();
  await expect(tree.getByRole('link', { name: 'Blog Architecture' })).toBeVisible();
});

test('Wiki section page shows child links and content', async ({ page }) => {
  await page.goto('/wiki/ai-tools.html');
  await expect(page.locator('h1').nth(1)).toContainText('AI Tools');
  const tree = page.getByTestId('wiki-tree');
  await expect(tree.getByRole('link', { name: 'Claude Code' })).toBeVisible();
  await expect(tree.getByRole('link', { name: 'OpenCode', exact: true })).toBeVisible();
  await expect(page.getByTestId('wiki-breadcrumbs')).toBeVisible();
});

test('Wiki leaf page renders content', async ({ page }) => {
  await page.goto('/wiki/ai-tools/claude-code.html');
  await expect(page.locator('h1').nth(1)).toContainText('Claude Code');
  await expect(page.getByTestId('wiki-breadcrumbs')).toBeVisible();
  await expect(page.getByText('Key Features')).toBeVisible();
});

test('Wiki breadcrumbs link back to parent', async ({ page }) => {
  await page.goto('/wiki/ai-tools/claude-code.html');
  const breadcrumbs = page.getByTestId('wiki-breadcrumbs');
  await breadcrumbs.getByRole('link', { name: 'AI Tools' }).click();
  await expect(page).toHaveURL('/wiki/ai-tools.html');
});

test('Wiki pages render on mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/wiki.html');
  await expect(page.getByRole('link', { name: /AI Tools/i })).toBeVisible();
  await expect(page.locator('h1').nth(1)).toContainText('Bot-Wiki');
});
