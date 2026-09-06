"use strict";
const {app} = require("electron");
const {setAcc} = require("./../keymap");
const {t} = require("./../locale");
const dialog = require("./../dialog");

module.exports = {
  label: app.getName(),
  submenu: [
    {
      role: "about",
      click() {
        dialog.confirmAbout();
      },
    }, {
      type: "separator",
    }, {
      role: "services",
      submenu: [],
    }, {
      type: "separator",
    }, {
      role: "hide",
    }, {
      role: "hideothers",
    }, {
      role: "unhide",
    }, {
      type: "separator",
    }, {
      label: t("menu.app.exit"),
      accelerator: setAcc("exit", "CmdorCtrl+Q"),
      click() {
        dialog.confirmExit();
      },
    },
  ],
};
