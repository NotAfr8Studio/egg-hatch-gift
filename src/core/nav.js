// Screen navigation, as a thin shim. The games call setScreen() to go back to tapping, and the router
// imports the games to start them. Going through here keeps the imports one-way (no import cycles),
// so module load order is predictable. screens/router.js plugs the real functions in at load.
var impl = {};
export function bindNav(o) { impl = o; }
export function setScreen(n, demo) { return impl.setScreen(n, demo); }
export function arcadeBack() { return impl.arcadeBack(); }
