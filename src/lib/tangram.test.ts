import { describe, expect, it } from 'vitest';
import {
  centroidOfPoints,
  fitPuzzlePoints,
  initialPieces,
  PIECE_DEFS,
  PUZZLES,
  pointInPolygon,
  polygonArea,
  rotatedPiece,
  TANGRAM_UNIT,
} from './tangram';

describe('tangram', () => {
  it('defines the seven classic tangram pieces with unique ids', () => {
    expect(PIECE_DEFS).toHaveLength(7);
    expect(new Set(PIECE_DEFS.map((p) => p.id))).toEqual(new Set([0, 1, 2, 3, 4, 5, 6]));
  });

  it('the seven pieces together tile a 4×4-unit square (area = 16·UNIT²)', () => {
    const totalArea = PIECE_DEFS.reduce((sum, p) => sum + polygonArea(p.points), 0);
    expect(totalArea).toBeCloseTo(16 * TANGRAM_UNIT * TANGRAM_UNIT, 5);
  });

  it('exposes five puzzle silhouettes', () => {
    expect(PUZZLES).toHaveLength(5);
    expect(PUZZLES.map((p) => p.name)).toContain('Quadrat');
  });

  it('polygonArea computes the area of a simple square', () => {
    expect(
      polygonArea([
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
      ]),
    ).toBe(16);
  });

  it('fitPuzzlePoints scales every puzzle to the same target area', () => {
    for (const puzzle of PUZZLES) {
      const fitted = fitPuzzlePoints(puzzle);
      expect(polygonArea(fitted)).toBeCloseTo(16 * TANGRAM_UNIT * TANGRAM_UNIT, 3);
    }
  });

  it('pointInPolygon detects inside vs outside points', () => {
    const square: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    expect(pointInPolygon(5, 5, square)).toBe(true);
    expect(pointInPolygon(20, 5, square)).toBe(false);
  });

  it('centroidOfPoints returns the average of the vertices', () => {
    expect(
      centroidOfPoints([
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
      ]),
    ).toEqual([2, 2]);
  });

  it('rotatedPiece with rotation 0 just translates the vertices', () => {
    const def = PIECE_DEFS[0]!;
    const translated = rotatedPiece(def, { id: 0, x: 10, y: 20, rotation: 0 });
    const expected = def.points.map(([px, py]) => [px + 10, py + 20] as [number, number]);
    translated.forEach(([x, y], i) => {
      expect(x).toBeCloseTo(expected[i]![0], 6);
      expect(y).toBeCloseTo(expected[i]![1], 6);
    });
  });

  it('rotatedPiece by a full turn returns to the original position', () => {
    const def = PIECE_DEFS[2]!;
    const zero = rotatedPiece(def, { id: 2, x: 0, y: 0, rotation: 0 });
    const full = rotatedPiece(def, { id: 2, x: 0, y: 0, rotation: Math.PI * 2 });
    full.forEach(([x, y], i) => {
      expect(x).toBeCloseTo(zero[i]![0], 6);
      expect(y).toBeCloseTo(zero[i]![1], 6);
    });
  });

  it('initialPieces lays out all seven pieces unrotated', () => {
    const pieces = initialPieces();
    expect(pieces).toHaveLength(7);
    expect(pieces.every((p) => p.rotation === 0)).toBe(true);
    expect(pieces.map((p) => p.id)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});
