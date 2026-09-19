(() => {
  const $ = (sel) => document.querySelector(sel);

  const settingsDlg = $("#dlg-settings");
  const parentsDlg = $("#dlg-parents");
  const toast = $("#toast");
  const soundBtn = $("#sound-switch");
  const nameInput = $("#kid-name");
  const bgm = $("#bgm");
  const goBtn = $("#go-btn");
  const balls = Array.from(document.querySelectorAll(".level"));

  const savedName = localStorage.getItem("times99.name") || "";
  const savedSound = localStorage.getItem("times99.sound") !== "off";
  if (nameInput) nameInput.value = savedName;
  if (soundBtn) soundBtn.setAttribute("aria-pressed", savedSound ? "true" : "false");
  if (bgm) {
    bgm.loop = true;
    bgm.volume = 0.38;
  }

  let selected = "";

  function soundOn() {
    return soundBtn && soundBtn.getAttribute("aria-pressed") === "true";
  }

  function syncBgm() {
    if (!bgm) return;
    if (soundOn()) {
      const p = bgm.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      bgm.pause();
    }
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

  function applySelect(n, persist) {
    if (!/^[1-9]$/.test(String(n))) return;
    selected = String(n);
    balls.forEach((btn) => {
      const on = btn.dataset.n === selected;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    if (goBtn) goBtn.classList.remove("is-wait");
    if (persist !== false) localStorage.setItem("times99.level", selected);
  }

  balls.forEach((btn) => {
    btn.addEventListener("click", () => {
      applySelect(btn.dataset.n, true);
      syncBgm();
    });
  });

  const fromHash = (location.hash || "").replace("#", "");
  const fromStore = localStorage.getItem("times99.level") || "";
  if (/^[1-9]$/.test(fromHash)) applySelect(fromHash, true);
  else if (/^[1-9]$/.test(fromStore)) applySelect(fromStore, false);

  if (!selected && goBtn) goBtn.classList.add("is-wait");

  $("#btn-back").addEventListener("click", () => {
    window.location.href = "index.html";
  });

  $("#btn-settings").addEventListener("click", () => openDlg(settingsDlg));
  $("#btn-parents").addEventListener("click", () => openDlg(parentsDlg));

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeDlg(btn.closest(".dialog")));
  });
  document.querySelectorAll(".dialog").forEach((dlg) => {
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) closeDlg(dlg);
    });
  });

  soundBtn.addEventListener("click", () => {
    const on = !soundOn();
    soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
    localStorage.setItem("times99.sound", on ? "on" : "off");
    syncBgm();
  });

  nameInput.addEventListener("change", () => {
    localStorage.setItem("times99.name", nameInput.value.trim());
  });
  $("#btn-save-settings").addEventListener("click", () => {
    localStorage.setItem("times99.name", nameInput.value.trim());
    closeDlg(settingsDlg);
  });

  goBtn.addEventListener("click", () => {
    goBtn.classList.add("is-down");
    syncBgm();
    if (!selected) {
      showToast("先點一個號碼球喔！");
      setTimeout(() => goBtn.classList.remove("is-down"), 160);
      return;
    }
    setTimeout(() => {
      window.location.href = `play.html?n=${encodeURIComponent(selected)}`;
    }, 120);
  });

  document.addEventListener("pointerdown", () => {
    if (soundOn()) syncBgm();
  }, { passive: true });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDlg(settingsDlg);
      closeDlg(parentsDlg);
      return;
    }
    if (!/^[1-9]$/.test(e.key)) return;
    applySelect(e.key, true);
  });
})();
