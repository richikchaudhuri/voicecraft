import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // expose on LAN so a phone/another device can load it too
    proxy: {
      // The browser calls same-origin /api/*; Vite forwards to the FastAPI backend
      // server-side. Robust to tunnels / LAN / other machines, and needs no CORS.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
