import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { setAudioSetting } from './lib/audioSettings';
import { router } from './lib/router';
import { PwaUpdateProvider } from './lib/usePwaUpdate';
import { SettingsProvider, useSettings } from './lib/useSettings';

// Bridges the React SettingsProvider's sound flag into the module-level singleton
// that the non-React audio helpers (audio.ts, toneAudio.ts) read before producing output.
function AudioSettingsBridge() {
  const { settings } = useSettings();
  useEffect(() => {
    setAudioSetting(settings.sound);
  }, [settings.sound]);
  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary label="root">
      <SettingsProvider>
        <PwaUpdateProvider>
          <AudioSettingsBridge />
          <RouterProvider router={router} />
        </PwaUpdateProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>,
);
