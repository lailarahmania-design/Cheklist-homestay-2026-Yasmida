import { defineConfig } from 'vite';

// base './' agar hasil build bisa dibuka dari subfolder GitHub Pages
export default defineConfig({
  base: './',
  build: { outDir: 'dist', target: 'es2020' },
  test: { include: ['tests/unit/**/*.test.js'], environment: 'node' },
});
