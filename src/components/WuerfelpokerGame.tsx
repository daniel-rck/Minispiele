import { useCallback, useEffect, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import { type WuerfelpokerScores, WuerfelpokerScoresSchema } from '../lib/persistedSchemas';
import { useGameSfx } from '../lib/useGameSfx';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';

const PIPS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const EMPTY_SCORES: WuerfelpokerScores = { you: 0, ai: 0, draws: 0 };

interface Hand {
  rank: number;
  name: string;
  val: number;
}

function evaluateHand(dice: readonly number[]): Hand {
  const sorted = [...dice].sort((a, b) => a - b);
  const counts: Record<number, number> = {};
  for (const d of dice) counts[d] = (counts[d] ?? 0) + 1;
  const vals = Object.values(counts).sort((a, b) => b - a);
  const isStraight = (sorted[4] ?? 0) - (sorted[0] ?? 0) === 4 && new Set(sorted).size === 5;
  const joined = sorted.join('');
  const isStraightLow = joined === '12345';
  const isStraightHigh = joined === '23456';
  const top = sorted[4] ?? 0;
  if (vals[0] === 5) return { rank: 7, name: 'Fünfling', val: top };
  if (vals[0] === 4) return { rank: 6, name: 'Viererpasch', val: sorted[2] ?? 0 };
  if (vals[0] === 3 && vals[1] === 2) return { rank: 5, name: 'Full House', val: sorted[2] ?? 0 };
  if (isStraight || isStraightLow || isStraightHigh) return { rank: 4, name: 'Straße', val: top };
  if (vals[0] === 3) return { rank: 3, name: 'Drilling', val: sorted[2] ?? 0 };
  if (vals[0] === 2 && vals[1] === 2) return { rank: 2, name: 'Zwei Paare', val: top };
  if (vals[0] === 2) return { rank: 1, name: 'Paar', val: top };
  return { rank: 0, name: 'Nichts', val: top };
}

function shouldHold(dice: readonly number[], i: number): boolean {
  const counts: Record<number, number> = {};
  for (const d of dice) counts[d] = (counts[d] ?? 0) + 1;
  const v = dice[i];
  return v !== undefined && (counts[v] ?? 0) >= 2;
}

export default function WuerfelpokerGame() {
  const [pDice, setPDice] = useState<number[]>([0, 0, 0, 0, 0]);
  const [aiDice, setAiDice] = useState<number[]>([0, 0, 0, 0, 0]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [over, setOver] = useState(false);
  const [scores, setScores] = useLocalStorage<WuerfelpokerScores>(
    STORAGE_KEYS.WUERFELPOKER_SCORES,
    WuerfelpokerScoresSchema,
    EMPTY_SCORES,
  );
  const [announcement, setAnnouncement] = useState('Würfle und halte die besten Würfel.');

  const sfx = useGameSfx();
  const { vibrate } = useVibration();

  const restart = useCallback(() => {
    setPDice([0, 0, 0, 0, 0]);
    setAiDice([0, 0, 0, 0, 0]);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setOver(false);
    setAnnouncement('Neue Runde. Würfle.');
  }, []);

  const roll = useCallback(() => {
    if (rollsLeft <= 0 || over) return;
    vibrate(15);
    sfx.pop();
    setPDice((d) => d.map((v, i) => (held[i] ? v : 1 + Math.floor(Math.random() * 6))));
    setRollsLeft((r) => r - 1);
  }, [rollsLeft, over, held, sfx, vibrate]);

  // Runden-Auflösung: sobald keine Würfe mehr übrig sind, spielt die KI und das
  // Ergebnis wird ausgewertet. Bewusst als Effect mit Cleanup statt verschachtelt
  // im setRollsLeft-Updater — Updater müssen pur sein (StrictMode ruft sie doppelt
  // auf), sonst würde der Score doppelt gezählt und der Timeout leakte.
  useEffect(() => {
    if (rollsLeft !== 0 || over) return;
    const aiTurn = [0, 0, 0, 0, 0].map(() => 1 + Math.floor(Math.random() * 6));
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < 5; i++) {
        if (!shouldHold(aiTurn, i)) aiTurn[i] = 1 + Math.floor(Math.random() * 6);
      }
    }
    setAiDice(aiTurn);
    const id = window.setTimeout(() => {
      const aiHand = evaluateHand(aiTurn);
      const pHand = evaluateHand(pDice);
      setOver(true);
      if (pHand.rank > aiHand.rank || (pHand.rank === aiHand.rank && pHand.val > aiHand.val)) {
        setScores((s) => ({ ...s, you: s.you + 1 }));
        setAnnouncement(`Du gewinnst: ${pHand.name} schlägt ${aiHand.name}.`);
        sfx.win();
        vibrate([60, 40, 120]);
      } else if (
        aiHand.rank > pHand.rank ||
        (aiHand.rank === pHand.rank && aiHand.val > pHand.val)
      ) {
        setScores((s) => ({ ...s, ai: s.ai + 1 }));
        setAnnouncement(`KI gewinnt: ${aiHand.name} schlägt ${pHand.name}.`);
        sfx.lose();
        vibrate([120, 60, 80]);
      } else {
        setScores((s) => ({ ...s, draws: s.draws + 1 }));
        setAnnouncement(`Unentschieden — beide ${pHand.name}.`);
        sfx.match();
      }
    }, 50);
    return () => window.clearTimeout(id);
  }, [rollsLeft, over, pDice, setScores, sfx, vibrate]);

  const toggleHold = useCallback(
    (i: number) => {
      if (rollsLeft === 3 || over) return;
      vibrate(10);
      setHeld((h) => h.map((v, idx) => (idx === i ? !v : v)));
    },
    [rollsLeft, over, vibrate],
  );

  const pHand = pDice.every((d) => d === 0) ? null : evaluateHand(pDice);
  const aiHand = over ? evaluateHand(aiDice) : null;

  return (
    <div className="flex flex-col items-center gap-3 pb-4">
      <AriaLive message={announcement} />

      <div className="grid w-full max-w-md grid-cols-3 gap-2 text-sm text-surface-700 dark:text-surface-200">
        <div>
          Du: <span className="font-semibold tabular-nums">{scores.you}</span>
        </div>
        <div className="text-center">
          U: <span className="font-semibold tabular-nums">{scores.draws}</span>
        </div>
        <div className="text-right">
          KI: <span className="font-semibold tabular-nums">{scores.ai}</span>
        </div>
      </div>

      <div className="w-full max-w-md rounded-2xl bg-surface-100 p-3 dark:bg-surface-800">
        <h3 className="mb-2 text-sm font-bold text-surface-700 dark:text-surface-200">KI</h3>
        <div className="flex justify-center gap-2">
          {aiDice.map((d, i) => (
            <div
              key={i}
              role="img"
              aria-label={`KI-Würfel ${i + 1}${over ? `: ${d}` : ': verdeckt'}`}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700 text-2xl text-amber-200"
            >
              {over && d ? PIPS[d] : '?'}
            </div>
          ))}
        </div>
        {aiHand && (
          <p className="mt-1 text-center text-xs text-surface-600 dark:text-surface-300">
            {aiHand.name}
          </p>
        )}
      </div>

      <div className="w-full max-w-md rounded-2xl bg-surface-100 p-3 dark:bg-surface-800">
        <h3 className="mb-2 text-sm font-bold text-surface-700 dark:text-surface-200">Du</h3>
        <div className="flex justify-center gap-2">
          {pDice.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleHold(i)}
              disabled={rollsLeft === 3 || over}
              aria-label={`Würfel ${i + 1}${d ? `: ${d}` : ''}${held[i] ? ' gehalten' : ''}`}
              aria-pressed={held[i]}
              className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                held[i] ? 'bg-amber-300 ring-4 ring-amber-500' : 'bg-white text-slate-900'
              }`}
            >
              {d ? PIPS[d] : '-'}
            </button>
          ))}
        </div>
        {pHand && (
          <p className="mt-1 text-center text-xs text-surface-600 dark:text-surface-300">
            {pHand.name}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary" size="sm" onClick={roll} disabled={rollsLeft === 0 || over}>
          Würfeln ({rollsLeft})
        </Button>
        <Button variant="secondary" size="sm" onClick={restart}>
          Neue Runde
        </Button>
      </div>

      <p className="max-w-md text-center text-xs text-surface-500 dark:text-surface-400">
        5 Würfel, 3 Würfe. Halte Würfel, dann erneut würfeln. Bilde die beste Poker-Hand: Paar &lt;
        Zwei Paare &lt; Drilling &lt; Straße &lt; Full House &lt; Viererpasch &lt; Fünfling.
      </p>
    </div>
  );
}
