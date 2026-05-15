import { test, expect } from '@playwright/test';

test.describe('Timer', () => {
  test('start, pause, resume, restart cycle', async ({ page }) => {
    await page.goto('/timer');
    const big = page.getByRole('button', { name: /Starten\./ });
    await big.click();
    await expect(page.getByText(/Status:/)).toContainText(/läuft/);

    const pauseBtn = page.getByRole('button', { name: /Pause\./ });
    await pauseBtn.click();
    await expect(page.getByText(/Status:/)).toContainText(/pausiert/);

    const resumeBtn = page.getByRole('button', { name: /Fortsetzen\./ });
    await resumeBtn.click();
    await expect(page.getByText(/Status:/)).toContainText(/läuft/);

    // ↺ restarts the run immediately, status stays 'läuft'.
    await page.getByRole('button', { name: 'Neu starten', exact: true }).click();
    await expect(page.getByText(/Status:/)).toContainText(/läuft/);
  });

  test('stepper buttons adjust minutes and seconds', async ({ page }) => {
    await page.goto('/timer');
    const minPlus = page.getByRole('button', { name: /min plus eins/i });
    await minPlus.click();
    // Defaults are 60s = 01:00. After +1 min it should show 02:00.
    await expect(page.locator('button').filter({ hasText: /02:00/ }).first()).toBeVisible();
  });

  test('big button is in the daumen-reach zone on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only assertion');
    await page.goto('/timer');
    const big = page.getByRole('button', { name: /Starten\./ });
    const box = await big.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(120);
  });
});
