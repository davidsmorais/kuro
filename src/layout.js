"use strict";
const nav = require("./nav");

const CONTAINER = "#container";
const SIDEBAR_TOGGLE = ".sidebarNavButton button";
const OVERLAID = "leftColumn-overlaid";
const VISIBLE = "leftColumn-visible";
const TITLE_ICON = "#main .listTitle-icon";
const TITLE = "#main .listTitle";
const SEARCH_BOX = "#O365_NavHeader #toDoSearchBox .searchToolbar";
const SETTINGS_PANE = "#FlexPane_todoSettingsPanel";
const FLEX_PANE_CONTAINER = "#O365fpcontainerid";
const FLEX_PANE_CLOSE = "#flexPaneCloseButton";
const SETTINGS_BUTTON = "#owaSettingsButton";
// Fluent UI renders dropdowns and callouts of the settings pane in layers
const LAYER = ".ms-Layer";

// Left edge of an element in page coordinates from the offsetParent chain:
// unlike getBoundingClientRect() this ignores CSS transforms and transitions.
// SVG elements have no offsetLeft; they are measured against their nearest
// HTML ancestor instead.
const layoutLeft = node => {
  let element = node;
  let left = 0;
  while (element && !(element instanceof HTMLElement)) {
    element = element.parentElement;
  }

  if (element !== node && element) {
    left += node.getBoundingClientRect().left - element.getBoundingClientRect().left;
  }

  for (; element; element = element.offsetParent) {
    left += element.offsetLeft;
  }

  return left;
};

// When the window gets narrow, MS To-Do switches to its "overlay" layout and
// hides the sidebar behind a hamburger button. When the window grows again it
// leaves the overlay layout but forgets to bring the sidebar back. This
// restores the sidebar if it was showing before the window got narrow.
class Layout {
  constructor() {
    this._observer = null;
    this._titleObserver = null;
    this._titleScheduled = false;
  }

  // Publish, as --kuro-search-shift on <html>, how far the header search icon
  // must move to sit above the list title icon (browser.css applies it as a
  // transform, so the O365 header layout itself is untouched).
  trackTitle() {
    if (this._titleObserver) {
      return;
    }

    const update = () => {
      this._titleScheduled = false;
      const icon = document.querySelector(TITLE_ICON) || document.querySelector(TITLE);
      const search = document.querySelector(SEARCH_BOX);
      const { style } = document.documentElement;
      if (!icon || !search) {
        style.removeProperty("--kuro-search-shift");
        return;
      }

      // Layout positions only (offsetLeft chain), so transforms in flight -
      // the shift itself mid-transition, the list-switch animation - do not
      // feed back into the measurement.
      const current = Number.parseFloat(style.getPropertyValue("--kuro-search-shift")) || 0;
      const shift = Math.round(layoutLeft(icon) - 4 - layoutLeft(search));
      if (Number.isFinite(shift) && shift !== current) {
        style.setProperty("--kuro-search-shift", `${shift}px`);
      }
    };

    const schedule = () => {
      if (!this._titleScheduled) {
        this._titleScheduled = true;
        requestAnimationFrame(update);
      }
    };

    this._titleObserver = new MutationObserver(schedule);
    this._titleObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
      childList: true,
      subtree: true,
    });
    window.addEventListener("resize", schedule);
    schedule();
  }

  // To-Do's settings pane only closes from its own close button; close it
  // when the user clicks anywhere outside it as well.
  closeSettingsOnOutsideClick() {
    document.addEventListener("mousedown", event => {
      if (!nav.select(SETTINGS_PANE)) {
        return;
      }

      const inside = event.target.closest(
        `${FLEX_PANE_CONTAINER}, ${SETTINGS_BUTTON}, ${LAYER}`,
      );
      if (!inside) {
        nav.select(FLEX_PANE_CLOSE)?.click();
      }
    }, true);
  }

  async watchSidebar() {
    const container = await nav.waitFor(CONTAINER, 60_000, 250);
    if (!container || this._observer) {
      return;
    }

    let wasOverlaid = container.classList.contains(OVERLAID);
    let visibleBeforeOverlay = container.classList.contains(VISIBLE);

    this._observer = new MutationObserver(() => {
      const overlaid = container.classList.contains(OVERLAID);
      const visible = container.classList.contains(VISIBLE);

      if (wasOverlaid && !overlaid) {
        if (visibleBeforeOverlay && !visible) {
          nav.select(SIDEBAR_TOGGLE)?.click();
        }
      } else if (!overlaid) {
        // Steady, wide state: remember the user's own sidebar preference
        visibleBeforeOverlay = visible;
      }

      wasOverlaid = overlaid;
    });

    this._observer.observe(container, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }
}

module.exports = new Layout();
