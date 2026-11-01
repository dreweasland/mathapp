import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { APP_NAME, THEME_COLOR } from './src/config.ts';

export default defineConfig({
  plugins: [
    {
      name: 'app-config-html',
      transformIndexHtml: (html) =>
        html.replaceAll('%APP_NAME%', APP_NAME).replaceAll('%THEME_COLOR%', THEME_COLOR),
    },
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: APP_NAME,
        short_name: APP_NAME,
        description: 'Daily math practice for kids. Private and offline.',
        display: 'standalone',
        orientation: 'any',
        start_url: '.',
        background_color: '#fff8e7',
        theme_color: THEME_COLOR,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,woff2}'] },
    }),
  ],
  // Relative paths keep the build host-agnostic (S3, GitHub Pages, a subfolder).
  base: './',
});
