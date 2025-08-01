"use strict";
const electron = require("electron");
const { is } = require("./util");
const file = require("./file");
const { store: settings } = require("./settings");

const { app, BrowserWindow } = electron;

class Win {
  get _screenDimensions() {
    const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
    return [width, height];
  }

  get _defaultDimensions() {
    return this._screenDimensions.map((x) => Math.round(x * 0.9));
  }

  get _lastState() {
    const { x, y, width, height } = settings.get("lastWindowState");
    const [defaultWidth, defaultHeight] = this._defaultDimensions;

    return {
      x,
      y,
      width: width || defaultWidth,
      height: height || defaultHeight,
    };
  }

  get _minDimensions() {
    const multipliers = [0.1, 0.3];
    const [minWidth, minHeight] = this._screenDimensions.map((x, idx) =>
      Math.round(x * multipliers[idx])
    );
    return { minWidth, minHeight };
  }

  get defaultOpts() {
    return Object.assign({}, this._minDimensions, this._lastState, {
      alwaysOnTop: settings.get("alwaysOnTop"),
      autoHideMenuBar: settings.get("menuBarHidden"),
      icon: is.linux && file.icon,
      show: false,
      title: app.getName(),
      titleBarStyle: "default",
      webPreferences: {
        nodeIntegration: false,
        enableRemoteModule: true,
        sandbox: false,
        plugins: true,
        preload: file.preload,
      },
    });
  }

  activate(command) {
    const [win] = BrowserWindow.getAllWindows();

    if (is.darwin) {
      win.restore();
    }

    win.webContents.send(command);
  }

  appear() {
    const [win] = BrowserWindow.getAllWindows();
    if (!win.isVisible() || !win.isFocused()) {
      win.show();
      win.focus();
    }
  }

  toggle() {
    const [win] = BrowserWindow.getAllWindows();
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  }
}

module.exports = new Win();
