export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export const DIE_TYPES: readonly DieType[] = [
  'd4',
  'd6',
  'd8',
  'd10',
  'd12',
  'd20',
  'd100',
] as const;

export const DIE_FACES: Record<DieType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

export interface Die {
  id: string;
  type: DieType;
  color: string;
  value: number;
  held: boolean;
}

export const DICE_COLOR_PALETTE: readonly string[] = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f8fafc',
  '#1e293b',
] as const;

export const MAX_DICE = 20;

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `die-${idCounter}-${Date.now().toString(36)}`;
}

function defaultRoll(faces: number): number {
  return Math.floor(Math.random() * faces) + 1;
}

export function rollValue(
  type: DieType,
  rand: (faces: number) => number = defaultRoll,
): number {
  return rand(DIE_FACES[type]);
}

export function createDie(
  type: DieType,
  color: string,
  rand?: (faces: number) => number,
): Die {
  return {
    id: nextId(),
    type,
    color,
    value: rollValue(type, rand),
    held: false,
  };
}

export function rollDie(
  die: Die,
  rand?: (faces: number) => number,
): Die {
  return { ...die, value: rollValue(die.type, rand) };
}

export function rollAll(
  dice: readonly Die[],
  rand?: (faces: number) => number,
): Die[] {
  return dice.map((d) => (d.held ? d : rollDie(d, rand)));
}

export function setDieType(die: Die, type: DieType): Die {
  if (die.type === type) return die;
  const faces = DIE_FACES[type];
  return { ...die, type, value: Math.min(die.value, faces) };
}

export function toggleHeld(die: Die): Die {
  return { ...die, held: !die.held };
}

export function sumValues(dice: readonly Die[]): number {
  return dice.reduce((acc, d) => acc + d.value, 0);
}

export interface DicePreset {
  id: string;
  label: string;
  description: string;
  count: number;
  type: DieType;
  color: string;
}

export const DICE_PRESETS: readonly DicePreset[] = [
  {
    id: 'kniffel',
    label: 'Kniffel',
    description: '5 × W6',
    count: 5,
    type: 'd6',
    color: '#f8fafc',
  },
  {
    id: 'maexle',
    label: 'Mäxle',
    description: '2 × W6',
    count: 2,
    type: 'd6',
    color: '#ef4444',
  },
  {
    id: 'dnd',
    label: 'D&D',
    description: '1 × W20',
    count: 1,
    type: 'd20',
    color: '#8b5cf6',
  },
];

export function buildPreset(
  preset: DicePreset,
  rand?: (faces: number) => number,
): Die[] {
  return Array.from({ length: preset.count }, () =>
    createDie(preset.type, preset.color, rand),
  );
}

export function readableTextColor(bgHex: string): string {
  const hex = bgHex.replace('#', '');
  if (hex.length !== 6) return '#0f172a';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#0f172a' : '#f8fafc';
}
