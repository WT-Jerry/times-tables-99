# 趣味九九乘法表 — 對話交接

給新 session 讀。不要重做已完成的事，除非 Jerry 又改需求。
公開文案禁止三麗鷗角色名（大耳狗、布丁狗、喜拿）→ 寫「可愛狗狗」。

## 專案

- 本機：`~/Project_99_Times_Tables`
- Git：`git@github.com:WT-Jerry/times-tables-99.git`（SSH，WT-Jerry）
- 線上：https://wt-jerry.github.io/times-tables-99/
- 推完等約 30 秒再 curl。第一次常是舊部署。確認新字串後才跟 Jerry 說已上線。
- 手機請硬重新整理。iPhone Safari 可能擋未靜音自動播放，點一下畫面會接上。
- 不要改 hermes-agent origin、不要塞 PAT、不要 `curl | python`（安全掃描會擋）。先 `curl -o` 再讀檔。

## Jerry 的做法

- 執行優先，少討論。
- 選關／主畫面壁紙：**套附件，不要 SVG 重畫**。裁掉 Safari 底列再當畫面。
- 他說「先不要推」才只截圖。這條線他要上 Pages 試，改完就推。
- 每次版面改完要 390×844 截圖，Slack 用 `MEDIA:/絕對路徑`。短機再看 320×568。
- 技能：`phone-readable-html` 的 `references/game-splash.md`。

## 流程

同一份文件切畫面，背景音樂不中斷。`<audio id="bgm">` 在 `index.html` 最外層，換畫面不准拆掉、不准重設 `src`。

1. `#view-home` 主畫面：森林壁紙 + 兩隻可愛狗狗 +「玩」。點畫面任何地方播 BGM。
2. 「玩」呼叫 `Times99.show("select")`，不走 `location.href`。
3. `#view-select` 選關：套 `assets/select-ref.jpg?v=2`（含紅球問號）。一次只能選一顆。
4. 「開始挑戰」→ `Times99.show("play", n)`。網址是 `index.html?view=play&n=1`…`9` 或 `n=mix`。沒選就提示「先點一個號碼球喔！」。
5. 返回鍵用 `history.back()`。`select.html`、`play.html` 只給舊連結，進站就 `location.replace` 回殼。

## 音樂

- 只有一顆 `<audio id="bgm">`，`assets/bgm.mp3?v=3`，音量約 0.38，循環。
- 切主頁／選關／測驗時同一個元素繼續播，`currentTime` 不歸零。
- 設定「音效」關掉就停，再開從原秒數接。
- iPhone 第一次若被擋，點一下畫面會接上；接上之後換畫面不會再斷。
- 快取：`styles.css?v=3`、`game.css?v=8`、`shell.js?v=3`、`app.js?v=4`、`select.js?v=3`、`play.js?v=10`、`table.js?v=1`。改檔要再加版本。

## 選關

- 1～9 選中：黃燈蓋住原圖號碼，數字仍看得到。
- 問號關 `data-n="mix"`：未選是圖上的紅球問號；選中變成粉紫金色特殊問號球，不是黃燈。
- 熱區大約（相對 `.shot`）：9 在 44.2% / 70.8%，問號在 62.2% / 70.9%。
- 高一點的手機底下多一截草地是原圖比例，不要再畫一層。

## 測驗（play.html / play.js）

- 每次固定 10 題、四選一。對了綠、錯了粉紅。
- 關卡 n：`n × k`，k 為 1～9 亂數（9 題全出再多 1 題）。
- 問號關：從 1×1～9×9 全部組合抽 10 題。
- 左愛心答錯少一顆，但 **10 題都會出完**，愛心歸零不提早結束。
- 答錯：跳出「記住這個算式」，答案綠色。隨機 `assets/review-yellow.png` 或 `assets/review-white.png`。圖先載好，解碼完才跟算式一起出現。按右邊 `>` 才下一題。
- **狗狗必須整隻留在藍卡白框裡面**，禁止負邊距壓到白框（Jerry 已打回）。
- 答對：綠一下後自動下一題。
- 結束：答對幾題、答錯幾題；「再考一次」或「回關卡地圖」。
- 十題全對：先隨機播 `assets/win-clip-yellow.mp4` 或 `assets/win-clip-white.mp4`（約 4 秒）。播完淡進結果頁，標題上方再隨機放狗狗。進測驗才開始載影片。音效開時暫停背景音樂、不歸零，播完接回。播不起來不要卡住。
- 主頁標題下有「99乘法表」按鈕，進背誦頁，不走 `location.href`。
- 背誦頁 `?view=table&n=1`…`9`。一頁一個數，算式都展開。中間穿插 `assets/table-dog-1.png`…`9.png`，每頁一張、動作都不一樣。公開文案仍寫可愛狗狗，不要寫角色名。
- 「蓋答案」把綠色答案蓋成黃塊，點那一格才打開。「上一頁／下一頁」或左右滑換頁。`table.html` 只給舊連結，進站就轉回殼。
- 背誦頁要用 `height: 100svh` 鎖在一屏，算式自己捲。只寫 `min-height` 會把短螢幕的底部按鈕裁掉。
- 右上槌子是提示，要大、要像錘子（粉紅槌頭、木柄）。提示不直接給答案。
- 快取：見「音樂」。改檔要再加版本，否則 Pages 還是舊的。

## 不要做

- 不要重畫樹山、羊皮紙、選關地圖。
- 不要在 README / Pages 文案寫角色名。
- 不要把測驗截圖當背景（算式是烤死的）。
- 不要把 `#shot-review` 留在正式 `play.js`。
- 不要用 `location.href` 在主頁、選關、測驗之間跳。那會把音樂元素清掉。
- 截圖 png 不用 commit。

## 最近 commit

- `526fba7` feat: 主頁加99乘法表背誦頁
- `d5db1d2` feat: 十題全對先播慶祝動畫，再跳結果頁
- `b102797` fix: 答錯算式的狗狗跟文字一起出現
- `419fb1d` fix: 全對結果的狗狗先載好，跟文字一起出現
- `20a2f8b` feat: 十題全對時在結果上方隨機放狗狗
- `860c561` feat: 同一頁切畫面，背景音樂不中斷
- `c84a199` fix: 記住算式的狗狗不要壓到白框
- `c264b10` feat: 答錯跳出算式，錘子加大
- `23187c6` feat: 選關加上問號混合關

## 新 session 進來先做

讀完這份檔，用台灣繁體中文回 Jerry：你已載入交接、目前線上是什麼、等他下一個改動。不要自己改碼、不要再推。
