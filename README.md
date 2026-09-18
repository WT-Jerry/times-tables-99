# 趣味九九乘法表

給小學二年級練習九九乘法的手機網頁遊戲。這一包先交 **登入／開始主畫面**。

## 開啟

用手機瀏覽器開：

```
/home/hermes/Project_99_Times_Tables/index.html
```

或在專案資料夾：

```
python3 -m http.server 8765 --bind 127.0.0.1
```

再連 `http://手機IP:8765/`。

## 這一版有什麼

- 森林卡通主畫面（對齊參考遊戲的齒輪、父母須知、大顆「玩」、其他遊戲貼紙）
- 可愛狗狗角色
- 設定：音效開關、小朋友稱呼（只存在這台裝置）
- 父母須知

「玩」下一步會接關卡地圖。

## 檔案

- `index.html` 主畫面
- `styles.css` / `tokens.css` / `app.js`
- `assets/` 可愛狗狗角色圖
- `assets/home-390.png` 手機直式截圖
