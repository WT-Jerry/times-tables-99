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
  const clipEl = $("#win-clip");
  const clipVideos = [$("#win-clip-yellow"), $("#win-clip-white")].filter(Boolean);
  const CLIP_SRCS = ["assets/win-clip-yellow.mp4?v=1", "assets/win-clip-white.mp4?v=1"];
  let clipToken = 0;
  function preloadSet(list) {
    return list.map((src) => {
      const img = new Image();
      img.decoding = "async";
      const ready = new Promise((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
      img.src = src;
      return ready;
    });
  }
  const reviewReady = preloadSet(DOGS);
  const winReady = preloadSet(WIN_DOGS);

  function preloadClips() {
    clipVideos.forEach((v, i) => {
      const src = CLIP_SRCS[i];
      if (!src) return;
      v.playsInline = true;
      v.setAttribute("playsinline", "");
      v.setAttribute("webkit-playsinline", "");
      v.preload = "auto";
      if (v.getAttribute("src") !== src) v.src = src;
    });
  }

  let clipsWarm = false;

  function warmClips() {
    if (clipsWarm) return;
    clipsWarm = true;
    clipVideos.forEach((v) => {
      if (!v.getAttribute("src")) return;
      const wasMuted = v.muted;
      v.muted = true;
      const p = v.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          if (clipEl && clipEl.classList.contains("is-live")) return;
          v.pause();
          try { v.currentTime = 0; } catch (e) { /* 尚未可 seek */ }
          v.muted = wasMuted;
        }).catch(() => {
          v.muted = wasMuted;
        });
      }
    });
  }

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

  let rememberId = 0;

  function hideRemember() {
    rememberId += 1;
    rememberEl.hidden = true;
  }

  function whenImageReady(img) {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => resolve();
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
  }

  async function showRemember(item, dogPick) {
    const my = rememberId;
    const pick = dogPick === 0 || dogPick === 1
      ? dogPick
      : Math.floor(Math.random() * DOGS.length);
    const src = DOGS[pick];
    rememberEq.innerHTML = `${item.a} × ${item.b} = <em>${item.answer}</em>`;
    if (rememberDog.getAttribute("src") !== src) rememberDog.src = src;
    await Promise.race([
      Promise.all([reviewReady[pick], whenImageReady(rememberDog)]),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
    if (my !== rememberId) return;
    if (rememberDog.decode) {
      try { await rememberDog.decode(); } catch (e) { /* 解碼失敗仍顯示算式 */ }
    }
    if (my !== rememberId) return;
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

  let revealId = 0;

  function hideWinDog() {
    revealId += 1;
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

  function primeWinDog() {
    const src = WIN_DOGS[Math.floor(Math.random() * WIN_DOGS.length)];
    if (resultDog.getAttribute("src") !== src) resultDog.src = src;
    if (resultDog.decode) resultDog.decode().catch(() => {});
  }

  function primeReviewDog() {
    const src = DOGS[Math.floor(Math.random() * DOGS.length)];
    if (rememberDog.getAttribute("src") !== src) rememberDog.src = src;
    if (rememberDog.decode) rememberDog.decode().catch(() => {});
  }

  function dogReady() {
    if (resultDog.complete && resultDog.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => resolve();
      resultDog.addEventListener("load", done, { once: true });
      resultDog.addEventListener("error", done, { once: true });
    });
  }

  function showPerfectResult() {
    resultCelebrate.hidden = false;
    resultEl.classList.add("is-perfect", "is-arriving");
    bodyEl.hidden = true;
    resultEl.hidden = false;
    view.classList.add("is-done");
    view.classList.remove("is-clip");
    placeWinDog();
  }

  function prepareWinDog() {
    if (!resultDog.getAttribute("src")) resultDog.src = WIN_DOGS[0];
    const src = resultDog.getAttribute("src");
    const idx = Math.max(0, WIN_DOGS.indexOf(src));
    return Promise.race([
      Promise.all([winReady[idx] || Promise.resolve(), dogReady()]).then(async () => {
        if (resultDog.decode) {
          try { await resultDog.decode(); } catch (e) { /* 解碼失敗仍顯示文字 */ }
        }
      }),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  }

  function stopClipVideos() {
    clipVideos.forEach((v) => {
      v.onended = null;
      v.onerror = null;
      v.pause();
      try { v.currentTime = 0; } catch (e) { /* 尚未可 seek */ }
    });
  }

  function releaseClipBgm() {
    if (window.Times99 && Times99.holdBgm) Times99.holdBgm(false);
  }

  function abortClip() {
    clipToken += 1;
    if (clipEl) {
      clipEl.classList.remove("is-live", "is-leaving");
      clipEl.setAttribute("aria-hidden", "true");
    }
    view.classList.remove("is-clip");
    stopClipVideos();
    releaseClipBgm();
  }

  function playPerfectClip() {
    const myRun = runId;
    const myClip = ++clipToken;
    const pick = Math.floor(Math.random() * clipVideos.length);
    const video = clipVideos[pick];
    const dogPromise = prepareWinDog();
    if (!video || !clipEl) {
      revealPerfect();
      return;
    }

    clipVideos.forEach((v, i) => {
      v.hidden = i !== pick;
    });
    const wantSound = window.Times99 && Times99.soundOn ? Times99.soundOn() : true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.muted = true;
    clipEl.classList.add("is-live");
    clipEl.classList.remove("is-leaving");
    clipEl.setAttribute("aria-hidden", "false");
    view.classList.add("is-clip");
    bodyEl.hidden = true;
    void clipEl.offsetWidth;
    if (video.readyState < 2) {
      try { video.load(); } catch (e) { /* 已在載 */ }
    }
    try { if (video.currentTime > 0.05) video.currentTime = 0; } catch (e) { /* 尚未可 seek */ }

    let settled = false;
    const done = new Promise((resolve) => {
      const finishClip = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      let playTimer = 0;
      const armEnd = () => {
        if (playTimer || settled || video.currentTime < 0.12) return;
        const dur = Number.isFinite(video.duration) && video.duration > 0.5 ? video.duration : 4.05;
        const left = Math.max(0.35, dur - video.currentTime);
        playTimer = window.setTimeout(finishClip, left * 1000 + 350);
      };
      const nudge = () => {
        if (settled || video.currentTime > 0.12) return;
        video.muted = true;
        const again = video.play();
        if (again && typeof again.catch === "function") again.catch(() => {});
      };
      video.onended = finishClip;
      video.onerror = finishClip;
      video.ontimeupdate = () => {
        if (video.currentTime > 0.12) {
          if (wantSound && video.muted) video.muted = false;
          armEnd();
        }
      };
      const started = video.play();
      if (window.Times99 && Times99.holdBgm) Times99.holdBgm(true);
      if (started && typeof started.catch === "function") {
        started.catch(nudge);
      }
      window.setTimeout(nudge, 280);
      window.setTimeout(() => {
        if (!settled && video.currentTime < 0.12) nudge();
      }, 700);
      window.setTimeout(() => {
        if (!settled && video.currentTime < 0.12) finishClip();
      }, 1400);
    });

    done.then(async () => {
      if (myRun !== runId || myClip !== clipToken) return;
      await Promise.race([
        dogPromise,
        new Promise((resolve) => setTimeout(resolve, 400)),
      ]);
      if (myRun !== runId || myClip !== clipToken) return;
      showPerfectResult();
      clipEl.classList.add("is-leaving");
      window.setTimeout(() => {
        if (myRun !== runId || myClip !== clipToken) return;
        clipEl.classList.remove("is-live", "is-leaving");
        clipEl.setAttribute("aria-hidden", "true");
        video.pause();
        releaseClipBgm();
      }, 320);
    });
  }

  async function revealPerfect() {
    const my = revealId;
    if (!resultDog.getAttribute("src")) resultDog.src = WIN_DOGS[0];
    const src = resultDog.getAttribute("src");
    const idx = Math.max(0, WIN_DOGS.indexOf(src));
    await Promise.race([
      Promise.all([winReady[idx], dogReady()]),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
    if (my !== revealId) return;
    if (resultDog.decode) {
      try { await resultDog.decode(); } catch (e) { /* 解碼失敗仍顯示文字 */ }
    }
    if (my !== revealId) return;
    resultCelebrate.hidden = false;
    resultEl.classList.add("is-perfect");
    bodyEl.hidden = true;
    resultEl.hidden = false;
    view.classList.add("is-done");
    placeWinDog();
  }

  function finish() {
    locked = true;
    setMeter();
    hideRemember();

    const kidName = (localStorage.getItem("times99.name") || "").trim();
    const who = kidName ? `${kidName}，` : "";
    $("#score-line").textContent = `答對 ${correct} 題`;
    $("#score-sub").textContent = `答錯 ${wrong} 題`;

    if (correct === TOTAL) {
      $("#score-line").textContent = `${who}全部答對 ${correct} 題`;
      $("#score-sub").textContent = "太厲害了！";
      playPerfectClip();
      return;
    }

    hideWinDog();
    bodyEl.hidden = true;
    resultEl.hidden = false;
    view.classList.add("is-done");
    if (kidName) {
      $("#score-line").textContent = `${who}答對 ${correct} 題`;
    }
  }

  function onPick(btn, value) {
    if (locked) return;
    locked = true;
    const item = questions[index];
    const ok = value === item.answer;
    const willWin = ok && correct + 1 === TOTAL;
    if (!willWin) {
      syncBgm();
      warmClips();
    }
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
      if (correct === TOTAL) {
        finish();
        return;
      }
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
    abortClip();
    preloadClips();
    view.classList.remove("is-done");
    primeWinDog();
    primeReviewDog();
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
    abortClip,
  };
})();
