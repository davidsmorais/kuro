"use strict";
const { activate } = require("./../win");
const { is } = require("./../util");
const { setAcc } = require("./../keymap");
const { t } = require("./../locale");
const dialog = require("./../dialog");
const { store: settings } = require("./../settings");

module.exports = {
  label: t("menu.file.label"),
  submenu: [
    {
      label: t("menu.file.search"),
      accelerator: "CmdorCtrl+F",
      click() {
        activate("search");
      },
    },
    {
      type: "separator",
    },
    {
      label: t("menu.file.list"),
      submenu: [
        {
          label: t("menu.file.newList"),
          accelerator: setAcc("new-list", "CmdorCtrl+L"),
          click() {
            activate("new-list");
          },
        },
        {
          label: t("menu.file.deleteList"),
          accelerator: setAcc("delete-list", "CmdorCtrl+Shift+D"),
          click() {
            activate("delete-list");
          },
        },
        {
          label: t("menu.file.renameList"),
          accelerator: setAcc("rename-list", "CmdorCtrl+Y"),
          click() {
            activate("rename-list");
          },
        },
        {
          type: "separator",
        },
        {
          label: t("menu.file.hideCompleted"),
          accelerator: setAcc("hide-todo", "CmdorCtrl+Shift+H"),
          click() {
            activate("hide-todo");
          },
        },
      ],
    },
    {
      label: t("menu.file.todo"),
      submenu: [
        {
          label: t("menu.file.newTodo"),
          accelerator: setAcc("new-todo", "CmdorCtrl+N"),
          click() {
            activate("new-todo");
          },
        },
        {
          label: t("menu.file.deleteTodo"),
          accelerator: setAcc("delete-todo", "CmdorCtrl+D"),
          click() {
            activate("delete-todo");
          },
        },
        {
          label: t("menu.file.renameTodo"),
          accelerator: setAcc("rename-todo", "CmdorCtrl+T"),
          click() {
            activate("rename-todo");
          },
        },
        {
          type: "separator",
        },
        {
          label: t("menu.file.addMyDay"),
          accelerator: setAcc("add-my-day", "CmdorCtrl+K"),
          click() {
            activate("add-my-day");
          },
        },
        {
          label: t("menu.file.completeTodo"),
          accelerator: setAcc("complete-todo", "CmdorCtrl+Shift+N"),
          click() {
            activate("complete-todo");
          },
        },
        {
          type: "separator",
        },
        {
          label: t("menu.file.setReminder"),
          accelerator: setAcc("set-reminder", "CmdorCtrl+Shift+E"),
          click() {
            activate("set-reminder");
          },
        },
        {
          label: t("menu.file.addDueDate"),
          accelerator: setAcc("add-due-date", "CmdorCtrl+Shift+T"),
          click() {
            activate("add-due-date");
          },
        },
        {
          label: t("menu.file.setRepeat"),
          accelerator: setAcc("set-repeat", "CmdorCtrl+Shift+U"),
          click() {
            activate("set-repeat");
          },
        },
      ],
    },
    {
      type: "separator",
    },
    {
      label: t("menu.file.goTo"),
      submenu: [
        {
          label: t("menu.file.myDay"),
          accelerator: setAcc("my-day", "CmdorCtrl+M"),
          click() {
            activate("my-day");
          },
        },
        {
          label: t("menu.file.important"),
          accelerator: setAcc("important", "CmdorCtrl+I"),
          click() {
            activate("important");
          },
        },
        {
          label: t("menu.file.planned"),
          accelerator: setAcc("planned", "CmdorCtrl+P"),
          click() {
            activate("planned");
          },
        },
        {
          label: t("menu.file.tasks"),
          accelerator: setAcc("tasks", "CmdorCtrl+A"),
          click() {
            activate("tasks");
          },
        },
      ],
    },
    {
      label: t("menu.file.returnToTodos"),
      accelerator: setAcc("return", "Esc"),
      click() {
        activate("return");
      },
    },
    {
      type: "separator",
    },
    {
      label: t("menu.file.todoSettings"),
      accelerator: setAcc("settings", "CmdorCtrl+,"),
      click() {
        activate("settings");
      },
    },
    {
      label: t("menu.file.kuroSettings"),
      accelerator: "CmdorCtrl+Shift+,",
      click() {
        // Required lazily: the settings window lives in its own module.
        require("./../settings-window").open();
      },
    },
    {
      type: "separator",
    },
    {
      label: t("menu.file.launchOnStart"),
      type: "checkbox",
      checked: settings.get("autoLaunch"),
      click(item) {
        // Other copies of this item (menu, tray, settings window) may be stale
        item.checked = !settings.get("autoLaunch");
        settings.set("autoLaunch", item.checked);
        activate("auto-launch");
      },
    },
    {
      label: t("menu.file.launchMinimized"),
      type: "checkbox",
      checked: settings.get("launchMinimized"),
      click(item) {
        // Other copies of this item (menu, tray, settings window) may be stale
        item.checked = !settings.get("launchMinimized");
        settings.set("launchMinimized", item.checked);
      },
    },
    {
      label: t("menu.file.globalShortcuts"),
      type: "checkbox",
      checked: settings.get("useGlobalShortcuts"),
      click(item) {
        dialog.confirmActivationRestart("useGlobalShortcuts", item.checked);
        item.checked = settings.get("useGlobalShortcuts");
      },
    },
    {
      label: t("menu.file.requestExitConfirmation"),
      type: "checkbox",
      checked: settings.get("requestExitConfirmation"),
      click(item) {
        // Other copies of this item (menu, tray, settings window) may be stale
        item.checked = !settings.get("requestExitConfirmation");
        settings.set("requestExitConfirmation", item.checked);
      },
    },
    {
      type: "separator",
    },
    {
      label: t("menu.file.signOut"),
      accelerator: setAcc("sign-out", "CmdorCtrl+Alt+Q"),
      click() {
        dialog.confirmSignOut();
      },
    },
    {
      label: t("menu.file.exitKuro"),
      visible: !is.darwin,
      accelerator: setAcc("exit", "CmdorCtrl+Q"),
      click() {
        dialog.confirmExit();
      },
    },
  ],
};
