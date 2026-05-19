import { expect, test } from '@playwright/test';

test.describe('Traffic Jam (Stau)', () => {
  test('navigates from home and renders the board', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Stau/i }).click();
    await expect(page).toHaveURL(/traffic-jam/);
    await expect(page.getByRole('heading', { name: /Stau/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Rotes Zielauto/i })).toBeVisible();
  });

  test('clicking a blocking car drives it and increments the Klicks counter', async ({ page }) => {
    await page.goto('/traffic-jam');
    // easy-01 first puzzle has Car C as the single vertical blocker.
    const carC = page.getByRole('button', { name: /Auto C/i });
    await carC.click();
    await expect(page.getByText(/Klicks/i).first()).toBeVisible();
    await expect(page.locator('body')).toContainText(/Klicks[^\d]*1/);
  });

  test('difficulty select is present and changes options', async ({ page }) => {
    await page.goto('/traffic-jam');
    const select = page.getByLabel(/Schwierigkeit/i);
    await expect(select).toBeVisible();
    await select.selectOption('hard');
    await expect(page.getByRole('button', { name: /Rotes Zielauto/i })).toBeVisible();
  });

  test('footer buttons meet 44px minimum on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only assertion');
    await page.goto('/traffic-jam');
    const restart = page.getByRole('button', { name: /^Neu starten$/i });
    const box = await restart.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});
