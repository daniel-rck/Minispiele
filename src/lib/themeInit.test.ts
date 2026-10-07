import { beforeEach, describe, expect, it, vi } from "vitest";
// The real shipped file, not a copy: a test against a transcription would keep
// passing after public/theme-init.js drifted away from it.
import themeInitSource from "../../public/theme-init.js?raw";

const SETTINGS_KEY = "minispiele.settings.v1";

function runThemeInit(): void {
  new Function(themeInitSource)();
}

function setMatchMedia(prefersDark: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: prefersDark && query.includes("dark"),
      media: query,
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
    })),
  );
}

describe("public/theme-init.js", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.head.innerHTML = '<meta name="theme-color" content="#11b3b3" />';
    setMatchMedia(false);
  });

  it("leaves data-theme absent when nothing is stored", () => {
    runThemeInit();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("reads a forced choice out of the settings blob", () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme: "dark", sound: true }));
    runThemeInit();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("leaves data-theme absent for an explicit 'system' choice", () => {
    // "system" must mean *no* attribute, not `data-theme="system"` — the CSS
    // three-state contract keys off absence for "follow the OS".
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme: "system" }));
    document.documentElement.setAttribute("data-theme", "dark");
    runThemeInit();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("ignores a blob with an unknown theme value", () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme: "neon" }));
    runThemeInit();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("survives malformed JSON", () => {
    localStorage.setItem(SETTINGS_KEY, "{not json");
    expect(() => runThemeInit()).not.toThrow();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("resolves theme-color for the address bar, which CSS cannot express", () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme: "dark" }));
    runThemeInit();
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe(
      "#0a1014",
    );
  });

  it("follows the OS for theme-color when the choice is 'system'", () => {
    setMatchMedia(true);
    runThemeInit();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe(
      "#0a1014",
    );
  });
});
