"use strict";
const { globalShortcut } = require("electron");
const { shortcutKeys } = require("./config");
const win = require("./win");

const { log } = console;

class Keymap {
  setAcc(custom, predefined) {
    if (Object.prototype.hasOwnProperty.call(shortcutKeys, custom)) {
      return shortcutKeys[custom];
    }

    return predefined;
  }

  registerGlobal() {
    const toggleKuro = globalShortcut.register(
      this.setAcc("global-toggle-window", "CmdorCtrl+Alt+A"),
      () => {
        win.toggle();
      },
    );

    const searchTodo = globalShortcut.register(
      this.setAcc("global-search-todo", "CmdorCtrl+Alt+F"),
      () => {
        win.appear();
        win.activate("search");
      },
    );

    const createTodo = globalShortcut.register(
      this.setAcc("global-create-todo", "CmdorCtrl+Alt+C"),
      () => {
        win.appear();
        win.activate("new-todo", true);
      },
    );

    if (toggleKuro && searchTodo && createTodo) {
      log("Successfully registered global shortcut keys");
    } else {
      log("Global shortcut keys registration failed");
    }
  }
}

module.exports = new Keymap();
