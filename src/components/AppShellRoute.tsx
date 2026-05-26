import { Suspense, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BRAND_NAME } from '../lib/brand';
import { ROUTES } from '../lib/routes.ts';
import { AppHeader, InstallButton } from '../lib/ui';
import { useSettings } from '../lib/useSettings';
import ErrorBoundary from './ErrorBoundary';
import OfflineIndicator from './OfflineIndicator';
import SettingsSheet from './SettingsSheet';
import UpdateBanner from './UpdateBanner';
import IconButton from './ui/IconButton';
import { ChevronLeftIcon, SettingsIcon, Volume2Icon, VolumeXIcon } from './ui/icons';

function RouteFallback() {
  return (
    <div className="flex justify-center py-12 text-sm text-surface-500" role="status">
      Lädt …
    </div>
  );
}

export default function AppShellRoute() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { settings, setSound } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isHome = pathname === ROUTES.home;

  return (
    <div className="flex min-h-full flex-col bg-surface text-fg">
      <a href="#main" className="skip-link">
        Zum Inhalt springen
      </a>
      <UpdateBanner />
      <AppHeader
        title={BRAND_NAME}
        logo={
          <span className="inline-flex items-center gap-1">
            {!isHome && (
              <IconButton
                icon={<ChevronLeftIcon />}
                label="Zurück zur Übersicht"
                size="md"
                variant="ghost"
                onClick={() => navigate(ROUTES.home)}
              />
            )}
            <img src="/logo.svg" alt="" width="32" height="32" className="size-8" />
          </span>
        }
        actions={
          <>
            <InstallButton />
            <IconButton
              icon={settings.sound ? <Volume2Icon /> : <VolumeXIcon />}
              label={settings.sound ? 'Töne ausschalten' : 'Töne einschalten'}
              pressed={!settings.sound}
              onClick={() => setSound(!settings.sound)}
              variant="ghost"
            />
            <IconButton
              icon={<SettingsIcon />}
              label="Einstellungen öffnen"
              onClick={() => setSettingsOpen(true)}
              variant="ghost"
            />
          </>
        }
      />
      <OfflineIndicator />
      <main id="main" className="flex-1" tabIndex={-1}>
        <ErrorBoundary label="route">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
