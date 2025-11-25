import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

const APP_NAME = '沖繩行程日曆'
const THEME_COLOR = '#122e4d'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: APP_NAME,
        short_name: 'OKA Trip',
        description: '五天沖繩行程與餐廳推薦，一鍵加入 PWA',
        theme_color: THEME_COLOR,
        background_color: '#f4f7fb',
        display: 'standalone',
        start_url: './',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
      },
    }),
  ],
  server: {
    port: 5173,
  },
})
