(() => {
  const $ = (sel) => document.querySelector(sel);
  const toast = $("#toast");
  const goBtn = $("#go-btn");
  const balls = Array.from(document.querySelectorAll("#view-select .level"));

  let selected = "";

  function isLevel(n) {
    const s = String(n || "");
    return /^[1-9]$/.test(s) || s === "mix";
  }

  function showToast(msg) {
    if (window.Times99) Times99.toast(msg);
    else if (toast) toast.textContent = msg;
  }

  function applySelect(n, persist) {
    if (!isLevel(n)) return;
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
      if (window.Times99) {
        Times99.syncBgm();
        Times99.syncSelectUrl(selected);
      }
    });
  });

  const bootN = new URLSearchParams(location.search).get("n") || "";
  const fromStore = localStorage.getItem("times99.level") || "";
  if (location.search.indexOf("view=select") !== -1 && isLevel(bootN)) applySelect(bootN, false);
  else if (isLevel(fromStore)) applySelect(fromStore, false);
  if (!selected && goBtn) goBtn.classList.add("is-wait");

  $("#map-back").addEventListener("click", () => {
    Times99.goBack("home");
  });
  $("#map-settings").addEventListener("click", () => Times99.openSettings());
  $("#map-parents").addEventListener("click", () => Times99.openParents());

  let leaving = false;
  goBtn.addEventListener("click", () => {
    if (leaving) return;
    goBtn.classList.add("is-down");
    Times99.syncBgm();
    if (!selected) {
      showToast("先點一個號碼球喔！");
      setTimeout(() => goBtn.classList.remove("is-down"), 160);
      return;
    }
    leaving = true;
    setTimeout(() => {
      leaving = false;
      goBtn.classList.remove("is-down");
      Times99.show("play", selected, "push");
    }, 120);
  });

  document.addEventListener("keydown", (e) => {
    if (document.body.dataset.view !== "select") return;
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (document.querySelector(".dialog.is-open")) return;
    if (!isLevel(e.key)) return;
    applySelect(e.key, true);
    Times99.syncSelectUrl(selected);
  });

  window.Times99Select = {
    selected() { return selected; },
    onShow(n) {
      if (isLevel(n)) applySelect(n, false);
    },
  };
})();
