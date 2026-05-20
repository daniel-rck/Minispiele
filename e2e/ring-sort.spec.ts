import { expect, test } from '@playwright/test';

test.describe('Ring Sort', () => {
  test('navigates from home and renders four pegs', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Ringe sortieren/i }).click();
    await expect(page).toHaveURL(/ring-sort/);
    const pegs = page.getByRole('button', { name: /^Stab/ });
    await expect(pegs).toHaveCount(4);
  });

  test('Undo button starts disabled and Neu starten resets the move counter', async ({ page }) => {
    await page.goto('/ring-sort');
    await expect(page.getByRole('button', { name: /^↶ Zurück$/i })).toBeDisabled();
    await page.getByRole('button', { name: /^Neu$/i }).click();
    await expect(page.getByText(/Züge: 0/)).toBeVisible();
  });

  test('bottom toolbar buttons meet 44px minimum on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only assertion');
    await page.goto('/ring-sort');
    const undo = page.getByRole('button', { name: /^↶ Zurück$/i });
    const box = await undo.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});
