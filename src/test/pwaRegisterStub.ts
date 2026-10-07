// Test stand-in for vite-plugin-pwa's `virtual:pwa-register/react`, which only
// exists inside a Vite build with VitePWA. No service worker ever registers in
// jsdom, so nothing is ever waiting.
type StateTuple = [boolean, (value: boolean) => void];

export function useRegisterSW(_options?: unknown): {
  needRefresh: StateTuple;
  offlineReady: StateTuple;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
} {
  return {
    needRefresh: [false, () => undefined],
    offlineReady: [false, () => undefined],
    updateServiceWorker: async () => undefined,
  };
}
