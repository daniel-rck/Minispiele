import { expect, test } from '@playwright/test';

test.describe('Blasenschießen', () => {
  test('renders the game field and a restart button', async ({ page }) => {
    await page.goto('/bubbles');
    await expect(page.getByRole('application', { name: /Blasenschießen/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Nochmal spielen/i }).first()).toBeVisible();
  });

  test('shooting via keyboard changes the bubble count on the field', async ({ page }) => {
    await page.goto('/bubbles');
    const cells = page.locator('[data-testid="bubble-cell"]');
    await expect(cells.first()).toBeVisible();
    const startCount = await cells.count();
    expect(startCount).toBeGreaterThan(0);
    await page.keyboard.press('Space');
    // Either +1 (no pop) or net loss (pop) — never identical.
    await expect.poll(() => cells.count(), { timeout: 2000 }).not.toBe(startCount);
  });
});
