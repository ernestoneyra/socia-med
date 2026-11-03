import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5188,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:5189',
      '/media': 'http://localhost:5189',
    },
  },
})
