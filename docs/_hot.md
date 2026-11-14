# Hot: Egg Hatch Gift

## In flight (2026-11-14)
First version built and tested locally. **Nothing pushed, nothing deployed, no GitHub repo yet.**
All of that waits for the owner's go.

## Next
1. Owner tries it: `npm run dev` in `repo\`, open `/make/` (a phone on the same wifi can use the
   address Vite prints). Make an egg, scan the QR with a real phone.
2. Test a long link in WhatsApp and iMessage: does the whole link stay clickable?
3. Owner's go needed for: GitHub repo (public), Vercel project, first deploy. Commit identity is
   already the noreply address; swap in the owner's own GitHub noreply address if commits should
   link to the account.

## Parked
- Licence check before going public: the Mixamo rig/animations and the base character mesh.
- `trainer.mp3` has no recorded source link.
- iPhone Safari can wipe a site's saves after 7 days without a visit. Option A has no backup.
- On a phone, the /make preview sits below the editor: you scroll to see it.

## Fresh traps
- Never open a gift's claim link yourself while testing: signing in claims it.
- The pre-commit privacy hook lives in `.git/hooks/` and reads `..\notes\private-words.txt`;
  a fresh clone has neither. Recreate both before committing from a new machine.
