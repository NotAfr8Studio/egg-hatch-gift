// What the egg says and gives.
//
// Normally a gift arrives inside the link (made on the /make page; see src/gift/codec.js), and
// GIFT below is filled from it when the page opens. Without a gift in the link, the page plays
// OWN_GIFT instead. Running your own copy and want one fixed gift for everyone who opens it?
// Fill in OWN_GIFT, and put a face photo at public/face.png (384 x 320, transparent background).
// Leave link and code empty and it is a demo egg that points people to /make.
// Careful: whatever you put here ends up in the built JavaScript, readable by anyone.
export const OWN_GIFT = {
  name: 'FRIEND',     // "Happy Birthday! FRIEND!" (12 characters at most)
  taps: 4000,         // taps to hatch; the mini games come at 20, 40, 60, 80 and 90%
  link: '',           // a gift card claim link, or...
  code: '',           // ...a gift card code
  store: '',          // shop name on the buttons: "CLAIM ON STEAM". Empty: "CLAIM GIFT"
  amount: '',         // big text on the card, e.g. '€25'
  claimBy: '',        // 'YYYY-MM-DD', shown as CLAIM BEFORE <date>. Empty: not shown
  redeem: '',         // for a code: the page where it gets redeemed
};

// The live gift. main.js fills it before the game starts; everything else only reads it.
export const GIFT = {
  id: 'own', demo: true, name: 'FRIEND', taps: 4000,
  kind: 'none', url: '', code: '', store: '', amount: '', claimBy: '', redeem: '',
  face: null, tone: null,
};

// Where a Steam wallet code gets redeemed (the /make page fills this in when the shop is Steam).
export const STEAM_REDEEM_URL = 'https://store.steampowered.com/account/redeemwalletcode';
