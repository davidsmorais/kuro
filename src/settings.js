"use strict";

const Store = require("electron-store");
const { touchFileSync } = require("./util");

const store = new Store({
  defaults: {
    alwaysOnTop: false,
    autoLaunch: false,
    autoNightMode: false,
    disableAutoUpdateCheck: false,
    hideTray: false,
    lastWindowState: {},
    launchMinimized: false,
    menuBarHidden: false,
    mode: {
      custom: false,
    },
    listColors: true,
    requestExitConfirmation: true,
    updateCheckPeriod: 4,
    useGlobalShortcuts: false,
    zoomFactor: 1,
  },
});

touchFileSync(store.path);
store.set({
  alwaysOnTop: store.get("alwaysOnTop", false),
  autoLaunch: store.get("autoLaunch", false),
  autoNightMode: store.get("autoNightMode", false),
  disableAutoUpdateCheck: store.get("disableAutoUpdateCheck", false),
  hideTray: store.get("hideTray", false),
  lastWindowState: {
    x: store.get("lastWindowState.x"),
    y: store.get("lastWindowState.y"),
    width: store.get("lastWindowState.width"),
    height: store.get("lastWindowState.height"),
  },
  launchMinimized: store.get("launchMinimized", false),
  menuBarHidden: false,
  mode: {
    custom: store.get("mode.custom", false),
  },
  listColors: store.get("listColors", true),
  requestExitConfirmation: store.get("requestExitConfirmation", true),
  updateCheckPeriod: store.get("updateCheckPeriod", "4"),
  useGlobalShortcuts: store.get("useGlobalShortcuts", false),
  zoomFactor: store.get("zoomFactor", 1),
});

module.exports = { store };
