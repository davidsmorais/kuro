"use strict";
const fs = require("node:fs");
const nodePath = require("node:path");
const defaultConfig = require("./configs");
const file = require("./file");

const { log } = console;

class Config {
  constructor() {
    this._default = Object.assign({}, defaultConfig);
  }

  get _local() {
    try {
      return JSON.parse(fs.readFileSync(file.localConfig, "utf8"));
    } catch (error) {
      return log(error);
    }
  }

  get configuration() {
    this._ensureLocalConfig(file.localConfig);
    return this._local;
  }

  get shortcutKeys() {
    return this.configuration.shortcutKeys;
  }

  get customTheme() {
    return this.configuration.theme;
  }

  // Defaults overlaid with the user's file. Sections and keys the defaults do
  // not know (typos, "$schema", removed options) are dropped rather than
  // crashing on them.
  _updateConfig(data) {
    const result = Object.assign({}, this._default);

    Object.keys(result).forEach(type => {
      const section = data[type];
      const options = section && typeof section === "object" && !Array.isArray(section) ? section : {};
      const known = new Set(Object.keys(this._default[type]));
      result[type] = Object.assign({}, this._default[type]);
      Object.keys(options).forEach(x => {
        if (known.has(x)) {
          result[type][x] = options[x];
        }
      });
    });

    return result;
  }

  // Move a pre-existing ~/.kuro.json into the XDG/userData location
  _migrateLegacyConfig(path) {
    const legacy = file.legacyLocalConfig;

    if (legacy === path || fs.existsSync(path) || !fs.existsSync(legacy)) {
      return;
    }

    try {
      fs.mkdirSync(nodePath.dirname(path), { recursive: true });
      try {
        fs.renameSync(legacy, path);
      } catch {
        // Cross-device (e.g. sandboxed home) - copy, then remove the original
        fs.copyFileSync(legacy, path);
        fs.unlinkSync(legacy);
      }

      log(`Migrated local config from ${legacy} to ${path}`);
    } catch (error) {
      log(error);
    }
  }

  _ensureLocalConfig(path) {
    this._migrateLegacyConfig(path);

    try {
      fs.mkdirSync(nodePath.dirname(path), { recursive: true });
    } catch (error) {
      log(error);
    }

    // An existing but unparsable file must not take the app down: start from
    // the defaults (the broken file is overwritten below)
    const local = fs.existsSync(path) ? this._local : null;
    const data = local && typeof local === "object" && !Array.isArray(local)
      ? this._updateConfig(local)
      : this._default;
    try {
      fs.writeFileSync(path, JSON.stringify(data, null, 4));
    } catch (error) {
      log(error);
    }
  }
}

module.exports = new Config();
