import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Semua request /api diteruskan ke backend Express — API key tetap di server.
      '/api': 'http://localhost:4000',
    },
  },
});

