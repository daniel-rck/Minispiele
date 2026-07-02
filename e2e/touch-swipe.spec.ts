import { expect, type Page, test } from '@playwright/test';

/**
 * Regressionsschutz für die Swipe-Spiele (Snake, 2048, Sokoban): ein vertikaler
 * Wisch über das Spielfeld darf die Seite nicht scrollen (touch-action: none)
 * und muss bei Snake als Richtungswechsel ankommen. Läuft nur im
 * mobile-chrome-Projekt (Touch), Swipes werden per CDP als echte Touch-Events
 * verschickt — Playwrights touchscreen kann nur tippen.
 */
test.describe('Touch-Swipe auf Spielfeldern', () => {
  test.skip(({ isMobile }) => !isMobile, 'Nur für das Touch-Projekt relevant');

  async function swipe(
    page: Page,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ): Promise<void> {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: from.x, y: from.y }],
    });
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          {
            x: from.x + ((to.x - from.x) * i) / steps,
            y: from.y + ((to.y - from.y) * i) / steps,
          },
        ],
      });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
  }

  async function boardCenter(page: Page, selector: string): Promise<{ x: number; y: number }> {
    const box = await page.locator(selector).first().boundingBox();
    if (!box) throw new Error(`Board ${selector} nicht gefunden`);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  test('Snake: Swipe scrollt nicht und lenkt die Schlange', async ({ page }) => {
    await page.goto('/snake');
    await page.getByRole('button', { name: 'Starten' }).click();

    const board = page.getByRole('grid', { name: /Snake-Spielfeld/ });
    await expect(board).toBeVisible();
    const center = await boardCenter(page, '[role="grid"]');

    const headY = () =>
      page.evaluate(() => {
        const grid = document.querySelector('[role="grid"]');
        const head = grid?.querySelector('div');
        const m = head instanceof HTMLElement ? head.style.transform.match(/,\s*(-?\d+)%/) : null;
        return m ? Number(m[1]) : null;
      });

    const yBefore = await headY();
    // Wisch nach unten — vorher scrollte das die Seite, statt zu lenken
    await swipe(page, center, { x: center.x, y: center.y + 120 });

    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBe(0);
    // Die Schlange startet horizontal (y konstant); nach dem Swipe muss sich
    // die y-Koordinate des Kopfs innerhalb weniger Ticks ändern.
    await expect.poll(headY, { timeout: 3000 }).not.toBe(yBefore);
  });

  for (const { path, board } of [
    { path: '/twenty-forty-eight', board: '.fit-box' },
    { path: '/sokoban', board: '[aria-label="Sokoban-Spielfeld"]' },
  ]) {
    test(`${path}: vertikaler Swipe scrollt die Seite nicht`, async ({ page }) => {
      await page.goto(path);
      const center = await boardCenter(page, board);
      await swipe(page, center, { x: center.x, y: center.y + 120 });
      await expect.poll(async () => page.evaluate(() => window.scrollY)).toBe(0);
    });
  }
});
