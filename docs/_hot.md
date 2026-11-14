# Hot: Egg Hatch Gift

## In flight (2026-11-14)
**Live:** https://egg-hatch-gift.vercel.app (maker: /make/). Code: github.com/NotAfr8Studio/egg-hatch-gift
(public). Vercel project `egg-hatch-gift` in the owner's team, linked to the repo, production
branch `main`: **every push to main goes live.** Deployed on the owner's go, 14 Nov 2026.
Tested live: QR decodes to the https link, the egg opens from it, taps count, saves per gift.

## Next
1. Owner: scan a QR with a real phone; send a long link through WhatsApp and iMessage to see it
   stays clickable.
2. Owner tests the new version on his phone: tall oval, date field, empty gift link.

## Parked
- Mixamo (Adobe) terms not verified: Adobe's FAQ blocks automated reading. Owner to read it.
- iPhone Safari can wipe a site's saves after 7 days without a visit. Option A has no backup.
- On a phone, the /make preview sits below the editor: you scroll to see it.

## Fresh traps
- Every push to main deploys. Docs-only commits redeploy too (harmless, but they do).
- npm runs in `repo\`, not in the project folder above it.
- Never open a gift's claim link yourself while testing: signing in claims it.
- The pre-commit privacy hook lives in `.git/hooks/` and reads `..\notes\private-words.txt`;
  a fresh clone has neither. Recreate both before committing from a new machine.
- A QR made on `localhost` can't open on a phone: open /make through Vite's Network address.
