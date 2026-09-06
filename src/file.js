"use strict";
const path = require("node:path");
const { homedir } = require("node:os");
const electron = require("electron");

// Name Electron uses for its per-user data directory (package.json productName)
const appName = "Kuro";

// Mirrors Electron's default `userData` location so the renderer (preload),
// where `electron.app` is unavailable, resolves the same directory as the
// main process. On Linux this follows the XDG base directory spec.
function fallbackUserData() {
  const { env, platform } = process;

  if (platform === "win32") {
    const appData = env.APPDATA || path.join(homedir(), "AppData", "Roaming");
    return path.join(appData, appName);
  }

  if (platform === "darwin") {
    return path.join(homedir(), "Library", "Application Support", appName);
  }

  const configHome = env.XDG_CONFIG_HOME || path.join(homedir(), ".config");
  return path.join(configHome, appName);
}

function userData() {
  const { app } = electron;

  if (app && typeof app.getPath === "function") {
    try {
      return app.getPath("userData");
    } catch {}
  }

  return fallbackUserData();
}

module.exports = {
  icon: path.join(__dirname, "../static/Icon.png"),
  // Pre-XDG location of the local config, kept only for migration
  legacyLocalConfig: path.join(homedir(), ".kuro.json"),
  get localConfig() {
    return path.join(userData(), "kuro.json");
  },
  preload: path.join(__dirname, "./browser.js"),
  style: path.join(__dirname, "./style"),
  trayIcon: path.join(__dirname, "../static/IconTray.png"),
};
