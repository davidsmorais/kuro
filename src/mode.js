"use strict";
const settings = require("./settings");
const time = require("./time");

class Mode {
  _toggle(mode) {
    const modes = settings.getSync("mode");
    Object.keys(modes).forEach(x => {
      settings.setSync(`mode.${x}`, x === mode ? !modes[x] : false);
      document.documentElement.classList.toggle(
        `${x}-mode`,
        settings.getSync(`mode.${x}`)
      );
    });
  }

  _enableAutoNight() {
    if (time.isDaytime()) {
      this._toggle(null);
    } else if (!settings.getSync("mode.dark")) {
      this._toggle("dark");
    }

    setTimeout(() => {
      if (settings.getSync("autoNightMode")) {
        return this._enableAutoNight();
      }
    }, time.ms(time.transitionSpan()));
  }

  _disableAutoNight() {
    this._toggle(null);
  }

  listColors() {
    const newColors = !settings.getSync("listColors");
    document.documentElement.classList.toggle(`list-colors`, newColors);
    settings.setSync("listColors", newColors);
  }

  autoNight() {
    return settings.getSync("autoNightMode")
      ? this._enableAutoNight()
      : this._disableAutoNight();
  }

  black() {
    this._toggle("black");
  }

  dark() {
    this._toggle("dark");
  }

  restore() {
    const modes = settings.getSync("mode");

    Object.keys(modes).forEach(x => {
      if (modes[x]) {
        document.documentElement.classList.toggle(`${x}-mode`, modes[x]);
      }
    });

    document.documentElement.classList.toggle(
      `list-colors`,
      settings.getSync("listColors")
    );
  }

  sepia() {
    this._toggle("sepia");
  }
  dracula() {
    this._toggle("dracula");
  }
}

module.exports = new Mode();
