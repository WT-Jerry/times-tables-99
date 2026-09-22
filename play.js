(() => {
  const TOTAL = 10;
  const LIVES = 3;
  const $ = (sel) => document.querySelector(sel);

  const params = new URLSearchParams(location.search);
  const n = params.get("n") || "";
  if (!/^[1-9]$/.test(n)) {
    location.replace("select.html");
    return;
  }
  const level = Number(n);

  const equationEl = $("#equation");
  const choicesEl = $("#choices");
  const livesEl = $("#lives");
  const meterFill = $("#meter-fill");
  const resultEl = $("#result");
  const bodyEl = $("#quiz-body");
  const toast = $("#toast");
  const bgm = $("#bgm");
  const hintBtn = $("#btn-hint");

  const kidName = (localStorage.getItem("times99.name") || "").trim();

  if (bgm) {
    bgm.loop = true;
    bgm.volume = 0.38;
    bgm.autoplay = true;
  }

  function soundOn() {
    return localStorage.getItem("times99.sound") !== "off";
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

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("is-on"), 2200);
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function makeChoices(a, b, answer) {
    const pool = [
      a + b,
      Math.abs(a - b),
      a * Math.max(1, b - 1),
      a * Math.min(9, b + 1),
      Math.max(0, (a - 1) * b),
      (a + 1) * b,
      answer + 1,
      Math.max(0, answer - 1),
      answer + a,
      Math.max(0, answer - a),
      answer + 2,
      Math.max(0, answer - 2),
      a * a,
      b * b,
      a + a,
      b + b
    ].filter((x) => Number.isInteger(x) && x >= 0 && x <= 99 && x !== answer);

    const unique = [];
    shuffle(pool).forEach((x) => {
      if (unique.length < 3 && unique.indexOf(x) === -1) unique.push(x);
    });
    let fill = 0;
    while (unique.length < 3) {
      if (fill !== answer && unique.indexOf(fill) === -1) unique.push(fill);
      fill += 1;
    }
    return shuffle([answer].concat(unique));
  }

  function buildQuestions(times) {
    const ks = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    let extra = 1 + Math.floor(Math.random() * 9);
    if (extra === ks[ks.length - 1]) extra = extra === 9 ? 1 : extra + 1;
    return ks.concat(extra).map((k) => {
      const answer = times * k;
      return {
        a: times,
        b: k,
        answer,
        choices: makeChoices(times, k, answer)
      };
    });
  }

  let questions = buildQuestions(level);
  let index = 0;
  let correct = 0;
  let wrong = 0;
  let hearts = LIVES;
  let locked = false;
  let hintUsed = false;

  function goMap() {
    location.href = "select.html";
  }

  function setHearts() {
    livesEl.querySelectorAll("[data-heart]").forEach((el, i) => {
      el.classList.toggle("is-gone", i >= hearts);
    });
    livesEl.setAttribute("aria-label", `剩下 ${hearts} 顆愛心`);
  }

  function setMeter() {
    const pct = (index / TOTAL) * 100;
    meterFill.style.height = `${pct}%`;
  }

  function hintText(item) {
    if (item.b === 1) return "乘 1 還是原來的數喔！";
    if (item.a === 1) return "1 乘任何數，答案都還是那個數。";
    return `${item.a} 個 ${item.b} 加起來是多少？`;
  }

  function renderQuestion() {
    locked = false;
    hintUsed = false;
    const item = questions[index];
    equationEl.textContent = `${item.a} × ${item.b} = ?`;
    choicesEl.innerHTML = "";
    item.choices.forEach((value) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-choice";
      btn.textContent = String(value);
      btn.dataset.value = String(value);
      btn.addEventListener("click", () => onPick(btn, value));
      choicesEl.appendChild(btn);
    });
    setHearts();
    setMeter();
  }

  function finish() {
    locked = true;
    setMeter();
    bodyEl.hidden = true;
    resultEl.hidden = false;
    document.getElementById("quiz").classList.add("is-done");

    const who = kidName ? `${kidName}，` : "";
    $("#score-line").textContent = `答對 ${correct} 題`;
    $("#score-sub").textContent = `答錯 ${wrong} 題`;

    if (correct === TOTAL) {
      $("#score-line").textContent = `${who}全部答對 ${correct} 題`;
      $("#score-sub").textContent = "太厲害了！";
    } else if (kidName) {
      $("#score-line").textContent = `${who}答對 ${correct} 題`;
    }
  }

  function onPick(btn, value) {
    if (locked) return;
    locked = true;
    syncBgm();
    const item = questions[index];
    const ok = value === item.answer;
    choicesEl.querySelectorAll(".quiz-choice").forEach((el) => {
      el.disabled = true;
      const v = Number(el.dataset.value);
      if (v === item.answer) el.classList.add("is-ok");
    });
    if (ok) {
      btn.classList.add("is-ok");
      correct += 1;
    } else {
      btn.classList.add("is-bad");
      wrong += 1;
      hearts = Math.max(0, hearts - 1);
      setHearts();
    }
    index += 1;
    setMeter();
    window.setTimeout(() => {
      if (index >= TOTAL) finish();
      else renderQuestion();
    }, 650);
  }

  $("#btn-back").addEventListener("click", goMap);
  $("#back-map").addEventListener("click", goMap);
  $("#retry").addEventListener("click", () => {
    questions = buildQuestions(level);
    index = 0;
    correct = 0;
    wrong = 0;
    hearts = LIVES;
    locked = false;
    resultEl.hidden = true;
    bodyEl.hidden = false;
    document.getElementById("quiz").classList.remove("is-done");
    renderQuestion();
    syncBgm();
  });

  hintBtn.addEventListener("click", () => {
    syncBgm();
    if (resultEl.hidden === false) return;
    if (hintUsed) {
      showToast("這一題提示過了，選一個答案吧！");
      return;
    }
    hintUsed = true;
    showToast(hintText(questions[index]));
  });

  document.addEventListener("pointerdown", () => {
    if (soundOn()) syncBgm();
  }, { passive: true });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") goMap();
  });

  renderQuestion();
  syncBgm();
})();
