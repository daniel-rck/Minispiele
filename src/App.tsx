import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import AppShell from './components/AppShell';
import ErrorBoundary from './components/ErrorBoundary';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import { SettingsProvider, useSettings } from './lib/useSettings';
import { setAudioSetting } from './lib/audioSettings';

const Home = lazy(() => import('./pages/Home'));
const RingSort = lazy(() => import('./pages/RingSort'));
const Timer = lazy(() => import('./pages/Timer'));
const Dice = lazy(() => import('./pages/Dice'));
const Memory = lazy(() => import('./pages/Memory'));
const TwentyFortyEight = lazy(() => import('./pages/TwentyFortyEight'));
const SlidingPuzzle = lazy(() => import('./pages/SlidingPuzzle'));
const Simon = lazy(() => import('./pages/Simon'));
const Minesweeper = lazy(() => import('./pages/Minesweeper'));
const Snake = lazy(() => import('./pages/Snake'));
const Wordle = lazy(() => import('./pages/Wordle'));
const Reaction = lazy(() => import('./pages/Reaction'));
const Stroop = lazy(() => import('./pages/Stroop'));
const Schulte = lazy(() => import('./pages/Schulte'));
const Hanoi = lazy(() => import('./pages/Hanoi'));
const LightsOut = lazy(() => import('./pages/LightsOut'));
const Mastermind = lazy(() => import('./pages/Mastermind'));
const Hangman = lazy(() => import('./pages/Hangman'));
const Anagram = lazy(() => import('./pages/Anagram'));
const Sudoku = lazy(() => import('./pages/Sudoku'));
const Nonogram = lazy(() => import('./pages/Nonogram'));
const Sokoban = lazy(() => import('./pages/Sokoban'));
const Wordsearch = lazy(() => import('./pages/Wordsearch'));
const Breakout = lazy(() => import('./pages/Breakout'));
const Bubbles = lazy(() => import('./pages/Bubbles'));
const Blocks = lazy(() => import('./pages/Blocks'));
const Freecell = lazy(() => import('./pages/Freecell'));
const Tangram = lazy(() => import('./pages/Tangram'));
const Flow = lazy(() => import('./pages/Flow'));
const TrafficJam = lazy(() => import('./pages/TrafficJam'));
const Hyperfokus = lazy(() => import('./pages/Hyperfokus'));

function RouteFallback() {
  return (
    <div className="flex justify-center py-12 text-sm text-surface-500" role="status">
      Lädt …
    </div>
  );
}

function LazyRoute({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <ErrorBoundary label={label}>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

// Bridges the React SettingsProvider's sound flag into the module-level singleton
// that the non-React audio helpers (audio.ts, toneAudio.ts) read before producing output.
function AudioSettingsBridge() {
  const { settings } = useSettings();
  useEffect(() => {
    setAudioSetting(settings.sound);
  }, [settings.sound]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary label="root">
      <SettingsProvider>
        <AudioSettingsBridge />
        <PWAUpdatePrompt />
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route
                index
                element={
                  <LazyRoute label="home">
                    <Home />
                  </LazyRoute>
                }
              />
              <Route
                path="ring-sort"
                element={
                  <LazyRoute label="ring-sort">
                    <RingSort />
                  </LazyRoute>
                }
              />
              <Route
                path="timer"
                element={
                  <LazyRoute label="timer">
                    <Timer />
                  </LazyRoute>
                }
              />
              <Route
                path="dice"
                element={
                  <LazyRoute label="dice">
                    <Dice />
                  </LazyRoute>
                }
              />
              <Route
                path="memory"
                element={
                  <LazyRoute label="memory">
                    <Memory />
                  </LazyRoute>
                }
              />
              <Route
                path="twenty-forty-eight"
                element={
                  <LazyRoute label="twenty-forty-eight">
                    <TwentyFortyEight />
                  </LazyRoute>
                }
              />
              <Route
                path="sliding-puzzle"
                element={
                  <LazyRoute label="sliding-puzzle">
                    <SlidingPuzzle />
                  </LazyRoute>
                }
              />
              <Route
                path="simon"
                element={
                  <LazyRoute label="simon">
                    <Simon />
                  </LazyRoute>
                }
              />
              <Route
                path="minesweeper"
                element={
                  <LazyRoute label="minesweeper">
                    <Minesweeper />
                  </LazyRoute>
                }
              />
              <Route
                path="snake"
                element={
                  <LazyRoute label="snake">
                    <Snake />
                  </LazyRoute>
                }
              />
              <Route
                path="wordle"
                element={
                  <LazyRoute label="wordle">
                    <Wordle />
                  </LazyRoute>
                }
              />
              <Route
                path="reaction"
                element={
                  <LazyRoute label="reaction">
                    <Reaction />
                  </LazyRoute>
                }
              />
              <Route
                path="stroop"
                element={
                  <LazyRoute label="stroop">
                    <Stroop />
                  </LazyRoute>
                }
              />
              <Route
                path="schulte"
                element={
                  <LazyRoute label="schulte">
                    <Schulte />
                  </LazyRoute>
                }
              />
              <Route
                path="hanoi"
                element={
                  <LazyRoute label="hanoi">
                    <Hanoi />
                  </LazyRoute>
                }
              />
              <Route
                path="lights-out"
                element={
                  <LazyRoute label="lights-out">
                    <LightsOut />
                  </LazyRoute>
                }
              />
              <Route
                path="mastermind"
                element={
                  <LazyRoute label="mastermind">
                    <Mastermind />
                  </LazyRoute>
                }
              />
              <Route
                path="hangman"
                element={
                  <LazyRoute label="hangman">
                    <Hangman />
                  </LazyRoute>
                }
              />
              <Route
                path="anagram"
                element={
                  <LazyRoute label="anagram">
                    <Anagram />
                  </LazyRoute>
                }
              />
              <Route
                path="sudoku"
                element={
                  <LazyRoute label="sudoku">
                    <Sudoku />
                  </LazyRoute>
                }
              />
              <Route
                path="nonogram"
                element={
                  <LazyRoute label="nonogram">
                    <Nonogram />
                  </LazyRoute>
                }
              />
              <Route
                path="sokoban"
                element={
                  <LazyRoute label="sokoban">
                    <Sokoban />
                  </LazyRoute>
                }
              />
              <Route
                path="wordsearch"
                element={
                  <LazyRoute label="wordsearch">
                    <Wordsearch />
                  </LazyRoute>
                }
              />
              <Route
                path="breakout"
                element={
                  <LazyRoute label="breakout">
                    <Breakout />
                  </LazyRoute>
                }
              />
              <Route
                path="bubbles"
                element={
                  <LazyRoute label="bubbles">
                    <Bubbles />
                  </LazyRoute>
                }
              />
              <Route
                path="blocks"
                element={
                  <LazyRoute label="blocks">
                    <Blocks />
                  </LazyRoute>
                }
              />
              <Route
                path="freecell"
                element={
                  <LazyRoute label="freecell">
                    <Freecell />
                  </LazyRoute>
                }
              />
              <Route
                path="tangram"
                element={
                  <LazyRoute label="tangram">
                    <Tangram />
                  </LazyRoute>
                }
              />
              <Route
                path="flow"
                element={
                  <LazyRoute label="flow">
                    <Flow />
                  </LazyRoute>
                }
              />
              <Route
                path="traffic-jam"
                element={
                  <LazyRoute label="traffic-jam">
                    <TrafficJam />
                  </LazyRoute>
                }
              />
              <Route
                path="hyperfokus"
                element={
                  <LazyRoute label="hyperfokus">
                    <Hyperfokus />
                  </LazyRoute>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
