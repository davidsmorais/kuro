"use strict";
const { execFile } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const electron = require("electron");
const defaults = require("../configs");
const file = require("../file");
const { store } = require("../settings");
const { is } = require("../util");
const strings = require("./strings");

const {
  BaseWindow, BrowserWindow, WebContentsView, globalShortcut, ipcMain, nativeTheme, shell,
} = electron;
const { log } = console;

const PREFIX = "kuro-settings:";

// Settings the page is allowed to touch (electron-store keys).
const BOOLEAN_SETTINGS = new Set([
  "alwaysOnTop",
  "autoLaunch",
  "autoNightMode",
  "disableAutoUpdateCheck",
  "hideTray",
  "invertNewTaskPosition",
  "launchMinimized",
  "menuBarHidden",
  "listAccents",
  "mode.custom",
  "reopenLastList",
  "requestExitConfirmation",
  "useGlobalShortcuts",
]);
// Stored as strings, matching the Help menu radio items and time.ms()
const UPDATE_PERIODS = new Set(["4", "8", "12", "24"]);
// Read once at startup by index.js - nothing to apply live
const RESTART_SETTINGS = new Set(["hideTray", "updateCheckPeriod", "disableAutoUpdateCheck"]);

const THEME_KEYS = Object.keys(defaults.theme);
const SHORTCUT_COMMANDS = Object.keys(defaults.shortcutKeys);

const HEX_COLOR = /^#([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;
const PICKER_COLOR = /^#[\da-f]{6}$/i;
// Anything CSS-ish but without the characters needed to break out of a
// declaration (the value is interpolated into insertCSS by index.js).
const SAFE_CSS_VALUE = /^[\w\s(),.%#-]{1,64}$/;
// Electron accelerator: modifiers joined with "+" and exactly one key. A
// string globalShortcut.register() cannot parse throws at startup, so
// validate it the way Electron does instead of accepting any ASCII.
const MODIFIERS = new Set([
  "command",
  "cmd",
  "control",
  "ctrl",
  "commandorcontrol",
  "cmdorctrl",
  "alt",
  "option",
  "altgr",
  "shift",
  "super",
  "meta",
]);
const KEY_TOKEN = /^(?:[\da-z]|f(?:[1-9]|1\d|2[0-4])|plus|space|tab|capslock|numlock|scrolllock|backspace|delete|insert|return|enter|up|down|left|right|home|end|pageup|pagedown|escape|esc|volumeup|volumedown|volumemute|medianexttrack|mediaprevioustrack|mediastop|mediaplaypause|printscreen|num(?:[\da-z]|dec|add|sub|mult|div)|[)!@#$%^&*(:;+=<,_\->.?/~`{\]|}"'])$/i;

function isAccelerator(text) {
  if (typeof text !== "string" || text.length === 0 || text.length > 64) {
    return false;
  }

  // "Ctrl+Shift+=" splits into an empty last part: the key is "+" itself
  const parts = text.split("+");
  if (parts.length > 1 && parts.at(-1) === "") {
    parts.splice(-2, 2, "+");
  }

  const key = parts.pop();
  return KEY_TOKEN.test(key) && parts.every(x => MODIFIERS.has(x.toLowerCase()));
}

// The settings UI is a BaseWindow hosting a WebContentsView rather than a
// BrowserWindow on purpose: BrowserWindow.getAllWindows() lists the newest
// window first, and win.js addresses the To-Do window as getAllWindows()[0].
// A second BrowserWindow would therefore hijack every menu command and
// global shortcut for as long as it stays open; a BaseWindow is not listed.
let settingsWindow = null;
let settingsView = null;
let handlersRegistered = false;

// Same source as the menus (KURO_LANG, View > Language, OS locale)
function locale() {
  return require("../locale").language() === "ru" ? "ru" : "en";
}

// The To-Do window: any live window other than ours. Looked up on demand
// so it doesn't matter in which order Electron reports its windows.
function mainWindow() {
  return BrowserWindow.getAllWindows().find(
    x => x !== settingsWindow && !x.isDestroyed(),
  );
}

// Same contract as win.activate(): an IPC command handled in src/browser.js
function send(command, ...args) {
  const main = mainWindow();
  if (!main) {
    return false;
  }

  main.webContents.send(command, ...args);
  return true;
}

// ---- kuro.json ------------------------------------------------------------

function detectIndent(text) {
  const match = /\n([ \t]+)"/.exec(text || "");
  if (!match) {
    return 4;
  }

  return match[1].startsWith("\t") ? "\t" : match[1].length;
}

function readLocalConfig() {
  let text = "";
  let data;

  try {
    text = fs.readFileSync(file.localConfig, "utf8");
    data = JSON.parse(text);
  } catch {}

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    // Missing or broken: let Config recreate/normalise it, as at startup;
    // if even that fails (unparsable file) start from the defaults
    try {
      data = require("../config").configuration;
    } catch (error) {
      log(error);
      data = null;
    }

    text = "";
  }

  if (!data || typeof data !== "object") {
    data = JSON.parse(JSON.stringify(defaults));
  }

  data.theme = Object.assign({}, data.theme);
  data.shortcutKeys = Object.assign({}, data.shortcutKeys);

  return {
    data,
    indent: detectIndent(text),
    trailingNewline: text.endsWith("\n"),
  };
}

function writeLocalConfig({ data, indent, trailingNewline }) {
  fs.mkdirSync(path.dirname(file.localConfig), { recursive: true });
  const json = JSON.stringify(data, null, indent) + (trailingNewline ? "\n" : "");
  fs.writeFileSync(file.localConfig, json);
}

// "#12121233" → { hex: "#121212", alpha: "33" }; "#111" → "#111111";
// non-hex values (named colours, rgba()) → hex: null, edited as text.
function parseColor(raw) {
  const value = String(raw ?? "").trim();
  const match = HEX_COLOR.exec(value);
  if (!match) {
    return { value, hex: null, alpha: "" };
  }

  let hex = match[1];
  let alpha = "";

  if (hex.length === 4 || hex.length === 8) {
    alpha = hex.slice(-Math.trunc(hex.length / 4));
    hex = hex.slice(0, -alpha.length);
  }

  if (hex.length === 3) {
    hex = [...hex].map(x => x + x).join("");
  }

  if (alpha.length === 1) {
    alpha += alpha;
  }

  return { value, hex: `#${hex}`, alpha };
}

function themeEntries(data) {
  const theme = data.theme || {};
  return THEME_KEYS.map(key => {
    const raw = typeof theme[key] === "string" ? theme[key] : defaults.theme[key];
    return Object.assign({ key, defaultValue: defaults.theme[key].trim() }, parseColor(raw));
  });
}

function shortcutEntries(data) {
  const keys = data.shortcutKeys || {};
  return SHORTCUT_COMMANDS.map(command => ({
    command,
    value: typeof keys[command] === "string" ? keys[command] : defaults.shortcutKeys[command],
    defaultValue: defaults.shortcutKeys[command],
  }));
}

// ---- electron-store settings -----------------------------------------------

function currentSettings() {
  const result = {};
  for (const key of BOOLEAN_SETTINGS) {
    result[key] = Boolean(store.get(key));
  }

  result.updateCheckPeriod = String(store.get("updateCheckPeriod", "4"));
  result.language = String(store.get("language", "system"));
  return result;
}

function applyGlobalShortcuts(enabled) {
  globalShortcut.unregisterAll();
  if (enabled) {
    require("../keymap").registerGlobal();
  }
}

// What can be applied to the running app right away. Everything else is
// either read only at startup (RESTART_SETTINGS) or only matters later.
const LIVE = {
  alwaysOnTop(value) {
    const main = mainWindow();
    if (main) {
      main.setAlwaysOnTop(value);
    }
  },
  autoLaunch() {
    // Same as browser.js' "auto-launch" handler, but run here in the main
    // process where electron.app is always available.
    require("../startup").autoLaunch();
  },
  autoNightMode: () => send("auto-night-mode"),
  invertNewTaskPosition: () => send("invert-new-task-position"),
  listAccents: () => send("toggle-list-accents"),
  useGlobalShortcuts: applyGlobalShortcuts,
  menuBarHidden(value) {
    const main = mainWindow();
    if (main) {
      main.setMenuBarVisibility(!value);
      main.setAutoHideMenuBar(value);
    }
  },
};

// ---- system accent colour ---------------------------------------------------
// The settings window draws its checkboxes, selects and the active tab in the
// desktop's accent colour. Linux desktops publish it through the
// xdg-desktop-portal Settings interface (GNOME 47+, KDE Plasma 6); older
// GNOME only has the named gsettings key. Resolves to "#RRGGBB" or null.

// GNOME's palette for the named `accent-color` key
const GNOME_ACCENTS = {
  blue: "#3584E4",
  teal: "#2190A4",
  green: "#3A944A",
  yellow: "#C88800",
  orange: "#ED5B00",
  red: "#E62D42",
  pink: "#D56199",
  purple: "#9141AC",
  slate: "#6F8396",
};

const run = (command, args) => new Promise(resolve => {
  try {
    execFile(command, args, { timeout: 1500 }, (error, stdout) => {
      resolve(error ? "" : String(stdout));
    });
  } catch {
    resolve("");
  }
});

const toHex = channel => Math.round(Math.min(1, Math.max(0, channel)) * 255)
  .toString(16)
  .padStart(2, "0")
  .toUpperCase();

async function systemAccent() {
  if (!is.linux) {
    return null;
  }

  // (<(0.568..., 0.254..., 0.674...)>,)
  const portal = await run("gdbus", [
    "call",
    "--session",
    "--dest",
    "org.freedesktop.portal.Desktop",
    "--object-path",
    "/org/freedesktop/portal/desktop",
    "--method",
    "org.freedesktop.portal.Settings.ReadOne",
    "org.freedesktop.appearance",
    "accent-color",
  ]);
  const rgb = portal.match(/\(([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/);
  if (rgb) {
    return `#${toHex(Number(rgb[1]))}${toHex(Number(rgb[2]))}${toHex(Number(rgb[3]))}`;
  }

  const named = await run("gsettings", ["get", "org.gnome.desktop.interface", "accent-color"]);
  return GNOME_ACCENTS[named.trim().replaceAll("'", "")] || null;
}

function setSetting(key, value) {
  if (typeof key !== "string") {
    throw new TypeError("Invalid setting");
  }

  if (key === "language") {
    const lang = String(value);
    if (!["system", "en", "ru"].includes(lang)) {
      throw new Error(`Unsupported language: ${lang}`);
    }

    store.set("language", lang);
    // Menus and every localized string are built at startup, so restart.
    // quit() (not exit) so before-quit still saves the window state.
    require("electron").app.relaunch();
    require("electron").app.quit();
    return { key, value: lang, restart: true };
  }

  if (key === "updateCheckPeriod") {
    const period = String(value);
    if (!UPDATE_PERIODS.has(period)) {
      throw new Error(`Unsupported update period: ${period}`);
    }

    store.set(key, period);
    return { key, value: period, restart: true };
  }

  if (!BOOLEAN_SETTINGS.has(key)) {
    throw new Error(`Unknown setting: ${key}`);
  }

  const next = Boolean(value);

  if (key === "mode.custom") {
    // "toggle-custom-mode" flips the stored value itself (see mode.js), so
    // only send it when the state actually has to change; without a To-Do
    // window there is nothing to toggle and we just record the value.
    if (Boolean(store.get("mode.custom")) !== next && !send("toggle-custom-mode")) {
      store.set("mode.custom", next);
    }

    return { key, value: next, restart: false };
  }

  store.set(key, next);

  try {
    if (LIVE[key]) {
      LIVE[key](next);
    }
  } catch (error) {
    log(error);
  }

  return { key, value: next, restart: RESTART_SETTINGS.has(key) };
}

function setThemeColor(key, value) {
  if (typeof key !== "string" || !THEME_KEYS.includes(key)) {
    throw new Error(`Unknown theme key: ${key}`);
  }

  if (typeof value !== "string") {
    throw new TypeError("Invalid colour");
  }

  const local = readLocalConfig();
  const current = parseColor(local.data.theme[key] ?? defaults.theme[key]);
  let next = value.trim();

  if (PICKER_COLOR.test(next)) {
    // Picker gives 6 digits; keep the alpha the value already had
    next += current.alpha;
  } else if (!SAFE_CSS_VALUE.test(next)) {
    throw new Error(`Invalid colour: ${value}`);
  }

  local.data.theme[key] = next;
  writeLocalConfig(local);

  return Object.assign({ key, defaultValue: defaults.theme[key].trim() }, parseColor(next));
}

function resetTheme() {
  const local = readLocalConfig();
  local.data.theme = Object.assign({}, defaults.theme);
  writeLocalConfig(local);
  return themeEntries(local.data);
}

function setShortcut(command, accelerator) {
  if (typeof command !== "string" || !SHORTCUT_COMMANDS.includes(command)) {
    throw new Error(`Unknown command: ${command}`);
  }

  const next = typeof accelerator === "string" ? accelerator.trim() : "";
  if (!isAccelerator(next)) {
    throw new Error("Invalid shortcut");
  }

  const local = readLocalConfig();
  local.data.shortcutKeys[command] = next;
  writeLocalConfig(local);

  return { command, value: next, defaultValue: defaults.shortcutKeys[command] };
}

// ---- IPC -----------------------------------------------------------------

function fromSettingsWindow(event) {
  return Boolean(settingsView)
    && !settingsView.webContents.isDestroyed()
    && event.sender === settingsView.webContents;
}

function handle(channel, fn) {
  ipcMain.handle(PREFIX + channel, (event, ...args) => {
    if (!fromSettingsWindow(event)) {
      throw new Error("Not allowed");
    }

    return fn(...args);
  });
}

function registerHandlers() {
  if (handlersRegistered) {
    return;
  }

  handlersRegistered = true;

  handle("get-locale", () => locale());
  handle("get-strings", () => strings.get(locale()));
  handle("get-state", async () => {
    const { data } = readLocalConfig();
    return {
      locale: locale(),
      platform: process.platform,
      accent: await systemAccent(),
      configPath: file.localConfig,
      settings: currentSettings(),
      theme: themeEntries(data),
      shortcuts: shortcutEntries(data),
    };
  });
  handle("set-setting", setSetting);
  handle("set-theme-color", setThemeColor);
  handle("reset-theme", resetTheme);
  handle("set-shortcut", setShortcut);
  handle("open-config", () => {
    readLocalConfig(); // Make sure the file exists before handing it over
    return shell.openPath(file.localConfig);
  });
  handle("show-config-folder", () => {
    readLocalConfig();
    shell.showItemInFolder(file.localConfig);
  });
  handle("close", () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close();
    }
  });
}

// ---- window --------------------------------------------------------------

function open() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (settingsWindow.isMinimized()) {
      settingsWindow.restore();
    }

    settingsWindow.show();
    settingsWindow.focus();
    return settingsWindow;
  }

  registerHandlers();

  const main = mainWindow();
  const background = nativeTheme.shouldUseDarkColors ? "#1E1E1E" : "#F6F6F6";

  const window = new BaseWindow({
    width: 720,
    height: 640,
    minWidth: 520,
    minHeight: 420,
    resizable: true,
    title: strings.get(locale()).title,
    // Keep it above the To-Do window (which may itself be always-on-top);
    // a hidden parent (Kuro in the tray) would just get in the way.
    parent: main && main.isVisible() ? main : undefined,
    icon: is.linux ? file.icon : undefined,
    autoHideMenuBar: true,
    show: false,
    backgroundColor: background,
  });

  const view = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  settingsWindow = window;
  settingsView = view;

  view.setBackgroundColor(background);
  window.setContentView(view);
  window.removeMenu();

  const { webContents } = view;

  webContents.once("did-finish-load", () => {
    if (settingsWindow === window && !window.isDestroyed()) {
      window.show();
    }
  });

  // Local page only: never navigate away or open child windows
  webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  webContents.on("will-navigate", event => {
    event.preventDefault();
  });

  window.on("closed", () => {
    // A WebContentsView's contents outlive their window unless closed
    if (!webContents.isDestroyed()) {
      webContents.close();
    }

    if (settingsWindow === window) {
      settingsWindow = null;
      settingsView = null;
    }
  });

  webContents.loadFile(path.join(__dirname, "settings.html"));

  return window;
}

module.exports = { open };
