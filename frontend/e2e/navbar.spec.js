import { test, expect } from '@playwright/test';

test.describe('Navbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders all center nav links', async ({ page }) => {
    const nav = page.locator('.navbar-center');
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Games' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Leaderboards' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Stats' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Discord' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Store' })).toBeVisible();
  });

  test('renders right-side tool buttons', async ({ page }) => {
    const right = page.locator('.navbar-right');
    await expect(right.getByRole('link', { name: /labs/i })).toBeVisible();
    await expect(right.getByRole('link', { name: /analytics/i })).toBeVisible();
  });

  test('clicking Leaderboards navigates to /leaderboards', async ({ page }) => {
    await page.locator('.navbar-center').getByRole('link', { name: 'Leaderboards' }).click();
    await expect(page).toHaveURL('/leaderboards');
  });

  test('clicking Stats navigates to /stats', async ({ page }) => {
    await page.locator('.navbar-center').getByRole('link', { name: 'Stats' }).click();
    await expect(page).toHaveURL(/\/stats/);
  });

  test('clicking Labs navigates to /labs', async ({ page }) => {
    await page.locator('.navbar-right').getByRole('link', { name: /labs/i }).click();
    await expect(page).toHaveURL(/\/labs/);
  });

  test('logo links back to home', async ({ page }) => {
    await page.goto('/leaderboards');
    await page.locator('.navbar-left a').click();
    await expect(page).toHaveURL('/');
  });
});
