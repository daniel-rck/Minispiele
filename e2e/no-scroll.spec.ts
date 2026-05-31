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
      // Auf Schriftladen + ein gerendertes Frame warten, statt fixem Timeout
      // (deterministischer, kein Flake durch ResizeObserver/Fonts).
      await page.evaluate(() =>
        document.fonts.ready.then(
          () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
        ),
      );

      const m = await page.evaluate(() => {
        const fitEl = document.querySelector<HTMLElement>('[data-game-fit]');
        if (!fitEl) return { missing: true } as const;
        const box = fitEl.querySelector<HTMLElement>('.fit-box');
        return {
          missing: false as const,
          scrollH: document.documentElement.scrollHeight,
          clientH: document.documentElement.clientHeight,
          scrollW: document.documentElement.scrollWidth,
          clientW: document.documentElement.clientWidth,
          fitMode: fitEl.dataset.gameFit ?? null,
          fitScrollH: fitEl.scrollHeight,
          fitClientH: fitEl.clientHeight,
          // Seitenverhältnis des Bretts vs. Sollwert (--fit-ar), um Verzerrung
          // durch falsch platzierte max-w-Caps zu erkennen.
          boxW: box?.offsetWidth ?? 0,
          boxH: box?.offsetHeight ?? 0,
          boxAr: box ? Number(getComputedStyle(box).getPropertyValue('--fit-ar')) : null,
        };
      });

      // Das Layout-Gerüst muss vorhanden sein, sonst würden die Checks lautlos
      // durchrutschen.
      expect(m.missing, `[data-game-fit] fehlt auf ${game.path}`).toBe(false);
      if (m.missing) return;

      // Der Fit-Modus muss zur Erwartung der Spielliste passen.
      expect(m.fitMode, `falscher Fit-Modus auf ${game.path}`).toBe(game.scroll ? 'scroll' : 'fit');

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

        // 3) Das Brett muss sein Soll-Seitenverhältnis halten (nicht verzerrt
        //    durch einen max-w-Cap am fit-box statt am fit-area).
        if (m.boxAr && m.boxW > 0 && m.boxH > 0) {
          const actual = m.boxW / m.boxH;
          expect(
            Math.abs(actual - m.boxAr),
            `Brett-Seitenverhältnis verzerrt auf ${game.path} (soll ${m.boxAr.toFixed(3)}, ist ${actual.toFixed(3)})`,
          ).toBeLessThan(0.06);
        }
      }
    });
  }
});
