import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // For local dev prefer `vercel dev` (serves UI + /api functions on :3000).
      // This proxy only matters if you run Vite standalone alongside it.
      '/api': 'http://localhost:3000',
    },
  },
});
