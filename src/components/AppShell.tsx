import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import OfflineIndicator from './OfflineIndicator';
import SettingsSheet from './SettingsSheet';
import IconButton from './ui/IconButton';
import { ChevronLeftIcon, SettingsIcon, Volume2Icon, VolumeXIcon } from './ui/icons';
import { useSettings } from './ui/useSettings';
import { BRAND_NAME } from '../lib/brand';

export default function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === '/';
  const { settings, setSound } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col">
      <a href="#main" className="skip-link">
        Zum Inhalt springen
      </a>
      <header
        className="sticky top-0 z-20 border-b border-surface-200/60 bg-white/85 backdrop-blur-md dark:border-surface-800/80 dark:bg-surface-950/85"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex items-center gap-2">
            {!isHome && (
              <IconButton
                icon={<ChevronLeftIcon />}
                label="Zurück zur Übersicht"
                size="md"
                variant="ghost"
                onClick={() => navigate('/')}
              />
            )}
            <Link
              to="/"
              className="flex items-center gap-2 rounded-xl px-1 py-1 font-display text-lg font-extrabold text-primary-700 dark:text-primary-200"
            >
              <img src="/logo.svg" alt="" width="32" height="32" className="size-8" />
              <span>{BRAND_NAME}</span>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <IconButton
              icon={settings.soundEnabled ? <Volume2Icon /> : <VolumeXIcon />}
              label={settings.soundEnabled ? 'Töne ausschalten' : 'Töne einschalten'}
              pressed={!settings.soundEnabled}
              onClick={() => setSound(!settings.soundEnabled)}
              variant="ghost"
            />
            <IconButton
              icon={<SettingsIcon />}
              label="Einstellungen öffnen"
              onClick={() => setSettingsOpen(true)}
              variant="ghost"
            />
          </div>
        </div>
        <OfflineIndicator />
      </header>
      <main id="main" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
