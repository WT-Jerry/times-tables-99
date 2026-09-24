(() => {
  const $ = (sel) => document.querySelector(sel);

  const views = {
    home: $("#view-home"),
    select: $("#view-select"),
    play: $("#view-play"),
  };
  const bgm = $("#bgm");
  const theme = document.querySelector('meta[name="theme-color"]');
  const settingsDlg = $("#dlg-settings");
  const parentsDlg = $("#dlg-parents");
  const toast = $("#toast");
  const soundBtn = $("#sound-switch");
  const nameInput = $("#kid-name");

  const THEME = { home: "#3c7faa", select: "#5a8eb0", play: "#6bb8e0" };
  const TITLE = {
    home: "趣味九九乘法表",
    select: "關卡選擇 · 趣味九九乘法表",
    play: "測驗 · 趣味九九乘法表",
  };

  let current = { view: "home", n: "" };

  function isLevel(n) {
    const s = String(n || "");
    return /^[1-9]$/.test(s) || s === "mix";
  }

  function soundOn() {
    return soundBtn.getAttribute("aria-pressed") === "true";
  }

  let bgmHeld = false;

  function syncBgm() {
    if (!bgm || bgmHeld) return;
    if (!soundOn()) {
      if (!bgm.paused) bgm.pause();
      return;
    }
    if (!bgm.paused) return;
    const p = bgm.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }

  function holdBgm(hold) {
    bgmHeld = !!hold;
    if (!bgm) return;
    if (bgmHeld) {
      if (!bgm.paused) bgm.pause();
      return;
    }
    syncBgm();
  }

  function openDlg(el) {
    el.classList.add("is-open");
    const close = el.querySelector("[data-close]");
    if (close) close.focus();
  }

  function closeDlg(el) {
    el.classList.remove("is-open");
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("is-on"), 2200);
  }

  function parseRoute() {
    const q = new URLSearchParams(location.search);
    const view = q.get("view");
    const n = q.get("n") || "";
    if (view === "play" && isLevel(n)) return { view: "play", n };
    if (view === "select") return { view: "select", n: isLevel(n) ? n : "" };
    if (view === "play") return { view: "select", n: "" };
    return { view: "home", n: "" };
  }

  function buildUrl(view, n) {
    const path = location.pathname;
    if (view === "select") {
      return isLevel(n) ? `${path}?view=select&n=${encodeURIComponent(n)}` : `${path}?view=select`;
    }
    if (view === "play" && isLevel(n)) {
      return `${path}?view=play&n=${encodeURIComponent(n)}`;
    }
    return path;
  }

  function paintUrl(view, n, mode) {
    const prev = history.state || {};
    const state = {
      view,
      n: n || "",
      canBack: mode === "push" ? true : !!prev.canBack,
    };
    const url = buildUrl(view, n);
    if (mode === "push") history.pushState(state, "", url);
    else history.replaceState(state, "", url);
  }

  function applyChrome(view) {
    const changed = document.body.dataset.view !== view;
    Object.keys(views).forEach((name) => {
      const el = views[name];
      if (!el) return;
      const on = name === view;
      el.hidden = !on;
      if (on) el.removeAttribute("aria-hidden");
      else el.setAttribute("aria-hidden", "true");
    });
    document.body.dataset.view = view;
    document.title = TITLE[view] || TITLE.home;
    if (theme) theme.setAttribute("content", THEME[view] || THEME.home);
    delete document.documentElement.dataset.boot;
    if (changed) {
      closeDlg(settingsDlg);
      closeDlg(parentsDlg);
    }
  }

  function show(view, n, historyMode) {
    let next = view;
    let level = isLevel(n) ? String(n) : "";
    if (next === "play" && !level) next = "select";
    if (next !== "home" && next !== "select" && next !== "play") next = "home";

    applyChrome(next);
    if (next !== "play" && window.Times99Quiz && Times99Quiz.abortClip) {
      Times99Quiz.abortClip();
    }
    if (next === "select" && window.Times99Select) {
      Times99Select.onShow(level);
      if (!level) level = Times99Select.selected();
    }
    if (next === "play" && window.Times99Quiz) {
      Times99Quiz.onShow(level, { fresh: historyMode !== "pop" });
    }
    if (historyMode === "push" || historyMode === "replace") paintUrl(next, level, historyMode);
    current = { view: next, n: next === "home" ? "" : level };
    return current;
  }

  function goBack(fallbackView, fallbackN) {
    if (history.state && history.state.canBack) {
      history.back();
      return;
    }
    show(fallbackView, fallbackN || "", "replace");
  }

  function syncSelectUrl(n) {
    if (current.view !== "select") return;
    const level = isLevel(n) ? String(n) : "";
    current.n = level;
    const prev = history.state || {};
    history.replaceState(
      { view: "select", n: level, canBack: !!prev.canBack },
      "",
      buildUrl("select", level)
    );
  }

  function boot() {
    const savedName = localStorage.getItem("times99.name") || "";
    const savedSound = localStorage.getItem("times99.sound") !== "off";
    if (nameInput) nameInput.value = savedName;
    if (soundBtn) soundBtn.setAttribute("aria-pressed", savedSound ? "true" : "false");
    if (bgm) {
      bgm.loop = true;
      bgm.volume = 0.38;
      bgm.autoplay = true;
    }

    const route = parseRoute();
    show(route.view, route.n, "replace");
    syncBgm();
  }

  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      const on = !soundOn();
      soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
      localStorage.setItem("times99.sound", on ? "on" : "off");
      syncBgm();
    });
  }

  if (nameInput) {
    nameInput.addEventListener("change", () => {
      localStorage.setItem("times99.name", nameInput.value.trim());
    });
  }

  const saveBtn = $("#btn-save-settings");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      if (nameInput) localStorage.setItem("times99.name", nameInput.value.trim());
      closeDlg(settingsDlg);
    });
  }

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeDlg(btn.closest(".dialog")));
  });
  document.querySelectorAll(".dialog").forEach((dlg) => {
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) closeDlg(dlg);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (settingsDlg.classList.contains("is-open") || parentsDlg.classList.contains("is-open")) {
      closeDlg(settingsDlg);
      closeDlg(parentsDlg);
      return;
    }
    if (document.body.dataset.view === "play") goBack("select", current.n);
  });

  document.addEventListener("pointerdown", () => {
    if (soundOn()) syncBgm();
  }, { passive: true });

  window.addEventListener("popstate", () => {
    const route = parseRoute();
    applyChrome(route.view);
    if (route.view === "select" && window.Times99Select) Times99Select.onShow(route.n);
    if (route.view === "play" && window.Times99Quiz) {
      Times99Quiz.onShow(route.n, { fresh: false });
    }
    current = route;
  });

  window.Times99 = {
    bgm,
    show,
    goBack,
    syncBgm,
    holdBgm,
    syncSelectUrl,
    openSettings() { openDlg(settingsDlg); },
    openParents() { openDlg(parentsDlg); },
    toast: showToast,
    soundOn,
    current() { return { view: current.view, n: current.n }; },
    boot,
  };
})();
