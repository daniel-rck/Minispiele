import { DIE_FACES, type DieType } from './dice';

export interface ParsedNotation {
  count: number;
  type: DieType;
  modifier: number;
}

const NOTATION_RE = /^(\d+)?d(\d+)([+-]\d+)?$/i;
const MAX_COUNT = 64;

export function parseNotation(input: string): ParsedNotation | null {
  const trimmed = input.trim().toLowerCase().replace(/\s+/g, '');
  if (trimmed.length === 0) return null;
  const match = NOTATION_RE.exec(trimmed);
  if (!match) return null;
  const [, countRaw, facesRaw, modifierRaw] = match;
  if (!facesRaw) return null;

  const count = countRaw ? Number.parseInt(countRaw, 10) : 1;
  if (!Number.isFinite(count) || count <= 0 || count > MAX_COUNT) return null;

  const faces = Number.parseInt(facesRaw, 10);
  const type = faceCountToType(faces);
  if (!type) return null;

  const modifier = modifierRaw ? Number.parseInt(modifierRaw, 10) : 0;
  if (!Number.isFinite(modifier)) return null;

  return { count, type, modifier };
}

function faceCountToType(faces: number): DieType | null {
  for (const [type, t] of Object.entries(DIE_FACES) as [DieType, number][]) {
    if (t === faces) return type;
  }
  return null;
}
