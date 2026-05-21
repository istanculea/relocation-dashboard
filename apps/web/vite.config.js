import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  root: webRoot,
  plugins: [react()],
  build: {
    outDir: '../../dist/relocation-dashboard',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 4173,
  },
});
