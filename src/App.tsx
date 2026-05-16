import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import AppShell from './components/AppShell';
import ErrorBoundary from './components/ErrorBoundary';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import Home from './pages/Home';

const RingSort = lazy(() => import('./pages/RingSort'));
const Timer = lazy(() => import('./pages/Timer'));
const Dice = lazy(() => import('./pages/Dice'));
const Memory = lazy(() => import('./pages/Memory'));
const TwentyFortyEight = lazy(() => import('./pages/TwentyFortyEight'));
const SlidingPuzzle = lazy(() => import('./pages/SlidingPuzzle'));
const Simon = lazy(() => import('./pages/Simon'));
const Minesweeper = lazy(() => import('./pages/Minesweeper'));

function RouteFallback() {
  return (
    <div className="flex justify-center py-12 text-sm text-slate-500" role="status">
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

export default function App() {
  return (
    <ErrorBoundary label="root">
      <PWAUpdatePrompt />
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route
              index
              element={
                <ErrorBoundary label="home">
                  <Home />
                </ErrorBoundary>
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
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
