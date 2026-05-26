import { execSync } from 'node:child_process';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const gitSha = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
})();
const buildDate = new Date().toISOString();

export default defineConfig({
  define: {
    __APP_GIT_SHA__: JSON.stringify(gitSha),
    __APP_BUILD_DATE__: JSON.stringify(buildDate),
  },
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/sw',
      filename: 'index.ts',
      injectRegister: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
      },
      registerType: 'prompt',
      devOptions: { enabled: false, type: 'module' },
      includeAssets: ['logo.svg', 'logo-maskable.svg'],
      manifest: {
        name: 'Minispiele',
        short_name: 'Minispiele',
        description: 'Kleine Browser-Minispiele — lokal, ohne Account.',
        theme_color: '#11b3b3',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'de',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/logo-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
    }),
    visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('react-router-dom')) return 'router';
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/'))
            return 'react';
          return undefined;
        },
      },
    },
  },
});
