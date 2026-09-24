(() => {
  const $ = (sel) => document.querySelector(sel);
  const tabsEl = $("#table-tabs");
  const eqsEl = $("#table-eqs");
  const kicker = $("#table-kicker");
  const heading = $("#table-heading");
  const view = $("#view-table");

  let n = 1;

  function render(num) {
    n = num;
    const title = `${num} 的乘法表`;
    heading.textContent = title;
    kicker.textContent = title;
    tabsEl.querySelectorAll("[data-n]").forEach((btn) => {
      const on = Number(btn.dataset.n) === num;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    eqsEl.innerHTML = "";
    for (let k = 1; k <= 9; k += 1) {
      const li = document.createElement("li");
      li.className = "table-pill";
      li.textContent = `${num} × ${k} = ${num * k}`;
      eqsEl.appendChild(li);
    }
    const body = view.querySelector(".table-body");
    if (body) body.scrollTop = 0;
  }

  function go(num) {
    const next = Math.min(9, Math.max(1, num));
    render(next);
    if (window.Times99 && Times99.syncTableUrl) Times99.syncTableUrl(String(next));
    if (window.Times99) Times99.syncBgm();
  }

  for (let i = 1; i <= 9; i += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "table-tab";
    btn.dataset.n = String(i);
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-label", `${i} 的乘法表`);
    btn.textContent = String(i);
    btn.addEventListener("click", () => go(i));
    tabsEl.appendChild(btn);
  }

  $("#table-back").addEventListener("click", () => {
    Times99.syncBgm();
    Times99.goBack("home");
  });
  $("#table-map").addEventListener("click", () => {
    Times99.syncBgm();
    Times99.show("select", "", "push");
  });

  window.Times99Table = {
    onShow(nextN) {
      const num = /^[1-9]$/.test(String(nextN || "")) ? Number(nextN) : 1;
      render(num);
    },
  };
})();
