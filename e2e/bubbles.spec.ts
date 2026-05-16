import { test, expect } from '@playwright/test';

test.describe('Blasenschießen', () => {
  test('renders 8 column buttons and a restart button', async ({ page }) => {
    await page.goto('/bubbles');
    const cols = page.getByRole('group', { name: /Schussspalten/i }).getByRole('button');
    await expect(cols).toHaveCount(8);
    await expect(page.getByRole('button', { name: /Nochmal spielen/i }).first()).toBeVisible();
  });

  test('shooting into a column raises the score over time', async ({ page }) => {
    await page.goto('/bubbles');
    const startScore = await page.getByText(/Punkte:/).innerText();
    // fire 5 shots — at least one is likely to score
    for (let i = 1; i <= 5; i++) {
      await page.getByRole('button', { name: `Spalte ${i}` }).click();
      // wait briefly for the flight animation to resolve
      await page.waitForTimeout(450);
    }
    const endScore = await page.getByText(/Punkte:/).innerText();
    expect(endScore).not.toEqual(startScore);
  });
});
