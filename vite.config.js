import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
const resolve = function (_, f) { return fileURLToPath(new URL(f, import.meta.url)); };

// Static build: `npm run build` writes dist/, which any static host (Vercel, Netlify...) serves as is.
// Two pages: the game at / and the egg maker at /make/.
export default defineConfig({
  build: {
    target: 'es2019', sourcemap: false,
    rollupOptions: { input: { main: resolve(__dirname, 'index.html'), make: resolve(__dirname, 'make/index.html') } },
  },
  optimizeDeps: { entries: ['index.html', 'make/index.html'] },
  server: { host: true }, // lets a phone on the same wifi open the dev server
});
