"use strict";
const { app, shell } = require("electron");
const { t } = require("./../locale");
const dialog = require("./../dialog");
const {store: settings} = require("./../settings");
const update = require("./../update");
const url = require("./../url");

module.exports = {
  label: t("menu.help.label"),
  submenu: [
    {
      label: t("menu.help.viewLicense"),
      click() {
        shell.openExternal(url.license);
      },
    },
    {
      label: t("menu.help.version", {version: app.getVersion()}),
      enabled: false,
    },
    {
      label: t("menu.help.homepage"),
      click() {
        shell.openExternal(url.homepage);
      },
    },
    {
      label: t("menu.help.checkForUpdate"),
      click() {
        update.check();
      },
    },
    {
      label: t("menu.help.updateCheckFrequency"),
      enabled: !settings.get("disableAutoUpdateCheck"),
      submenu: [
        {
          label: t("menu.help.every4Hours"),
          type: "checkbox",
          checked: settings.get("updateCheckPeriod") === "4",
          click(item) {
            dialog.confirmActivationRestart("updateCheckPeriod", "4");
            item.checked = settings.get("updateCheckPeriod") === "4";
          },
        },
        {
          label: t("menu.help.every8Hours"),
          type: "checkbox",
          checked: settings.get("updateCheckPeriod") === "8",
          click(item) {
            dialog.confirmActivationRestart("updateCheckPeriod", "8");
            item.checked = settings.get("updateCheckPeriod") === "8";
          },
        },
        {
          label: t("menu.help.every12Hours"),
          type: "checkbox",
          checked: settings.get("updateCheckPeriod") === "12",
          click(item) {
            dialog.confirmActivationRestart("updateCheckPeriod", "12");
            item.checked = settings.get("updateCheckPeriod") === "12";
          },
        },
        {
          label: t("menu.help.onceADay"),
          type: "checkbox",
          checked: settings.get("updateCheckPeriod") === "24",
          click(item) {
            dialog.confirmActivationRestart("updateCheckPeriod", "24");
            item.checked = settings.get("updateCheckPeriod") === "24";
          },
        },
      ],
    },
    {
      label: t("menu.help.disableAutoUpdateCheck"),
      type: "checkbox",
      checked: settings.get("disableAutoUpdateCheck"),
      click(item) {
        dialog.confirmActivationRestart("disableAutoUpdateCheck", item.checked);
        item.checked = settings.get("disableAutoUpdateCheck");
      },
    },
    {
      type: "separator",
    },
    {
      label: t("menu.help.keyboardShortcuts"),
      click() {
        dialog.confirmKey();
      },
    },
    {
      type: "separator",
    },
    {
      label: t("menu.help.search"),
      submenu: [
        {
          label: t("menu.help.issues"),
          click() {
            shell.openExternal(url.search);
          },
        },
        {
          label: t("menu.help.featureRequests"),
          click() {
            shell.openExternal(url.searchFeatureRequests);
          },
        },
      ],
    },
    {
      label: t("menu.help.forkSource"),
      click() {
        shell.openExternal(url.source);
      },
    },
    {
      label: t("menu.help.reportIssue"),
      click() {
        shell.openExternal(url.issue);
      },
    },
    {
      label: t("menu.help.community"),
      click() {
        shell.openExternal(url.community);
      },
    },
  ],
};
