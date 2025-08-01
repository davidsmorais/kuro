"use strict";
const { shell } = require("electron");
const { activate } = require("./../win");
const { is } = require("./../util");
const { setAcc } = require("./../keymap");
const dialog = require("./../dialog");
const file = require("./../file");
const { store: settings } = require("./../settings");

module.exports = {
  label: "File",
  submenu: [
    {
      label: "Search",
      accelerator: "CmdorCtrl+F",
      click() {
        activate("search");
      },
    },
    {
      type: "separator",
    },
    {
      label: "List",
      submenu: [
        {
          label: "New List",
          accelerator: setAcc("new-list", "CmdorCtrl+L"),
          click() {
            activate("new-list");
          },
        },
        {
          label: "Delete List",
          accelerator: setAcc("delete-list", "CmdorCtrl+Shift+D"),
          click() {
            activate("delete-list");
          },
        },
        {
          label: "Rename List",
          accelerator: setAcc("rename-list", "CmdorCtrl+Y"),
          click() {
            activate("rename-list");
          },
        },
        {
          type: "separator",
        },
        {
          label: "Hide Completed ToDos",
          accelerator: setAcc("hide-todo", "CmdorCtrl+Shift+H"),
          click() {
            activate("hide-todo");
          },
        },
      ],
    },
    {
      label: "ToDo",
      submenu: [
        {
          label: "New ToDo",
          accelerator: setAcc("new-todo", "CmdorCtrl+N"),
          click() {
            activate("new-todo");
          },
        },
        {
          label: "Delete ToDo",
          accelerator: setAcc("delete-todo", "CmdorCtrl+D"),
          click() {
            activate("delete-todo");
          },
        },
        {
          label: "Rename ToDo",
          accelerator: setAcc("rename-todo", "CmdorCtrl+T"),
          click() {
            activate("rename-todo");
          },
        },
        {
          type: "separator",
        },
        {
          label: "Add to My Day",
          accelerator: setAcc("add-my-day", "CmdorCtrl+K"),
          click() {
            activate("add-my-day");
          },
        },
        {
          label: "Complete ToDo",
          accelerator: setAcc("complete-todo", "CmdorCtrl+Shift+N"),
          click() {
            activate("complete-todo");
          },
        },
        {
          type: "separator",
        },
        {
          label: "Set Reminder",
          accelerator: setAcc("set-reminder", "CmdorCtrl+Shift+E"),
          click() {
            activate("set-reminder");
          },
        },
        {
          label: "Add Due Date",
          accelerator: setAcc("add-due-date", "CmdorCtrl+Shift+T"),
          click() {
            activate("add-due-date");
          },
        },
        {
          label: "Set Repeat",
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
      label: "Go to",
      submenu: [
        {
          label: "My Day",
          accelerator: setAcc("my-day", "CmdorCtrl+M"),
          click() {
            activate("my-day");
          },
        },
        {
          label: "Important",
          accelerator: setAcc("important", "CmdorCtrl+I"),
          click() {
            activate("important");
          },
        },
        {
          label: "Planned",
          accelerator: setAcc("planned", "CmdorCtrl+P"),
          click() {
            activate("planned");
          },
        },
        {
          label: "Tasks",
          accelerator: setAcc("tasks", "CmdorCtrl+A"),
          click() {
            activate("tasks");
          },
        },
      ],
    },
    {
      label: "Return to ToDos",
      accelerator: setAcc("return", "Esc"),
      click() {
        activate("return");
      },
    },
    {
      type: "separator",
    },
    {
      label: "To-Do Settings",
      accelerator: setAcc("settings", "CmdorCtrl+,"),
      click() {
        activate("settings");
      },
    },
    {
      label: "Edit Kuro Settings (JSON)",
      accelerator: "CmdorCtrl+.",
      click() {
        shell.openPath(file.localConfig);
      },
    },
    {
      type: "separator",
    },
    {
      label: "Launch on Start",
      type: "checkbox",
      checked: settings.get("autoLaunch"),
      click(item) {
        settings.set("autoLaunch", item.checked);
        activate("auto-launch");
      },
    },
    {
      label: "Launch Minimized",
      type: "checkbox",
      checked: settings.get("launchMinimized"),
      click(item) {
        settings.set("launchMinimized", item.checked);
      },
    },
    {
      label: "Enable Global Shortcut Keys",
      type: "checkbox",
      checked: settings.get("useGlobalShortcuts"),
      click(item) {
        dialog.confirmActivationRestart("useGlobalShortcuts", item.checked);
        item.checked = settings.get("useGlobalShortcuts");
      },
    },
    {
      label: "Request Exit Confirmation",
      type: "checkbox",
      checked: settings.get("requestExitConfirmation"),
      click(item) {
        settings.set("requestExitConfirmation", item.checked);
      },
    },
    {
      type: "separator",
    },
    {
      label: "Sign out",
      accelerator: setAcc("sign-out", "CmdorCtrl+Alt+Q"),
      click() {
        dialog.confirmSignOut();
      },
    },
    {
      label: "Exit Kuro",
      visible: !is.darwin,
      accelerator: setAcc("exit", "CmdorCtrl+Q"),
      click() {
        dialog.confirmExit();
      },
    },
  ],
};
