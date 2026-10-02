import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Web admin ada di repo terpisah: marselcerebrum-jpg/web-admin-booking.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html')
      }
    }
  }
});
