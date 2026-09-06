"use strict";
const background = require("./background");
const { colors, scenes } = require("./backgrounds");
const { t } = require("./locale");
const nav = require("./nav");

// Runs in the renderer (preload). The per-list theme picker: a pane that
// slides in from the right, over the To-Do UI, like To-Do's own settings pane
// (same geometry, header and close button), so it feels like part of the app.
// Styled by src/style/theme-panel.css; the chosen theme is stored and applied
// by src/background.js.
//
// The DOM of the pane is built ONCE and afterwards only its state (active
// swatch, list title) is updated in place. Rebuilding it on every
// change is exactly what broke the first version: Fluent UI toggles a class
// on <body> at every mousedown, the background observer fired, the pane was
// re-rendered, and the button under the cursor was gone before mouseup - so
// real clicks never produced a click event while scripted `.click()` worked.
const HEADER = "#O365_NavHeader";
const GEAR_CONTAINER = "#todoSettingsBtn_container";
const TODO_SETTINGS_PANE = "#FlexPane_todoSettingsPanel";
const TODO_SETTINGS_CLOSE = "#flexPaneCloseButton";
// Fluent UI renders callouts/dropdowns in layers outside the pane
const LAYER = ".ms-Layer";

const PALETTE_ICON = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3a9 9 0 100 18h1.5a2 2 0 002-2 2 2 0 00-.5-1.3 2 2 0 01-.5-1.3 2 2 0 012-2H18a3 3 0 003-3c0-3.9-4-8.4-9-8.4z\"/><circle cx=\"7.5\" cy=\"11\" r=\"1\"/><circle cx=\"12\" cy=\"7.5\" r=\"1\"/><circle cx=\"16.5\" cy=\"11\" r=\"1\"/></svg>";
const CLOSE_ICON = "<svg viewBox=\"0 0 12 12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\"><path d=\"M1 1l10 10M11 1L1 11\"/></svg>";

const TABS = ["color", "scenes"];

// Ring flash on the control that was just clicked (restarted if still running)
const flashes = new WeakMap();
const flash = node => {
  const previous = flashes.get(node);
  if (previous) {
    clearTimeout(previous.timer);
    node.removeEventListener("animationend", previous.done);
  }

  node.classList.remove("kuro-highlight-flash");
  node.getBoundingClientRect();
  node.classList.add("kuro-highlight-flash");
  const done = event => {
    // The active ring's own animation (on ::after) ends on this node too
    if (event && event.animationName !== "kuro-highlight-flash") {
      return;
    }

    node.classList.remove("kuro-highlight-flash");
    node.removeEventListener("animationend", done);
    flashes.delete(node);
  };

  node.addEventListener("animationend", done);
  // No animationend arrives when animations are off or the window is hidden
  flashes.set(node, { done, timer: setTimeout(done, 1400) });
};

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }

  if (text !== undefined) {
    node.textContent = text;
  }

  return node;
};

const button = (className, text) => {
  const node = element("button", className, text);
  node.type = "button";
  return node;
};

class ThemePanel {
  constructor() {
    this._root = null;
    this._parts = null;
    this._tab = "color";
    this._buttonObserver = null;
    this._paneObserver = null;
    background.onChange(() => this._refresh());
  }

  isOpen() {
    return Boolean(this._root) && this._root.classList.contains("is-open");
  }

  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (!this._root) {
      this._build();
    }

    if (this.isOpen()) {
      return;
    }

    // One pane at a time, like To-Do itself. Their pane may take a moment to
    // leave the DOM; watching for it too early would close ours at once.
    const todoPaneOpen = Boolean(nav.select(TODO_SETTINGS_PANE));
    if (todoPaneOpen) {
      nav.click(TODO_SETTINGS_CLOSE);
    }

    const header = document.querySelector(HEADER);
    this._root.style.top = `${header ? header.getBoundingClientRect().bottom : 48}px`;
    this._root.hidden = false;
    this._refresh();

    // Force a layout in the hidden position first so the slide-in animates
    // (no requestAnimationFrame: it does not run while the window is occluded)
    this._root.getBoundingClientRect();
    this._root.classList.add("is-open");
    this._moveTabIndicator();

    document.addEventListener("keydown", this._onKey, true);
    document.addEventListener("mousedown", this._onMouseDown, true);
    if (todoPaneOpen) {
      this._watchTodoPaneWhenGone();
    } else {
      this._watchTodoPane();
    }
  }

  _watchTodoPaneWhenGone() {
    const deadline = Date.now() + 1500;
    const check = () => {
      if (!this.isOpen()) {
        return;
      }

      if (!nav.select(TODO_SETTINGS_PANE) || Date.now() >= deadline) {
        this._watchTodoPane();
        return;
      }

      setTimeout(check, 50);
    };

    setTimeout(check, 50);
  }

  close() {
    if (!this._root) {
      return;
    }

    document.removeEventListener("keydown", this._onKey, true);
    document.removeEventListener("mousedown", this._onMouseDown, true);
    this._paneObserver?.disconnect();
    this._paneObserver = null;

    if (!this.isOpen()) {
      return;
    }

    const root = this._root;
    root.classList.remove("is-open");
    // Only the pane's own slide counts: transitionend bubbles up from the
    // buttons inside (hover colours) while the pane is still moving
    const hide = event => {
      if (event && (event.target !== root || event.propertyName !== "transform")) {
        return;
      }

      root.removeEventListener("transitionend", hide);
      if (!root.classList.contains("is-open")) {
        root.hidden = true;
      }
    };

    root.addEventListener("transitionend", hide);
    setTimeout(hide, 450);
  }

  _onKey = event => {
    if (event.key === "Escape") {
      event.stopPropagation();
      this.close();
    }
  };

  _onMouseDown = event => {
    const inside = event.target.closest(`#kuro-theme-pane, #kuro-theme-btn, ${LAYER}`);
    if (!inside) {
      this.close();
    }
  };

  // When the user opens To-Do's settings pane, ours gives way
  _watchTodoPane() {
    if (this._paneObserver) {
      return;
    }

    this._paneObserver = new MutationObserver(() => {
      if (nav.select(TODO_SETTINGS_PANE)) {
        this.close();
      }
    });
    this._paneObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Palette button in the To-Do header, left of the settings gear. To-Do
  // re-renders its header, so the button is re-inserted by an observer.
  mountButton() {
    const place = () => {
      if (document.querySelector("#kuro-theme-btn")) {
        return;
      }

      const gearContainer = document.querySelector(GEAR_CONTAINER);
      if (!gearContainer?.parentElement) {
        return;
      }

      const node = button("", "");
      node.id = "kuro-theme-btn";
      node.title = t("theme.button");
      node.setAttribute("aria-label", t("theme.button"));
      node.innerHTML = PALETTE_ICON;
      node.addEventListener("click", () => this.toggle());
      gearContainer.parentElement.insertBefore(node, gearContainer);
    };

    place();
    this._buttonObserver = new MutationObserver(() => place());
    this._buttonObserver.observe(document.body, { childList: true, subtree: true });
  }

  // ---- DOM, built once ----------------------------------------------------

  _build() {
    const root = element("div", "kuro-theme-pane");
    root.id = "kuro-theme-pane";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", t("theme.title"));
    root.hidden = true;

    const header = element("div", "kuro-theme-pane__header");
    const title = element("h2", "kuro-theme-pane__title", t("theme.title"));
    const close = button("kuro-theme-pane__close");
    close.title = t("theme.close");
    close.setAttribute("aria-label", t("theme.close"));
    close.innerHTML = CLOSE_ICON;
    close.addEventListener("click", () => this.close());
    header.append(title, close);

    const scroll = element("div", "kuro-theme-pane__scroll");
    const list = element("p", "kuro-theme-pane__list");
    const noList = element("p", "kuro-theme-pane__hint kuro-theme-pane__no-list", t("theme.noList"));
    const body = element("div", "kuro-theme-pane__body");

    const tabs = element("div", "kuro-theme-pane__tabs");
    tabs.setAttribute("role", "tablist");
    const tabButtons = {};
    const sections = {};
    for (const id of TABS) {
      const tab = button("kuro-theme-pane__tab", t(`theme.tab.${id}`));
      tab.setAttribute("role", "tab");
      tab.addEventListener("click", () => this._selectTab(id));
      tabs.append(tab);
      tabButtons[id] = tab;

      const section = element("section", "kuro-theme-pane__section");
      section.setAttribute("role", "tabpanel");
      sections[id] = section;
    }

    const indicator = element("div", "kuro-theme-pane__tab-indicator");
    indicator.setAttribute("aria-hidden", "true");
    tabs.append(indicator);

    const swatches = [];
    for (const light of [false, true]) {
      sections.color.append(element("p", "kuro-theme-pane__label", t(light ? "theme.color.light" : "theme.color.solid")));
      const row = element("div", "kuro-theme-pane__row");
      for (const color of colors) {
        const swatch = button(light ? "kuro-theme-pane__swatch is-light" : "kuro-theme-pane__swatch");
        swatch.title = t(`theme.color.${color.id}`);
        swatch.setAttribute("aria-label", swatch.title);
        swatch.style.setProperty("--swatch", light ? color.light : color.solid);
        swatch.style.setProperty("--swatch-ring", color.solid);
        swatch.style.setProperty("--kuro-flash", color.solid);
        swatch.addEventListener("click", () => {
          background.set({ kind: "color", value: color.id, light });
          flash(swatch);
        });
        swatch.dataset.theme = `color:${color.id}:${light}`;
        row.append(swatch);
        swatches.push(swatch);
      }

      sections.color.append(row);
    }

    const grid = element("div", "kuro-theme-pane__scenes");
    for (const scene of scenes) {
      const tile = button("kuro-theme-pane__scene");
      tile.dataset.scene = scene.id;
      tile.dataset.theme = `scene:${scene.id}`;
      tile.title = t(`theme.scene.${scene.id}`);
      tile.append(element("span", "kuro-theme-pane__scene-label", tile.title));
      tile.addEventListener("click", () => {
        background.set({ kind: "scene", value: scene.id });
        flash(tile);
      });
      grid.append(tile);
      swatches.push(tile);
    }

    sections.scenes.append(grid);

    const none = button("kuro-theme-pane__none", t("theme.none"));
    none.dataset.theme = "none";
    none.addEventListener("click", () => {
      background.set(null);
      flash(none);
    });
    swatches.push(none);

    body.append(tabs, sections.color, sections.scenes, none);
    scroll.append(list, noList, body);
    root.append(header, scroll);

    // Inside #app so that To-Do's own theme variables apply; falls back to
    // body while the app shell is still loading.
    (document.querySelector("#app") || document.body).append(root);

    this._root = root;
    this._parts = {
      list, noList, body, tabButtons, sections, swatches, indicator,
    };
    this._selectTab(this._tab);
  }

  _selectTab(id) {
    this._tab = id;
    const { tabButtons, sections } = this._parts;
    for (const tab of TABS) {
      const active = tab === id;
      tabButtons[tab].classList.toggle("is-active", active);
      tabButtons[tab].setAttribute("aria-selected", String(active));
      sections[tab].hidden = !active;
    }

    this._moveTabIndicator();
  }

  // Slide the underline to the active tab. The first placement is applied
  // without a transition (is-ready enables it afterwards), so the line does
  // not grow out of the corner when the pane opens.
  _moveTabIndicator() {
    const { tabButtons, indicator } = this._parts;
    const tab = tabButtons[this._tab];
    if (!tab || !tab.offsetWidth) {
      return;
    }

    indicator.style.width = `${tab.offsetWidth}px`;
    indicator.style.transform = `translateX(${tab.offsetLeft}px)`;
    if (!indicator.classList.contains("is-ready")) {
      indicator.getBoundingClientRect();
      indicator.classList.add("is-ready");
    }
  }

  // Update state in place; never replaces nodes (see the note at the top)
  _refresh() {
    if (!this._root || this._root.hidden) {
      return;
    }

    const { list, noList, body, swatches } = this._parts;
    const key = background.currentListKey();
    const current = background.current();

    list.textContent = background.currentListTitle();
    noList.hidden = Boolean(key);
    body.hidden = !key;

    const activeId = current
      ? (current.kind === "color"
        ? `color:${current.value}:${Boolean(current.light)}`
        : `${current.kind}:${current.value}`)
      : "none";
    for (const swatch of swatches) {
      swatch.classList.toggle("is-active", swatch.dataset.theme === activeId);
    }

    this._moveTabIndicator();
  }
}

module.exports = new ThemePanel();
