"use strict";
const { colors, scenes } = require("./backgrounds");
const { store: settings } = require("./settings");

// Runs in the renderer (preload). The theme chosen for a list in the theme
// panel is stored under `listThemes[<list key>]` as
//   { kind: "color", value: "<id>", light: bool }
//   { kind: "scene", value: "<id>" }
// and applied as <html data-kuro-background="…" data-kuro-tone="light|dark">
// plus CSS variables, which src/style/list-backgrounds.css picks up.
const ACTIVE_LIST = ".listItem-container.active .listItem";
const MY_DAY_ACTIVE = ".todayToolbar-item.active";

class Background {
  constructor() {
    this._observer = null;
    this._scheduled = false;
    this._listeners = new Set();
    this._lastKey = undefined;
    this._switchTimer = null;
    this._keyByPath = null;
    this._themes = null;
  }

  // Stable key of the list on screen: To-Do puts the list id on the active
  // sidebar entry (`inbox`, `important`, or the long id of a custom list).
  currentListKey() {
    const path = window.location.pathname;
    if (document.querySelector(MY_DAY_ACTIVE)) {
      return this._remember(path, "today");
    }

    const active = document.querySelector(ACTIVE_LIST);
    if (active?.id) {
      return this._remember(path, active.id);
    }

    // To-Do unmounts the sidebar while it is collapsed; the list is still the
    // one last seen for this URL
    if (this._keyByPath?.path === path) {
      return this._keyByPath.key;
    }

    const [, section, key] = path.split("/");
    return section === "tasks" && key && key !== "id" ? key : null;
  }

  _remember(path, key) {
    this._keyByPath = { path, key };
    return key;
  }

  currentListTitle() {
    return document.querySelector("#main .listTitle")?.textContent.trim() || "";
  }

  // Kept in memory: apply() runs on every class mutation in the page and the
  // store re-reads its file on each get()
  _all() {
    if (this._themes) {
      return this._themes;
    }

    const stored = settings.get("listThemes");
    const themes = stored && typeof stored === "object" ? { ...stored } : {};

    // Migrate the first version of this feature (scene id per list)
    const legacy = settings.get("listBackgrounds");
    if (legacy && typeof legacy === "object") {
      for (const [key, id] of Object.entries(legacy)) {
        if (!themes[key] && scenes.some(x => x.id === id)) {
          themes[key] = { kind: "scene", value: id };
        }
      }

      settings.delete("listBackgrounds");
      settings.set("listThemes", themes);
    }

    this._themes = themes;
    return themes;
  }

  current() {
    const key = this.currentListKey();
    return key ? this._all()[key] || null : null;
  }

  onChange(listener) {
    this._listeners.add(listener);
  }

  apply() {
    const key = this.currentListKey();
    // A real change from one list to another (not a gap while the sidebar
    // re-renders) plays the list-switch animation
    if (key && this._lastKey && key !== this._lastKey) {
      this._animateListSwitch();
    }

    this._lastKey = key;

    const theme = key ? this._all()[key] || null : null;
    const html = document.documentElement;
    const { dataset, style } = html;

    let background;
    let tone;
    let listBackground;
    switch (theme?.kind) {
      case "color": {
        const color = colors.find(x => x.id === theme.value);
        if (color) {
          background = "color";
          tone = theme.light ? "light" : "dark";
          listBackground = theme.light ? color.light : color.solid;
        }

        break;
      }

      case "scene": {
        const scene = scenes.find(x => x.id === theme.value);
        if (scene) {
          background = scene.id;
          tone = scene.tone;
        }

        break;
      }

      default:
    }

    // Touch the document only when something changed (each write is a style
    // recalculation of the whole page)
    if (dataset.kuroBackground !== background) {
      if (background) {
        dataset.kuroBackground = background;
      } else {
        delete dataset.kuroBackground;
      }
    }

    if (dataset.kuroTone !== tone) {
      if (tone) {
        dataset.kuroTone = tone;
      } else {
        delete dataset.kuroTone;
      }
    }

    if (style.getPropertyValue("--kuro-list-bg") !== (listBackground || "")) {
      if (listBackground) {
        style.setProperty("--kuro-list-bg", listBackground);
      } else {
        style.removeProperty("--kuro-list-bg");
      }
    }

    for (const listener of this._listeners) {
      listener(theme);
    }
  }

  // Let src/style/motion.css bounce the list column's content in on a list
  // change (the class is removed again once the animation is over).
  _animateListSwitch() {
    const html = document.documentElement;
    html.classList.remove("kuro-list-switch");
    html.getBoundingClientRect();
    html.classList.add("kuro-list-switch");
    clearTimeout(this._switchTimer);
    this._switchTimer = setTimeout(() => html.classList.remove("kuro-list-switch"), 450);
  }

  set(theme) {
    const key = this.currentListKey();
    if (!key) {
      return false;
    }

    const all = this._all();
    if (theme) {
      all[key] = theme;
    } else {
      delete all[key];
    }

    settings.set("listThemes", all);
    this._themes = all;
    this.apply();
    return true;
  }

  // Re-apply whenever the active list changes (To-Do toggles classes in the
  // sidebar and on #app when navigating; there is no navigation event to hook).
  watch() {
    if (this._observer) {
      return;
    }

    this._observer = new MutationObserver(() => {
      if (this._scheduled) {
        return;
      }

      this._scheduled = true;
      requestAnimationFrame(() => {
        this._scheduled = false;
        this.apply();
      });
    });

    // Also childList: the restored theme must not wait for the first class
    // change after To-Do has rendered its sidebar
    this._observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
      childList: true,
      subtree: true,
    });
    this.apply();
  }
}

module.exports = new Background();
