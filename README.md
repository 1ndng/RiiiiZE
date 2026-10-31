# RiiiiZE

模擬手機畫面的網頁遊戲框架（從 sosho 移植功能）：手機密碼鎖、首頁、Instagram、電話、KakaoTalk。
目前只有功能，所有內容都是佔位用的測試資料，照片全部是 `images/placeholder.jpg`。

- 手機直接開就是滿版；電腦上會顯示成一支手機。
- 測試用密碼：手機、KakaoTalk、IG 帳號都是 `0000`；電話撥 `0000` 會接通測試對話。

## 檔案結構

| 檔案 | 用途 |
| --- | --- |
| `index.html` | 頁面骨架、載入所有程式 |
| `js/data.js` | **所有內容都在這裡**：密碼、首頁、IG 帳號／貼文／限動、電話劇本、Kakao 聊天（每段都有中文註解） |
| `js/app.js` | 主要程式：密碼鎖、首頁、Instagram、換頁、上滑回首頁、進度旗標 |
| `js/apps/phone.js` | 電話（撥號鍵盤、通話字幕＋選項、來電） |
| `js/apps/kakao.js` | KakaoTalk（密碼畫面、聊天列表、聊天室、自動回覆、即時訊息） |
| `js/lang.js`、`js/vendor/opencc-t2cn.js` | 繁體／简体切換 |
| `css/style.css` | 手機外框、首頁、密碼鎖、Instagram |
| `css/apps.css` | 電話、KakaoTalk |
| `images/` | 圖片（App 圖示、預設頭貼、佔位照片） |

## 其他

- **重新開始**、**繁體／简体**：IG → 右上角三條線（設定和動態）→ 最下面
- **上滑回首頁**：在 App 裡從畫面最下方往上滑（電腦可用滑鼠拖底部橫條）
- 進度存在瀏覽器 localStorage（key 都是 `riiiize-` 開頭，不會和 sosho 互相影響）

## 網址（hash）

| 網址 | 畫面 |
| --- | --- |
| `#/home` | 首頁 |
| `#/ig`、`#/ig/u/帳號` | 自己的 IG、別人的 IG |
| `#/ig/settings`、`#/ig/archive`、`#/ig/saved` | 設定、典藏、已儲存 |
| `#/phone` | 電話 |
| `#/kakao`、`#/kakao/chat/f1`、`#/kakao/chat/me`、`#/kakao/chat/g1` | 聊天列表、聊天室 |
