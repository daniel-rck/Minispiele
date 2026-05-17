import { test, expect } from '@playwright/test';

test.describe('Blasenschießen', () => {
  test('renders 8 column buttons and a restart button', async ({ page }) => {
    await page.goto('/bubbles');
    const cols = page.getByRole('group', { name: /Schussspalten/i }).getByRole('button');
    await expect(cols).toHaveCount(8);
    await expect(page.getByRole('button', { name: /Nochmal spielen/i }).first()).toBeVisible();
  });

  test('shooting changes the bubble count on the field', async ({ page }) => {
    await page.goto('/bubbles');
    // Only the rendered cells carry aria-hidden — flight, particles and the
    // preview circle don't — so this selector counts only the field bubbles.
    const cells = page.locator('[role="application"] circle[aria-hidden="true"]');
    const startCount = await cells.count();
    expect(startCount).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Spalte 4' }).click();
    // Either +1 (no pop) or net loss (pop) — never identical.
    await expect.poll(() => cells.count(), { timeout: 2000 }).not.toBe(startCount);
  });
});
