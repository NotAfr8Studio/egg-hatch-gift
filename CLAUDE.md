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
  `ui/dialog.js`, links through `safeUrl()` (http/https only).
- Changing the link format: bump `VERSION` in codec.js and keep decoding the old one, or every
  egg already sent breaks.
- Dev-only code sits behind `import.meta.env.DEV`; the production build must not contain it.
- After a change: `npm run build`, check the console, test at 390 x 844, and decode a fresh QR.

## Traps
- Never open a gift's claim link while testing. Signing in claims it.
- The face area on the model is 1.2 : 1; the face patch is stretched over it.
- Saves are per gift: `egg-save-<id>` in localStorage, id = hash of the link.
- The /make preview is the real game in a frame on `/?preview`, talking by `postMessage`
  (same origin only). Nothing is saved there.
