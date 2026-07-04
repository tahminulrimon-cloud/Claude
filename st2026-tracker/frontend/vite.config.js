import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Lets us verify the service worker under `npm run dev`, not just a build+preview.
      devOptions: { enabled: true, type: 'module' },
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'ST-2026 Tracker',
        short_name: 'ST-2026',
        description: 'Training schedule tracker for Exercise BOJRO AGHAT (ST-2026)',
        theme_color: '#1f2937',
        background_color: '#14161a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell is precached automatically. The timeline data is the one
        // network call the UI depends on, so it gets its own runtime strategy:
        // try the live backend first, fall back to the last good copy offline.
        runtimeCaching: [
          {
            urlPattern: /\/api\/timeline$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'st2026-timeline-cache',
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:4026',
    },
  },
  preview: {
    proxy: {
      '/api': 'http://localhost:4026',
    },
  },
})
