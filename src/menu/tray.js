"use strict";
const { shell } = require("electron");
const { t } = require("./../locale");
const dialog = require("./../dialog");
const { store: settings } = require("./../settings");
const url = require("./../url");
const win = require("./../win");

module.exports = [
  {
    label: t("tray.openKuro"),
    click() {
      win.toggle();
    },
  },
  {
    type: "separator",
  },
  {
    label: t("tray.search"),
    click() {
      win.appear();
      win.activate("search");
    },
  },
  {
    type: "separator",
  },
  {
    label: t("tray.create"),
    submenu: [
      {
        label: t("tray.newList"),
        click() {
          win.appear();
          win.activate("new-list");
        },
      },
      {
        label: t("tray.newTodo"),
        click() {
          win.appear();
          win.activate("new-todo");
        },
      },
    ],
  },
  {
    label: t("tray.myDay"),
    click() {
      win.appear();
      win.activate("my-day");
    },
  },
  {
    type: "separator",
  },
  {
    label: t("tray.darkTheme"),
    click() {
      win.appear();
      win.activate("toggle-dark-mode");
    },
  },
  {
    label: t("tray.customTheme"),
    click() {
      win.appear();
      win.activate("toggle-custom-mode");
    },
  },
  {
    label: t("tray.autoNightMode"),
    type: "checkbox",
    checked: settings.get("autoNightMode"),
    click(item) {
      win.appear();
      // Other copies of this item (menu, tray, settings window) may be stale
      item.checked = !settings.get("autoNightMode");
      settings.set("autoNightMode", item.checked);
      win.activate("auto-night-mode");
    },
  },

  {
    label: t("tray.invertNewTaskPosition"),
    type: "checkbox",
    checked: settings.get("invertNewTaskPosition"),
    click(item) {
      win.appear();
      // Other copies of this item (menu, tray, settings window) may be stale
      item.checked = !settings.get("invertNewTaskPosition");
      settings.set("invertNewTaskPosition", item.checked);
      win.activate("invert-new-task-position");
    },
  },
  {
    label: t("tray.followListColors"),
    type: "checkbox",
    checked: settings.get("listAccents"),
    click(item) {
      win.appear();
      // Other copies of this item (menu, tray, settings window) may be stale
      item.checked = !settings.get("listAccents");
      settings.set("listAccents", item.checked);
      win.activate("toggle-list-accents");
    },
  },
  {
    label: t("tray.changeListTheme"),
    click() {
      win.appear();
      win.activate("list-theme-panel");
    },
  },
  {
    type: "separator",
  },
  {
    label: t("tray.kuroSettings"),
    click() {
      win.appear();
      require("./../settings-window").open();
    },
  },
  {
    label: t("tray.todoSettings"),
    click() {
      win.appear();
      win.activate("settings");
    },
  },
  {
    label: t("tray.reportIssue"),
    click() {
      shell.openExternal(url.issue);
    },
  },
  {
    type: "separator",
  },
  {
    label: t("tray.exit"),
    click() {
      dialog.confirmExit();
    },
  },
];
