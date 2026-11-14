# Egg Hatch Gift

A birthday egg for a friend. They open a link (or scan a QR code), tap a 3D egg a few thousand
times with mini games along the way, and it hatches into a dancing little character with their
face. Then they get your gift card.

## Make one (no coding)

Open `/make/` on the site. Fill in their name, add a photo and frame the face, paste the gift
card claim link or code, pick how many taps. You get a QR code and a link to send.

**Nothing is uploaded or stored.** Everything (name, a tiny pixel version of the face, the gift)
is packed into the link itself, in the part after the `#`, which browsers never send to a server.
That also means: whoever has the link or QR code can open the egg and the gift. Only send it to
the birthday person. And never open a gift card claim link yourself: signing in can claim it.

## Run it yourself

You need Node.js 20 or newer.

```
npm install
npm run dev      # game at http://localhost:5173/, the maker at http://localhost:5173/make/
npm run build    # static site in dist/, ready for any static host
```

In development a DEV button opens a panel to jump to any screen, skip taps and try faces.

Want one fixed egg instead of links? Fill in `OWN_GIFT` in `src/config.js` and put a face at
`public/face.png` (384 x 320, transparent background). It is gitignored on purpose: keep your
friend's face out of your commits. Anything in `OWN_GIFT` ends up readable in the built site.

## How the link works

`src/gift/codec.js` packs the gift into bytes (the face as a small palette image), compresses
them, and writes them with the 43 characters a QR code can store most compactly. The /make page
picks the best face detail that still fits a QR code of 97 x 97 squares.

## Credits

Music, model and libraries: see `CREDITS.md`. Code: MIT (`LICENSE`).
