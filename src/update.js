"use strict";
const {app} = require("electron");
const {get} = require("node:https");
const dialog = require("./dialog");
const url = require("./url");

const {log} = console;

class Update {
  // Turn "v9.1.3", "9.1.3-beta.1" or "Kuro v9.1" into [9, 1, 3]
  _parseVersion(version) {
    const match = /\d+(?:\.\d+)*/.exec(String(version));

    if (!match) {
      return null;
    }

    const parts = match[0].split(".").map(Number);

    while (parts.length < 3) {
      parts.push(0);
    }

    return parts;
  }

  _compareToLocal(version) {
    const remote = this._parseVersion(version);
    const local = this._parseVersion(app.getVersion());

    if (!remote || !local) {
      return 0;
    }

    const length = Math.max(remote.length, local.length);

    for (let i = 0; i < length; i++) {
      const dif = (remote[i] || 0) - (local[i] || 0);
      if (dif !== 0) {
        return dif;
      }
    }

    return 0;
  }

  _fetchJson(target, headers = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          Accept: "application/json",
          "User-Agent": `Kuro/${app.getVersion()} (+${url.homepage})`,
          ...headers,
        },
        timeout: 15_000,
      };

      const request = get(target, options, response => {
        const {statusCode: sc} = response;

        if (sc < 200 || sc > 299) {
          response.resume();
          reject(new Error(`Request to get update data failed with HTTP status code: ${sc}`));
          return;
        }

        const data = [];
        response.setEncoding("utf8");
        response.on("data", d => data.push(d));
        response.on("end", () => {
          try {
            resolve(JSON.parse(data.join("")));
          } catch (error) {
            reject(error);
          }
        });
        response.on("error", error => reject(error));
      });

      request.on("timeout", () => request.destroy(new Error("Request to get update data timed out")));
      request.on("error", error => reject(error));
    });
  }

  // Primary source: the latest (non-draft, non-prerelease) GitHub release
  async _fetchLatestRelease() {
    const data = await this._fetchJson(url.updateApi, {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    });

    if (!data || typeof data.tag_name !== "string") {
      throw new TypeError("GitHub release data did not contain a tag name");
    }

    return data.tag_name.replace(/^v/i, "");
  }

  // Fallback source: docs/update.json on the master branch
  async _fetchUpdateData() {
    const data = await this._fetchJson(url.update);

    if (!data || typeof data.version !== "string") {
      throw new TypeError("Update data did not contain a version");
    }

    return data.version;
  }

  async _fetchLatestVersion() {
    try {
      return await this._fetchLatestRelease();
    } catch (error) {
      log(`Falling back to ${url.update}: ${error.message}`);
    }

    return this._fetchUpdateData();
  }

  _hasUpdate(version) {
    return this._compareToLocal(version) > 0;
  }

  async auto() {
    let latestVer;

    try {
      latestVer = await this._fetchLatestVersion();
    } catch (error) {
      return log(error);
    }

    if (this._hasUpdate(latestVer)) {
      return dialog.getUpdate(latestVer);
    }
  }

  async check() {
    let latestVer;

    try {
      latestVer = await this._fetchLatestVersion();
    } catch (error) {
      return dialog.updateError(error.message);
    }

    if (this._hasUpdate(latestVer)) {
      return dialog.getUpdate(latestVer);
    }

    return dialog.noUpdate();
  }
}

module.exports = new Update();
