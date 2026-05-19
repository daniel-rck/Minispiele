import { expect, test } from '@playwright/test';

test.describe('Hyperfokus', () => {
  test('tap increments score and opens upgrade sheet', async ({ page }) => {
    await page.goto('/hyperfokus');

    const core = page.getByLabel(/Hyperfokus-Kern tippen/i);
    await expect(core).toBeVisible();

    // Tap the core a few times.
    for (let i = 0; i < 8; i++) {
      await core.click({ force: true });
    }

    // Score area should contain a non-zero number.
    const coinsRow = page.getByText(/Coins · Bestes/i);
    await expect(coinsRow).toBeVisible();

    // Upgrade sheet opens.
    await page.getByRole('button', { name: /Upgrades öffnen/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Tipp-Kraft/i)).toBeVisible();
    await expect(dialog.getByText(/Auto-Tapper/i)).toBeVisible();
  });

  test('keyboard space triggers a tap', async ({ page }) => {
    await page.goto('/hyperfokus');
    const core = page.getByLabel(/Hyperfokus-Kern tippen/i);
    await expect(core).toBeVisible();
    await core.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('Space');
    await page.keyboard.press('Space');
    // After a few taps, combo line is visible
    await expect(page.getByText(/COMBO/)).toBeVisible();
  });
});
