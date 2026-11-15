# Hot: Egg Hatch Gift

## In flight (2026-11-14)
**Live:** https://egg-hatch-gift.vercel.app (maker: /make/). Code: github.com/NotAfr8Studio/egg-hatch-gift
(public). Vercel project `egg-hatch-gift` in the owner's team, linked to the repo, production
branch `main`: **every push to main goes live.** Deployed on the owner's go, 14 Nov 2026.
Tested live: QR decodes to the https link, the egg opens from it, taps count, saves per gift.

**2026-11-15: egg counter live on the owner's go.** `api/count.js` + `src/core/count.js`,
counting `made`, `opened`, `tapped`, `hatched`; see project-history. Upstash connected (prefix
`COUNTER`, production + preview). Tested: 17 flows locally, end to end on the `egg-counter`
preview against the real store (test numbers), then live with `?nocount` (nothing sent, no
errors, real numbers 0). Read them at `/api/count?days=7`.
**2026-11-16: both spam limits live on the owner's go.** Vercel firewall rule "Egg counter
limit" (path equals `/api/count`, 10 requests per IP per 600 s, fixed window, 429; published by
the owner in the dashboard, not in this repo) and the daily allowance in `api/count.js`.

**2026-11-15: security fixes deployed on the owner's go.** Card names the real site behind
CLAIM / REDEEM, https only, font shipped with the app, Content-Security-Policy in `vercel.json`,
/make note extended. Vercel plan: Hobby (owner, 15 Nov). No bill, but over a limit every
deployment pauses and stays paused until support or a move to Pro (docs, read 15 Nov).
Decided the same day: eggs don't expire (see project-history). Follow-up fix: gift eggs no longer
ask for the self-host `face.png` (two 404s per no-photo egg); it ships in the counter's commit.

## Next
1. Owner: scan a QR with a real phone; send a long link through WhatsApp and iMessage to see it
   stays clickable.
2. Owner tests the new version on his phone: PICK FROM PHOTO, the new AUTO, the new copy.
3. Owner: open `/make/?nocount` once on each phone and browser used for testing, so tests don't
   count.

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
- Calling `/api/count` from home (tests, curl, reading the numbers) spends your address's 10 per
  10 minutes. Phones on the same wifi then get 429 from the counter for a while: harmless, but
  their counts in that window are lost.
