import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// Export build: bundle everything (3D chunks, CSS, assets) into a single
// self-contained index.html that works from file:// or any static host.
// Set EXPORT_OUT_DIR to choose where dist lands (see src/cli/export.ts).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: process.env.EXPORT_OUT_DIR || 'dist-export',
    emptyOutDir: true,
    assetsInlineLimit: 100000000,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
