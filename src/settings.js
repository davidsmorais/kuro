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
    mode: {},
    listColors: true,
    requestExitConfirmation: true,
    sideBarHidden: false,
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
  menuBarHidden: store.get("menuBarHidden", false),
  mode: {
    black: store.get("mode.black", false),
    dark: store.get("mode.dark", false),
    sepia: store.get("mode.sepia", false),
    dracula: store.get("mode.dracula", false),
  },
  listColors: store.get("listColors", true),
  requestExitConfirmation: store.get("requestExitConfirmation", true),
  sideBarHidden: store.get("sideBarHidden", false),
  updateCheckPeriod: store.get("updateCheckPeriod", "4"),
  useGlobalShortcuts: store.get("useGlobalShortcuts", false),
  zoomFactor: store.get("zoomFactor", 1),
});

module.exports = { store };
