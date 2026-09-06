"use strict";
const { store: settings } = require("./settings");

// Runs in the renderer (preload). Mirrors the `listAccents` setting onto
// <html class="list-accents">, which scopes src/style/list-themes.css.
const LIST_ACCENTS_CLASS = "list-accents";

class Accent {
  apply() {
    const enabled = settings.get("listAccents", true);
    document.documentElement.classList.toggle(LIST_ACCENTS_CLASS, enabled);
    return enabled;
  }
}

module.exports = new Accent();
