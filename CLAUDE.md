# Egg Hatch Gift: guide for Claude Code

The public, make-your-own version of a birthday egg game. Vite, vanilla JS, three@0.128.0 (keep
that version: newer ones change colours and light units). Game at `/`, egg maker at `/make/`.

General working rules (plan before code changes, no deploys or pushes without the owner's go in
that session, how to talk) live in `F:\OS\CLAUDE.md` when working on the owner's machine; read it.
Current state: `docs/_hot.md`. Why things are the way they are: `docs/project-history.md`.

## Rules
- **Nothing personal in this repo.** No real faces, names, gift links, emails or local paths in
  any file, commit message or commit identity. A local pre-commit hook enforces it (word list
  outside the repo). Test faces stay outside the repo; `public/face.*` is gitignored.
- **A gift lives only in its link** (`src/gift/codec.js`). Never add a server, database or
  analytics that would see a gift without a decision recorded in project-history.
- Anything read from a link is untrusted: text goes through `textContent` or `esc()` in
  `ui/dialog.js`, links through `safeUrl()` (https only). The gift card names the real site a
  button opens (`siteOf()`): the shop name is typed by whoever made the egg.
- **Everything loads from this site.** `vercel.json` sets a Content-Security-Policy that blocks
  any other source. A new font, script, image or API elsewhere must be added there on purpose;
  `npm run preview` sends the same headers, so test there (dev does not).
- **The counter sends one word, nothing else.** `src/core/count.js` is the only code that tells a
  server anything (`api/count.js`): `made`, `opened`, `tapped` or `hatched`. Never add anything
  from the link or about the person to it.
- Changing the link format: bump `VERSION` in codec.js and keep decoding the old one, or every
  egg already sent breaks.
- Dev-only code sits behind `import.meta.env.DEV`; the production build must not contain it.
- After a change: `npm run build`, check the console, test at 390 x 844, and decode a fresh QR.

## Traps
- Never open a gift's claim link while testing. Signing in claims it.
- The face area on the model is 1.2 : 1; the face patch is stretched over it.
- Saves are per gift: `egg-save-<id>` in localStorage, id = hash of the link.
- Counts: the live site writes `eggs:` in Redis, previews `test:eggs:`. `?nocount` on any page
  stops that browser counting, `?count` undoes it. GET `/api/count?days=7` reads the numbers.
- `/api/count` answers 429 for two reasons: Vercel's firewall rule (per address, set in the
  dashboard, not in this repo) or the daily allowance (`DAILY` in `api/count.js`, until midnight
  UTC). Both are meant; the game ignores the answer.
- The /make preview is the real game in a frame on `/?preview`, talking by `postMessage`
  (same origin only). Nothing is saved there.
