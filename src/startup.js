"use strict";
const AutoLaunch = require("auto-launch");
const { is } = require("./util");
const {store: settings} = require("./settings");

// The executable path works in the main process and in the preload alike (the
// old `remote` module is gone). macOS needs the .app bundle; an AppImage must
// point at the image itself, its mount point does not survive a reboot.
const _settings = {
  name: "Kuro",
  path: is.darwin
    ? process.execPath.replace(/\.app\/Contents.*/, ".app")
    : (process.env.APPIMAGE || undefined),
  isHidden: true,
};

class Startup {
  constructor(settings) {
    this._launcher = new AutoLaunch(settings);
  }

  async _activate() {
    const enabled = await this._launcher.isEnabled();
    if (!enabled) {
      return this._launcher.enable();
    }
  }

  async _deactivate() {
    const enabled = await this._launcher.isEnabled();
    if (enabled) {
      return this._launcher.disable();
    }
  }

  autoLaunch() {
    if (settings.get("autoLaunch")) {
      this._activate();
    } else {
      this._deactivate();
    }
  }
}

module.exports = new Startup(_settings);
