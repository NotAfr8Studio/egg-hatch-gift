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
