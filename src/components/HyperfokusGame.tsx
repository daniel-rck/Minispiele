import { forwardRef, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useVibration } from '../hooks/useVibration';
import { STORAGE_KEYS } from '../lib/constants';
import {
  ACHIEVEMENTS,
  applyPrestige,
  applyUpgrade,
  autoTapperRate,
  type CoinKind,
  canAfford,
  comboDecaySec,
  comboMultiplier,
  computeOfflineIncome,
  critChance,
  critMultiplier,
  DEFAULT_SAVE,
  EVENTS,
  type EventKind,
  eventRateMultiplier,
  findCheapestAffordable,
  formatNumber,
  isThemeUnlocked,
  newlyUnlockedAchievements,
  nextEventDelayMs,
  PRESTIGE_THRESHOLD,
  pickRandomEvent,
  prestigeBonus,
  prestigeReward,
  rollTapReward,
  THEME_ORDER,
  THEMES,
  tapPowerValue,
  UPGRADE_ORDER,
  UPGRADES,
  type UpgradeId,
  upgradeCost,
} from '../lib/hyperfokus';
import { type Particle, particleOpacity, spawnBurst, stepParticles } from '../lib/particles';
import type { HyperfokusSave, HyperfokusTheme } from '../lib/persistedSchemas';
import { HyperfokusSaveSchema } from '../lib/persistedSchemas';
import { ToneAudio } from '../lib/toneAudio';
import { useLocalStorage } from '../lib/useLocalStorage';
import AriaLive from './AriaLive';
import Button from './ui/Button';
import Sheet from './ui/Sheet';

const PENTATONIC_HZ = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
const CRIT_CHORD_HZ = [523.25, 659.25, 783.99];
const MAX_FLOATERS = 24;
const AUTOTAP_TICK_MS = 200;
const COMBO_FRAME_MS = 80;

interface Floater {
  id: number;
  x: number;
  y: number;
  text: string;
  kind: CoinKind | 'crit';
  bornAt: number;
}

interface ActiveEvent {
  kind: EventKind;
  startedAt: number;
  endsAt: number;
  bossHp: number;
}

function eventBlurb(k: EventKind): string {
  if (k === 'goldrausch') return '×3 für 10 Sek.';
  if (k === 'frenzy') return '+8 Tipps/s';
  if (k === 'zeitlupe') return 'Combo bleibt';
  if (k === 'boss') return 'Tippe schnell!';
  return '';
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

export default function HyperfokusGame() {
  const [save, setSave] = useLocalStorage<HyperfokusSave>(
    STORAGE_KEYS.HYPERFOKUS_SAVE,
    HyperfokusSaveSchema,
    DEFAULT_SAVE,
  );
  const reducedMotion = usePrefersReducedMotion();

  const [combo, setCombo] = useState(0);
  const [comboFill, setComboFill] = useState(0);
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [toasts, setToasts] = useState<{ id: number; text: string; sub: string }[]>([]);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [coreFlash, setCoreFlash] = useState<'none' | 'crit' | 'tap' | 'boss'>('none');
  const [announcement, setAnnouncement] = useState('');
  const [scoreDisplay, setScoreDisplay] = useState(save.coins);
  const [offlineGain, setOfflineGain] = useState(0);

  const saveRef = useRef(save);
  saveRef.current = save;
  const comboRef = useRef(0);
  comboRef.current = combo;
  const lastTapMsRef = useRef(0);
  const critsInRowRef = useRef(0);
  const eventRef = useRef<ActiveEvent | null>(null);
  eventRef.current = activeEvent;
  const audioRef = useRef<ToneAudio | null>(null);
  if (audioRef.current === null && typeof window !== 'undefined') {
    audioRef.current = new ToneAudio();
  }
  const floaterIdRef = useRef(0);
  const toastIdRef = useRef(0);
  const lastSavedAtRef = useRef(Date.now());
  const mountedRef = useRef(true);
  const nextEventTimerRef = useRef<number | null>(null);
  const tapsRemainderRef = useRef(0);
  const coreRef = useRef<HTMLButtonElement | null>(null);
  const floaterLayerRef = useRef<HTMLDivElement | null>(null);

  const { vibrate } = useVibration();
  const [, forceTick] = useReducer((n: number) => n + 1, 0);

  const theme = save.currentTheme;
  const themeDef = THEMES[theme];

  // Offline income on mount.
  useEffect(() => {
    const now = Date.now();
    const gain = Math.floor(computeOfflineIncome(saveRef.current, now));
    if (gain > 0) {
      setSave((s) => ({ ...s, coins: s.coins + gain, lastSavedAt: now }));
      setOfflineGain(gain);
      pushToast(`Während du weg warst: +${formatNumber(gain)}`, 'Auto-Tapper');
    } else {
      setSave((s) => ({ ...s, lastSavedAt: now }));
    }
    lastSavedAtRef.current = now;
    // Initial event scheduling
    scheduleNextEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stamp `lastSavedAt` only on tab hide / page unload. `useLocalStorage` already
  // serializes every state change; this stamp bounds offline-income on next load.
  useEffect(() => {
    const stamp = () => {
      const now = Date.now();
      lastSavedAtRef.current = now;
      setSave((s) => ({ ...s, lastSavedAt: now }));
    };
    document.addEventListener('visibilitychange', stamp);
    window.addEventListener('beforeunload', stamp);
    return () => {
      document.removeEventListener('visibilitychange', stamp);
      window.removeEventListener('beforeunload', stamp);
    };
  }, [setSave]);

  // Track mounted state so deferred timeouts can no-op after unmount.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Smooth score display.
  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const delta = now - prev;
      prev = now;
      setScoreDisplay((cur) => {
        const target = saveRef.current.coins;
        if (Math.abs(cur - target) < 0.5) return target;
        const lerp = Math.min(1, delta / 180);
        return cur + (target - cur) * lerp;
      });
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  // Combo decay loop.
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = performance.now();
      const last = lastTapMsRef.current;
      const decay = comboDecaySec(saveRef.current.upgrades.comboDecay);
      const ev = eventRef.current;
      const decayMul =
        ev && EVENTS[ev.kind].comboDecayFactor ? (EVENTS[ev.kind].comboDecayFactor ?? 1) : 1;
      const decayMs = (decay * 1000) / decayMul;
      const since = now - last;
      const fill = Math.max(0, 1 - since / decayMs);
      setComboFill(fill);
      if (fill <= 0 && comboRef.current > 0) {
        setCombo(0);
        critsInRowRef.current = 0;
      }
    }, COMBO_FRAME_MS);
    return () => window.clearInterval(id);
  }, []);

  // Auto-tapper passive income + frenzy. Fractional-tap accumulator keeps
  // totalTaps honest (achievements depend on it) without overflowing each tick.
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = saveRef.current;
      const rate = autoTapperRate(s.upgrades.autoTapper);
      const ev = eventRef.current;
      const frenzyRate =
        ev && EVENTS[ev.kind].autoTapsPerSec ? (EVENTS[ev.kind].autoTapsPerSec ?? 0) : 0;
      const totalRate = rate + frenzyRate;
      if (totalRate <= 0) {
        tapsRemainderRef.current = 0;
        return;
      }
      const ticksPerSec = 1000 / AUTOTAP_TICK_MS;
      const tapsThisTick = totalRate / ticksPerSec;
      const power = tapPowerValue(s.upgrades.tapPower);
      const pmult = prestigeBonus(s.prestigeCrystals);
      const eventMul = ev ? EVENTS[ev.kind].rewardMultiplier : 1;
      const reward = power * pmult * eventMul * tapsThisTick;

      tapsRemainderRef.current += tapsThisTick;
      const wholeTaps = Math.floor(tapsRemainderRef.current);
      tapsRemainderRef.current -= wholeTaps;

      if (reward > 0 || wholeTaps > 0) {
        setSave((cur) => ({
          ...cur,
          coins: cur.coins + reward,
          totalTaps: cur.totalTaps + wholeTaps,
        }));
      }
    }, AUTOTAP_TICK_MS);
    return () => window.clearInterval(id);
  }, [setSave]);

  // Event lifecycle (end-check).
  useEffect(() => {
    if (!activeEvent) return;
    const ms = Math.max(0, activeEvent.endsAt - Date.now());
    const id = window.setTimeout(() => {
      setActiveEvent(null);
      scheduleNextEvent();
    }, ms);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEvent]);

  // Force-refresh display every 250ms while event is active (timer bar).
  useEffect(() => {
    if (!activeEvent) return;
    const id = window.setInterval(() => forceTick(), 250);
    return () => window.clearInterval(id);
  }, [activeEvent]);

  const pushFloater = useCallback(
    (clientX: number, clientY: number, text: string, kind: Floater['kind']) => {
      if (reducedMotion) return;
      // Translate viewport coords → coords local to the floater container
      // so the rendered floater appears centered on the actual tap point.
      const rect = floaterLayerRef.current?.getBoundingClientRect();
      const x = rect ? clientX - rect.left : clientX;
      const y = rect ? clientY - rect.top : clientY;
      const id = floaterIdRef.current++;
      setFloaters((prev) => {
        const next = [...prev, { id, x, y, text, kind, bornAt: performance.now() }];
        if (next.length > MAX_FLOATERS) return next.slice(next.length - MAX_FLOATERS);
        return next;
      });
      window.setTimeout(() => {
        if (!mountedRef.current) return;
        setFloaters((prev) => prev.filter((f) => f.id !== id));
      }, 950);
    },
    [reducedMotion],
  );

  const pushToast = useCallback((text: string, sub: string) => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, text, sub }]);
    window.setTimeout(() => {
      if (!mountedRef.current) return;
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  const scheduleNextEvent = useCallback(() => {
    if (nextEventTimerRef.current !== null) {
      window.clearTimeout(nextEventTimerRef.current);
    }
    const delay = nextEventDelayMs(saveRef.current.upgrades.eventRate);
    nextEventTimerRef.current = window.setTimeout(() => {
      nextEventTimerRef.current = null;
      if (!mountedRef.current || eventRef.current) return;
      const kind = pickRandomEvent();
      const def = EVENTS[kind];
      const ev: ActiveEvent = {
        kind,
        startedAt: Date.now(),
        endsAt: Date.now() + def.durationMs,
        bossHp: def.bossTaps ?? 0,
      };
      setActiveEvent(ev);
      pushToast(def.name, eventBlurb(kind));
      audioRef.current?.playTone(660, 220, { type: 'triangle' });
    }, delay);
  }, [pushToast]);

  // Clear the pending "next event" timer on unmount.
  useEffect(() => {
    return () => {
      if (nextEventTimerRef.current !== null) {
        window.clearTimeout(nextEventTimerRef.current);
        nextEventTimerRef.current = null;
      }
    };
  }, []);

  // ----- Particle canvas (declared before handleCoreTap so it can reference spawnParticleBurst) -----
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  const spawnParticleBurst = useCallback(
    (x: number, y: number, reward: ReturnType<typeof rollTapReward>, bossKilled: boolean) => {
      const palette = themeDef.particles;
      const color = palette[Math.floor(Math.random() * palette.length)] ?? '#fff';
      const count = bossKilled ? 40 : reward.coinKind === 'mega' ? 26 : reward.isCrit ? 18 : 10;
      const rect = canvasRef.current?.getBoundingClientRect();
      const px = rect ? x - rect.left : x;
      const py = rect ? y - rect.top : y;
      const burst = spawnBurst({
        x: px,
        y: py,
        count,
        speed: bossKilled ? 0.18 : 0.1,
        color,
        lifeMs: bossKilled ? 1000 : 700,
        size: bossKilled ? 4 : 3,
      });
      particlesRef.current = particlesRef.current.concat(burst).slice(-200);
    },
    [themeDef.particles],
  );

  // ----- Tap handling -----

  const playTapSound = useCallback((comboValue: number, isCrit: boolean) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isCrit) {
      for (let i = 0; i < CRIT_CHORD_HZ.length; i++) {
        const f = CRIT_CHORD_HZ[i];
        if (typeof f === 'number') {
          audio.playTone(f, 250, { type: 'triangle', peak: 0.18 });
        }
      }
      return;
    }
    const idx = Math.min(PENTATONIC_HZ.length - 1, Math.floor(comboValue / 6));
    const freq = PENTATONIC_HZ[idx] ?? 440;
    audio.playTone(freq, 90, { type: 'sine', peak: 0.13 });
  }, []);

  const handleCoreTap = useCallback(
    (clientX: number, clientY: number) => {
      const audio = audioRef.current;
      if (audio && !audio.prime()) {
        // ignore — no audio context, still continue silently
      }
      audio?.resume();

      lastTapMsRef.current = performance.now();
      const newCombo = comboRef.current + 1;
      setCombo(newCombo);
      setComboFill(1);

      const ev = eventRef.current;
      const eventMulti = ev ? EVENTS[ev.kind].rewardMultiplier : 1;
      const reward = rollTapReward({
        save: saveRef.current,
        combo: newCombo,
        eventMulti,
      });

      // Boss tap mechanic: every tap during BOSS event hits HP, large reward on kill.
      let bossReward = 0;
      let bossKilled = false;
      if (ev && ev.kind === 'boss' && ev.bossHp > 0) {
        const nextHp = ev.bossHp - 1;
        if (nextHp <= 0) {
          bossKilled = true;
          bossReward =
            500 *
            tapPowerValue(saveRef.current.upgrades.tapPower) *
            prestigeBonus(saveRef.current.prestigeCrystals);
          setActiveEvent(null);
          scheduleNextEvent();
          pushToast('BOSS BESIEGT!', `+${formatNumber(bossReward)}`);
        } else {
          setActiveEvent({ ...ev, bossHp: nextHp });
        }
      }

      const gained = reward.total + bossReward;

      // Track crits in row for achievements.
      if (reward.isCrit) {
        critsInRowRef.current += 1;
      } else {
        critsInRowRef.current = 0;
      }

      setSave((s) => {
        const nextCoins = s.coins + gained;
        const nextTaps = s.totalTaps + 1;
        const nextBest = Math.max(s.allTimeBest, nextCoins);
        const ach = newlyUnlockedAchievements(s.unlockedAchievements, {
          coins: nextCoins,
          totalTaps: nextTaps,
          combo: newCombo,
          critsInRow: critsInRowRef.current,
          crystals: s.prestigeCrystals,
        });
        if (ach.length > 0) {
          for (const id of ach) {
            const def = ACHIEVEMENTS.find((a) => a.id === id);
            if (def) pushToast(`🏆 ${def.name}`, def.description);
          }
          return {
            ...s,
            coins: nextCoins,
            totalTaps: nextTaps,
            allTimeBest: nextBest,
            unlockedAchievements: [...s.unlockedAchievements, ...ach],
          };
        }
        return { ...s, coins: nextCoins, totalTaps: nextTaps, allTimeBest: nextBest };
      });

      // Floating number + flash + particles + sound.
      const label =
        reward.coinKind === 'mega'
          ? `MEGA +${formatNumber(gained)}`
          : reward.coinKind === 'bonus'
            ? `BONUS +${formatNumber(gained)}`
            : reward.isCrit
              ? `CRIT +${formatNumber(gained)}`
              : `+${formatNumber(gained)}`;
      pushFloater(clientX, clientY, label, reward.isCrit ? 'crit' : reward.coinKind);
      playTapSound(newCombo, reward.isCrit);
      vibrate(reward.isCrit ? 18 : 6);

      // Particle burst on crit / mega / bonus / boss kill.
      if (!reducedMotion) {
        if (reward.isCrit || reward.coinKind !== 'normal' || bossKilled) {
          spawnParticleBurst(clientX, clientY, reward, bossKilled);
        }
      }

      setCoreFlash(bossKilled ? 'boss' : reward.isCrit ? 'crit' : 'tap');
      window.setTimeout(() => {
        if (!mountedRef.current) return;
        setCoreFlash('none');
      }, 120);

      if (newCombo === 1 || newCombo % 10 === 0) {
        setAnnouncement(`Combo ${newCombo}`);
      }
    },
    [
      pushFloater,
      pushToast,
      playTapSound,
      reducedMotion,
      scheduleNextEvent,
      setSave,
      spawnParticleBurst,
      vibrate,
    ],
  );

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let prev = performance.now();
    const loop = (now: number) => {
      const delta = now - prev;
      prev = now;
      particlesRef.current = stepParticles(particlesRef.current, delta, 0.0006);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particlesRef.current) {
        ctx.globalAlpha = particleOpacity(p);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  // ----- Keyboard support -----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('[role="dialog"]')) return;
      if (e.key === ' ' || e.key === 'Enter') {
        if (e.repeat) return;
        const rect = coreRef.current?.getBoundingClientRect();
        const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
        const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
        handleCoreTap(cx, cy);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleCoreTap]);

  // ----- Upgrade actions -----
  const onBuyUpgrade = useCallback(
    (id: UpgradeId) => {
      setSave((s) => {
        if (!canAfford(s, id)) return s;
        return applyUpgrade(s, id);
      });
      audioRef.current?.playTone(740, 120, { type: 'square', peak: 0.13 });
    },
    [setSave],
  );

  const onPrestige = useCallback(() => {
    const gained = prestigeReward(saveRef.current.coins);
    if (gained <= 0) return;
    setSave((s) => applyPrestige(s));
    setCombo(0);
    setActiveEvent(null);
    setShowUpgrades(false);
    pushToast(`+${gained} Aurora-Kristall${gained === 1 ? '' : 'e'}`, 'Prestige aktiviert');
    audioRef.current?.playTone(880, 600, { type: 'triangle', peak: 0.16 });
  }, [setSave, pushToast]);

  const onSwitchTheme = useCallback(
    (t: HyperfokusTheme) => {
      if (!isThemeUnlocked(t, saveRef.current.prestigeCrystals)) return;
      setSave((s) => ({ ...s, currentTheme: t }));
    },
    [setSave],
  );

  // ----- Derived display values -----
  const cmult = comboMultiplier(combo);
  const eventDef = activeEvent ? EVENTS[activeEvent.kind] : null;
  const eventLeftMs = activeEvent ? Math.max(0, activeEvent.endsAt - Date.now()) : 0;
  const eventLeftFrac =
    eventDef && activeEvent ? Math.max(0, Math.min(1, eventLeftMs / eventDef.durationMs)) : 0;
  const prestigeAvailable = save.coins >= PRESTIGE_THRESHOLD;
  const prestigeGain = prestigeReward(save.coins);
  const quickBuy = findCheapestAffordable(save);
  const quickBuyCost = quickBuy ? upgradeCost(quickBuy, save.upgrades[quickBuy]) : 0;

  const accentByEvent = useMemo(() => {
    if (!activeEvent) return null;
    if (activeEvent.kind === 'goldrausch') return 'oklch(0.85 0.18 80)';
    if (activeEvent.kind === 'frenzy') return 'oklch(0.7 0.22 25)';
    if (activeEvent.kind === 'boss') return 'oklch(0.62 0.22 25)';
    return 'oklch(0.75 0.17 220)';
  }, [activeEvent]);

  const bgStyle = useMemo<React.CSSProperties>(
    () => ({
      backgroundImage: `radial-gradient(ellipse at top, ${themeDef.from}, ${themeDef.to})`,
    }),
    [themeDef],
  );

  return (
    <div className="relative -mx-4 overflow-hidden rounded-3xl text-white" style={bgStyle}>
      <AriaLive message={announcement} />

      <div className="relative z-10 flex flex-col gap-3 px-4 pt-4 pb-6">
        {/* Top header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <div
              aria-label={`${formatNumber(Math.floor(scoreDisplay))} Coins`}
              className="text-3xl font-extrabold tabular-nums sm:text-4xl"
            >
              {formatNumber(Math.floor(scoreDisplay))}
            </div>
            <div className="text-xs text-white/60">
              Coins · Bestes {formatNumber(save.allTimeBest)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {save.prestigeCrystals > 0 && (
              <div
                className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs backdrop-blur"
                aria-label={`${save.prestigeCrystals} Aurora-Kristalle`}
              >
                <span aria-hidden>✦</span>
                <span className="font-bold tabular-nums">{save.prestigeCrystals}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowUpgrades(true)}
              className="inline-flex min-h-11 items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm font-bold backdrop-blur hover:bg-white/20"
              aria-label="Upgrades öffnen"
            >
              <span aria-hidden>⚙</span> Upgrades
            </button>
          </div>
        </div>

        {/* Quick-buy chip — auto-appears when an upgrade becomes affordable
            so the player doesn't have to open the modal (which would cool the combo). */}
        {quickBuy && (
          <button
            key={`qb-${quickBuy}`}
            type="button"
            onClick={() => onBuyUpgrade(quickBuy)}
            className="card-pop-in flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-highlight-300/40 bg-highlight-500/20 px-3 py-2 text-left backdrop-blur transition hover:bg-highlight-500/30"
            aria-label={`Schnellkauf: ${UPGRADES[quickBuy].name} für ${formatNumber(quickBuyCost)} Coins`}
          >
            <div>
              <div className="text-[10px] tracking-wide text-highlight-200 uppercase">
                Schnellkauf
              </div>
              <div className="text-sm font-extrabold text-white">{UPGRADES[quickBuy].name} +1</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[10px] tracking-wide text-white/60 uppercase">Kosten</div>
              <div className="text-sm font-extrabold tabular-nums text-highlight-200">
                {formatNumber(quickBuyCost)}
              </div>
            </div>
          </button>
        )}

        {/* Combo bar */}
        <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-fuchsia-400 to-amber-300 transition-[width] duration-100 ease-linear motion-reduce:transition-none"
            style={{ width: `${comboFill * 100}%` }}
            aria-hidden
          />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tracking-widest text-white/90">
            COMBO ×{cmult.toFixed(2)} · {combo}
          </div>
        </div>

        {/* Event banner */}
        {activeEvent && eventDef && (
          <div
            className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur"
            style={{ borderColor: accentByEvent ?? undefined }}
            role="status"
          >
            <div className="flex items-center justify-between text-sm font-extrabold">
              <span>{eventDef.name}</span>
              <span className="text-xs font-medium opacity-80">
                {Math.ceil(eventLeftMs / 1000)}s
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full"
                style={{
                  width: `${eventLeftFrac * 100}%`,
                  background: accentByEvent ?? '#fff',
                  transition: 'width 220ms linear',
                }}
                aria-hidden
              />
            </div>
            {activeEvent.kind === 'boss' && (
              <div className="mt-2 text-xs">
                HP: <span className="font-bold tabular-nums">{activeEvent.bossHp}</span>
              </div>
            )}
          </div>
        )}

        {/* Core area */}
        <div className="relative my-2 flex h-[60vh] min-h-[360px] items-center justify-center">
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
          />
          <Core
            ref={coreRef}
            onTap={handleCoreTap}
            theme={themeDef.id}
            from={themeDef.coreFrom}
            to={themeDef.coreTo}
            flash={coreFlash}
            reducedMotion={reducedMotion}
            isBoss={activeEvent?.kind === 'boss'}
          />
          {/* Floaters */}
          <div
            ref={floaterLayerRef}
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            {floaters.map((f) => (
              <FloaterPip key={f.id} f={f} />
            ))}
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs text-white/80">
          <Stat label="Tipps" value={formatNumber(save.totalTaps)} />
          <Stat
            label="Tipp-Wert"
            value={`${formatNumber(
              tapPowerValue(save.upgrades.tapPower) * prestigeBonus(save.prestigeCrystals) * cmult,
            )}`}
          />
          <Stat label="Auto/s" value={autoTapperRate(save.upgrades.autoTapper).toFixed(1)} />
        </div>

        {prestigeAvailable && (
          <div className="rounded-2xl border border-amber-300/60 bg-amber-300/10 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-extrabold text-amber-200">Prestige verfügbar</div>
                <div className="text-xs text-amber-100/80">
                  Reset für +{prestigeGain} Aurora-Kristall{prestigeGain === 1 ? '' : 'e'} ( +
                  {Math.round(prestigeGain * 10)}% dauerhaft)
                </div>
              </div>
              <Button
                variant="highlight"
                size="sm"
                onClick={onPrestige}
                aria-label="Prestige durchführen"
              >
                Reset
              </Button>
            </div>
          </div>
        )}

        {offlineGain > 0 && (
          <button
            type="button"
            onClick={() => setOfflineGain(0)}
            className="rounded-2xl border border-white/20 bg-white/5 px-3 py-2 text-left text-xs text-white/80"
            aria-label="Offline-Bonus schließen"
          >
            Auto-Tapper hat während deiner Abwesenheit{' '}
            <span className="font-bold text-amber-200">+{formatNumber(offlineGain)}</span>{' '}
            gesammelt. Tippe zum Ausblenden.
          </button>
        )}
      </div>

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-40 flex flex-col items-center gap-2 px-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card-pop-in rounded-2xl bg-black/70 px-4 py-2 text-center shadow-pop backdrop-blur"
          >
            <div className="text-sm font-extrabold text-white">{t.text}</div>
            <div className="text-xs text-white/70">{t.sub}</div>
          </div>
        ))}
      </div>

      <UpgradeSheet
        open={showUpgrades}
        onClose={() => setShowUpgrades(false)}
        save={save}
        onBuy={onBuyUpgrade}
        onSwitchTheme={onSwitchTheme}
      />
    </div>
  );
}

interface CoreProps {
  onTap: (x: number, y: number) => void;
  theme: HyperfokusTheme;
  from: string;
  to: string;
  flash: 'none' | 'crit' | 'tap' | 'boss';
  reducedMotion: boolean;
  isBoss: boolean;
}

const Core = forwardRef<HTMLButtonElement, CoreProps>(function Core(
  { onTap, from, to, flash, reducedMotion, isBoss },
  ref,
) {
  const handlePointer = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    onTap(e.clientX, e.clientY);
  };

  const flashRing =
    flash === 'crit'
      ? 'shadow-[0_0_60px_18px_rgba(253,224,71,0.6)]'
      : flash === 'boss'
        ? 'shadow-[0_0_80px_28px_rgba(220,38,38,0.7)]'
        : flash === 'tap'
          ? 'shadow-[0_0_30px_8px_rgba(255,255,255,0.25)]'
          : '';

  const scaleClass = reducedMotion
    ? ''
    : flash === 'tap' || flash === 'crit' || flash === 'boss'
      ? 'scale-95'
      : 'scale-100';

  return (
    <button
      ref={ref}
      type="button"
      onPointerDown={handlePointer}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Hyperfokus-Kern tippen"
      className={`relative aspect-square w-[68vmin] max-w-[420px] min-w-[240px] rounded-full border-4 border-white/20 transition-transform duration-100 ease-out select-none touch-manipulation ${scaleClass} ${flashRing}`}
      style={{
        background: `radial-gradient(circle at 30% 25%, ${from}, ${to})`,
      }}
    >
      <span className="pointer-events-none absolute inset-3 rounded-full bg-white/10 blur-2xl" />
      <span className="pointer-events-none absolute inset-0 grid place-items-center text-center text-white/90">
        <span className="flex flex-col items-center gap-1">
          <span className="text-3xl font-extrabold tracking-widest drop-shadow sm:text-4xl">
            {isBoss ? 'BOSS' : 'TIPP'}
          </span>
          <span className="text-xs text-white/70">
            {isBoss ? 'schnell tippen!' : 'Space oder Enter'}
          </span>
        </span>
      </span>
    </button>
  );
});

function FloaterPip({ f }: { f: Floater }) {
  const colorByKind: Record<Floater['kind'], string> = {
    normal: 'text-white',
    bonus: 'text-amber-300',
    mega: 'text-fuchsia-300',
    crit: 'text-yellow-200',
  };
  const sizeByKind: Record<Floater['kind'], string> = {
    normal: 'text-base',
    bonus: 'text-lg font-extrabold',
    mega: 'text-2xl font-extrabold',
    crit: 'text-xl font-extrabold',
  };
  return (
    <div
      className={`hyperfokus-floater absolute select-none drop-shadow ${colorByKind[f.kind]} ${sizeByKind[f.kind]}`}
      style={
        {
          left: f.x,
          top: f.y,
          transform: 'translate(-50%, -50%)',
        } as React.CSSProperties
      }
      aria-hidden
    >
      {f.text}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-2 py-1.5 backdrop-blur">
      <div className="text-[10px] tracking-wide text-white/60 uppercase">{label}</div>
      <div className="text-sm font-extrabold tabular-nums">{value}</div>
    </div>
  );
}

interface UpgradeSheetProps {
  open: boolean;
  onClose: () => void;
  save: HyperfokusSave;
  onBuy: (id: UpgradeId) => void;
  onSwitchTheme: (t: HyperfokusTheme) => void;
}

function UpgradeSheet({ open, onClose, save, onBuy, onSwitchTheme }: UpgradeSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Hyperfokus-Upgrades" side="right" size="md">
      <div className="flex flex-col gap-3">
        <div className="text-xs text-surface-500 dark:text-surface-300">
          Coins: <span className="font-bold tabular-nums">{formatNumber(save.coins)}</span>
        </div>
        <div className="flex flex-col gap-2">
          {UPGRADE_ORDER.map((id) => {
            const def = UPGRADES[id];
            const lvl = save.upgrades[id];
            const maxed = lvl >= def.maxLevel;
            const cost = maxed ? 0 : Math.ceil(def.baseCost * Math.pow(def.costGrowth, lvl));
            const afford = !maxed && save.coins >= cost;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onBuy(id)}
                disabled={!afford}
                className="flex items-center justify-between gap-3 rounded-2xl border border-surface-200 bg-surface-50 px-3 py-2 text-left transition disabled:opacity-50 hover:border-primary-400 dark:border-surface-700 dark:bg-surface-900"
                aria-label={`${def.name}, Stufe ${lvl} von ${def.maxLevel}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{def.name}</span>
                    <span className="rounded-full bg-primary-500/15 px-2 py-0.5 text-[10px] font-bold text-primary-700 dark:text-primary-300">
                      Stufe {lvl}/{def.maxLevel}
                    </span>
                  </div>
                  <div className="text-xs text-surface-500 dark:text-surface-300">
                    {def.describe(lvl)}
                    {!maxed && ` → ${def.describe(lvl + 1)}`}
                  </div>
                </div>
                <div className="shrink-0 text-right text-xs">
                  {maxed ? (
                    <span className="font-bold text-success-500">MAX</span>
                  ) : (
                    <>
                      <div className="text-[10px] text-surface-400 uppercase">Kosten</div>
                      <div className="font-extrabold tabular-nums">{formatNumber(cost)}</div>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {(save.prestigeCrystals > 0 || save.prestigeCount > 0) && (
          <div className="mt-2">
            <div className="mb-2 text-xs font-bold text-surface-500 uppercase dark:text-surface-300">
              Themes
            </div>
            <div className="flex flex-wrap gap-2">
              {THEME_ORDER.map((t) => {
                const def = THEMES[t];
                const unlocked = isThemeUnlocked(t, save.prestigeCrystals);
                const active = save.currentTheme === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => unlocked && onSwitchTheme(t)}
                    disabled={!unlocked}
                    aria-pressed={active}
                    className={`min-h-10 rounded-full border px-3 py-1 text-xs font-bold transition disabled:opacity-40 ${
                      active
                        ? 'border-primary-500 bg-primary-500 text-white'
                        : 'border-surface-300 bg-surface-50 text-surface-700 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200'
                    }`}
                  >
                    {def.name}
                    {!unlocked && ` (✦${def.crystalsToUnlock})`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-2 rounded-2xl border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-900">
          <div className="text-xs font-bold text-surface-500 uppercase dark:text-surface-300">
            Crit-Vorschau
          </div>
          <div className="text-xs text-surface-600 dark:text-surface-300">
            Chance {Math.round(critChance(save.upgrades.critChance) * 100)}% · Multi ×
            {critMultiplier(save.upgrades.critMulti)} · Decay{' '}
            {comboDecaySec(save.upgrades.comboDecay).toFixed(2)}s · Events ×
            {eventRateMultiplier(save.upgrades.eventRate).toFixed(2)}
          </div>
        </div>

        <div className="text-[10px] text-surface-400">
          Lokal gespeichert — kein Konto, kein Cloud-Save. Daten bleiben in deinem Browser.
        </div>
      </div>
    </Sheet>
  );
}
