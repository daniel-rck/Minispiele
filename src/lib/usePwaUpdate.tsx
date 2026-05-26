import { registerSW } from 'virtual:pwa-register';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

export interface PwaUpdateContextValue {
  needRefresh: boolean;
  checking: boolean;
  applyUpdate: () => Promise<void>;
  checkForUpdate: () => Promise<void>;
}

const PwaUpdateContext = createContext<PwaUpdateContextValue | null>(null);

const HOUR_MS = 60 * 60 * 1000;

export function PwaUpdateProvider({ children }: { children: ReactNode }) {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [checking, setChecking] = useState(false);
  const updateRef = useRef<((reload?: boolean) => Promise<void>) | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onRegisteredSW(_url, registration) {
        registrationRef.current = registration;
      },
    });
    updateRef.current = update;

    const tick = () => {
      registrationRef.current?.update().catch(() => undefined);
    };
    const interval = window.setInterval(tick, HOUR_MS);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', tick);
    };
  }, []);

  const applyUpdate = useCallback(async () => {
    if (updateRef.current) {
      await updateRef.current(true);
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  const checkForUpdate = useCallback(async () => {
    setChecking(true);
    try {
      const reg = registrationRef.current;
      if (reg) await reg.update();
    } finally {
      setChecking(false);
    }
  }, []);

  return (
    <PwaUpdateContext.Provider value={{ needRefresh, checking, applyUpdate, checkForUpdate }}>
      {children}
    </PwaUpdateContext.Provider>
  );
}

export function usePwaUpdate(): PwaUpdateContextValue {
  const ctx = useContext(PwaUpdateContext);
  if (!ctx) {
    return {
      needRefresh: false,
      checking: false,
      applyUpdate: async () => undefined,
      checkForUpdate: async () => undefined,
    };
  }
  return ctx;
}
