import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist/relocation-dashboard',
  },
  server: {
    host: '0.0.0.0',
    port: 4173,
  },
});