export const SPELLING_BEE_LETTERS = 7;
export const SPELLING_BEE_MIN_WORD_LENGTH = 4;
export const SPELLING_BEE_PANGRAM_BONUS = 7;
const PUZZLE_GENERATION_ATTEMPTS = 100;

const POOL = 'ABCDEFGHIKLMNOPRSTUVWZ';

export const SPELLING_BEE_WORDS: readonly string[] = [
  'ABER',
  'ADER',
  'ADLER',
  'AFFE',
  'ALARM',
  'AMPEL',
  'ANGEL',
  'ANGST',
  'APFEL',
  'ARBEIT',
  'ARZT',
  'AUTO',
  'BACH',
  'BACK',
  'BAHN',
  'BALL',
  'BAND',
  'BANK',
  'BART',
  'BAUM',
  'BERG',
  'BILD',
  'BLATT',
  'BLAU',
  'BLICK',
  'BLITZ',
  'BLUME',
  'BLUT',
  'BODEN',
  'BOOT',
  'BRAND',
  'BRAUN',
  'BRIEF',
  'BROT',
  'BRUCH',
  'BRUST',
  'BUCH',
  'BURG',
  'DACH',
  'DAME',
  'DAMPF',
  'DANK',
  'DECKE',
  'DICHT',
  'DIENST',
  'DING',
  'DORF',
  'DRAHT',
  'DRANG',
  'DRUCK',
  'DUMM',
  'DUNKEL',
  'ECKE',
  'EGAL',
  'EHRE',
  'EICHE',
  'EIMER',
  'EISEN',
  'ELCH',
  'ENGEL',
  'ERDE',
  'ERNST',
  'ESSEN',
  'EULE',
  'FACH',
  'FADEN',
  'FAHNE',
  'FAHRT',
  'FALL',
  'FALSCH',
  'FARBE',
  'FEDER',
  'FEHLER',
  'FEIER',
  'FELD',
  'FELS',
  'FEST',
  'FEUER',
  'FILM',
  'FISCH',
  'FLASCHE',
  'FLEISCH',
  'FLUG',
  'FLUSS',
  'FORST',
  'FRAGE',
  'FRAU',
  'FREI',
  'FREMD',
  'FREUDE',
  'FRIEDE',
  'FROST',
  'FRUCHT',
  'FUCHS',
  'GABEL',
  'GANG',
  'GARTEN',
  'GAST',
  'GEIST',
  'GELD',
  'GIFT',
  'GLAS',
  'GLOCKE',
  'GOLD',
  'GRAB',
  'GRAF',
  'GRAS',
  'GRAU',
  'GRIFF',
  'GRUND',
  'GUNST',
  'GUSS',
  'HAFEN',
  'HAHN',
  'HALB',
  'HALLE',
  'HALT',
  'HAND',
  'HANG',
  'HART',
  'HASE',
  'HAUS',
  'HAUT',
  'HEFT',
  'HELL',
  'HEMD',
  'HERBST',
  'HERD',
  'HERR',
  'HERZ',
  'HILFE',
  'HIRSCH',
  'HOLZ',
  'HONIG',
  'HUHN',
  'HUND',
  'INSEL',
  'JAGD',
  'KABEL',
  'KALT',
  'KAMM',
  'KAMPF',
  'KARTE',
  'KATZE',
  'KELLER',
  'KERN',
  'KETTE',
  'KIND',
  'KISTE',
  'KLAR',
  'KLEID',
  'KLEIN',
  'KLUG',
  'KNIE',
  'KNOPF',
  'KOPF',
  'KORB',
  'KRAFT',
  'KRANZ',
  'KRAUT',
  'KREIS',
  'KREUZ',
  'KRIEG',
  'KRONE',
  'KUNST',
  'KUPFER',
  'KURZ',
  'LADEN',
  'LAMPE',
  'LAND',
  'LANG',
  'LAUT',
  'LEDER',
  'LEER',
  'LEHRE',
  'LEID',
  'LEISE',
  'LICHT',
  'LIEBE',
  'LIED',
  'LINDE',
  'LINKS',
  'LISTE',
  'LOCH',
  'LUFT',
  'MAGEN',
  'MACHT',
  'MARKT',
  'MAUER',
  'MEHL',
  'MEISTER',
  'MILCH',
  'MITTEL',
  'MOND',
  'MORGEN',
  'MUSTER',
  'NAGEL',
  'NASE',
  'NATUR',
  'NEBEL',
  'NETZ',
  'NICHT',
  'NORDEN',
  'NUDEL',
  'OBEN',
  'OFEN',
  'OSTEN',
  'PAAR',
  'PAPIER',
  'PELZ',
  'PFEIL',
  'PFLICHT',
  'PLATZ',
  'PREIS',
  'PUNKT',
  'RABE',
  'RAHMEN',
  'RAND',
  'RAUCH',
  'RAUM',
  'RECHT',
  'REGAL',
  'REGEN',
  'REICH',
  'REIHE',
  'REISE',
  'RING',
  'ROCK',
  'ROLLE',
  'RUHE',
  'RUHM',
  'RUND',
  'SACK',
  'SALZ',
  'SAND',
  'SATZ',
  'SCHAF',
  'SCHALL',
  'SCHATTEN',
  'SCHEIN',
  'SCHERZ',
  'SCHICHT',
  'SCHILD',
  'SCHLAF',
  'SCHLAG',
  'SCHLOSS',
  'SCHLUSS',
  'SCHNEE',
  'SCHNELL',
  'SCHRANK',
  'SCHRECK',
  'SCHRIFT',
  'SCHULD',
  'SCHULE',
  'SCHUTZ',
  'SCHWACH',
  'SCHWARZ',
  'SCHWER',
  'SEELE',
  'SEIDE',
  'SEIFE',
  'SEIL',
  'SEITE',
  'SILBER',
  'SINN',
  'SITZ',
  'SOCKE',
  'SONNE',
  'SORGE',
  'SPIEL',
  'SPIEGEL',
  'SPORT',
  'STAAT',
  'STADT',
  'STAMM',
  'STAND',
  'STARK',
  'STAUB',
  'STEIN',
  'STELLE',
  'STERN',
  'STILL',
  'STIMME',
  'STIRN',
  'STOFF',
  'STOLZ',
  'STRAND',
  'STRASSE',
  'STREICH',
  'STROM',
  'STURM',
  'SUMPF',
  'SUPPE',
  'TANNE',
  'TASCHE',
  'TASSE',
  'TEMPEL',
  'TEPPICH',
  'TIER',
  'TISCH',
  'TOPF',
  'TRAUM',
  'TREUE',
  'TROST',
  'TROPF',
  'TURM',
  'UFER',
  'UNTEN',
  'VATER',
  'WALD',
  'WAND',
  'WANGE',
  'WASSER',
  'WELT',
  'WERT',
  'WETTER',
  'WILD',
  'WILLE',
  'WIND',
  'WINTER',
  'WISSEN',
  'WOLKE',
  'WORT',
  'WUNDE',
  'WURM',
  'ZAHL',
  'ZAHN',
  'ZAUN',
  'ZEILE',
  'ZEITUNG',
  'ZELT',
  'ZIEGE',
  'ZIMMER',
  'ZORN',
  'ZUCKER',
  'ZUFALL',
  'ZUKUNFT',
  'ZUNGE',
] as const;

export interface SpellingBeePuzzle {
  /** The mandatory centre letter. */
  center: string;
  /** Six outer letters surrounding the centre. */
  outer: string[];
  /** All seven letters as a Set for membership checks. */
  letters: Set<string>;
  /** Valid words for this puzzle, sorted alphabetically. */
  validWords: string[];
}

export function wordIsValidForLetters(word: string, center: string, letters: Set<string>): boolean {
  if (word.length < SPELLING_BEE_MIN_WORD_LENGTH) return false;
  if (!word.includes(center)) return false;
  for (const ch of word) {
    if (!letters.has(ch)) return false;
  }
  return true;
}

export function findValidWords(
  letters: Set<string>,
  center: string,
  dict: readonly string[] = SPELLING_BEE_WORDS,
): string[] {
  return dict.filter((w) => wordIsValidForLetters(w, center, letters)).sort();
}

export function isPangram(word: string, letters: Set<string>): boolean {
  for (const l of letters) {
    if (!word.includes(l)) return false;
  }
  return true;
}

export function scoreWord(word: string, letters: Set<string>): number {
  if (word.length < SPELLING_BEE_MIN_WORD_LENGTH) return 0;
  const base = word.length === SPELLING_BEE_MIN_WORD_LENGTH ? 1 : word.length;
  return isPangram(word, letters) ? base + SPELLING_BEE_PANGRAM_BONUS : base;
}

function shuffled(arr: string[], rng: () => number): string[] {
  const next = arr.slice();
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = next[i];
    const b = next[j];
    if (a === undefined || b === undefined) continue;
    next[i] = b;
    next[j] = a;
  }
  return next;
}

export function generatePuzzle(
  rng: () => number = Math.random,
  dict: readonly string[] = SPELLING_BEE_WORDS,
): SpellingBeePuzzle {
  const pool = [...POOL];
  let best: { center: string; outer: string[]; validWords: string[] } | null = null;
  for (let attempt = 0; attempt < PUZZLE_GENERATION_ATTEMPTS; attempt++) {
    const picked = shuffled(pool, rng).slice(0, SPELLING_BEE_LETTERS);
    const center = picked[0];
    if (center === undefined) continue;
    const letters = new Set(picked);
    const valid = findValidWords(letters, center, dict);
    if (!best || valid.length > best.validWords.length) {
      best = { center, outer: picked.slice(1), validWords: valid };
      if (valid.length >= 25) break;
    }
  }
  if (!best) {
    // Defensive fallback (should be unreachable since the pool always yields some words).
    best = { center: 'E', outer: ['A', 'I', 'L', 'N', 'R', 'S'], validWords: [] };
  }
  return {
    center: best.center,
    outer: best.outer,
    letters: new Set([best.center, ...best.outer]),
    validWords: best.validWords,
  };
}

export type SubmitResult =
  | { kind: 'too-short' }
  | { kind: 'missing-center' }
  | { kind: 'invalid-letters' }
  | { kind: 'already-found' }
  | { kind: 'unknown' }
  | { kind: 'accepted'; word: string; points: number; pangram: boolean };

export function submitWord(
  word: string,
  puzzle: SpellingBeePuzzle,
  foundWords: ReadonlySet<string>,
): SubmitResult {
  const normalised = word.toUpperCase().trim();
  if (normalised.length < SPELLING_BEE_MIN_WORD_LENGTH) return { kind: 'too-short' };
  if (!normalised.includes(puzzle.center)) return { kind: 'missing-center' };
  for (const ch of normalised) {
    if (!puzzle.letters.has(ch)) return { kind: 'invalid-letters' };
  }
  if (foundWords.has(normalised)) return { kind: 'already-found' };
  if (!puzzle.validWords.includes(normalised)) return { kind: 'unknown' };
  const points = scoreWord(normalised, puzzle.letters);
  return {
    kind: 'accepted',
    word: normalised,
    points,
    pangram: isPangram(normalised, puzzle.letters),
  };
}
