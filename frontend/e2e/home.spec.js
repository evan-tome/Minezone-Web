import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero tagline', async ({ page }) => {
    await expect(page.getByText('The Home of Super Craft Bros')).toBeVisible();
  });

  test('copy IP button is present', async ({ page }) => {
    await expect(page.getByText('minezone.club')).toBeVisible();
  });

  test('renders What We Offer section', async ({ page }) => {
    await expect(page.getByText('What We Offer')).toBeVisible();
    await expect(page.getByText('60+ Classes & Maps')).toBeVisible();
    await expect(page.getByText('Leaderboards').first()).toBeVisible();
  });

  test('renders Games section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible();
  });

  test('renders Latest News section', async ({ page }) => {
    await expect(page.getByText('Latest News')).toBeVisible();
    await expect(page.getByText('Welcome to Our Website!')).toBeVisible();
  });

  test('Games nav link scrolls to games section', async ({ page }) => {
    await page.locator('.navbar-center').getByRole('link', { name: 'Games' }).click();
    const gamesSection = page.locator('#games');
    await expect(gamesSection).toBeInViewport();
  });

  test('Discord CTA link opens discord', async ({ page }) => {
    const discordLink = page.getByRole('link', { name: /join our discord/i });
    await expect(discordLink).toHaveAttribute('href', /discord/);
  });
});
