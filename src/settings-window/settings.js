"use strict";

// Renderer for the Settings window. Runs without Node; everything goes
// through the `window.kuro` bridge exposed by preload.js.

(() => {
  const api = window.kuro;
  let T = {};

  // Which electron-store checkboxes go where. `hint` is an optional string key.
  const GROUPS = {
    startup: [
      { key: "autoLaunch" },
      { key: "launchMinimized" },
      { key: "reopenLastList" },
    ],
    window: [
      { key: "alwaysOnTop" },
      { key: "hideTray", hidePlatform: "darwin" },
      { key: "menuBarHidden", hint: "menuBarHiddenHint", hidePlatform: "darwin" },
      { key: "requestExitConfirmation" },
      { key: "useGlobalShortcuts" },
    ],
    updates: [
      { key: "disableAutoUpdateCheck" },
    ],
    theme: [
      { key: "autoNightMode", hint: "autoNightModeHint" },
      { key: "listAccents" },
      { key: "invertNewTaskPosition" },
      { key: "mode.custom", label: "customMode", hint: "customModeHint" },
    ],
  };
  const UPDATE_PERIODS = ["4", "8", "12", "24"];

  const $ = (selector, root = document) => root.querySelector(selector);

  function format(text, vars) {
    return String(text).replace(/{(\w+)}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
    );
  }

  function element(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(props)) {
      if (name === "class") {
        node.className = value;
      } else if (name === "text") {
        node.textContent = value;
      } else if (name.startsWith("data-") || name.startsWith("aria-")) {
        node.setAttribute(name, value);
      } else {
        node[name] = value;
      }
    }

    for (const child of children) {
      if (child) {
        node.append(child);
      }
    }

    return node;
  }

  // ---- status line --------------------------------------------------------

  let statusTimer;
  function status(message, { error = false, sticky = false } = {}) {
    const node = $("#status");
    node.textContent = message;
    node.classList.toggle("error", error);
    clearTimeout(statusTimer);
    if (!sticky && !error) {
      statusTimer = setTimeout(() => {
        node.textContent = "";
      }, 4000);
    }
  }

  function saved(restart) {
    status(restart ? `${T.saved} · ${T.restartNote}` : T.saved, { sticky: restart });
  }

  function failed(error) {
    status(format(T.errorSave, { message: error?.message || error }), { error: true });
  }

  // ---- labels -------------------------------------------------------------

  function humanise(text) {
    const words = text.replace(/[-_]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  function commandLabel(command) {
    return (T.commands && T.commands[command]) || humanise(command);
  }

  // Humanise a theme key: bgPrimaryTransparent → "Background primary transparent"
  function themeLabel(key) {
    const words = T.themeWords || {};
    let prefix = "";
    let rest = key;

    for (const candidate of ["fontColor", "bg"]) {
      if (key.startsWith(candidate)) {
        prefix = words[candidate] || humanise(candidate);
        rest = key.slice(candidate.length);
        break;
      }
    }

    const parts = rest
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(" ")
      .filter(Boolean)
      .map(x => {
        const word = x.toLowerCase();
        return words[word] || word;
      });

    const label = [prefix, ...parts].filter(Boolean).join(" ");
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  // ---- tabs ---------------------------------------------------------------

  function selectTab(name) {
    const tabs = [...document.querySelectorAll(".tab")];
    for (const tab of tabs) {
      const active = tab.dataset.tab === name;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      $(`#panel-${tab.dataset.tab}`).hidden = !active;
    }

    moveTabIndicator();

    try {
      localStorage.setItem("kuro-settings-tab", name);
    } catch {}
  }

  // Slide the pill behind the active tab. The first placement happens without
  // a transition (the "ready" class enables it), so the pill does not fly in
  // from the corner when the window opens.
  function moveTabIndicator() {
    const indicator = $(".tab-indicator");
    const tab = document.querySelector(".tab[aria-selected='true']");
    if (!indicator || !tab) {
      return;
    }

    const navRect = indicator.parentElement.getBoundingClientRect();
    const rect = tab.getBoundingClientRect();
    indicator.style.width = `${rect.width}px`;
    indicator.style.height = `${rect.height}px`;
    indicator.style.opacity = "1";
    indicator.style.transform = `translate3d(${rect.left - navRect.left}px, ${rect.top - navRect.top}px, 0)`;
    if (!indicator.classList.contains("ready")) {
      indicator.getBoundingClientRect();
      indicator.classList.add("ready");
    }
  }

  // Ring flash on the control whose value was just saved
  const flashes = new WeakMap();
  function flash(node) {
    if (!node) {
      return;
    }

    const previous = flashes.get(node);
    if (previous) {
      clearTimeout(previous.timer);
      node.removeEventListener("animationend", previous.done);
    }

    node.classList.remove("highlight-flash");
    node.getBoundingClientRect();
    node.classList.add("highlight-flash");
    const done = () => {
      node.classList.remove("highlight-flash");
      node.removeEventListener("animationend", done);
      flashes.delete(node);
    };

    node.addEventListener("animationend", done);
    flashes.set(node, { done, timer: setTimeout(done, 1400) });
  }

  function initTabs() {
    const tabs = [...document.querySelectorAll(".tab")];
    window.addEventListener("resize", moveTabIndicator);
    for (const tab of tabs) {
      tab.addEventListener("click", () => selectTab(tab.dataset.tab));
      tab.addEventListener("keydown", event => {
        const index = tabs.indexOf(tab);
        let next;
        switch (event.key) {
          case "ArrowRight": {
            next = tabs[(index + 1) % tabs.length];

            break;
          }

          case "ArrowLeft": {
            next = tabs[(index - 1 + tabs.length) % tabs.length];

            break;
          }

          case "Home": {
            next = tabs[0];

            break;
          }

          case "End": {
            next = tabs[tabs.length - 1];

            break;
          }
        // No default
        }

        if (next) {
          event.preventDefault();
          selectTab(next.dataset.tab);
          next.focus();
        }
      });
    }

    let remembered = "general";
    try {
      remembered = localStorage.getItem("kuro-settings-tab") || remembered;
    } catch {}

    selectTab(tabs.some(x => x.dataset.tab === remembered) ? remembered : "general");
  }

  // ---- general / appearance checkboxes -----------------------------------

  function renderCheckbox(item, state) {
    const id = `setting-${item.key.replace(/\W/g, "-")}`;
    const input = element("input", { type: "checkbox", id, checked: Boolean(state.settings[item.key]) });
    input.dataset.key = item.key;

    input.addEventListener("change", async () => {
      input.disabled = true;
      try {
        const result = await api.setSetting(item.key, input.checked);
        input.checked = Boolean(result.value);
        saved(result.restart);
        flash(input.closest(".row"));
      } catch (error) {
        input.checked = !input.checked;
        failed(error);
      } finally {
        input.disabled = false;
      }
    });

    return element("label", { class: "row row-check", htmlFor: id }, [
      input,
      element("span", { class: "row-text" }, [
        element("span", { text: T[item.label || item.key] || humanise(item.key) }),
        item.hint ? element("span", { class: "row-hint", text: T[item.hint] }) : null,
      ]),
    ]);
  }

  function renderGroups(state) {
    for (const [group, items] of Object.entries(GROUPS)) {
      const container = $(`[data-group="${group}"]`);
      container.replaceChildren();
      for (const item of items) {
        if (item.hidePlatform && item.hidePlatform === state.platform) {
          continue;
        }

        container.append(renderCheckbox(item, state));
      }
    }

    const select = $("#updateCheckPeriod");
    select.replaceChildren(...UPDATE_PERIODS.map(n =>
      element("option", { value: n, text: format(T.hours, { n }) }),
    ));
    select.value = UPDATE_PERIODS.includes(state.settings.updateCheckPeriod)
      ? state.settings.updateCheckPeriod
      : "4";
    select.addEventListener("change", async () => {
      try {
        const result = await api.setSetting("updateCheckPeriod", select.value);
        select.value = result.value;
        saved(result.restart);
        flash(select);
      } catch (error) {
        failed(error);
      }
    });

    renderLanguage(state);
  }

  const LANGUAGES = ["system", "en", "ru"];

  function renderLanguage(state) {
    const select = $("#language");
    select.replaceChildren(...LANGUAGES.map(code =>
      element("option", { value: code, text: T[`language.${code}`] || code }),
    ));
    select.value = LANGUAGES.includes(state.settings.language)
      ? state.settings.language
      : "system";
    select.addEventListener("change", async () => {
      try {
        // Changing the language rebuilds the menus, so the app restarts
        await api.setSetting("language", select.value);
      } catch (error) {
        failed(error);
      }
    });
  }

  // ---- custom theme colours -------------------------------------------------

  function renderColor(entry) {
    const id = `theme-${entry.key}`;
    const valueNode = element("span", { class: "value", text: entry.value });
    const input = entry.hex
      ? element("input", { type: "color", id, value: entry.hex })
      : element("input", { type: "text", id, value: entry.value, spellcheck: false });

    let last = input.value;

    input.addEventListener("change", async () => {
      try {
        const result = await api.setThemeColor(entry.key, input.value);
        valueNode.textContent = result.value;
        // The picker can only show #RRGGBB; a text field keeps the exact value
        input.value = input.type === "color" && result.hex ? result.hex : result.value;
        last = input.value;
        saved(true);
        flash(input.closest(".color"));
      } catch (error) {
        input.value = last;
        failed(error);
      }
    });

    return element("div", { class: "color" }, [
      input,
      element("label", { class: "row-text", htmlFor: id }, [
        element("span", { text: themeLabel(entry.key) }),
        element("span", { class: "key", text: entry.key }),
      ]),
      element("span", { class: "row-text", title: format(T.defaultValue, { value: entry.defaultValue }) }, [
        valueNode,
      ]),
    ]);
  }

  function renderTheme(entries) {
    $("#theme-colors").replaceChildren(...entries.map(x => renderColor(x)));
  }

  // ---- shortcuts ------------------------------------------------------------

  function renderShortcut(entry) {
    const id = `shortcut-${entry.command}`;
    const input = element("input", {
      type: "text",
      id,
      value: entry.value,
      spellcheck: false,
      placeholder: entry.defaultValue,
    });
    input.setAttribute("aria-invalid", "false");
    let last = entry.value;

    input.addEventListener("change", async () => {
      const value = input.value.trim();
      if (!value) {
        status(T.invalidShortcut, { error: true });
        input.value = last;
        return;
      }

      try {
        const result = await api.setShortcut(entry.command, value);
        last = result.value;
        input.value = result.value;
        input.setAttribute("aria-invalid", "false");
        saved(true);
        flash(input);
      } catch (error) {
        // Show the field as invalid until the reverted (valid) value is seen
        input.setAttribute("aria-invalid", "true");
        input.value = last;
        setTimeout(() => input.setAttribute("aria-invalid", "false"), 1500);
        failed(error);
      }
    });

    return element("tr", {}, [
      element("td", {}, [
        element("label", { htmlFor: id, text: commandLabel(entry.command) }),
        element("span", { class: "key", text: entry.command }),
      ]),
      element("td", {}, [input]),
    ]);
  }

  function renderShortcuts(entries) {
    $("#shortcut-rows").replaceChildren(...entries.map(x => renderShortcut(x)));
  }

  // ---- footer ---------------------------------------------------------------

  function initFooter(state) {
    $("#config-path").textContent = state.configPath;

    $("#open-json").addEventListener("click", async () => {
      try {
        const result = await api.openConfig();
        if (result) {
          status(result, { error: true });
        }
      } catch (error) {
        failed(error);
      }
    });

    $("#open-folder").addEventListener("click", () => api.showConfigFolder().catch(failed));

    $("#reset-theme").addEventListener("click", async () => {
      // eslint-disable-next-line no-alert
      if (!window.confirm(T.confirmResetTheme)) {
        return;
      }

      try {
        renderTheme(await api.resetTheme());
        saved(true);
      } catch (error) {
        failed(error);
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        api.close();
      }
    });
  }

  // ---- boot -----------------------------------------------------------------

  function applyStrings(locale) {
    document.documentElement.lang = locale;
    document.title = T.title;
    for (const node of document.querySelectorAll("[data-string]")) {
      node.textContent = T[node.dataset.string] || node.dataset.string;
    }

    const tabLabels = { general: T.tabGeneral, appearance: T.tabAppearance, shortcuts: T.tabShortcuts };
    for (const tab of document.querySelectorAll(".tab")) {
      tab.textContent = tabLabels[tab.dataset.tab];
    }

    $(".tabs").setAttribute("aria-label", T.title);
  }

  // Desktop accent colour for form controls and the active tab; the CSS
  // fallback stays in place when the desktop does not publish one.
  function applyAccent(hex) {
    if (!/^#[\da-f]{6}$/i.test(hex || "")) {
      return;
    }

    const [r, g, b] = [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
    const luminance = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
    const { style } = document.documentElement;
    style.setProperty("--accent", hex);
    style.setProperty("--focus", hex);
    style.setProperty("--accent-text", luminance > 0.55 ? "#1F1F1F" : "#FFFFFF");
  }

  async function boot() {
    try {
      const [locale, table, state] = await Promise.all([
        api.getLocale(),
        api.getStrings(),
        api.getState(),
      ]);
      T = table;
      applyStrings(locale);
      applyAccent(state.accent);
      initTabs();
      renderGroups(state);
      renderTheme(state.theme);
      renderShortcuts(state.shortcuts);
      initFooter(state);
    } catch (error) {
      status(format(T.errorLoad || "Could not load settings: {message}", {
        message: error?.message || error,
      }), { error: true });
    }
  }

  window.addEventListener("DOMContentLoaded", boot);
})();
