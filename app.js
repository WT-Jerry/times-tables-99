(() => {
  const $ = (sel) => document.querySelector(sel);

  const settingsDlg = $("#dlg-settings");
  const parentsDlg = $("#dlg-parents");
  const toast = $("#toast");
  const soundBtn = $("#sound-switch");
  const nameInput = $("#kid-name");
  const playBtn = $("#play-btn");

  const savedName = localStorage.getItem("times99.name") || "";
  const savedSound = localStorage.getItem("times99.sound") !== "off";
  nameInput.value = savedName;
  soundBtn.setAttribute("aria-pressed", savedSound ? "true" : "false");

  function openDlg(el) {
    el.classList.add("is-open");
    const close = el.querySelector("[data-close]");
    if (close) close.focus();
  }

  function closeDlg(el) {
    el.classList.remove("is-open");
  }

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
    const on = soundBtn.getAttribute("aria-pressed") !== "true";
    soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
    localStorage.setItem("times99.sound", on ? "on" : "off");
  });

  nameInput.addEventListener("change", () => {
    localStorage.setItem("times99.name", nameInput.value.trim());
  });

  $("#btn-save-settings").addEventListener("click", () => {
    localStorage.setItem("times99.name", nameInput.value.trim());
    closeDlg(settingsDlg);
  });

  $("#btn-more").addEventListener("click", () => {
    showToast("其他遊戲之後再放進來喔");
  });

  playBtn.addEventListener("click", () => {
    playBtn.classList.add("is-down");
    const name = (localStorage.getItem("times99.name") || "").trim();
    showToast(name ? `${name}，關卡地圖下一回合就來！` : "關卡地圖下一回合就來！");
    setTimeout(() => playBtn.classList.remove("is-down"), 180);
  });

  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-on"), 2200);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeDlg(settingsDlg);
    closeDlg(parentsDlg);
  });
})();
