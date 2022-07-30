"use strict";
const { app, clipboard, dialog, shell } = require("electron");
const os = require("os");
const { activate } = require("./win");
const { release } = require("./url");
const file = require("./file");
const {store: settings} = require("./settings");

class Dialog {
  get _keyReferenceInfo() {
    return [
      "Add due date: Ctrl+Shift+T",
      "Add my day: Ctrl+K",
      "Complete todo: Ctrl+Shift+N",
      "Delete list: Ctrl+Shift+D",
      "Delete todo: Ctrl+D",
      "Global create todo: Ctrl+Alt+C",
      "Global search todo: Ctrl+Alt+F",
      "Global toggle window: Ctrl+Alt+A",
      "Hide todo: Ctrl+Shift+H",
      "Important: Ctrl+I",
      "My day: Ctrl+M",
      "New list: Ctrl+L",
      "New todo: Ctrl+N",
      "Planned: Ctrl+P",
      "Rename list: Ctrl+Y",
      "Rename todo: Ctrl+T",
      "Return: Esc",
      "Set reminder: Ctrl+Shift+E",
      "Settings: Ctrl+,",
      "Sign out: Ctrl+Alt+Q",
      "Tasks: Ctrl+J",
      "Toggle black mode: Ctrl+B",
      "Toggle dark mode: Ctrl+H",
      "Toggle sepia mode: Ctrl+G",
      "Toggle dracula mode: Ctrl+Shift+G",
      "Toggle sidebar: Ctrl+O",
    ].join("\n");
  }

  get _systemInfo() {
    return [
      `Version: ${app.getVersion()}`,
      `Electron: ${process.versions.electron}`,
      `Chrome: ${process.versions.chrome}`,
      `Node: ${process.versions.node}`,
      `V8: ${process.versions.v8}`,
      `OS: ${os.type()} ${os.arch()} ${os.release()}`,
    ].join("\n");
  }

  _keyRef() {
    return this._create({
      buttons: ["Done", "Copy"],
      detail: `Created by Greymond.\n\n${this._keyReferenceInfo}`,
      message: `Kuro ${app.getVersion()} (${os.arch()})`,
      title: "Shortcut Key Reference",
    });
  }

  _about() {
    return this._create({
      buttons: ["Done", "Copy"],
      detail: `Created by Klaus Sinani.\n\n${this._systemInfo}`,
      message: `Kuro ${app.getVersion()} (${os.arch()})`,
      title: "About Kuro",
    });
  }

  _create(options) {
    return dialog.showMessageBoxSync(
      Object.assign(
        {
          cancelId: 1,
          defaultId: 0,
          icon: file.icon,
        },
        options,
      ),
    );
  }

  _exit() {
    return this._create({
      buttons: ["Exit", "Dismiss"],
      detail: "Are you sure you want to exit?",
      message: "Exit Kuro",
      title: "Kuro - Exit Confirmation",
    });
  }

  _signOut() {
    return this._create({
      buttons: ["Sign Out", "Dismiss"],
      detail: "Are you sure you want to sign out?",
      message: "Sign out of Kuro",
      title: "Kuro - Sign Out Confirmation",
    });
  }

  _restart() {
    return this._create({
      buttons: ["Restart", "Dismiss"],
      detail: "Would you like to restart now?",
      message: "Restart Kuro to activate your new settings",
      title: "Kuro - Restart Required",
    });
  }

  _update(version) {
    return this._create({
      buttons: ["Download", "Dismiss"],
      detail: "Click Download to get it now",
      message: `Version ${version} is now available`,
      title: "Update Kuro",
    });
  }

  confirmAbout() {
    if (this._about() === 1) {
      clipboard.writeText(this._systemInfo);
    }
  }

  confirmKey() {
    if (this._keyRef() === 1) {
      clipboard.writeText(this._keyReferenceInfo);
    }
  }

  confirmExit() {
    if (settings.get("requestExitConfirmation")) {
      if (this._exit() === 0) {
        app.quit();
      }
    } else {
      app.quit();
    }
  }

  confirmActivationRestart(option, state) {
    if (this._restart() === 0) {
      settings.set(option, state);
      app.quit();
      app.relaunch();
    }
  }

  confirmSignOut() {
    if (this._signOut() === 0) {
      activate("sign-out");
    }
  }

  updateError(content) {
    return dialog.showErrorBox("Request to get update failed", content);
  }

  noUpdate() {
    return this._create({
      buttons: ["Done"],
      detail: `Kuro is running on the latest ${app.getVersion()} version`,
      message: "There are currently no updates available",
      title: "Kuro - No Update Available",
    });
  }

  getUpdate(version) {
    if (this._update(version) === 0) {
      shell.openExternal(release);
    }
  }
}

module.exports = new Dialog();
