"use strict";
const { app, BrowserWindow, Menu, shell, session } = require("electron");
const fs = require("fs");
const { is, readSheet } = require("./src/util");
const file = require("./src/file");
const menu = require("./src/menu");
const { store } = require("./src/settings");
const shortcut = require("./src/keymap");
const time = require("./src/time");
const tray = require("./src/tray");
const update = require("./src/update");
const url = require("./src/url");
const win = require("./src/win");

const { log } = console;

require("electron-debug")({ enabled: true });
require("electron-dl")();
require("electron-context-menu")();

let exiting = false;
let shown = false;
let mainWindow;

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.show();
  }
});

function createMainWindow() {
  const kuroWindow = new BrowserWindow(win.defaultOpts);

  kuroWindow.loadURL(url.app);

  kuroWindow.on("close", error => {
    if (!exiting) {
      error.preventDefault();

      if (is.darwin) {
        app.hide();
      } else {
        kuroWindow.hide();
      }
    }
  });

  kuroWindow.on("page-title-updated", error => {
    error.preventDefault();
  });

  kuroWindow.on("unresponsive", log);

  kuroWindow.webContents.on("did-navigate-in-page", (_, url) => {
    store.set("lastURL", url);
  });

  return kuroWindow;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(menu);

  const lang = app.getLocale();
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["Accept-Language"] = `${lang},en-US;q=0.9`;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  mainWindow = createMainWindow();
  if (store.get("useGlobalShortcuts")) {
    shortcut.registerGlobal();
  }

  if (!store.get("hideTray")) {
    tray.create();
  }

  const { webContents } = mainWindow;
  webContents.on("dom-ready", () => {
    fs.readdir(file.style, (error, files) => {
      for (const x of files) {
        webContents.insertCSS(readSheet(x));
      }
    });

    if (!shown) {
      if (store.get("launchMinimized")) {
        mainWindow.minimize();
      } else {
        mainWindow.show();
      }

      shown = true;
    }
  });

  webContents.on("new-window", (error, url) => {
    error.preventDefault();
    shell.openExternal(url);
  });

  webContents.on("crashed", log);

  if (!store.get("disableAutoUpdateCheck")) {
    setInterval(() => update.auto(), time.ms(store.get("updateCheckPeriod")));
  }
});

process.on("uncaughtException", log);

app.on("activate", () => mainWindow.show());

app.on("before-quit", () => {
  exiting = true;
  if (!mainWindow.isFullScreen()) {
    store.set("lastWindowState", mainWindow.getBounds());
  }
});
