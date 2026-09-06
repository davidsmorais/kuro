"use strict";
const { app, clipboard, dialog, shell } = require("electron");
const os = require("node:os");
const { activate } = require("./win");
const { release } = require("./url");
const { t } = require("./locale");
const file = require("./file");
const { store: settings } = require("./settings");

// Shortcut reference shown from Help: [label key, command]. The accelerator
// comes from the platform defaults as customized in kuro.json.
const KEY_REFERENCE = [
  ["dialog.key.addDueDate", "add-due-date"],
  ["dialog.key.setReminder", "set-reminder"],
  ["dialog.key.setRepeat", "set-repeat"],
  ["dialog.key.addMyDay", "add-my-day"],
  ["dialog.key.completeTodo", "complete-todo"],
  ["dialog.key.deleteList", "delete-list"],
  ["dialog.key.deleteTodo", "delete-todo"],
  ["dialog.key.globalCreateTodo", "global-create-todo"],
  ["dialog.key.globalSearchTodo", "global-search-todo"],
  ["dialog.key.globalToggleWindow", "global-toggle-window"],
  ["dialog.key.hideTodo", "hide-todo"],
  ["dialog.key.important", "important"],
  ["dialog.key.myDay", "my-day"],
  ["dialog.key.newList", "new-list"],
  ["dialog.key.newTodo", "new-todo"],
  ["dialog.key.planned", "planned"],
  ["dialog.key.renameList", "rename-list"],
  ["dialog.key.renameTodo", "rename-todo"],
  ["dialog.key.return", "return"],
  ["dialog.key.settings", "settings"],
  ["dialog.key.signOut", "sign-out"],
  ["dialog.key.tasks", "tasks"],
  ["dialog.key.toggleCustomMode", "toggle-custom-mode"],
  ["dialog.key.toggleDarkTheme", "toggle-dark-mode"],
  ["dialog.key.toggleSidebar", "toggle-sidebar"],
];

class Dialog {
  get _keyReferenceInfo() {
    const { shortcutKeys } = require("./config");
    return KEY_REFERENCE
      .filter(([, command]) => shortcutKeys[command])
      .map(([key, command]) => `${t(key)}: ${shortcutKeys[command]}`)
      .join("\n");
  }

  get _systemInfo() {
    return [
      `${t("dialog.info.version")}: ${app.getVersion()}`,
      `Electron: ${process.versions.electron}`,
      `Chrome: ${process.versions.chrome}`,
      `Node: ${process.versions.node}`,
      `V8: ${process.versions.v8}`,
      `${t("dialog.info.os")}: ${os.type()} ${os.arch()} ${os.release()}`,
    ].join("\n");
  }

  get _appVersion() {
    return t("dialog.appVersion", {version: app.getVersion(), arch: os.arch()});
  }

  _keyRef() {
    return this._create({
      buttons: [t("dialog.button.done"), t("dialog.button.copy")],
      detail: `${t("dialog.createdBy", {name: "Greymond"})}\n\n${this._keyReferenceInfo}`,
      message: this._appVersion,
      title: t("dialog.keyRef.title"),
    });
  }

  _about() {
    return this._create({
      buttons: [t("dialog.button.done"), t("dialog.button.copy")],
      detail: `${t("dialog.createdBy", {name: "Klaus Sinani"})}\n\n${this._systemInfo}`,
      message: this._appVersion,
      title: t("dialog.about.title"),
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
      buttons: [t("dialog.button.exit"), t("dialog.button.dismiss")],
      detail: t("dialog.exit.detail"),
      message: t("dialog.exit.message"),
      title: t("dialog.exit.title"),
    });
  }

  _signOut() {
    return this._create({
      buttons: [t("dialog.button.signOut"), t("dialog.button.dismiss")],
      detail: t("dialog.signOut.detail"),
      message: t("dialog.signOut.message"),
      title: t("dialog.signOut.title"),
    });
  }

  _restart() {
    return this._create({
      buttons: [t("dialog.button.restart"), t("dialog.button.dismiss")],
      detail: t("dialog.restart.detail"),
      message: t("dialog.restart.message"),
      title: t("dialog.restart.title"),
    });
  }

  _update(version) {
    return this._create({
      buttons: [t("dialog.button.download"), t("dialog.button.dismiss")],
      detail: t("dialog.updateAvailable.detail"),
      message: t("dialog.updateAvailable.message", {version}),
      title: t("dialog.updateAvailable.title"),
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
    return dialog.showErrorBox(t("dialog.updateError.title"), content);
  }

  noUpdate() {
    return this._create({
      buttons: [t("dialog.button.done")],
      detail: t("dialog.noUpdate.detail", {version: app.getVersion()}),
      message: t("dialog.noUpdate.message"),
      title: t("dialog.noUpdate.title"),
    });
  }

  getUpdate(version) {
    if (this._update(version) === 0) {
      shell.openExternal(release);
    }
  }
}

module.exports = new Dialog();
