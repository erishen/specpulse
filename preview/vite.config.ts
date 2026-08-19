import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Pin the fs allow-list to the preview root so the preview iframe can
    // never fetch sibling files (e.g. the project's .env) via /@fs/, even if
    // this repo is later placed inside a workspace/monorepo with a wider root.
    fs: { allow: ['.'] },
  },
});
