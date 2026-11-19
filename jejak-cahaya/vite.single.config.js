import { defineConfig } from 'vite';

// Build satu-file: semua JS (termasuk Phaser) dan CSS digabung, lalu disisipkan ke satu HTML
// oleh tools/build-single.mjs. Cocok untuk dibagikan sebagai file atau dibuka tanpa server.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist-single',
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 4000,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
