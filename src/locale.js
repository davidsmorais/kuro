"use strict";

// UI string lookup shared by the main process (menus, tray, dialogs) and the
// renderer. Kept free of side effects: nothing here waits for app.whenReady,
// because the menu templates are built at require time.

const SUPPORTED = new Set(["en", "ru"]);
const FALLBACK = "en";

const locales = {
  en: require("./locales/en"),
  ru: require("./locales/ru"),
};

// "ru-RU", "ru_RU.UTF-8", "ru" → "ru"; anything not supported → "" (unknown).
function normalize(tag) {
  if (typeof tag !== "string") {
    return "";
  }

  const code = tag.trim().toLowerCase().split(/[-_.@]/)[0];

  return SUPPORTED.has(code) ? code : "";
}

function fromElectron() {
  try {
    const electron = require("electron");
    // In the renderer `electron.app` is undefined; before `ready` getLocale()
    // may return "" on some platforms - both fall through to the next source.
    if (electron && electron.app && typeof electron.app.getLocale === "function") {
      return electron.app.getLocale();
    }
  } catch {}

  return "";
}

function fromNavigator() {
  try {
    if (typeof navigator !== "undefined" && navigator.language) {
      return navigator.language;
    }
  } catch {}

  return "";
}

function fromEnv() {
  const {env} = process;

  return env.LC_ALL || env.LC_MESSAGES || env.LANG || "";
}

// Explicit choice from View > Language, stored in the settings store
function fromSettings() {
  try {
    const { store } = require("./settings");
    return store.get("language");
  } catch {}

  return "";
}

function language() {
  const candidates = [
    process.env.KURO_LANG,
    fromSettings(),
    fromElectron(),
    fromNavigator(),
    fromEnv(),
  ];

  for (const candidate of candidates) {
    // Override or a definite answer wins; empty/unknown moves on to the next
    // source so that an unset locale never masks a usable one.
    const code = normalize(candidate);
    if (code) {
      return code;
    }
  }

  return FALLBACK;
}

function interpolate(text, vars) {
  if (!vars) {
    return text;
  }

  return text.replace(/{(\w+)}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
}

function t(key, vars) {
  const lang = language();
  const table = locales[lang] || locales[FALLBACK];
  const text = (table && table[key]) || locales[FALLBACK][key] || key;

  return interpolate(text, vars);
}

module.exports = {t, language};
