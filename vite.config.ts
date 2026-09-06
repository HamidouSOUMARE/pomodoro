import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base relative : l'app est chargee par Electron via file:// en production
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, strictPort: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
