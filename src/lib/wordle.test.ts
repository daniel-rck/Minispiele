import { describe, it, expect } from 'vitest';
import {
  appendLetter,
  backspace,
  createInitialState,
  isValidWord,
  keyboardStatus,
  pickRandomWord,
  scoreGuess,
  submitGuess,
  MAX_GUESSES,
  WORD_LENGTH,
} from './wordle';

describe('wordle scoreGuess', () => {
  it('marks all letters correct when the guess matches the target', () => {
    expect(scoreGuess('APFEL', 'APFEL')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
  });

  it('marks letters absent when not in the target at all', () => {
    expect(scoreGuess('FUNKE', 'APFEL')).toEqual([
      'present', // F is in APFEL
      'absent', // U
      'absent', // N
      'absent', // K
      'present', // E is in APFEL
    ]);
  });

  it('handles duplicate letters in the guess vs single in target (LAUNE vs ALLEE)', () => {
    // target=ALLEE, guess=LAUNE
    // L at position 0 — A is target[0]: not correct. L is in target → present
    // A at position 1 — L is target[1]: not correct. A is in target (at 0) → present
    // U at position 2 — L target[2]: not correct. U not in target → absent
    // N at position 3 — E target[3]: not correct. N not in target → absent
    // E at position 4 — E target[4]: correct
    expect(scoreGuess('LAUNE', 'ALLEE')).toEqual([
      'present',
      'present',
      'absent',
      'absent',
      'correct',
    ]);
  });

  it('does not double-count letters when target has fewer occurrences', () => {
    // target=BLOCK, guess=LOLLI (3 L's, but target only has 1)
    // Wait that's only 5 chars: L,O,L,L,I.
    // First pass: position 0 L vs B: no, position 1 O vs L: no, position 2 L vs O: no,
    // position 3 L vs C: no, position 4 I vs K: no
    // Second pass with remaining letters of target = {B:1, L:1, O:1, C:1, K:1}
    // L (pos 0) -> L exists, mark present, consume L
    // O (pos 1) -> O exists, mark present, consume O
    // L (pos 2) -> L already consumed, absent
    // L (pos 3) -> absent
    // I (pos 4) -> not in target, absent
    expect(scoreGuess('LOLLI', 'BLOCK')).toEqual([
      'present',
      'present',
      'absent',
      'absent',
      'absent',
    ]);
  });

  it('throws when guess and target lengths differ', () => {
    expect(() => scoreGuess('ABC', 'APFEL')).toThrow();
  });
});

describe('wordle state', () => {
  it('createInitialState normalizes the target to uppercase', () => {
    const s = createInitialState('apfel');
    expect(s.target).toBe('APFEL');
    expect(s.guesses).toEqual([]);
    expect(s.done).toBeNull();
  });

  it('submitGuess rejects too-short input', () => {
    const s = createInitialState('APFEL');
    const r = submitGuess(s, 'APF');
    expect(r.error).toBe('too-short');
    expect(r.state).toBe(s);
  });

  it('submitGuess rejects words not in the dictionary', () => {
    const s = createInitialState('APFEL');
    const r = submitGuess(s, 'XYZXY');
    expect(r.error).toBe('not-a-word');
  });

  it('submitGuess marks "won" when the guess matches the target', () => {
    const s = createInitialState('APFEL');
    const r = submitGuess(s, 'APFEL');
    expect(r.error).toBeUndefined();
    expect(r.state.done).toBe('won');
    expect(r.state.guesses).toEqual(['APFEL']);
  });

  it('submitGuess transitions to "lost" after MAX_GUESSES wrong attempts', () => {
    let s = createInitialState('APFEL');
    const wrongGuess = 'BLITZ';
    for (let i = 0; i < MAX_GUESSES; i++) {
      const r = submitGuess(s, wrongGuess);
      expect(r.error).toBeUndefined();
      s = r.state;
    }
    expect(s.done).toBe('lost');
    expect(s.guesses).toHaveLength(MAX_GUESSES);
  });

  it('appendLetter / backspace edit the current draft up to WORD_LENGTH', () => {
    let s = createInitialState('APFEL');
    for (const ch of 'apfels') s = appendLetter(s, ch);
    expect(s.current).toBe('APFEL');
    expect(s.current.length).toBe(WORD_LENGTH);
    s = backspace(s);
    expect(s.current).toBe('APFE');
  });

  it('appendLetter ignores non-letters', () => {
    const s = createInitialState('APFEL');
    expect(appendLetter(s, '1')).toBe(s);
    expect(appendLetter(s, ' ')).toBe(s);
  });
});

describe('wordle pickRandomWord and isValidWord', () => {
  it('pickRandomWord returns a 5-letter uppercase word', () => {
    const w = pickRandomWord(() => 0.5);
    expect(w).toMatch(/^[A-ZÄÖÜẞ]{5}$/);
  });

  it('isValidWord accepts curated words and rejects gibberish', () => {
    expect(isValidWord('APFEL')).toBe(true);
    expect(isValidWord('apfel')).toBe(true);
    expect(isValidWord('XYZAB')).toBe(false);
    expect(isValidWord('AB')).toBe(false);
  });
});

describe('wordle keyboardStatus', () => {
  it('aggregates per-letter status across guesses with correct>present>absent precedence', () => {
    let s = createInitialState('APFEL');
    s = submitGuess(s, 'FUNKE').state; // F=present, U=absent, N=absent, K=absent, E=present
    s = submitGuess(s, 'BLITZ').state; // B,L,I,T,Z (L is in target → present)
    const map = keyboardStatus(s);
    expect(map['F']).toBe('present');
    expect(map['U']).toBe('absent');
    expect(map['L']).toBe('present');
    expect(map['Z']).toBe('absent');
  });

  it('upgrades present to correct if a later guess places the letter correctly', () => {
    let s = createInitialState('APFEL');
    s = submitGuess(s, 'FLECK').state; // F,L,E present (each in APFEL at different positions)
    s = submitGuess(s, 'TAFEL').state; // F,E,L all in correct positions of APFEL
    const map = keyboardStatus(s);
    expect(map['F']).toBe('correct');
    expect(map['L']).toBe('correct');
    expect(map['E']).toBe('correct');
  });
});
