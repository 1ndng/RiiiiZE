# RiiiiZE

模擬手機畫面的網頁遊戲框架（從 sosho 移植功能）：手機密碼鎖、首頁（行事曆小工具）、Instagram、KakaoTalk（含語音通話）、相簿、X、備忘錄。
目前只有功能，所有內容都是佔位用的測試資料，照片全部是 `images/placeholder.jpg`。

- 手機直接開就是滿版；電腦上會顯示成一支手機。
- 測試用密碼：手機、KakaoTalk、IG 帳號、相簿「已隱藏」、鎖住的備忘錄都是 `0000`。
- 通話：KakaoTalk 和「好友 A」的聊天室右上角電話鍵 → 會接通測試對話；打開「好友 B」聊天室 6 秒後會有來電。

## 檔案結構

| 檔案 | 用途 |
| --- | --- |
| `index.html` | 頁面骨架、載入所有程式 |
| `js/data.js` | **所有內容都在這裡**：密碼、首頁、IG 帳號／貼文／限動、電話劇本、Kakao 聊天（每段都有中文註解） |
| `js/app.js` | 主要程式：密碼鎖、首頁、Instagram、換頁、上滑回首頁、進度旗標 |
| `js/apps/photos.js` | 相簿（iPhone「照片」風格：圖庫的年／月／所有照片、相簿列表、看照片、收藏、刪除／最近刪除、上鎖的已隱藏） |
| `js/apps/kakao.js` | KakaoTalk（密碼畫面、聊天列表、聊天室、自動回覆、即時訊息） |
| `js/apps/kakaocall.js` | KakaoTalk 語音通話（打給好友、來電、通話字幕＋選項、通話紀錄） |
| `js/apps/x.js` | X（時間軸、貼文內頁＋回覆串、個人檔案的貼文／回覆／轉推／喜歡分頁、正在跟隨／跟隨者名單、編輯個人資料（名稱、簡介、不公開）、鎖帳、按讚／轉推／回覆／發文） |
| `js/apps/notes.js` | 備忘錄（列表、釘選、編輯、新增／刪除、上鎖的備忘錄） |
| `js/lang.js`、`js/vendor/opencc-t2cn.js` | 繁體／简体切換 |
| `css/style.css` | 手機外框、首頁、密碼鎖、Instagram |
| `css/apps.css` | KakaoTalk（含通話畫面） |
| `css/x.css`、`css/notes.css` | X、備忘錄 |
| `css/photos.css` | 相簿 |
| `images/` | 圖片（App 圖示、預設頭貼、佔位照片） |

首頁：上方是行事曆小工具（日期跟著現實走，行程寫在 `data.js` 的 `home.calendar`），下面是有名稱的 App 圖示（`home.icons`，照順序上到下、左到右排）。

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
| `#/x`、`#/x/t/貼文id`、`#/x/u/帳號`、`#/x/u/帳號/following`、`#/x/edit` | X 時間軸、貼文、個人檔案、跟隨名單、編輯個人資料 |
| `#/notes`、`#/notes/n/id` | 備忘錄列表、單則備忘錄 |
| `#/photos`、`#/photos/albums`、`#/photos/album/相簿id` | 圖庫、相簿列表、某個相簿（`fav` 個人收藏、`videos` 影片、`hidden` 已隱藏、`deleted` 最近刪除） |
| `#/kakao`、`#/kakao/chat/f1`、`#/kakao/chat/me`、`#/kakao/chat/g1` | 聊天列表、聊天室 |
