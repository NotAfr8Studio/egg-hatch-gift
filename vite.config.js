import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
const resolve = function (_, f) { return fileURLToPath(new URL(f, import.meta.url)); };

// The live site's security headers (Content-Security-Policy and friends) live in vercel.json.
// `npm run preview` sends the same ones, so anything they would block shows up here first.
const live = JSON.parse(readFileSync(resolve(null, 'vercel.json'), 'utf8')).headers[0].headers;
const liveHeaders = Object.fromEntries(live.map(function (h) { return [h.key, h.value]; }));

// Static build: `npm run build` writes dist/, which any static host (Vercel, Netlify...) serves as is.
// Two pages: the game at / and the egg maker at /make/.
export default defineConfig({
  build: {
    target: 'es2019', sourcemap: false,
    rollupOptions: { input: { main: resolve(__dirname, 'index.html'), make: resolve(__dirname, 'make/index.html') } },
  },
  optimizeDeps: { entries: ['index.html', 'make/index.html'] },
  // Own copy without links: is there a public/face.png (see README)? Checked when the build or the
  // dev server starts, so a site without one never asks the server for a file it doesn't have.
  define: { __OWN_FACE__: JSON.stringify(existsSync(resolve(null, 'public/face.png'))) },
  server: { host: true }, // lets a phone on the same wifi open the dev server
  preview: { headers: liveHeaders },
});
