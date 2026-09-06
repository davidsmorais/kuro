"use strict";
const { app } = require("electron");
const { activate } = require("./../win");
const { is } = require("./../util");
const { setAcc } = require("./../keymap");
const { t } = require("./../locale");
const dialog = require("./../dialog");
const { store: settings } = require("./../settings");

module.exports = {
  label: t("menu.view.label"),
  submenu: [
    {
      label: t("menu.view.reload"),
      accelerator: "CmdOrCtrl+Shift+R",
      click(_, focusedWindow) {
        if (focusedWindow) {
          focusedWindow.reload();
        }
      },
    },
    {
      type: "separator",
    },
    {
      label: t("menu.view.fontSize"),
      submenu: [
        {
          label: t("menu.view.textLarger"),
          accelerator: "CmdOrCtrl+Plus",
          click() {
            activate("zoom-in");
          },
        },
        {
          label: t("menu.view.textSmaller"),
          accelerator: "CmdOrCtrl+-",
          click() {
            activate("zoom-out");
          },
        },
        {
          label: t("menu.view.resetZoom"),
          accelerator: "CmdOrCtrl+0",
          click() {
            activate("zoom-reset");
          },
        },
      ],
    },
    {
      type: "separator",
    },
    {
      label: t("menu.view.darkTheme"),
      accelerator: setAcc("toggle-dark-mode", "CmdorCtrl+B"),
      click() {
        activate("toggle-dark-mode");
      },
    },
    {
      label: t("menu.view.autoNightMode"),
      type: "checkbox",
      checked: settings.get("autoNightMode"),
      accelerator: "CmdorCtrl+Alt+N",
      click(item) {
        // Other copies of this item (menu, tray, settings window) may be stale
        item.checked = !settings.get("autoNightMode");
        settings.set("autoNightMode", item.checked);
        activate("auto-night-mode");
      },
    },
    {
      label: t("menu.view.invertNewTaskPosition"),
      type: "checkbox",
      checked: settings.get("invertNewTaskPosition"),
      click(item) {
        // Other copies of this item (menu, tray, settings window) may be stale
        item.checked = !settings.get("invertNewTaskPosition");
        settings.set("invertNewTaskPosition", item.checked);
        activate("invert-new-task-position");
      },
    },
    {
      label: t("menu.view.followListColors"),
      type: "checkbox",
      checked: settings.get("listAccents"),
      accelerator: setAcc("toggle-list-accents", "CmdorCtrl+Shift+L"),
      click(item) {
        // Other copies of this item (menu, tray, settings window) may be stale
        item.checked = !settings.get("listAccents");
        settings.set("listAccents", item.checked);
        activate("toggle-list-accents");
      },
    },
    {
      label: t("menu.view.reopenLastList"),
      type: "checkbox",
      checked: settings.get("reopenLastList"),
      click(item) {
        // Other copies of this item (menu, tray, settings window) may be stale
        item.checked = !settings.get("reopenLastList");
        settings.set("reopenLastList", item.checked);
      },
    },
    {
      label: t("menu.view.language.label"),
      submenu: ["system", "en", "ru"].map(code => ({
        label: t(`menu.view.language.${code}`),
        type: "radio",
        checked: settings.get("language") === code,
        click() {
          settings.set("language", code);
          // Menus are built once at startup, so restart to apply; quit() (not
          // exit) so before-quit still saves the window state
          app.relaunch();
          app.quit();
        },
      })),
    },
    {
      label: t("menu.view.changeListTheme"),
      accelerator: setAcc("list-theme-panel", "CmdorCtrl+Shift+B"),
      click() {
        activate("list-theme-panel");
      },
    },
    {
      type: "separator",
    },
    {
      label: t("menu.view.nextList"),
      accelerator: "CmdorCtrl+Tab",
      click() {
        activate("next-list");
      },
    },
    {
      label: t("menu.view.previousList"),
      accelerator: "CmdorCtrl+Shift+Tab",
      click() {
        activate("previous-list");
      },
    },
    {
      type: "separator",
    },
    {
      label: t("menu.view.alwaysOnTop"),
      type: "checkbox",
      checked: settings.get("alwaysOnTop"),
      accelerator: "CmdorCtrl+Shift+P",
      click(item, focusedWindow) {
        // Other copies of this item (menu, tray, settings window) may be stale
        item.checked = !settings.get("alwaysOnTop");
        settings.set("alwaysOnTop", item.checked);
        focusedWindow.setAlwaysOnTop(item.checked);
      },
    },
    {
      label: t("menu.view.hideTray"),
      type: "checkbox",
      visible: !is.darwin,
      checked: settings.get("hideTray"),
      click(item) {
        dialog.confirmActivationRestart("hideTray", item.checked);
        item.checked = settings.get("hideTray");
      },
    },
    {
      type: "separator",
    },
    {
      label: t("menu.view.toggleSidebar"),
      type: "checkbox",
      accelerator: setAcc("toggle-sidebar", "CmdorCtrl+B"),
      click() {
        activate("toggle-sidebar");
      },
    },
    {
      label: t("menu.view.toggleMenuBar"),
      type: "checkbox",
      checked: !settings.get("menuBarHidden"),
      visible: !is.darwin,
      click(item, focusedWindow) {
        settings.set("menuBarHidden", !item.checked);
        focusedWindow.setMenuBarVisibility(item.checked);
        focusedWindow.setAutoHideMenuBar(!item.checked);
      },
    },
    {
      label: t("menu.view.toggleFullScreen"),
      accelerator: is.darwin ? "Ctrl+Command+F" : "F11",
      click(_, focusedWindow) {
        if (focusedWindow) {
          focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
        }
      },
    },
    {
      label: t("menu.view.toggleDevTools"),
      accelerator: is.darwin ? "Alt+Command+I" : "Ctrl+Shift+I",
      click(_, focusedWindow) {
        focusedWindow.toggleDevTools();
      },
    },
  ],
};
