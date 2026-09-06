"use strict";
const { app, BrowserWindow, Menu, shell, session } = require("electron");
const fs = require("fs");
const kebabCase = require("lodash/kebabCase");
const { is, readSheet } = require("./src/util");
const file = require("./src/file");
const { store } = require("./src/settings");
const shortcut = require("./src/keymap");
const time = require("./src/time");
const update = require("./src/update");
const url = require("./src/url");
const win = require("./src/win");
const { customTheme } = require("./src/config");

const { log } = console;

// The To-Do web app picks its language bundle ("Add a task", dates, etc.) from
// the renderer's navigator.language. That follows the process locale, which on
// Linux comes from the LANG/LC_ALL environment and on all platforms from the
// --lang switch. Set both from the Kuro language setting so To-Do matches the
// menus; "system" leaves the OS locale untouched.
{
  const chosen = store.get("language");
  if (chosen === "en" || chosen === "ru") {
    const locale = chosen === "ru" ? "ru_RU.UTF-8" : "en_US.UTF-8";
    process.env.LC_ALL = locale;
    process.env.LANG = locale;
    process.env.LANGUAGE = chosen;
    app.commandLine.appendSwitch("lang", chosen === "ru" ? "ru-RU" : "en-US");
  }
}

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

// Issue #111: reopen the list that was open when Kuro was last closed
function startUrl() {
  const last = store.get("lastURL");
  const isList = typeof last === "string"
    && last.startsWith(url.app)
    && !/\/tasks\/(auth|id)\//.test(last);

  return store.get("reopenLastList") && isList ? last : url.app;
}

function createMainWindow() {
  const kuroWindow = new BrowserWindow(win.defaultOpts);

  kuroWindow.loadURL(startUrl());

  kuroWindow.on("close", (event) => {
    if (exiting) {
      return;
    }

    // Without a tray icon a hidden window has no way back: quit instead
    if (!is.darwin && store.get("hideTray")) {
      app.quit();
      return;
    }

    event.preventDefault();
    if (is.darwin) {
      app.hide();
    } else {
      kuroWindow.hide();
    }
  });

  kuroWindow.on("page-title-updated", (error) => {
    error.preventDefault();
  });

  kuroWindow.on("unresponsive", log);

  for (const event of ["did-navigate", "did-navigate-in-page"]) {
    kuroWindow.webContents.on(event, (_, url) => {
      store.set("lastURL", url);
    });
  }

  return kuroWindow;
}

app.whenReady().then(() => {
  // Menus and the tray template read the UI language with t() while they are
  // built; app.getLocale() only answers after ready, so build them here.
  const menu = require("./src/menu");
  const tray = require("./src/tray");
  Menu.setApplicationMenu(menu);

  // Language for the To-Do web app itself (its UI strings, "Add a task",
  // dates). Follows the Kuro language setting; "system" keeps the OS locale.
  const preferred = store.get("language") === "en" || store.get("language") === "ru"
    ? store.get("language")
    : app.getLocale();
  const primary = preferred.includes("-") ? preferred : `${preferred}-${preferred.toUpperCase()}`;
  const acceptLanguage = `${primary},${preferred};q=0.9,en-US;q=0.8`;
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["Accept-Language"] = acceptLanguage;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  mainWindow = createMainWindow();
  if (store.get("useGlobalShortcuts")) {
    // A shortcut Electron cannot parse throws; never let that stop the
    // window and tray from coming up
    try {
      shortcut.registerGlobal();
    } catch (error) {
      log(error);
    }
  }

  if (!store.get("hideTray")) {
    tray.create();
  }


  const { webContents } = mainWindow;

    if (store.get('invertNewTaskPosition')) {
      webContents.executeJavaScript('document.documentElement.classList.add("reverse-new-task")');
    }
  webContents.on("dom-ready", () => {
    fs.readdir(file.style, (_error, files) => {
      for (const x of files) {
        webContents.insertCSS(readSheet(x));
      }
    });
    const customThemeCss = `html.custom-mode {
      ${Object.keys(customTheme)
        .map((x) => `--${kebabCase(x)}: ${customTheme[x]} !important;`)
        .join("")}
    }`;

    webContents.insertCSS(customThemeCss);

    if (!shown) {
      if (store.get("launchMinimized")) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }

      shown = true;
    }
  });

  // Links that To-Do opens with window.open() go to the system browser
  webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  webContents.on("render-process-gone", (_, details) => log("renderer gone:", details));

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
