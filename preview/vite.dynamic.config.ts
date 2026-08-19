import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// Dynamic export build: bundle the spec-driven runtime (SpecRenderer + all UI
// components) into a single self-contained HTML. The UISpec is embedded by
// src/cli/export.ts and/or loaded from ./spec.json at runtime.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: process.env.EXPORT_OUT_DIR || 'dist-export',
    emptyOutDir: true,
    assetsInlineLimit: 100000000,
    rollupOptions: {
      input: path.resolve(process.cwd(), 'dynamic.html'),
      output: { inlineDynamicImports: true },
    },
  },
});
