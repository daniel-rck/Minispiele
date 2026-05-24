import { expect, test } from '@playwright/test';

const games: { path: string; title: RegExp }[] = [
  { path: '/memory', title: /Memory/i },
  { path: '/twenty-forty-eight', title: /2048/ },
  { path: '/sliding-puzzle', title: /Schiebepuzzle/i },
  { path: '/simon', title: /Simon/i },
  { path: '/minesweeper', title: /Minensucher/i },
  { path: '/snake', title: /Snake/i },
  { path: '/wordle', title: /Wordle/i },
  { path: '/sudoku', title: /Sudoku/i },
  { path: '/nonogram', title: /Bildr.tsel/i },
  { path: '/lights-out', title: /Lichter aus/i },
  { path: '/mastermind', title: /Codeknacker/i },
  { path: '/hanoi', title: /Hanoi/i },
  { path: '/sokoban', title: /Kistenschieber/i },
  { path: '/flow', title: /Verbinden/i },
  { path: '/tangram', title: /Tangram/i },
  { path: '/freecell', title: /FreeCell/i },
  { path: '/hangman', title: /Galgenm.nnchen/i },
  { path: '/wordsearch', title: /Wortgitter/i },
  { path: '/anagram', title: /Wortsalat/i },
  { path: '/breakout', title: /Ziegelbruch/i },
  { path: '/bubbles', title: /Blasenschie.en/i },
  { path: '/blocks', title: /Blockstapler/i },
  { path: '/reaction', title: /Reaktionstest/i },
  { path: '/schulte', title: /Zahlentafel/i },
  { path: '/stroop', title: /Stroop/i },
  { path: '/traffic-jam', title: /Stau/i },
  { path: '/hyperfokus', title: /Hyperfokus/i },
  { path: '/gfrett', title: /Gfrett/i },
  { path: '/color-flood', title: /Farbflut/i },
  { path: '/spelling-bee', title: /Buchstabierbiene/i },
  { path: '/bingo', title: /Bingo/i },
  { path: '/slot-machine', title: /Einarmiger Bandit/i },
  { path: '/leiterspiel', title: /Leiterspiel/i },
  { path: '/tic-tac-toe', title: /Tic-Tac-Toe/i },
  { path: '/asteroids', title: /Asteroids/i },
  { path: '/binairo', title: /Binairo/i },
  { path: '/connections', title: /Connections/i },
  { path: '/conway-battle', title: /Conway Battle/i },
  { path: '/doodle-jump', title: /Doodle Jump/i },
  { path: '/flappy-bird', title: /Flappy Bird/i },
  { path: '/frogger', title: /Frogger/i },
  { path: '/futoshiki', title: /Futoshiki/i },
  { path: '/game-of-life', title: /Game of Life/i },
  { path: '/halma', title: /Halma/i },
  { path: '/hitori', title: /Hitori/i },
  { path: '/kakuro', title: /Kakuro/i },
  { path: '/kniffel', title: /Kniffel/i },
  { path: '/crossword', title: /Kreuzworträtsel/i },
  { path: '/match3', title: /Match-3/i },
  { path: '/nurikabe', title: /Nurikabe/i },
  { path: '/pentomino', title: /Pentomino/i },
  { path: '/pipe-puzzle', title: /Rohre drehen/i },
  { path: '/pong', title: /Pong/i },
  { path: '/quiz', title: /Quiz/i },
  { path: '/qwirkle', title: /Qwirkle/i },
  { path: '/roulette', title: /Roulette/i },
  { path: '/slitherlink', title: /Slitherlink/i },
  { path: '/typing-test', title: /Typing Test/i },
  { path: '/vier-bilder', title: /4 Bilder 1 Wort/i },
  { path: '/viergewinnt', title: /4 Gewinnt/i },
  { path: '/whack-a-mole', title: /Whack-a-Mole/i },
  { path: '/wuerfelpoker', title: /Würfelpoker/i },
];

test.describe('All games smoke render', () => {
  for (const game of games) {
    test(`${game.path} loads with title`, async ({ page }) => {
      await page.goto(game.path);
      await expect(page.getByRole('heading', { name: game.title }).first()).toBeVisible();
    });
  }
});

test.describe('Home category filter', () => {
  test('filters to action games', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Action.*Arcade/i }).click();
    await expect(page.getByRole('link', { name: /Snake/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Ziegelbruch/i })).toBeVisible();
  });
});

test.describe('Restart-Label-Vereinheitlichung', () => {
  for (const game of games) {
    test(`${game.path} zeigt kein "Game Over" in englisch`, async ({ page }) => {
      await page.goto(game.path);
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toContain('Game Over');
    });
  }
});
