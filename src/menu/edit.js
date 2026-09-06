"use strict";
const {t} = require("./../locale");

module.exports = {
  label: t("menu.edit.label"),
  submenu: [
    {
      type: "separator",
    }, {
      role: "undo",
    }, {
      role: "redo",
    }, {
      type: "separator",
    }, {
      role: "cut",
    }, {
      role: "copy",
    }, {
      role: "paste",
    }, {
      role: "pasteandmatchstyle",
    }, {
      role: "delete",
    }, {
      role: "selectall",
    },
  ],
};
