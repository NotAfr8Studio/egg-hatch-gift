# Hot: Egg Hatch Gift

## In flight (2026-11-14)
**Live:** https://egg-hatch-gift.vercel.app (maker: /make/). Code: github.com/NotAfr8Studio/egg-hatch-gift
(public). Vercel project `egg-hatch-gift` in the owner's team, linked to the repo, production
branch `main`: **every push to main goes live.** Deployed on the owner's go, 14 Nov 2026.
Tested live: QR decodes to the https link, the egg opens from it, taps count, saves per gift.

**2026-11-15: egg counter decided, not built.** Own counter (function + Upstash Redis), counting
`made`, `opened`, `hatched` only; see project-history. Needs the owner to add Upstash to the
Vercel project before it can run. Nothing pushed.

**2026-11-15: security fixes deployed on the owner's go.** Card names the real site behind
CLAIM / REDEEM, https only, font shipped with the app, Content-Security-Policy in `vercel.json`,
/make note extended. Vercel plan: Hobby (owner, 15 Nov), which pauses at its limit, no bill.

## Next
1. Owner: scan a QR with a real phone; send a long link through WhatsApp and iMessage to see it
   stays clickable.
2. Owner tests the new version on his phone: PICK FROM PHOTO, the new AUTO, the new copy.

## Parked
- **Idea (owner, 14 Nov 2026): a small "buy me a coffee" button** at the end of /make, for people
  who want to thank him. Not now: first see how many people actually use the maker. If it gets
  used a lot, add it then. The egg counter (`made`) will answer this.
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
- The Content-Security-Policy blocks anything from another site, and `npm run dev` doesn't send
  it: test new outside resources with `npm run build` + `npm run preview`. The egg counter's
  call to its own function is same-site, so the policy allows it.
