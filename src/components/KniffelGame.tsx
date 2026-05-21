import { useCallback, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { KniffelBestSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

type Section = 'upper' | 'lower';

interface Category {
  id: string;
  name: string;
  section: Section;
  fn: (dice: readonly number[]) => number;
}

function counts(dice: readonly number[]): Record<number, number> {
  const c: Record<number, number> = {};
  for (const v of dice) c[v] = (c[v] ?? 0) + 1;
  return c;
}

const CATS: readonly Category[] = [
  {
    id: 'ones',
    name: 'Einser',
    section: 'upper',
    fn: (d) => d.filter((x) => x === 1).reduce((a, b) => a + b, 0),
  },
  {
    id: 'twos',
    name: 'Zweier',
    section: 'upper',
    fn: (d) => d.filter((x) => x === 2).reduce((a, b) => a + b, 0),
  },
  {
    id: 'threes',
    name: 'Dreier',
    section: 'upper',
    fn: (d) => d.filter((x) => x === 3).reduce((a, b) => a + b, 0),
  },
  {
    id: 'fours',
    name: 'Vierer',
    section: 'upper',
    fn: (d) => d.filter((x) => x === 4).reduce((a, b) => a + b, 0),
  },
  {
    id: 'fives',
    name: 'Fünfer',
    section: 'upper',
    fn: (d) => d.filter((x) => x === 5).reduce((a, b) => a + b, 0),
  },
  {
    id: 'sixes',
    name: 'Sechser',
    section: 'upper',
    fn: (d) => d.filter((x) => x === 6).reduce((a, b) => a + b, 0),
  },
  {
    id: 'three_kind',
    name: 'Dreierpasch',
    section: 'lower',
    fn: (d) => (Object.values(counts(d)).some((v) => v >= 3) ? d.reduce((a, b) => a + b, 0) : 0),
  },
  {
    id: 'four_kind',
    name: 'Viererpasch',
    section: 'lower',
    fn: (d) => (Object.values(counts(d)).some((v) => v >= 4) ? d.reduce((a, b) => a + b, 0) : 0),
  },
  {
    id: 'full_house',
    name: 'Full House',
    section: 'lower',
    fn: (d) => {
      const c = Object.values(counts(d)).sort();
      return c.length === 2 && c[0] === 2 && c[1] === 3 ? 25 : 0;
    },
  },
  {
    id: 'sm_straight',
    name: 'Kleine Straße',
    section: 'lower',
    fn: (d) => {
      const u = [...new Set(d)].sort().join('');
      return u.includes('1234') || u.includes('2345') || u.includes('3456') ? 30 : 0;
    },
  },
  {
    id: 'lg_straight',
    name: 'Große Straße',
    section: 'lower',
    fn: (d) => {
      const u = [...new Set(d)].sort().join('');
      return u === '12345' || u === '23456' ? 40 : 0;
    },
  },
  {
    id: 'kniffel',
    name: 'Kniffel',
    section: 'lower',
    fn: (d) => (Object.values(counts(d)).some((v) => v === 5) ? 50 : 0),
  },
  { id: 'chance', name: 'Chance', section: 'lower', fn: (d) => d.reduce((a, b) => a + b, 0) },
];

const PIP_POSITIONS: Record<number, readonly [number, number][]> = {
  1: [[50, 50]],
  2: [
    [25, 25],
    [75, 75],
  ],
  3: [
    [25, 25],
    [50, 50],
    [75, 75],
  ],
  4: [
    [25, 25],
    [75, 25],
    [25, 75],
    [75, 75],
  ],
  5: [
    [25, 25],
    [75, 25],
    [50, 50],
    [25, 75],
    [75, 75],
  ],
  6: [
    [25, 25],
    [75, 25],
    [25, 50],
    [75, 50],
    [25, 75],
    [75, 75],
  ],
};

export default function KniffelGame() {
  const [dice, setDice] = useState<number[]>([1, 2, 3, 4, 5]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [round, setRound] = useState(0);
  const [over, setOver] = useState(false);
  const [announcement, setAnnouncement] = useState('Würfle los!');
  const [best, setBest] = useLocalStorage<number>(STORAGE_KEYS.KNIFFEL_BEST, KniffelBestSchema, 0);

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback(() => {
    setDice([1, 2, 3, 4, 5]);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setScores({});
    setRound(0);
    setOver(false);
    setAnnouncement('Würfle los!');
  }, []);

  const rollDice = useCallback(() => {
    if (rollsLeft <= 0 || over) return;
    vibrate(20);
    setDice((d) => d.map((v, i) => (held[i] ? v : 1 + Math.floor(Math.random() * 6))));
    setRollsLeft((r) => r - 1);
    sfx.pop();
    setAnnouncement(
      rollsLeft - 1 > 0
        ? 'Halte Würfel, dann nochmal würfeln.'
        : 'Wähle eine Kategorie für deine Punkte.',
    );
  }, [rollsLeft, over, held, vibrate, sfx]);

  const toggleHold = useCallback(
    (i: number) => {
      if (rollsLeft === 3 || over) return;
      vibrate(10);
      setHeld((h) => h.map((v, idx) => (idx === i ? !v : v)));
    },
    [rollsLeft, over, vibrate],
  );

  const scoreCategory = useCallback(
    (cat: Category) => {
      if (scores[cat.id] !== undefined || rollsLeft === 3 || over) return;
      const value = cat.fn(dice);
      const newScores = { ...scores, [cat.id]: value };
      setScores(newScores);
      const newRound = round + 1;
      setRound(newRound);
      sfx.match();
      vibrate(15);
      if (newRound >= 13) {
        setOver(true);
        let upperSum = 0;
        for (const c of CATS) {
          if (c.section === 'upper' && newScores[c.id] !== undefined) {
            upperSum += newScores[c.id] ?? 0;
          }
        }
        const bonus = upperSum >= 63 ? 35 : 0;
        const total = Object.values(newScores).reduce((a, b) => a + b, 0) + bonus;
        if (total > best) {
          setBest(total);
          setAnnouncement(`Spiel vorbei! Neuer Rekord ${total} Punkte.`);
          sfx.win();
          vibrate([60, 40, 120]);
        } else {
          setAnnouncement(`Spiel vorbei. ${total} Punkte.`);
        }
      } else {
        setRollsLeft(3);
        setHeld([false, false, false, false, false]);
        setAnnouncement(`Runde ${newRound + 1}/13 — Würfle.`);
      }
    },
    [scores, rollsLeft, over, dice, round, best, setBest, sfx, vibrate],
  );

  let upperSum = 0;
  let totalSum = 0;
  for (const cat of CATS) {
    if (scores[cat.id] !== undefined) {
      if (cat.section === 'upper') upperSum += scores[cat.id] ?? 0;
      totalSum += scores[cat.id] ?? 0;
    }
  }
  const bonus = upperSum >= 63 && round >= 6 ? 35 : 0;
  if (round >= 6) totalSum += bonus;

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <p className="text-sm text-surface-700 dark:text-surface-200">
        {over ? 'Spiel vorbei' : `Runde ${round + 1}/13`}
      </p>

      <div className="flex justify-center gap-2">
        {dice.map((value, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggleHold(i)}
            disabled={rollsLeft === 3 || over}
            aria-label={`Würfel ${i + 1}: ${value}${held[i] ? ' gehalten' : ''}`}
            aria-pressed={held[i]}
            className={`relative h-12 w-12 rounded-xl bg-white shadow disabled:cursor-not-allowed ${
              held[i] ? 'ring-4 ring-amber-400' : ''
            }`}
          >
            {(PIP_POSITIONS[value] ?? []).map((p, idx) => (
              <span
                key={idx}
                aria-hidden
                className="absolute block h-2 w-2 rounded-full bg-slate-900"
                style={{ left: `${p[0] - 8}%`, top: `${p[1] - 8}%` }}
              />
            ))}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary" size="sm" onClick={rollDice} disabled={rollsLeft <= 0 || over}>
          Würfeln ({rollsLeft})
        </Button>
        <Button variant="secondary" size="sm" onClick={restart}>
          Neues Spiel
        </Button>
        <span className="text-sm text-surface-700 dark:text-surface-200">
          Best: <span className="font-semibold tabular-nums">{best}</span>
        </span>
      </div>

      <table className="w-full max-w-md text-sm">
        <thead>
          <tr className="text-left text-surface-600 dark:text-surface-400">
            <th className="px-2 py-1">Kategorie</th>
            <th className="w-24 px-2 py-1 text-right">Punkte</th>
          </tr>
        </thead>
        <tbody>
          {CATS.map((cat) => {
            const scored = scores[cat.id];
            const preview = scored === undefined && rollsLeft < 3 && !over ? cat.fn(dice) : null;
            return (
              <tr key={cat.id} className="border-t border-surface-200 dark:border-surface-700">
                <td className="px-2 py-1">{cat.name}</td>
                <td className="px-2 py-1 text-right">
                  {scored !== undefined ? (
                    <span className="font-semibold tabular-nums">{scored}</span>
                  ) : preview !== null ? (
                    <button
                      type="button"
                      onClick={() => scoreCategory(cat)}
                      className="rounded bg-amber-100 px-2 py-1 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-100"
                      aria-label={`${cat.name} mit ${preview} Punkten eintragen`}
                    >
                      {preview}
                    </button>
                  ) : (
                    <span className="text-surface-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
          <tr className="border-t border-surface-300 font-semibold dark:border-surface-600">
            <td className="px-2 py-1">Bonus ({upperSum}/63)</td>
            <td className="px-2 py-1 text-right tabular-nums">
              {round >= 6 ? (bonus > 0 ? `+${bonus}` : '0') : '…'}
            </td>
          </tr>
          <tr className="border-t border-surface-300 font-bold dark:border-surface-600">
            <td className="px-2 py-1">Gesamt</td>
            <td className="px-2 py-1 text-right tabular-nums">{totalSum}</td>
          </tr>
        </tbody>
      </table>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        3 Würfe pro Runde. Halte Würfel, dann erneut würfeln. Wähle nach jedem Wurf eine Kategorie
        zum Eintragen. 13 Runden insgesamt; ab 63 Oberteil-Summe gibt es +35 Bonus.
      </p>
    </div>
  );
}
