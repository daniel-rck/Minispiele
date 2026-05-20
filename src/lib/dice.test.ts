import { describe, expect, it } from 'vitest';
import {
  buildPreset,
  createDie,
  DICE_PRESETS,
  DIE_FACES,
  type Die,
  readableTextColor,
  rollAll,
  rollDie,
  setDieType,
  sumValues,
  toggleHeld,
} from './dice';

function fixedRand(value: number): (faces: number) => number {
  return () => value;
}

describe('rollDie', () => {
  it('produces a value within 1..faces for each die type', () => {
    for (const [type, faces] of Object.entries(DIE_FACES)) {
      const die = createDie(type as keyof typeof DIE_FACES, '#fff', fixedRand(1));
      const rolled = rollDie(die);
      expect(rolled.value).toBeGreaterThanOrEqual(1);
      expect(rolled.value).toBeLessThanOrEqual(faces);
    }
  });

  it('uses the injected RNG', () => {
    const die = createDie('d20', '#fff', fixedRand(1));
    const rolled = rollDie(die, fixedRand(17));
    expect(rolled.value).toBe(17);
  });
});

describe('rollAll', () => {
  it('rerolls non-held dice and keeps held dice unchanged', () => {
    const a: Die = { id: 'a', type: 'd6', color: '#fff', value: 3, held: true };
    const b: Die = { id: 'b', type: 'd6', color: '#fff', value: 3, held: false };
    const out = rollAll([a, b], fixedRand(5));
    expect(out[0]?.value).toBe(3);
    expect(out[1]?.value).toBe(5);
    expect(out[0]).toBe(a);
  });
});

describe('setDieType', () => {
  it('clamps the displayed value to the new die size', () => {
    const die: Die = { id: 'x', type: 'd20', color: '#fff', value: 17, held: false };
    const next = setDieType(die, 'd6');
    expect(next.type).toBe('d6');
    expect(next.value).toBe(6);
  });

  it('returns the same die when type is unchanged', () => {
    const die: Die = { id: 'x', type: 'd6', color: '#fff', value: 4, held: false };
    expect(setDieType(die, 'd6')).toBe(die);
  });
});

describe('toggleHeld', () => {
  it('flips the held flag', () => {
    const die: Die = { id: 'x', type: 'd6', color: '#fff', value: 4, held: false };
    expect(toggleHeld(die).held).toBe(true);
    expect(toggleHeld(toggleHeld(die)).held).toBe(false);
  });
});

describe('sumValues', () => {
  it('sums all die values', () => {
    expect(
      sumValues([
        { id: 'a', type: 'd6', color: '#fff', value: 3, held: false },
        { id: 'b', type: 'd6', color: '#fff', value: 5, held: true },
      ]),
    ).toBe(8);
  });
});

describe('buildPreset', () => {
  it('creates the right number of dice for Kniffel', () => {
    const kniffel = DICE_PRESETS.find((p) => p.id === 'kniffel')!;
    const dice = buildPreset(kniffel, fixedRand(1));
    expect(dice).toHaveLength(5);
    expect(dice.every((d) => d.type === 'd6')).toBe(true);
  });

  it('creates the right number of dice for Mäxle', () => {
    const maexle = DICE_PRESETS.find((p) => p.id === 'maexle')!;
    const dice = buildPreset(maexle, fixedRand(1));
    expect(dice).toHaveLength(2);
    expect(dice.every((d) => d.type === 'd6')).toBe(true);
  });
});

describe('readableTextColor', () => {
  it('returns dark text on light backgrounds', () => {
    expect(readableTextColor('#ffffff')).toBe('#0f172a');
    expect(readableTextColor('#f8fafc')).toBe('#0f172a');
  });

  it('returns light text on dark backgrounds', () => {
    expect(readableTextColor('#000000')).toBe('#f8fafc');
    expect(readableTextColor('#1e293b')).toBe('#f8fafc');
  });
});
