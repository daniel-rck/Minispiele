import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_GIT_SHA__: JSON.stringify("test"),
    __APP_BUILD_DATE__: JSON.stringify("1970-01-01T00:00:00.000Z"),
  },
  resolve: {
    alias: {
      "virtual:pwa-register/react": fileURLToPath(
        new URL("./src/test/pwaRegisterStub.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    // web-base's owned setup (fake-indexeddb, jest-dom, cleanup, matchMedia),
    // then the app's own (a no-op canvas 2D context for the canvas games).
    setupFiles: ["./src/test/setup.ts", "./src/test/canvas.ts"],
    css: false,
    exclude: ["node_modules", "dist", "e2e", "playwright-report", "test-results"],
  },
});
