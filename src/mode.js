"use strict";
const nav = require("./nav");
const { store: settings } = require("./settings");
const time = require("./time");
const win = require("./win");

class Mode {
  _toggle(mode) {
    if (mode) {
      const modes = settings.get("mode");
      Object.keys(modes).forEach(x => {
        settings.set(`mode.${x}`, x === mode ? !modes[x] : false);
        document.documentElement.classList.toggle(
          `${x}-mode`,
          settings.get(`mode.${x}`),
        );
      });
    } else {
      win.activate("toggle-dark-mode");
      settings.set("mode.custom", false);
    }
  }

  _enableAutoNight() {
    const isInDarkMode = nav.select("html")?.attributes?.["data-theme"]?.value;
    if (time.isDaytime() && !isInDarkMode) {
      this._toggle();
    } else if (isInDarkMode) {
      this._toggle();
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

  invertNewTaskPosition() {
    const invert = settings.get("invertNewTaskPosition");
    document.documentElement.classList.toggle(
      "reverse-new-task",
      invert,
    );
    settings.set("invertNewTaskPosition", invert);
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

    Object.keys(modes).forEach(x => {
      if (modes[x] && x === "custom") {
        document.documentElement.classList.toggle(`${x}-mode`, modes[x]);
      }
    });

  }
}

module.exports = new Mode();
