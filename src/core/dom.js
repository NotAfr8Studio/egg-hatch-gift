// Tiny DOM helpers. Modules are deferred, so index.html is already parsed here.
export const $ = (id) => document.getElementById(id);
export const phone = $('phone');
