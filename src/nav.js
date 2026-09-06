"use strict";
const { webFrame } = require("electron");
const { is } = require("./util");
const { store: settings } = require("./settings");

class Nav {
  constructor() {
    this._defaultZoomFactor = 1;
    this._listItem = ".listItem-container";
    this._lists = ".lists";
    this._lowerZoomLimit = 0.5;
    this._myDayList = ".todayToolbar-item";
    this._selectedListClass = "active";
    this._upperZoomLimit = 3;
    this._zoomStep = 0.1;
  }

  get _lastIdx() {
    return this._getLists().length - 1;
  }

  _currentIdx(lists) {
    if (!lists) {
      lists = this._getLists();
    }

    for (let i = 0; i < lists.length; i++) {
      if (lists[i].classList.contains(this._selectedListClass)) {
        return i;
      }
    }

    return 0;
  }

  _getLists() {
    // Both are absent while the sidebar is collapsed (MS To-Do unmounts it).
    const myDayList = this.select(this._myDayList);
    const lists = this.select(this._lists);
    return [
      ...(myDayList ? [myDayList] : []),
      ...(lists ? lists.querySelectorAll(this._listItem) : []),
    ];
  }

  click(x) {
    const element = this.select(x);
    if (element) {
      element.click();
    }

    return Boolean(element);
  }

  // Click an element that MS To-Do renders asynchronously (lazy-loaded detail
  // pane, account menu, ...) once it shows up in the DOM.
  async clickWhenReady(x, timeout) {
    const element = await this.waitFor(x, timeout);
    if (element) {
      element.click();
    }

    return Boolean(element);
  }

  jumpToList(event) {
    const comboKey = is.darwin ? event.metaKey : event.ctrlKey;

    if (!comboKey) {
      return null;
    }

    const n = Number.parseInt(event.key, 10);

    if (n > 0 && n < 10) {
      this.selectList(n - 1);
    }
  }

  nextList() {
    const lists = this._getLists();
    const idx = this._currentIdx(lists);
    this.selectList(idx === this._lastIdx ? 0 : idx + 1, lists);
  }

  previousList() {
    const lists = this._getLists();
    const idx = this._currentIdx(lists);
    return this.selectList(idx === 0 ? this._lastIdx : idx - 1, lists);
  }

  select(x) {
    return document.querySelector(x);
  }

  waitFor(x, timeout = 5000, interval = 100) {
    return new Promise(resolve => {
      const deadline = Date.now() + timeout;
      const check = () => {
        const element = this.select(x);
        if (element || Date.now() >= deadline) {
          return resolve(element || null);
        }

        setTimeout(check, interval);
      };

      check();
    });
  }

  selectList(idx, lists) {
    if (!lists) {
      lists = this._getLists();
    }

    if (idx >= 0 && idx < lists.length) {
      // `li.todayToolbar-item > div.todayToolbar-inner` for My Day,
      // `li.listItem-container > div.listItem#<listId>` for the other lists.
      const target = lists[idx].children[0] || lists[idx];
      target.click();
    }
  }

  zoomIn() {
    const zoomFactor = webFrame.getZoomFactor() + this._zoomStep;

    if (zoomFactor < this._upperZoomLimit) {
      webFrame.setZoomFactor(zoomFactor);
      settings.set("zoomFactor", zoomFactor);
    }
  }

  zoomReset() {
    webFrame.setZoomFactor(this._defaultZoomFactor);
    settings.set("zoomFactor", this._defaultZoomFactor);
  }

  zoomRestore() {
    webFrame.setZoomFactor(settings.get("zoomFactor"));
  }

  zoomOut() {
    const zoomFactor = webFrame.getZoomFactor() - this._zoomStep;

    if (zoomFactor > this._lowerZoomLimit) {
      webFrame.setZoomFactor(zoomFactor);
      settings.set("zoomFactor", zoomFactor);
    }
  }
}

module.exports = new Nav();
