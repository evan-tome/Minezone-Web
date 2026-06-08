import { test, expect } from '@playwright/test';

const MOCK_PLAYERS = [
  { UUID: 'uuid-1', LastPlayerName: 'Steve', Wins: 500 },
  { UUID: 'uuid-2', LastPlayerName: 'Alex',  Wins: 420 },
  { UUID: 'uuid-3', LastPlayerName: 'Notch', Wins: 350 },
];

test.describe('Leaderboards', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/leaderboard*', route =>
      route.fulfill({ json: MOCK_PLAYERS })
    );
    await page.goto('/leaderboards');
  });

  test('renders the page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Leaderboards' })).toBeVisible();
  });

  test('renders all category buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Wins' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Flawless Wins' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kills' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Best Winstreak' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fish Caught' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Level' })).toBeVisible();
  });

  test('displays player names from API response', async ({ page }) => {
    await expect(page.getByText('Steve')).toBeVisible();
    await expect(page.getByText('Alex')).toBeVisible();
    await expect(page.getByText('Notch')).toBeVisible();
  });

  test('switching category triggers a new API call', async ({ page }) => {
    const requestPromise = page.waitForRequest(req => req.url().includes('category=Kills'));
    await page.getByRole('button', { name: 'Kills' }).click();
    await requestPromise;
  });

  test('shows refresh disclaimer', async ({ page }) => {
    await expect(page.getByText(/stats refresh every minute/i)).toBeVisible();
  });

  test('shows error message when API fails', async ({ page }) => {
    await page.route('**/leaderboard*', route => route.fulfill({ status: 500, body: '' }));
    await page.goto('/leaderboards');
    await expect(page.getByText(/couldn't reach the server/i)).toBeVisible();
  });
});
