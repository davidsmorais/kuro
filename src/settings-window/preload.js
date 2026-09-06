"use strict";
const { contextBridge, ipcRenderer } = require("electron");

// Every call goes through ipcRenderer.invoke and is answered by the
// ipcMain.handle handlers registered in ./index.js. Channel names are
// prefixed so they can't collide with the To-Do window's own commands.
const PREFIX = "kuro-settings:";

const invoke = channel => (...args) => ipcRenderer.invoke(PREFIX + channel, ...args);

contextBridge.exposeInMainWorld("kuro", {
  getLocale: invoke("get-locale"),
  getStrings: invoke("get-strings"),
  getState: invoke("get-state"),
  setSetting: invoke("set-setting"),
  setThemeColor: invoke("set-theme-color"),
  resetTheme: invoke("reset-theme"),
  setShortcut: invoke("set-shortcut"),
  openConfig: invoke("open-config"),
  showConfigFolder: invoke("show-config-folder"),
  close: invoke("close"),
});
