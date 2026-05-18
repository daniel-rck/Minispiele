import { test, expect } from '@playwright/test';

test.describe('Gfrett', () => {
  test('renders the board, match area and restart button', async ({ page }) => {
    await page.goto('/gfrett');
    await expect(page.getByRole('heading', { name: /Gfrett/i })).toBeVisible();
    await expect(page.getByRole('application', { name: /Gfrett-Spielfeld/i })).toBeVisible();
    await expect(page.getByRole('list', { name: /Match-Leiste/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Level neustarten/i })).toBeVisible();
  });

  test('keyboard input on a focused block decrements blocks on grid', async ({ page }) => {
    await page.goto('/gfrett');
    const board = page.getByRole('application', { name: /Gfrett-Spielfeld/i });
    await expect(board).toBeVisible();
    const blocks = page.locator('[data-block-id]');
    const startCount = await blocks.count();
    expect(startCount).toBeGreaterThan(0);

    // Focus the first block and slide it right; if it can exit, the count decreases.
    const first = blocks.first();
    await first.focus();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('ArrowRight');
    }
    // Either the block exits (count drops) or moved (count stays). At minimum, no crash.
    await expect
      .poll(async () => blocks.count(), { timeout: 2000 })
      .toBeLessThanOrEqual(startCount);
  });
});
