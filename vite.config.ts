import preact from '@preact/preset-vite';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  // Sous-chemin de publication GitHub Pages.
  base: '/FrigoMalin/',
  plugins: [preact()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
