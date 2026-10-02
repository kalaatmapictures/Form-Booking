import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Multi-page: landing page booking (/) dan web admin (/admin/).
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:  resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin/index.html')
      }
    }
  }
});
