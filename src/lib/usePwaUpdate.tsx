import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useAppUpdate } from "./pwa/useAppUpdate.ts";

export type PwaUpdateContextValue = {
  needRefresh: boolean;
  checking: boolean;
  applyUpdate: () => Promise<void>;
  checkForUpdate: () => Promise<void>;
};

const PwaUpdateContext = createContext<PwaUpdateContextValue | null>(null);

async function updateRegistration(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  await registration?.update();
}

/**
 * The app's update UI (UpdateBanner, the settings sheet's „Auf Updates prüfen")
 * on top of web-base's owned useAppUpdate(), which registers the service worker
 * with `registerType: "prompt"` and re-checks hourly. On top of that, Minispiele
 * re-checks when the window regains focus and lets the user check by hand.
 */
export function PwaUpdateProvider({ children }: { children: ReactNode }) {
  const { needRefresh, reload } = useAppUpdate();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const onFocus = () => {
      updateRegistration().catch(() => undefined);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const applyUpdate = useCallback(async () => {
    reload();
  }, [reload]);

  const checkForUpdate = useCallback(async () => {
    setChecking(true);
    try {
      await updateRegistration();
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
