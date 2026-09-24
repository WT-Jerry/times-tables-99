(() => {
  const $ = (sel) => document.querySelector(sel);
  const tabsEl = $("#table-tabs");
  const eqsEl = $("#table-eqs");
  const kicker = $("#table-kicker");
  const coverBtn = $("#table-cover");
  const view = $("#view-table");
  const DOGS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `assets/table-dog-${n}.png`);

  let n = 1;
  let covered = false;

  function dogSrc(num) {
    return DOGS[num - 1];
  }

  function setCovered(on) {
    covered = on;
    view.classList.toggle("is-covered", on);
    coverBtn.setAttribute("aria-pressed", on ? "true" : "false");
    coverBtn.textContent = on ? "看答案" : "蓋答案";
  }

  function render(num) {
    n = num;
    kicker.textContent = `${num} 的乘法`;
    tabsEl.querySelectorAll("[data-n]").forEach((btn) => {
      const on = Number(btn.dataset.n) === num;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
      if (on) btn.scrollIntoView({ inline: "center", block: "nearest" });
    });
    $("#table-prev").disabled = num <= 1;
    $("#table-next").disabled = num >= 9;
    eqsEl.innerHTML = "";
    for (let k = 1; k <= 9; k += 1) {
      if (k === 5) {
        const slot = document.createElement("li");
        slot.className = "table-dog-slot";
        const img = document.createElement("img");
        img.className = "table-dog";
        img.alt = "";
        img.decoding = "async";
        img.src = dogSrc(num);
        slot.appendChild(img);
        eqsEl.appendChild(slot);
      }
      const li = document.createElement("li");
      li.className = "table-row";
      const q = document.createElement("span");
      q.className = "table-q";
      q.textContent = `${num} × ${k}`;
      const eq = document.createElement("span");
      eq.className = "table-eq";
      eq.textContent = "=";
      const ans = document.createElement("button");
      ans.type = "button";
      ans.className = "table-ans";
      ans.textContent = String(num * k);
      ans.addEventListener("click", () => {
        if (!covered) return;
        ans.classList.add("is-open");
      });
      li.appendChild(q);
      li.appendChild(eq);
      li.appendChild(ans);
      eqsEl.appendChild(li);
    }
    view.querySelector(".table-body").scrollTop = 0;
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
    btn.textContent = String(i);
    btn.addEventListener("click", () => go(i));
    tabsEl.appendChild(btn);
  }

  $("#table-back").addEventListener("click", () => {
    Times99.syncBgm();
    Times99.goBack("home");
  });
  $("#table-prev").addEventListener("click", () => go(n - 1));
  $("#table-next").addEventListener("click", () => go(n + 1));
  coverBtn.addEventListener("click", () => {
    Times99.syncBgm();
    setCovered(!covered);
    if (!covered) {
      eqsEl.querySelectorAll(".table-ans").forEach((el) => el.classList.remove("is-open"));
    }
  });

  let touchX = 0;
  view.addEventListener("touchstart", (e) => {
    touchX = e.changedTouches[0].clientX;
  }, { passive: true });
  view.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) < 48) return;
    go(dx < 0 ? n + 1 : n - 1);
  }, { passive: true });

  window.Times99Table = {
    onShow(nextN) {
      const num = /^[1-9]$/.test(String(nextN || "")) ? Number(nextN) : 1;
      render(num);
    },
  };
})();
