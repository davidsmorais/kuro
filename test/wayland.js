"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"),
);

assert.equal(packageJson.build.snap.allowNativeWayland, true);
assert.ok(
  packageJson.build.linux.executableArgs.includes("--ozone-platform-hint=auto"),
);

console.log("Wayland packaging configuration tests passed");
