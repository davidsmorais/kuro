"use strict";
const nav = require("./nav");

// Runs in the renderer (preload). Adds a "locate" button to the detail pane
// header that scrolls the task list to the row of the task being shown and
// flashes it, like an IDE's "select opened file". To-Do marks that row with
// `.taskItem.selected`; the list renders in chunks as you scroll (rows are only
// appended, never dropped), so a row that is not in the DOM yet is loaded by
// scrolling the list to the bottom until it shows up or nothing more loads.
const SELECTED_ROW = ".taskItem.selected";
const SCROLLER = ".chunkedScrollContainer";
const DETAIL_HEADER = ".details .detailHeader-titleWrapper";
const BUTTON_CLASS = "kuro-locate-btn";
const FLASH_CLASS = "kuro-locate-flash";
const MISS_CLASS = "kuro-locate-miss";
const FLASH_MS = 1600;
const LOAD_WAIT_MS = 300;
const MAX_LOAD_ROUNDS = 20;
const LABEL = "Locate in list";
const MISSING_LABEL = "Not in the current list";

const LOCATE_ICON = "<svg viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\"><circle cx=\"8\" cy=\"8\" r=\"4.5\"/><circle cx=\"8\" cy=\"8\" r=\"1.2\" fill=\"currentColor\"/><path d=\"M8 1v2.5M8 12.5V15M1 8h2.5M12.5 8H15\"/></svg>";

const sleep = ms => new Promise(resolve => {
  setTimeout(resolve, ms);
});

// Load more chunks until the selected row is rendered or the list stops growing
const findRow = async () => {
  let row = nav.select(SELECTED_ROW);
  const scroller = nav.select(SCROLLER);
  if (!scroller) {
    return row;
  }

  const { scrollTop } = scroller;
  let height = -1;
  for (let i = 0; !row && scroller.scrollHeight !== height && i < MAX_LOAD_ROUNDS; i++) {
    height = scroller.scrollHeight;
    scroller.scrollTop = height;
    // eslint-disable-next-line no-await-in-loop
    await sleep(LOAD_WAIT_MS);
    row = nav.select(SELECTED_ROW);
  }

  // Not found: put the list back where the user had it
  if (!row) {
    scroller.scrollTop = scrollTop;
  }

  return row;
};

const flash = (node, className) => {
  clearTimeout(node._kuroLocateTimer);
  node.classList.remove(className);
  // Restart the animation when clicked again while it is still running
  void node.offsetWidth; // eslint-disable-line no-void
  node.classList.add(className);
  node._kuroLocateTimer = setTimeout(() => node.classList.remove(className), FLASH_MS);
};

const locate = async button => {
  const row = await findRow();
  if (!row) {
    // Opened from search or another view: the task is not in this list
    button.title = MISSING_LABEL;
    flash(button, MISS_CLASS);
    setTimeout(() => {
      button.title = LABEL;
    }, FLASH_MS);
    return;
  }

  row.scrollIntoView({ block: "center", behavior: "smooth" });
  flash(row, FLASH_CLASS);
};

const makeButton = () => {
  const node = document.createElement("button");
  node.type = "button";
  node.className = BUTTON_CLASS;
  node.title = LABEL;
  node.setAttribute("aria-label", LABEL);
  node.innerHTML = LOCATE_ICON;
  // Keep the click away from To-Do's own header handlers
  node.addEventListener("mousedown", event => event.stopPropagation());
  node.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    locate(node);
  });
  return node;
};

class LocateTask {
  constructor() {
    this._observer = null;
    this._scheduled = false;
  }

  _place() {
    this._scheduled = false;

    const header = nav.select(DETAIL_HEADER);
    if (header && !header.querySelector(`.${BUTTON_CLASS}`)) {
      const title = header.querySelector(".detailHeader-title");
      header.insertBefore(makeButton(), title?.nextSibling || null);
    }
  }

  mount() {
    if (this._observer) {
      return;
    }

    const schedule = () => {
      if (!this._scheduled) {
        this._scheduled = true;
        requestAnimationFrame(() => this._place());
      }
    };

    this._observer = new MutationObserver(schedule);
    this._observer.observe(document.body, { childList: true, subtree: true });
    schedule();
  }
}

module.exports = new LocateTask();
