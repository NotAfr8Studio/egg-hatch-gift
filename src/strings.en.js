// Every line of player-facing text. A Dutch file (strings.nl.js) can copy this shape later.
// Plain strings are shown as they are; functions build lines that contain numbers.

export const S = {
  title: 'HATCH',
  subtitle: 'A BIRTHDAY EGG',
  nogl: '3D is not available in this browser.',

  aria: { soundOn: 'Sound on', soundOff: 'Sound off', giftCard: 'Gift card' },

  plate: { egg: 'EGG', hp: 'HP', raccoon: 'RACCOON', lv: 'Lv99', shoo: 'SHOO', escape: 'ESCAPE', rac: 'RAC', run: 'RUN' },

  common: {
    again: 'Again?', tryAgain: 'TRY AGAIN', back: 'BACK', whatNow: 'What now?', skip: 'SKIP',
    go: 'GO!', bonk: 'BONK!', splat: 'SPLAT!',
  },

  start: { intro: 'A strange egg appeared!', prompt: 'TAP TO START' },
  // returning visits: one tap to unlock the sound before the game carries on
  cont: { prompt: 'TAP TO CONTINUE', egg: 'Your egg is waiting.', hatched: (name) => name + ' is waiting!' },

  msg: {
    first: 'Tap the egg!',
    ten: 'Good start.',
    hundred: (left) => '100 done! Just ' + left + ' to go.',
    quarter: (n) => n + ' done! The egg has a crack!',
    half: (n) => n + ' done! Halfway. No turning back.',
    threeQuarter: (n) => n + ' done! It is shaking a lot.',
    ninety: (n) => n + ' done! Almost there. (Not really.)',
    every: (n, left) => n + ' done! Just ' + left + ' to go.',
  },
  welcomeBack: (left) => 'Welcome back! ' + left + ' HP to go.',

  quiz: {
    intro: ['POP QUIZ!', 'What came first?'],
    head: 'The...',
    chicken: 'CHICKEN',
    egg: 'EGG',
    right: ['Correct! Probably.', 'Eggs were around way before chickens.', 'Dinosaurs laid them first.'],
    wrong: ['Then who laid THIS egg?!', 'Suspicious...', 'The egg will remember this.'],
    after: 'Back to tapping!',
  },

  snake: {
    introArcade: ['Endless snakes!', 'How many can you shoo?'],
    intro: ['Something is moving in the grass...', 'Snakes want the egg!', 'Tap them to shoo them away!'],
    hint: 'TAP THE SNAKES',
    hey: 'HEY!', miss: 'MISS', shoo: 'SHOO!', faster: 'FASTER!',
    win: ['All snakes shooed!', 'The egg is safe.'],
    afterWin: 'The snakes are gone. Keep tapping!',
    lose: ['A snake took the egg!', '...then it dropped it. Phew.'],
    afterSkip: 'The snakes got bored. Keep tapping!',
    arcadeLose: (n, newBest, best) => ['A snake got the egg!', 'You shooed ' + n + '.' + (newBest ? ' NEW BEST!' : ' Best: ' + best + '.')],
  },

  run: {
    intro: ['The egg wants to go outside!', 'Tap to jump over things.', 'Roll all the way home!'],
    hint: 'TAP TO JUMP',
    finish: 'FINISH!',
    out: ['Bonk, bonk, BONK!', 'Out of eggs! Too dizzy.', 'Back to the start!'],
    dist: (x, L) => x + '/' + L + 'm',
    last: (tries, splats, bonks) => tries > 1 ? 'It only took ' + tries + ' tries!' : splats ? 'It got a bit muddy...' : bonks ? 'Not bad for an egg.' : 'A perfect run!',
    done: (time, bonks, newBest, last) => ['The egg rolled home!', 'Time: ' + time + 's. Bonks: ' + bonks + '.', newBest ? 'NEW BEST TIME!' : last],
    after: 'What a trip! Keep tapping.',
  },

  enc: {
    appear: ['A wild RACCOON appeared!', 'It wants the egg!'],
    menuHead: 'EGG will...',
    fight: 'FIGHT', tap: 'TAP', run: 'RUN', snack: 'SNACK',
    runLines: ["EGG can't run.", 'It has no legs. Yet.'],
    lines: {
      fight: ['EGG used HARD SHELL!', 'RACCOON hurt its paws.'],
      tap: ['You tapped the egg.', 'EGG lost 1 HP.', 'The noise scared RACCOON.'],
      snack: ['You threw a sandwich.', 'RACCOON took it instead!'],
    },
    ranAway: ['RACCOON ran away.'],
    after: 'The raccoon is gone. Keep tapping!',
  },

  mud: {
    scrub: 'SCRUB', rinse: 'RINSE', dry: 'DRY',
    intro: ['The egg is covered in mud!', 'Where has it been?!', 'Rub it to scrub it clean.'],
    hintScrub: 'RUB TO SCRUB', hintRinse: 'HOLD TO RINSE', hintDry: 'RUB TO DRY',
    nice: 'NICE!', sparkle: 'SPARKLE!',
    done: (time, newBest) => ['Squeaky clean!', 'Time: ' + time + 's.' + (newBest ? ' NEW BEST!' : '')],
    after: 'Clean egg! Keep tapping.',
  },

  chase: {
    introArcade: ['RACCOON is chasing you!', 'How far can you get?'],
    intro: ['RACCOON is back!', 'And it still wants the egg!', 'Roll 300m to escape!', 'Swipe left or right to dodge.', 'Swipe up to jump, down to duck.'],
    hint: 'SWIPE TO DODGE',
    dist: (m) => m + 'm',
    caught: ['RACCOON caught the egg!', '...but it was too heavy. Phew.'],
    arcadeCaught: (dist, newBest, best) => ['RACCOON caught the egg!', '...it was too heavy. It let go.', 'Distance: ' + dist + 'm.' + (newBest ? ' NEW BEST!' : ' Best: ' + best + 'm.')],
    afterSkip: 'The raccoon gave up. Keep tapping!',
    escaped: (seeds) => ['RACCOON tripped over a root!', 'The egg got away!', 'Seeds collected: ' + seeds + '.'],
    afterEscape: 'Safe at last. Keep tapping!',
  },

  // a gift link that got cut off or changed on the way (the egg still plays, as the demo)
  broken: 'This egg link got damaged on the way. Ask for the QR code again!',

  error: {
    head: 'ERROR',
    body: 'CONNECTION LOST. Please refresh the page!',
    btn: 'REFRESH',
    kidding: 'Just kidding! Keep tapping.',
  },

  hatch: {
    start: '...!',
    hatched: 'The egg hatched!',
    birthday: (name) => 'Happy Birthday!\n' + name + '!',
    cameFirst: (name) => 'Egg came first.\nThen came ' + name + '!',
    next: 'NEXT',
  },

  home: {
    cardTitle: 'GIFT CARD',
    cardOpen: 'TAP TO OPEN',
    cardNote: 'HAPPY BIRTHDAY!',
    cardCodeLabel: 'CODE',
    viewCard: 'VIEW CARD',
    games: 'MINI GAMES',
    replay: 'REPLAY HATCH',
    again: 'START OVER',
    cardHint: 'Press and hold the card, then tap Save to Photos.',
    cardKind: (store) => store ? store + ' GIFT' : 'A GIFT FOR YOU',
    claimBy: (d) => 'CLAIM BEFORE ' + d,
    claim: (store) => store ? 'CLAIM ON ' + store : 'CLAIM GIFT',
    claimHint: 'Tap the button and follow the steps to claim it.',
    redeem: (store) => store ? 'REDEEM ON ' + store : 'REDEEM',
    missing: 'No gift card in this egg. Just the hatch!',
    demoKind: 'DEMO EGG',
    demoNote: 'MAKE YOUR OWN!',
    demoHint: 'This is a demo egg. Make one for a friend, with their face and a gift card inside.',
    make: 'MAKE AN EGG',
    copyCode: 'COPY CODE',
    close: 'CLOSE',
    copied: 'COPIED!',
    copyBlocked: 'COPY BLOCKED',
  },

  lib: {
    head: 'MINI GAMES',
    back: 'BACK',
    names: { snake: 'SNAKES', run: 'ROLL RUN', enc: 'RACCOON', clean: 'MUD WASH', chase: 'CHASE' },
    // CC-BY asks for these credits in the game itself; everything else is listed in CREDITS.md
    credit: 'MUSIC: PLAYONLOOP.COM AND OTHERS\nMODEL: JOAOBALTIERI (CC BY)',
    notPlayed: 'NOT PLAYED YET',
    justForFun: 'JUST FOR FUN',
    bestSnake: (b) => 'BEST ' + b + ' SHOOED',
    bestTime: (b) => 'BEST TIME ' + b.toFixed(1) + 's',
    bestChase: (b) => 'BEST ' + b + 'm',
  },

  startOver: {
    midHead: 'Your egg:',
    head: 'Start over?',
    cont: 'CONTINUE IT',
    restartMid: 'RESTART IT',
    no: 'BACK',
    yes: 'YES, RESTART',
    noPlain: 'NO',
    newEgg: 'A new egg! Gift stays saved.',
  },
};
