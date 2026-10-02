import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Multi-page: landing page booking sekarang, web admin menyusul
// (tambahkan admin/index.html ke input di bawah saat sudah dibuat).
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html')
      }
    }
  }
});
