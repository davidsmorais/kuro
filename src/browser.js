"use strict";
const { ipcRenderer: ipc } = require("electron");
const mode = require("./mode");
const nav = require("./nav");
const { store } = require("./settings");
const startup = require("./startup");
const url = require("./url");

ipc.on("search", () => {
  nav.click(".search");
});

ipc.on("new-list", () => {
  nav.click(".baseAdd-icon.addList");
});

ipc.on("delete-list", () => {
  nav.click(".toolbarButton.more");
  nav.click(".ms-ContextualMenu-item-destructive > button");
});

ipc.on("rename-list", () => {
  nav.click(".listTitle");
});

ipc.on("hide-todo", () => {
  nav.click(
    '.taskCard-headerActions [aria-labelledby="completed_tasks-label completed_tasks-hint"]'
  );
});

ipc.on("new-todo", () => {
  nav.click("#main .baseAdd.addTask");
  nav.click("#main .baseAdd-icon.addTask");
});

ipc.on("rename-todo", () => {
  nav.click(".taskItem.selected.active");
  nav.click(".editableContent-editButton");
});

ipc.on("delete-todo", () => {
  nav.click(".taskItem.selected");
  nav.click(".detailFooter-trash");
});

ipc.on("add-my-day", () => {
  nav.click(".taskItem.selected.active");
  nav.click(".section-innerClick");
  nav.click(".detailFooter-close");
});

ipc.on("complete-todo", () => {
  nav.click(".taskItem.selected.active .checkBox");
});

ipc.on("my-day", () => {
  nav.click(".todayToolbar-item");
});

ipc.on("important", () => {
  nav.click(".listItem-container > #important");
});

ipc.on("planned", () => {
  nav.click(".listItem-container > #planned");
});

ipc.on("tasks", () => {
  nav.click(".listItem .ms-Icon--Home");
});

ipc.on("set-reminder", () => {
  nav.click(".taskItem.selected.active");
  nav.click(".ms-Icon--Ringer");
});

ipc.on("add-due-date", () => {
  nav.click(".taskItem.selected.active");
  nav.click(".section-icon .ms-Icon--Calendar");
});

ipc.on("settings", () => {
  nav.click("#owaSettingsButton");
});

ipc.on("toggle-dark-mode", () => {
  console.log("Everyday im togglin");
  if (!nav.select("#dark_mode")) {
    nav.click("#owaSettingsButton");
  }
  nav.click("#dark_mode .ms-Toggle-background");
  nav.click("#owaSettingsButton");
});

ipc.on("toggle-custom-mode", () => mode.custom());
ipc.on("sign-out", () => {
  nav.click("#O365_MainLink_Me");

  setTimeout(() => {
    nav.click("#mectrl_body_signOut");
  }, 200);
});

ipc.on("toggle-sidebar", () => {
  if (nav.select(".sidebar-header")) {
    nav.click(".sidebar-header button");
  } else {
    nav.click("#main .sidebarNavButton > button");
  }
});

ipc.on("return", () => {
  nav.click(".detailFooter-close");
});

ipc.on("toggle-list-colors", () => mode.listColors());

ipc.on("auto-night-mode", () => mode.autoNight());

ipc.on("next-list", () => nav.nextList());

ipc.on("previous-list", () => nav.previousList());

ipc.on("auto-launch", () => startup.autoLaunch());

ipc.on("zoom-in", () => nav.zoomIn());

ipc.on("zoom-out", () => nav.zoomOut());

ipc.on("zoom-reset", () => nav.zoomReset());

document.addEventListener("keydown", (list) => nav.jumpToList(list));

document.addEventListener("DOMContentLoaded", () => {
  nav.zoomRestore();

  if (store.get("autoNightMode")) {
    mode.autoNight();
  }

  nav.sideBar();
  mode.restore();
});

// Open links in system browser
document.addEventListener("click", (event) => {
  if (event.target.tagName.toLowerCase() === "a") {
    const targetHref = event.target.href;
    if (!targetHref.includes(url.todoBase)) {
      event.preventDefault();
      require("electron").shell.openExternal(event.target.href);
    }
  }
});
