"use strict";
const { store: settings } = require("./settings");
const time = require("./time");
const win = require("./win");

class Mode {
  _toggle(mode) {
    console.log("🚀 ~ file: mode.js:8 ~ Mode ~ _toggle ~ mode:", mode);
    if (!mode) {
      win.activate("toggle-dark-mode");
    } else {
      const modes = settings.get("mode");
      console.log("🚀 ~ file: mode.js:12 ~ Mode ~ _toggle ~ modes:", modes);
      Object.keys(modes).forEach((x) => {
        settings.set(`mode.${x}`, x === mode ? !modes[x] : false);
        document.documentElement.classList.toggle(
          `${x}-mode`,
          settings.get(`mode.${x}`)
        );
      });
    }
  }

  _enableAutoNight() {
    if (time.isDaytime()) {
      this._toggle(null);
    } else if (!settings.get("mode.dark")) {
      this._toggle("dark");
    }

    setTimeout(() => {
      if (settings.get("autoNightMode")) {
        return this._enableAutoNight();
      }
    }, time.ms(time.transitionSpan()));
  }

  _disableAutoNight() {
    this._toggle(null);
  }

  listColors() {
    const newColors = !settings.get("listColors");
    document.documentElement.classList.toggle("list-colors", newColors);
    settings.set("listColors", newColors);
  }

  autoNight() {
    return settings.get("autoNightMode")
      ? this._enableAutoNight()
      : this._disableAutoNight();
  }

  dark() {
    this._toggle();
  }

  custom() {
    this._toggle("custom");
  }

  restore() {
    const modes = settings.get("mode");

    Object.keys(modes).forEach((x) => {
      if (modes[x] && x === "custom") {
        document.documentElement.classList.toggle(`${x}-mode`, modes[x]);
      }
    });

    document.documentElement.classList.toggle(
      "list-colors",
      settings.get("listColors")
    );
  }
}

module.exports = new Mode();
