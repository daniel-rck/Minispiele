import { expect, test } from '@playwright/test';
import { games } from './games';

/**
 * Kein Spiel darf die Seite (document) scrollen lassen – alles soll in den
 * Viewport passen. Läuft über alle Spiele × beide Projekte (Desktop + Pixel 5).
 */
test.describe('Spiele erzeugen keine Seiten-Scrollbar', () => {
  for (const game of games) {
    test(`${game.path} passt in den Viewport`, async ({ page }) => {
      await page.goto(game.path);
      await expect(page.getByRole('heading', { name: game.title }).first()).toBeVisible();
      // Layout settlen lassen (ResizeObserver / fit-square / Schriftladen).
      await page.waitForTimeout(150);

      const m = await page.evaluate(() => {
        const fitEl = document.querySelector<HTMLElement>('[data-game-fit]');
        return {
          scrollH: document.documentElement.scrollHeight,
          clientH: document.documentElement.clientHeight,
          scrollW: document.documentElement.scrollWidth,
          clientW: document.documentElement.clientWidth,
          fitMode: fitEl?.dataset.gameFit ?? null,
          fitScrollH: fitEl?.scrollHeight ?? 0,
          fitClientH: fitEl?.clientHeight ?? 0,
        };
      });

      // 1) Die Seite selbst darf nie scrollen (+1px Sub-Pixel-Toleranz).
      expect(m.scrollH, `vertikaler Seiten-Overflow auf ${game.path}`).toBeLessThanOrEqual(
        m.clientH + 1,
      );
      expect(m.scrollW, `horizontaler Seiten-Overflow auf ${game.path}`).toBeLessThanOrEqual(
        m.clientW + 1,
      );

      // 2) Bei `fit`-Spielen darf der Spielbereich nichts abschneiden
      //    (`scroll`-Spiele dürfen bewusst intern scrollen).
      if (m.fitMode === 'fit') {
        expect(
          m.fitScrollH,
          `Inhalt wird im Spielbereich abgeschnitten auf ${game.path}`,
        ).toBeLessThanOrEqual(m.fitClientH + 1);
      }
    });
  }
});
