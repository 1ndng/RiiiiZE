# RiiiiZE

模擬手機畫面的網頁遊戲框架（從 sosho 移植功能）：手機密碼鎖、首頁（行事曆小工具）、Instagram、KakaoTalk（含語音通話）、相簿、X、備忘錄。
目前只有功能，所有內容都是佔位用的測試資料，照片全部是 `images/placeholder.jpg`。

- 手機直接開就是滿版；電腦上會顯示成一支手機。
- 打開網頁先是鎖定畫面（滑動以解鎖、時間、KakaoTalk 未讀通知），往上滑才輸入密碼；點通知解鎖後直接打開那個聊天室。
- 測試用密碼：手機、KakaoTalk、IG 帳號、相簿「已隱藏」、鎖住的備忘錄都是 `0000`。
- 通話：KakaoTalk 和「好友 A」的聊天室右上角電話鍵 → 會接通測試對話；打開「好友 B」聊天室 6 秒後會有來電。

## 檔案結構

| 檔案 | 用途 |
| --- | --- |
| `index.html` | 頁面骨架、載入所有程式 |
| `js/game.js` | 遊戲時間（第幾天、早上／放學／晚上、睡覺換日）和存檔（手動好幾格＋每天早上自動存檔） |
| `js/data.js` | **所有內容都在這裡**：密碼、首頁、IG 帳號／貼文／限動、電話劇本、Kakao 聊天（每段都有中文註解） |
| `js/app.js` | 主要程式：密碼鎖、首頁、Instagram、換頁、上滑回首頁、進度旗標 |
| `js/apps/photos.js` | 相簿（iPhone「照片」風格：圖庫的年／月／所有照片、相簿列表、看照片、收藏、刪除／最近刪除、上鎖的已隱藏） |
| `js/apps/kakao.js` | KakaoTalk（密碼畫面、聊天列表、聊天室、自動回覆、即時訊息） |
| `js/apps/kakaocall.js` | KakaoTalk 語音通話（打給好友、來電、通話字幕＋選項、通話紀錄） |
| `js/apps/x.js` | X（時間軸、貼文內頁＋回覆串、個人檔案的貼文／回覆／轉推／喜歡分頁、正在跟隨／跟隨者名單、編輯個人資料（名稱、簡介、不公開）、鎖帳、按讚／轉推／回覆／發文） |
| `js/apps/settings.js` | 設定（遊戲進度、存檔與讀檔、語言、重新開始） |
| `js/apps/notes.js` | 備忘錄（列表、釘選、編輯、新增／刪除、上鎖的備忘錄） |
| `js/lang.js`、`js/vendor/opencc-t2cn.js` | 繁體／简体切換 |
| `css/style.css` | 手機外框、首頁、密碼鎖、Instagram |
| `css/apps.css` | KakaoTalk（含通話畫面） |
| `css/x.css`、`css/notes.css`、`css/settings.css` | X、備忘錄、設定 |
| `css/photos.css` | 相簿 |
| `images/` | 圖片（App 圖示、預設頭貼、佔位照片） |

首頁：上方是行事曆小工具（日期跟著現實走，行程寫在 `data.js` 的 `home.calendar`），下面是有名稱的 App 圖示（`home.icons`，照順序上到下、左到右排）。

## 其他

- **一天的流程**：早上 → 放學 → 晚上（自由使用手機），晚上主畫面按「睡覺」進入隔天，並自動存檔。日期從 `data.js` 的 `game.startDate` 開始算
- **隱藏數值**：好感度（玩家對每位成員）、成員之間的關係（兩兩一組）、覺醒度。成員寫在 `data.js` 的 `cast`；選項、訊息回覆、電話段落寫 `effects` 改數值，劇情、訊息、電話、行事曆行程寫 `if` 加條件（格式寫在 `cast` 上面的註解）。開發時可以在 設定 → 數值（開發用）查看、調整、跳天數；正式公開前把 `game.debug` 改成 `false`
- **KakaoTalk 選項式回覆**：好友或群組寫 `choices`，輸入框上方出現選項；點了文字放進輸入框（不能修改，刪除＝整句刪掉，點別的選項＝換掉），按送出才傳。每組只能選一次，可以寫 `if`、`effects`、`flag`、`reply`（格式寫在 `data.js` 好友 C 的註解）
- **存檔**：設定 → 存檔與讀檔（手動存檔格數 = `game.saveSlots`）。存檔放在 `riiiizeSaves`，「重新開始」不會清掉
- **重新開始**、**繁體／简体**：設定 App
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
| `#/settings`、`#/settings/saves` | 設定、存檔與讀檔 |
| `#/photos`、`#/photos/albums`、`#/photos/album/相簿id` | 圖庫、相簿列表、某個相簿（`fav` 個人收藏、`videos` 影片、`hidden` 已隱藏、`deleted` 最近刪除） |
| `#/kakao`、`#/kakao/chat/f1`、`#/kakao/chat/me`、`#/kakao/chat/g1` | 聊天列表、聊天室 |
