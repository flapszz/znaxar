import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "http://localhost:4000",
    },
    // Разрешаем временный публичный домен cloudflare-туннеля для показа сайта
    // удалённо. Убрать/сузить перед постоянной работой — это только для демо.
    allowedHosts: [".trycloudflare.com"],
  },
})
