"use strict";
const path = require("path");
const { homedir } = require("os");

module.exports = {
  icon: path.join(__dirname, "../static/Icon.png"),
  localConfig: path.join(homedir(), ".kuro.json"),
  // Optional user stylesheet injected after Kuro's own sheets (e.g. category row colors)
  userStyle: path.join(homedir(), ".kuro.css"),
  preload: path.join(__dirname, "./browser.js"),
  style: path.join(__dirname, "./style"),
  trayIcon: path.join(__dirname, "../static/IconTray.png"),
};
