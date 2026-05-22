export interface CrosswordWord {
  word: string;
  row: number;
  col: number;
  dir: 'h' | 'v';
  clue: string;
}

export interface CrosswordPuzzle {
  size: number;
  words: CrosswordWord[];
}

export const CROSSWORD_PUZZLES: readonly CrosswordPuzzle[] = [
  {
    size: 8,
    words: [
      { word: 'WASSER', row: 0, col: 0, dir: 'h', clue: 'Flüssigkeit aus dem Hahn' },
      { word: 'WOLKE', row: 0, col: 0, dir: 'v', clue: 'Am Himmel, bringt Regen' },
      { word: 'SONNE', row: 2, col: 3, dir: 'h', clue: 'Stern am Tageshimmel' },
      { word: 'STERN', row: 0, col: 4, dir: 'v', clue: 'Leuchtet am Nachthimmel' },
      { word: 'ERDE', row: 4, col: 0, dir: 'h', clue: 'Unser Planet' },
      { word: 'MOND', row: 0, col: 6, dir: 'v', clue: 'Kreist um die Erde' },
      { word: 'REGEN', row: 6, col: 2, dir: 'h', clue: 'Fällt vom Himmel' },
      { word: 'WIND', row: 2, col: 1, dir: 'v', clue: 'Bewegte Luft' },
    ],
  },
  {
    size: 9,
    words: [
      { word: 'SCHULE', row: 0, col: 0, dir: 'h', clue: 'Ort zum Lernen' },
      { word: 'STUHL', row: 0, col: 0, dir: 'v', clue: 'Sitzmöbel' },
      { word: 'LESEN', row: 2, col: 4, dir: 'v', clue: 'Bücher…' },
      { word: 'HEFT', row: 2, col: 2, dir: 'h', clue: 'Zum Reinschreiben' },
      { word: 'TAFEL', row: 4, col: 0, dir: 'h', clue: 'Lehrer schreibt daran' },
      { word: 'FEDER', row: 4, col: 4, dir: 'v', clue: 'Zum Schreiben (historisch)' },
      { word: 'KREIDE', row: 6, col: 1, dir: 'h', clue: 'Schreibt auf der Tafel' },
      { word: 'BUCH', row: 0, col: 7, dir: 'v', clue: 'Hat viele Seiten' },
    ],
  },
  {
    size: 10,
    words: [
      { word: 'KLAVIER', row: 0, col: 0, dir: 'h', clue: 'Tasteninstrument' },
      { word: 'GEIGE', row: 2, col: 3, dir: 'h', clue: 'Streichinstrument' },
      { word: 'TROMMEL', row: 4, col: 1, dir: 'h', clue: 'Schlaginstrument' },
      { word: 'FLOETE', row: 6, col: 0, dir: 'h', clue: 'Holzblasinstrument' },
      { word: 'KLANG', row: 0, col: 0, dir: 'v', clue: 'Ton, Geräusch' },
      { word: 'LIED', row: 0, col: 1, dir: 'v', clue: 'Gesungene Melodie' },
      { word: 'NOTEN', row: 8, col: 2, dir: 'h', clue: 'Musikschrift' },
      { word: 'GITARRE', row: 0, col: 3, dir: 'v', clue: 'Saiteninstrument' },
    ],
  },
];
