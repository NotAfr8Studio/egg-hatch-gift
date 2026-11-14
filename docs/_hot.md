# Hot: Egg Hatch Gift

## In flight (2026-11-14)
Public on GitHub (github.com/NotAfr8Studio/egg-hatch-gift), on the owner's go. **Not deployed:
no Vercel project yet.** That needs the owner's go too.

## Next
1. Owner's go for Vercel: new project from this repo, framework Vite. Once linked, every push to
   `main` goes live.
2. On the live site: scan a QR with a real phone, and send a long link through WhatsApp and
   iMessage to see that it stays clickable.
3. Owner's question about the /make preview "face being more centered": open (see below).

## Parked
- Licence of the Mixamo rig/animations and the base character mesh: not recorded. Owner chose to
  publish anyway (2026-11-14).
- iPhone Safari can wipe a site's saves after 7 days without a visit. Option A has no backup.
- On a phone, the /make preview sits below the editor: you scroll to see it.

## Fresh traps
- npm runs in `repo\`, not in the project folder above it.
- Never open a gift's claim link yourself while testing: signing in claims it.
- The pre-commit privacy hook lives in `.git/hooks/` and reads `..\notes\private-words.txt`;
  a fresh clone has neither. Recreate both before committing from a new machine.
- A QR made on `localhost` can't open on a phone: open /make through Vite's Network address.
