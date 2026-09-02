/*
 * Apply the persisted theme before first paint, so a forced light/dark choice
 * doesn't flash the wrong colors on load.
 *
 * This lives in `public/` rather than inline in index.html on purpose: apps
 * that ship a Worker CSP can then keep `script-src 'self'` instead of pinning a
 * `sha256-` hash of an inline snippet — a hash that silently breaks the theme
 * the moment the snippet changes.
 *
 * Minispiele keeps the theme inside its settings blob rather than under
 * localStorage["theme"], which the layout template explicitly allows: the
 * contract is only that `data-theme` ends up on <html> for a forced choice and
 * is absent for "system". Keep in sync with `applyTheme` in
 * src/lib/useSettings.ts, and with STORAGE_KEYS.SETTINGS in src/lib/constants.ts.
 */
(() => {
  const SETTINGS_KEY = "minispiele.settings.v1";
  let mode = "system";
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const stored = parsed && parsed.theme;
      if (stored === "light" || stored === "dark" || stored === "system") mode = stored;
    }
  } catch {
    /* localStorage unavailable (private mode, quota) — fall back to the OS. */
  }

  if (mode === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", mode);

  // The address-bar color can't be expressed in CSS, so it still needs the
  // resolved light/dark answer rather than the three-state one.
  try {
    const dark =
      mode === "dark" ||
      (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0a1014" : "#11b3b3");
  } catch {
    /* matchMedia missing — leave the static theme-color from index.html. */
  }
})();
