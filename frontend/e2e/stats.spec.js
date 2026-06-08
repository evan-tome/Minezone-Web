import { test, expect } from '@playwright/test';

const MOCK_PLAYER = {
  UUID: 'mock-uuid',
  LastPlayerName: 'TestPlayer',
  Wins: 100,
  Kills: 200,
  Level: 50,
};

test.describe('Stats', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/stats/recent-matches', route =>
      route.fulfill({ json: { matches: [] } })
    );
    await page.route('**/analytics/overview', route =>
      route.fulfill({ json: {} })
    );
    await page.goto('/stats');
  });

  test('renders search input', async ({ page }) => {
    await expect(page.getByRole('textbox')).toBeVisible();
  });

  test('shows player stats after searching', async ({ page }) => {
    await page.route('**/stats/TestPlayer', route =>
      route.fulfill({ json: MOCK_PLAYER })
    );
    await page.route('**/stats/TestPlayer/**', route =>
      route.fulfill({ json: {} })
    );

    await page.getByRole('textbox').fill('TestPlayer');
    await page.getByRole('textbox').press('Enter');

    await expect(page.getByText('TestPlayer')).toBeVisible();
  });

  test('shows error for unknown player', async ({ page }) => {
    await page.route('**/stats/unknown*', route =>
      route.fulfill({ status: 404, json: { error: 'Not found' } })
    );

    await page.getByRole('textbox').fill('unknownxyz');
    await page.getByRole('textbox').press('Enter');

    await expect(page.getByText(/couldn't find/i)).toBeVisible();
  });

  test('navigates to /stats/:username via URL', async ({ page }) => {
    await page.route('**/stats/TestPlayer', route =>
      route.fulfill({ json: MOCK_PLAYER })
    );
    await page.route('**/stats/TestPlayer/**', route =>
      route.fulfill({ json: {} })
    );

    await page.goto('/stats/TestPlayer');
    await expect(page).toHaveURL(/\/stats\/TestPlayer/);
    await expect(page.getByText('TestPlayer')).toBeVisible();
  });
});
