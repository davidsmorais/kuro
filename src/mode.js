"use strict";
const nav = require("./nav");
const { store: settings } = require("./settings");

const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";
const SETTINGS_BUTTON = "#owaSettingsButton";
const DARK_MODE_SETTING = "#dark_mode";
const DARK_MODE_TOGGLE = "#dark_mode .ms-Toggle-background";

// MS To-Do marks its theme on <html data-theme="dark"|"default">
const TODO_DARK = "dark";
const TODO_LIGHT = "default";

const sleep = ms => new Promise(resolve => {
  setTimeout(resolve, ms);
});

class Mode {
  constructor() {
    this._syncing = false;
    this._syncRequested = false;
    this._pin = null;
    this._pinWrites = 0;
    this._todoTheme = undefined;
    this._schemeQuery = typeof window === "undefined"
      ? null
      : window.matchMedia(DARK_SCHEME_QUERY);

    // Re-sync whenever the OS switches between light and dark
    this._schemeQuery?.addEventListener("change", () => this.autoNight());
  }

  // Cross-fade colours for a moment when the theme flips (see motion.css)
  _crossfade() {
    const html = document.documentElement;
    html.classList.add("kuro-theme-switch");
    clearTimeout(this._crossfadeTimer);
    this._crossfadeTimer = setTimeout(() => html.classList.remove("kuro-theme-switch"), 350);
  }

  _toggle(mode) {
    if (mode) {
      this._crossfade();
      const modes = settings.get("mode");
      Object.keys(modes).forEach(x => {
        settings.set(`mode.${x}`, x === mode ? !modes[x] : false);
        document.documentElement.classList.toggle(
          `${x}-mode`,
          settings.get(`mode.${x}`),
        );
      });
    } else {
      this._toggleDark();
    }
  }

  _systemPrefersDark() {
    return Boolean(this._schemeQuery?.matches);
  }

  _systemTheme() {
    return this._systemPrefersDark() ? TODO_DARK : TODO_LIGHT;
  }

  _writeTheme(theme) {
    this._crossfade();
    this._pinWrites++;
    document.documentElement.dataset.theme = theme;
  }

  // Keep <html data-theme> equal to the OS scheme from the very first paint,
  // so the loading screen is already in the right theme. To-Do re-asserts its
  // own saved theme when its settings load; we remember what it wanted (to
  // know whether its setting must be flipped) and put the OS theme back.
  _pinThemeToSystem() {
    if (this._pin) {
      return;
    }

    this._pin = new MutationObserver(records => {
      for (let i = 0; i < records.length; i++) {
        if (this._pinWrites > 0) {
          this._pinWrites--;
          continue;
        }

        this._todoTheme = document.documentElement.dataset.theme;
        if (this._todoTheme !== this._systemTheme()) {
          this._writeTheme(this._systemTheme());
          this._syncWithSystem();
        }
      }
    });

    this._pin.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    this._writeTheme(this._systemTheme());
  }

  _unpinTheme() {
    this._pin?.disconnect();
    this._pin = null;
    this._pinWrites = 0;
    this._todoTheme = undefined;
  }

  // Flip MS To-Do's own "dark mode" switch, which lives in its settings pane
  async _toggleDark() {
    if (!nav.select(DARK_MODE_SETTING)) {
      const settingsButton = await nav.waitFor(SETTINGS_BUTTON);
      if (!settingsButton) {
        return false;
      }

      settingsButton.click();
    }

    const toggle = await nav.waitFor(DARK_MODE_TOGGLE);
    if (!toggle) {
      return false;
    }

    const wasChecked = toggle.getAttribute("aria-checked");
    this._crossfade();
    toggle.click();

    // Applying MS To-Do's theme turns the custom theme off
    settings.set("mode.custom", false);
    document.documentElement.classList.remove("custom-mode");

    const checked = () => nav.select(DARK_MODE_TOGGLE)?.getAttribute("aria-checked");
    const deadline = Date.now() + 2000;
    while (checked() === wasChecked && Date.now() < deadline) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(50);
    }

    nav.select(SETTINGS_BUTTON)?.click();
    return checked() !== wasChecked;
  }

  async _syncWithSystem() {
    this._syncRequested = true;
    if (this._syncing) {
      return;
    }

    this._syncing = true;
    try {
      while (this._syncRequested) {
        this._syncRequested = false;

        // The To-Do SPA renders its toolbar a while after DOMContentLoaded
        // eslint-disable-next-line no-await-in-loop
        const ready = await nav.waitFor(SETTINGS_BUTTON, 60_000, 250);
        if (!ready || !settings.get("autoNightMode")) {
          return;
        }

        // Until To-Do has told us its saved theme there is nothing to flip;
        // the observer above re-syncs as soon as it does.
        if (this._todoTheme !== undefined && this._todoTheme !== this._systemTheme()) {
          // eslint-disable-next-line no-await-in-loop
          await this._toggleDark();
        }
      }
    } finally {
      this._syncing = false;
    }
  }

  invertNewTaskPosition() {
    const invert = settings.get("invertNewTaskPosition");
    document.documentElement.classList.toggle(
      "reverse-new-task",
      invert,
    );
    settings.set("invertNewTaskPosition", invert);
  }

  // Auto Night Mode: keep MS To-Do's theme in step with the OS color scheme
  autoNight() {
    if (settings.get("autoNightMode")) {
      this._pinThemeToSystem();
      this._writeTheme(this._systemTheme());
      this._syncWithSystem();
    } else {
      this._unpinTheme();
    }
  }

  dark() {
    // A manual choice ends "Follow System Theme"; otherwise the pin would flip
    // the theme straight back
    if (settings.get("autoNightMode")) {
      settings.set("autoNightMode", false);
      this._unpinTheme();
    }

    this._toggle();
  }

  custom() {
    this._toggle("custom");
  }

  restore() {
    const modes = settings.get("mode");

    Object.keys(modes).forEach(x => {
      if (modes[x] && x === "custom") {
        document.documentElement.classList.toggle(`${x}-mode`, modes[x]);
      }
    });
  }
}

module.exports = new Mode();
