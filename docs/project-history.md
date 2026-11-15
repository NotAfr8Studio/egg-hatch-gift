# Project history

Append-only. One heading per decision.

## 2026-11-14: Forked from the private birthday version, without its history
The private version's git history contains a real person's face, name and gift link. Deleting
them in a new commit would leave them in old commits, so this repo started from a plain copy with
a fresh `git init`. Left out: the prototype file, kickoff and notes, `public/face.png`, the
`.env` gift link, the Supabase draft. Commit identity is a GitHub noreply address, never a
personal email.

## 2026-11-14: Option A: the whole gift lives in the link, no server
Considered: a database (Supabase) holding each gift behind a short link, deleted after two
months, with rate limits against spam. Chosen instead: pack everything into the link after the
`#`. Nothing is stored, so nothing needs deleting, there is nothing to spam, nothing to pay for,
and nobody (including the owner) can read other people's gifts or photos. Cost: long links. The
owner's call: nobody minds how the link looks if the idea works.

## 2026-11-14: QR-friendly text and a pixel face, so the link fits a QR code
A QR code tops out around 3 KB, and a scannable one off a phone screen is far less. So:
- the face is stored as a palette image of at most 48 x 40 pixels (on screen the face is about
  31 x 25 pixels at the default pixel size, so little is lost; it also suits the pixel style);
- the bytes are compressed (deflate-raw, built into browsers) and written in base 43, the QR
  "alphanumeric" characters minus space and %, which pack ~25% tighter than ordinary text;
- the maker steps the face detail down until the QR code is at most version 20 (97 x 97).
A realistic gift with a photo and a ~95 character claim link came out at version 19-20.
A trailing `Z` protects the last character from chat apps that drop a final `.` or `:`, and a
16-bit check catches damaged links.

## 2026-11-14: Squash and stretch after cutting
The owner asked for it: after cutting the face out (square like the original, rounded, oval or
circle), the cut-out can be squashed, stretched and moved on the face area. The original
birthday face filled the whole 1.2 : 1 area edge to edge, so SQUARE is the default shape.

## 2026-11-14: Skin tone from the face, not from fixed cheek spots
The original sampled two fixed cheek spots, which only works for a tight crop. With free
framing they landed on beard and background and gave a far too dark tone. Now: skin-coloured
pixels from the middle of the cut-out, darkest 55% and brightest 8% dropped, median of the rest.
Can be overridden with a colour picker.

## 2026-11-14: Commits under the owner's GitHub account, repo public
Superseded the "Not Afr8 Studio" placeholder identity of earlier the same day: NotAfr8Studio is
the owner's own GitHub account, so commits use its noreply address
(`<id>+NotAfr8Studio@users.noreply.github.com`) and link to the account without exposing an
email. Repo made public on the owner's go; not deployed.

## 2026-11-14: Pixel font words pulled closer on /make
Press Start 2P gives a space the width of a full letter, so titles and buttons read as
separate blocks. `word-spacing: -0.5em` on every pixel-font element (and the QR card) brings
them to normal text spacing. The game itself keeps its spacing.

## 2026-11-14: The /make preview fills its frame
The game picks a whole-device-pixel cell size. In the small preview frame on a 1.5x screen that
rounded down to two thirds, with a thick border, and a frame resized after load didn't always
re-layout. The preview now uses the exact fit, and layout also follows a ResizeObserver.

## 2026-11-14: Saves per gift
`egg-save-<hash of the link>`, so a test run of your own gift, or two gifts on one phone, never
share progress. The `#unlocked` backup link of the private version is gone: the hash now holds
the gift.

## 2026-11-14: Base model credited (CC BY 4.0), deployed on Vercel
The character's base mesh is "Square Head Character (Free Demo)" by joaobaltieri on Sketchfab,
CC Attribution 4.0 (Sketchfab licence data: "Author must be credited. Commercial use is
allowed."). The owner edited in a different face, re-rigged it and added the eggshell. Credited in
the game (under the mini game list), on /make and in CREDITS.md, with the changes listed as CC BY
asks. Mixamo's own terms could not be read automatically and are still unverified.
Then, on the owner's go: Vercel project `egg-hatch-gift`, linked to the GitHub repo, live at
https://egg-hatch-gift.vercel.app. Static Vite build; no environment variables, because no gift
is ever part of the build.

## 2026-11-14: Tall oval, optional gift link, a date field that works on iPhone
Owner's test on his phone. The oval filled the wide face area, so it only lost its corners and
looked like ROUNDED on the character: it is now a tall, face-shaped oval (0.74 x the height wide).
Checked on the 3D preview: square, oval and circle now read clearly differently.
The gift link or code is optional (owner's call): people may hand over the present in person
afterwards. An empty field makes the egg's card say the present comes another way; only text
that isn't a web link is still an error.
iPhone Safari gives an empty date field no height and its own minimum width, so it looked empty
and stuck out of the form. Fixed height, no minimum width, a "Pick a date" hint (desktop
browsers' own dd/mm/yyyy hidden behind it until the field is in use) and a CLEAR button, since
the iPhone date wheel can't empty the field.

## 2026-11-14: Any gift card, no warnings, copy in the owner's voice
Owner's call: the maker read like a Steam tool. The claim link warnings ("don't open it, signing
in claims it", "Steam gifts expire in 30 days") are gone: people know their own gift cards, and
any card works. The page copy was rewritten playful and direct, in the published register of
`F:\OS\context\voice.md` (still a draft there), with no dashes joining clauses. "CLAIM LINK"
became "GIFT LINK".

## 2026-11-14: Skin colour: tap the photo, tap the swatch, better AUTO
Owner: AUTO picked the wrong colour on most of his photos, and the little colour square did
nothing when tapped. Now the square is the colour picker itself; PICK FROM PHOTO takes the
colour under the next tap on the photo (a 7 x 7 average of what is on screen); and the controls
moved right under the photo so they're seen while editing. AUTO now keeps only the middle of the
face, tests pixels for skin in YCbCr colour space (separates colour from brightness, so it holds
for light and dark skin and drops walls, hair and whites), then takes the median of the brighter
part. Picking the most common skin colour was tried first and landed on the shadow side.
Tested on one face only, so PICK FROM PHOTO is the real safety net.

## 2026-11-14: No emoji, anywhere
Owner's call, firmly: no emoji in any copy. The egg emoji in the /make intro looked bad. This
overrides the emoji habit described in voice.md for this project.

## 2026-11-15: Counting eggs with our own counter, nothing from the link
Owner wants to know how many eggs get made, opened and hatched (the parked coffee button also
waits on "does anyone use the maker"). Chosen: a tiny function in this repo plus a small Redis
store (Upstash, added through the Vercel Marketplace) that adds 1 to a named count, per day and
in total. It accepts only one word from a fixed list: `made`, `opened`, `hatched` (`tapped` added
later the same day, see "How the egg counter counts"). Nothing read
from the link is ever sent: not the name, face, gift card, store, amount, date, tap count or gift
id. Nothing about the person either: no cookies, no visitor id, no country, no device. Counting
runs on the live site only, never in dev or in the /make preview.

Considered: Vercel Web Analytics. Rejected: on the free plan it has no custom events, so it
cannot count "made" or "hatched"; it keeps one month of data, so no running total; and it
records country, browser and device on every visit. Its script also reads the page's full
address, and the docs don't say whether the part after `#` is left out.

This amends Option A (2026-11-14): there is a server again, but it never sees a gift. Cost: anyone
who finds the address can inflate the counts. Fine for a fun number; stopping it properly would
mean storing visitors' addresses, which is the opposite of the point. Damaged links are not
counted: the owner doesn't care about that number.

Sources, read 2026-11-15: vercel.com/docs/analytics/custom-events ("Custom Events are available
on Enterprise and Pro plans"); vercel.com/docs/analytics/limits-and-pricing (Hobby: 50,000
events a month, 1 month reporting window); vercel.com/docs/analytics/privacy-policy (collects
URL, query params "filtered", geolocation, OS, browser, device type; no mention of the `#` part);
upstash.com/pricing/redis ("Free tier includes 250MB data size and 500K commands per month").

## 2026-11-15: Security pass: the card names the real site, https only, font and policy local
An attack pass on the app (reading the code as someone trying to misuse it). The core held up:
link text can't run code, only web links become buttons, unzipping is capped, the gift never
reaches a server, `npm audit` is clean. The real risk is misuse of the maker: anyone can make
an egg on this domain saying "CLAIM ON STEAM, €100" with a link to a fake login page, and the
shop name on the button is just text they typed. Owner's call: fix it without any redesign.

- **The card's hint line names the site the button really opens** ("Opens
  store.steampowered.com. Follow the steps there to claim it."; for a code, "REDEEM opens ...").
  It is the hostname as the browser reads it, so look-alike letters show as `xn--`, and very long
  names keep their end, which says whose site it is. It breaks after dots so it wraps cleanly.
  This is not the warnings removed on 2026-11-14: it says where, not how to claim.
  Considered: only allowing known gift card sites. Rejected: it undoes "any gift card works".
  Considered: an "only tap if you trust the sender" line. Not done: that is a warning again.
- **https only.** `safeUrl()` drops `http:` links. An egg made before this with an `http` link
  loses its button and says the present comes another way (none are known to exist).
- **Direction marks stripped.** `clean()` also drops the invisible characters that can make a
  shop name or amount read backwards.
- **Font shipped with the app.** Press Start 2P came from Google's servers, which hands every
  visitor's IP address to Google (a German court ruled against this in 2022; general knowledge,
  not checked this session). Same files and ranges, now in `src/fonts/`.
- **Content-Security-Policy** in `vercel.json`: the browser only loads anything from this site,
  and no other site can show the game in a frame. A second line of defence if a future change
  ever lets link text into the page as code. `npm run preview` sends the same headers.
- **/make note:** "There's no copy anywhere else, so hang on to the link." and "photo and all".

Tested in a separate headless Chrome against `npm run preview` at 390 x 844: headers on every
page, nothing blocked, every request to this site only, /make makes an egg with a photo, an
`http` link is refused, five crafted eggs show the right site on the card and fit the screen.
Sources: the app-security notes in the owner's library (reels by @chris.raroque on adversarial
review, @securedbycasco on IDOR, @adilet.fndr and @raycfu on costly mistakes and legal traps,
@peterstewiestartup on scoring instead of blocking).

## 2026-11-15: Eggs don't expire
Owner asked whether eggs should delete themselves after a few months, to keep data from
lingering and to protect the server from millions of old links. Decided no, owner agreed:
- There is nothing to delete. An egg exists only as its link, in chat apps and printed QR codes.
  A "self-destruct" could only make the game refuse to play after a date; the photo and gift
  would still sit inside the link, and the decoder is public. It would look safe without being safe.
- Links cost nothing at rest. Vercel serves the same static files to everyone, so cost follows
  opens (about 7 MB for a full playthrough, 6 MB of it music), not how many eggs exist. The site
  is on Hobby, which pauses at its limit instead of billing (general knowledge, not checked
  against Vercel's docs). If traffic ever nears it, shrink the music first.
- The sensitive part ends by itself: a claimed gift card is worth nothing, and most cards carry
  their own end date (CLAIM BEFORE).
- Real deletion means storing eggs on a server: the database option rejected on 2026-11-14.
It would also break late openings, long tap marathons and replays a year on.

## 2026-11-15: Gift eggs never ask for the self-host face file
Eggs without a photo asked for `public/face.png`, which is only meant for a self-hosted copy's
own egg. The live site has none, so each such egg logged two 404 errors in the console, and on a
copy that did have one, a no-photo gift would have shown the host's face instead of the pixel face
/make previewed. Now only the site's own egg loads it, and only when the build found the file
(`__OWN_FACE__`, set in vite.config.js).

## 2026-11-15: How the egg counter counts
Four moments, each sent as one word with `sendBeacon` (it survives the page closing): `made` when
MAKE is pressed (pressing it again on the same egg doesn't recount), `opened` the first time a
gift link opens on a phone, `tapped` the first tap on the egg, `hatched` the first hatch.
`tapped` was the owner's addition: it separates friends who played from friends who only looked.
Considered and dropped: a running total of all taps (fun, but thousands of sends per egg) and
how eggs leave the maker (copy, QR or share). No public number on the site for now, owner's call.
The demo egg, the /make preview and dev never count. `?nocount` stops a browser counting, for the
owner's own testing.

Opening or hatching an egg on the phone that made it doesn't count: makers try their own egg
first, and without this "opened" would mostly mirror "made". The maker's phone keeps the ids
of its eggs (a hash of the link) in localStorage and never sends them. A test on a second
phone still counts; nothing can tell that apart without identifying people.

The numbers are readable by anyone at GET `/api/count` (totals; `?days=N` per day). They are
only three numbers, and the owner needs a way to read them without the store's password. Cached
for 5 minutes, because Upstash's free tier is 500K commands a month and a public counter on a
busy page would otherwise spend it. Previews write `test:eggs:` instead of `eggs:`, so a branch
can be tried without touching the real counts.

Spam: anyone can call `/api/count` and inflate the numbers, use up the free commands (counting
then stops until next month) or, at real volume, Vercel's function allowance, and Hobby pauses
the whole site at its limit. The counter itself must never store addresses to stop that, so
Vercel's firewall should: one rate-limit rule on `/api/count`, 10 requests a minute per
address, answered with 429. Hobby includes one such rule per project (vercel.com/docs/
vercel-firewall/vercel-waf/rate-limiting, read 2026-11-15). The firewall keeps its own short
tally per address; this app stores nothing. Status at go-live: not set yet. Claude's Vercel
connector was blocked from changing firewall settings, so the owner adds it in the dashboard.

Tested: the function against a fake store (only the four words accepted, other sites' pages
refused, previews kept apart, no store means a quiet 503), then the built site in Chrome, 17
flows: every request is one word in the body, `text/plain`, no cookie; the maker's own egg,
repeat opens and repeat taps send nothing.
