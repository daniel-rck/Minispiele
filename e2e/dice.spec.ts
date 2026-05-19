import { expect, test } from '@playwright/test';

test.describe('Dice', () => {
  test('parses notation 2d20 and renders two d20 dice', async ({ page }) => {
    await page.goto('/dice');
    await page.getByPlaceholder('3d6+2').fill('2d20');
    await page.getByRole('button', { name: /^Setzen$/i }).click();
    const d20Dice = page.locator('button[aria-label^="Würfel d20"]');
    await expect(d20Dice).toHaveCount(2);
  });

  test('roll button updates the history badge', async ({ page }) => {
    await page.goto('/dice');
    const verlauf = page.getByRole('button', { name: /Verlauf/i });
    await page.getByRole('button', { name: /^🎲 Würfeln/ }).click();
    await expect(verlauf).toContainText('1');
  });

  test('Verlauf bottom-sheet opens and dismisses', async ({ page }) => {
    await page.goto('/dice');
    await page.getByRole('button', { name: /^🎲 Würfeln/ }).click();
    await page.getByRole('button', { name: /Verlauf/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /Schließen/i }).click();
    await expect(dialog).toBeHidden();
  });

  test('roll button is reachable in the bottom third on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only assertion');
    await page.goto('/dice');
    const button = page.getByRole('button', { name: /^🎲 Würfeln/ });
    const box = await button.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.y + box!.height / 2).toBeGreaterThan(viewport!.height * 0.6);
  });
});
