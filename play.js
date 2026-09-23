(() => {
  const TOTAL = 10;
  const LIVES = 3;
  const $ = (sel) => document.querySelector(sel);
  const view = $("#view-play");

  const equationEl = $("#equation");
  const choicesEl = $("#choices");
  const livesEl = $("#lives");
  const meterFill = $("#meter-fill");
  const resultEl = $("#result");
  const bodyEl = $("#quiz-body");
  const hintBtn = $("#btn-hint");
  const rememberEl = $("#remember");
  const rememberEq = $("#remember-eq");
  const rememberDog = $("#remember-dog");
  const resultCelebrate = $("#result-celebrate");
  const resultDog = $("#result-dog");
  const DOGS = ["assets/review-yellow.png", "assets/review-white.png"];
  const WIN_DOGS = ["assets/win-yellow.png", "assets/win-white.png"];

  let n = "";
  let isMix = false;
  let level = 0;
  let activeN = "";
  let hasRun = false;
  let runId = 0;

  let questions = [];
  let index = 0;
  let correct = 0;
  let wrong = 0;
  let hearts = LIVES;
  let locked = false;
  let hintUsed = false;

  function syncBgm() {
    if (window.Times99) Times99.syncBgm();
  }

  function showToast(msg) {
    if (window.Times99) Times99.toast(msg);
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

  function buildMixQuestions() {
    const pairs = [];
    for (let a = 1; a <= 9; a += 1) {
      for (let b = 1; b <= 9; b += 1) {
        pairs.push([a, b]);
      }
    }
    return shuffle(pairs).slice(0, TOTAL).map((pair) => {
      const a = pair[0];
      const b = pair[1];
      const answer = a * b;
      return {
        a,
        b,
        answer,
        choices: makeChoices(a, b, answer)
      };
    });
  }

  function makeQuiz() {
    return isMix ? buildMixQuestions() : buildQuestions(level);
  }

  function goMap() {
    Times99.goBack("select", isMix ? "mix" : String(level || ""));
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

  function hideRemember() {
    rememberEl.hidden = true;
  }

  function showRemember(item, dogPick) {
    const pick = dogPick === 0 || dogPick === 1
      ? dogPick
      : Math.floor(Math.random() * DOGS.length);
    rememberEq.innerHTML = `${item.a} × ${item.b} = <em>${item.answer}</em>`;
    rememberDog.src = DOGS[pick];
    rememberEl.hidden = false;
  }

  function afterAnswer() {
    if (index >= TOTAL) finish();
    else renderQuestion();
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

  function hideWinDog() {
    if (resultCelebrate) resultCelebrate.hidden = true;
    resultEl.classList.remove("is-perfect");
  }

  function placeWinDog() {
    if (!resultCelebrate || resultCelebrate.hidden) return;
    const title = resultEl.querySelector("h2");
    if (!title) return;
    const box = resultEl.getBoundingClientRect();
    const titleBox = title.getBoundingClientRect();
    const gap = titleBox.top - box.top - 12;
    resultCelebrate.style.height = `${Math.max(64, gap)}px`;
  }

  function showWinDog() {
    const pick = Math.floor(Math.random() * WIN_DOGS.length);
    resultDog.src = WIN_DOGS[pick];
    resultCelebrate.hidden = false;
    resultEl.classList.add("is-perfect");
    requestAnimationFrame(placeWinDog);
  }

  function finish() {
    locked = true;
    setMeter();
    bodyEl.hidden = true;
    resultEl.hidden = false;
    hideRemember();
    hideWinDog();
    view.classList.add("is-done");

    const kidName = (localStorage.getItem("times99.name") || "").trim();
    const who = kidName ? `${kidName}，` : "";
    $("#score-line").textContent = `答對 ${correct} 題`;
    $("#score-sub").textContent = `答錯 ${wrong} 題`;

    if (correct === TOTAL) {
      $("#score-line").textContent = `${who}全部答對 ${correct} 題`;
      $("#score-sub").textContent = "太厲害了！";
      showWinDog();
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
      index += 1;
      setMeter();
      const my = runId;
      window.setTimeout(() => {
        if (my !== runId) return;
        afterAnswer();
      }, 650);
    } else {
      btn.classList.add("is-bad");
      wrong += 1;
      hearts = Math.max(0, hearts - 1);
      setHearts();
      index += 1;
      setMeter();
      showRemember(item);
    }
  }

  function begin(nextN) {
    runId += 1;
    n = String(nextN);
    isMix = n === "mix";
    level = isMix ? 0 : Number(n);
    questions = makeQuiz();
    index = 0;
    correct = 0;
    wrong = 0;
    hearts = LIVES;
    locked = false;
    hintUsed = false;
    resultEl.hidden = true;
    bodyEl.hidden = false;
    hideRemember();
    hideWinDog();
    view.classList.remove("is-done");
    renderQuestion();
    activeN = n;
    hasRun = true;
  }

  $("#btn-back").addEventListener("click", goMap);
  $("#back-map").addEventListener("click", goMap);
  $("#retry").addEventListener("click", () => {
    begin(isMix ? "mix" : String(level));
    syncBgm();
  });
  $("#remember-next").addEventListener("click", () => {
    syncBgm();
    hideRemember();
    afterAnswer();
  });
  hintBtn.addEventListener("click", () => {
    syncBgm();
    if (resultEl.hidden === false) return;
    if (rememberEl.hidden === false) return;
    if (!questions[index]) return;
    if (hintUsed) {
      showToast("這一題提示過了，選一個答案吧！");
      return;
    }
    hintUsed = true;
    showToast(hintText(questions[index]));
  });

  window.addEventListener("resize", () => {
    if (resultEl.classList.contains("is-perfect")) placeWinDog();
  });

  window.Times99Quiz = {
    onShow(nextN, opts) {
      const fresh = !opts || opts.fresh !== false;
      if (!fresh && hasRun && activeN === String(nextN)) return;
      begin(nextN);
    },
  };
})();
