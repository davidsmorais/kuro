"use strict";

// Palette and scenes for the list theme panel (src/theme-panel.js). Pure data,
// shared by main and renderer, so no electron here.
//
// Colours mirror the mobile To-Do clients: seven solid colours (white text)
// and seven light tints (dark text).
const colors = [
  { id: "blue", solid: "#2564CF", light: "#DCE7FB" },
  { id: "purple", solid: "#7A4EBF", light: "#E9DDF7" },
  { id: "red", solid: "#D13438", light: "#FADADB" },
  { id: "orange", solid: "#D9640F", light: "#FCE3CC" },
  { id: "green", solid: "#3E8A2E", light: "#DBEFCF" },
  { id: "teal", solid: "#0F8A8A", light: "#D0EFEF" },
  { id: "graphite", solid: "#4B4B4B", light: "#E6E6E6" },
];

// CSS-drawn scenes, see src/style/list-backgrounds.css. `tone` says whether
// the list header must use light or dark text on top of it.
const scenes = [
  { id: "list-color", tone: "dark" },
  { id: "sunset", tone: "dark" },
  { id: "ocean", tone: "dark" },
  { id: "forest", tone: "dark" },
  { id: "aurora", tone: "dark" },
  { id: "sand", tone: "light" },
  { id: "night", tone: "dark" },
  { id: "berry", tone: "dark" },
];

module.exports = { colors, scenes };
