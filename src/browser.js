"use strict";
const { ipcRenderer: ipc, shell } = require("electron");
const accent = require("./accent");
const background = require("./background");
const layout = require("./layout");
const mode = require("./mode");
const nav = require("./nav");
const startup = require("./startup");
const themePanel = require("./theme-panel");
const dialog = require("./dialog");

// The title button of the currently selected task. Clicking it opens the
// detail pane (and keeps it open if it is already showing).
const SELECTED_TASK = ".taskItem.selected .taskItem-titleWrapper";

// Open the detail pane of the selected task and click `selector` inside it.
// The pane is a lazy-loaded chunk, so it may show up asynchronously.
const clickInDetails = async selector => {
  if (nav.click(SELECTED_TASK)) {
    return nav.clickWhenReady(selector);
  }

  return false;
};

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
    ".taskCard-headerActions [aria-labelledby=\"completed_tasks-label completed_tasks-hint\"]",
  );
});

ipc.on("new-todo", () => {
  nav.click("#main .baseAdd.addTask");
  nav.click("#main .baseAdd-icon.addTask");
});

ipc.on("rename-todo", () => {
  clickInDetails(".editableContent-editButton");
});

ipc.on("delete-todo", () => {
  clickInDetails(".detailFooter-trash");
});

ipc.on("add-my-day", async () => {
  // The first section of the detail pane is the "Add to My Day" toggle
  await clickInDetails(".details .section-innerClick");
  nav.click(".detailFooter-close");
});

ipc.on("complete-todo", () => {
  // The checkbox is a sibling of the title button, not a child of it
  nav.click(".taskItem.selected .checkBox");
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
  nav.click(".listItem-container > #inbox");
});

ipc.on("set-reminder", () => {
  clickInDetails(
    ".details-body .section:nth-of-type(2) .section-item:nth-of-type(1) button",
  );
});

ipc.on("add-due-date", () => {
  clickInDetails(
    ".details-body .section:nth-of-type(2) .section-item:nth-of-type(2) button",
  );
});

ipc.on("set-repeat", () => {
  clickInDetails(
    ".details-body .section:nth-of-type(2) .section-item:nth-of-type(3) button",
  );
});

ipc.on("settings", () => {
  nav.click("#owaSettingsButton");
});

ipc.on("toggle-dark-mode", () => mode.dark());

ipc.on("toggle-custom-mode", () => mode.custom());

ipc.on("sign-out", () => {
  // The account menu is rendered lazily and can take a couple of seconds
  // the first time it is opened
  if (nav.click("#O365_MainLink_Me")) {
    nav.clickWhenReady("#mectrl_body_signOut");
  }
});

ipc.on("toggle-sidebar", () => {
  // Lives in the sidebar header while it is open and in the tasks toolbar
  // while the sidebar is collapsed
  nav.click(".sidebarNavButton button");
});

ipc.on("return", () => {
  nav.click(".detailFooter-close");
});

ipc.on("exit", () => {
  dialog.confirmExit();
});

ipc.on("invert-new-task-position", () => mode.invertNewTaskPosition());

ipc.on("auto-night-mode", () => mode.autoNight());

ipc.on("next-list", () => nav.nextList());

ipc.on("previous-list", () => nav.previousList());

ipc.on("auto-launch", () => startup.autoLaunch());

ipc.on("zoom-in", () => nav.zoomIn());

ipc.on("zoom-out", () => nav.zoomOut());

ipc.on("zoom-reset", () => nav.zoomReset());

document.addEventListener("keydown", list => nav.jumpToList(list));

ipc.on("toggle-list-accents", () => accent.apply());

ipc.on("list-theme-panel", () => themePanel.toggle());

document.addEventListener("DOMContentLoaded", () => {
  nav.zoomRestore();

  mode.restore();
  mode.autoNight();
  accent.apply();
  background.watch();
  layout.watchSidebar();
  layout.trackTitle();
  themePanel.mountButton();
  layout.closeSettingsOnOutsideClick();
});

// Open links in system browser. Covers links in task notes / steps
// (`a[href]`) and linked resources (`div.section.linkedEntity >
// button.linkedEntity-container[title="<url>"]`), which MS To-Do would
// otherwise open with `window.open(url, "_blank")`.
document.addEventListener("click", event => {
  const TODO_BASE_URL = "https://to-do.live.com";
  const targetUrl = event.target.closest("div.linkedEntity > button.linkedEntity-container")?.title
    || event.target.closest("a[href]")?.href;
  if (targetUrl && targetUrl.startsWith("http") && !targetUrl.startsWith(TODO_BASE_URL)) {
    event.preventDefault();
    event.stopPropagation();
    shell.openExternal(targetUrl);
  }
}, true);
