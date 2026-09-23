(() => {
  const playBtn = document.querySelector("#play-btn");
  let leaving = false;

  document.querySelector("#home-settings").addEventListener("click", () => {
    Times99.openSettings();
  });
  document.querySelector("#home-parents").addEventListener("click", () => {
    Times99.openParents();
  });

  playBtn.addEventListener("click", () => {
    if (leaving) return;
    leaving = true;
    playBtn.classList.add("is-down");
    Times99.syncBgm();
    setTimeout(() => {
      leaving = false;
      playBtn.classList.remove("is-down");
      Times99.show("select", "", "push");
    }, 140);
  });
})();
