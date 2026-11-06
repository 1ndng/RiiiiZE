/* =========================================================
 * 網頁上所有「顯示文字」與「圖片路徑」都集中在這個檔案。
 * 目前全部是測試用的佔位內容：照片都先用 images/placeholder.jpg，
 * 之後把文字、圖片路徑換成正式內容即可。
 * - 文字中的換行：在字串裡寫 \n。
 * - 影片：路徑寫 .mp4（限時動態、Kakao 都能放）；同名的 xxx_poster.jpg 會當作封面。
 * ========================================================= */
var PH = "images/placeholder.jpg";   // 佔位照片（全部先用同一張）
// 玩家和六位成員都互相追蹤（IG）／互相跟隨（X）：others("帳號") = 除了自己以外的所有人
var IG_ALL = ["briiii1ze._", "shotaroo0", "seokkkk", "sungchan913", "bin032", "252525252_", "antonnie"];
var X_ALL  = ["briiii1ze._", "shotaroo0", "seokkkk", "sungchan913", "bin032", "252525252_", "antonnie"];
function others(list, me) { return list.filter(function (x) { return x !== me; }); }

window.SITE_DATA = {

  /* ---------- 共用 ---------- */
  notUpdatedText: "尚未更新",   // 點到未開放功能時跳出的文字

  /* ---------- 角色（六位成員） ----------
   * id 用在數值、條件、效果裡（例如 aff: { m1: 2 }、pair: { "m1-m2": 1 }），之後不要改；name 可以隨時換
   * birthday = 生日（"11-25"）：那天會停下來播 scenes.birthday_成員id（行事曆也會顯示）
   * activities = 平日放學在哪些日程會遇到他（月曆安排加好感時，照這個決定誰在場）
   *   club 社團活動、volunteer 志工活動、sports 體育館、council 學生會、games 網咖、karaoke KTV
   * 隱藏數值（玩家看不到）：
   *   aff   好感度：玩家對每位成員
   *   pair  成員之間的關係：每兩位一組（"m1-m2"，順序不拘）
   *   awake 覺醒度：每位成員對「自己其實已經長大」的察覺程度
   *   visits 每個日程去過幾次
   * 效果 effects（選項、訊息回覆、電話段落）：{ aff: { m1: 2 }, pair: { "m1-m2": 1 }, awake: { m3: 1 }, flag: "旗標" }
   * 條件 if（劇情、訊息、電話、行事曆行程、特殊劇情…）：
   *   { date: "12-24" 或 ["10-01", "10-31"], weekday: 0（星期日）～6, month: 9 或 [9, 10],
   *     day: ">=5"（學年第幾天）, phase: "night", flag: "旗標", notFlag: "旗標",
   *     aff: { m1: ">=10" }, pair: { "m1-m2": ">=5" }, awake: { m3: ">=3" }, visits: { council: ">=3" },
   *     lover: "m1", notLover: "m1", couple: "m1-m2", notCouple: "m1-m2", allAwake: true / false,
   *     any: [條件, 條件]（其中一個成立）, not: 條件（不成立才算） }
   *   比較可寫 ">=10"、">3"、"<=2"、"<5"、"=4"，只寫數字 = 至少這個數字
   */
  // avatar = 大頭照（沒寫就用預設頭貼 images/default_avatar.png）
  // no = 編號（1 將太郎、2 恩奭、3 成燦、4 元彬、6 炤熙、7 燦榮；隨機劇情的名字 rand_club_14 用這個）
  // short = 劇情對話框裡顯示的名字（只有名、沒有姓）；emoji = 「這週的放學後」好感、關係用的符號
  cast: [
    { id: "m1", no: 1, name: "大﨑将太郎", short: "將太郎", emoji: "🧋", birthday: "11-25", activities: ["club", "council", "games"], avatar: "images/cast/m1.jpg" },
    { id: "m2", no: 2, name: "宋恩奭", short: "恩奭", emoji: "🪨",     birthday: "03-19", activities: ["volunteer", "council", "games"], avatar: "images/cast/m2.jpg" },
    { id: "m3", no: 3, name: "鄭成燦", short: "成燦", emoji: "🦌",     birthday: "09-13", activities: ["council", "sports", "karaoke"], avatar: "images/cast/m3.jpg" },
    { id: "m4", no: 4, name: "朴元彬", short: "元彬", emoji: "🎸",     birthday: "03-02", activities: ["club", "council", "sports"], avatar: "images/cast/m4.jpg" },
    { id: "m5", no: 6, name: "李炤熙", short: "炤熙", emoji: "💂",     birthday: "11-21", activities: ["club", "council", "karaoke", "games"], avatar: "images/cast/m5.jpg" },
    { id: "m6", no: 7, name: "李燦榮", short: "燦榮", emoji: "🦕",     birthday: "03-21", activities: ["volunteer", "council", "sports", "karaoke"], avatar: "images/cast/m6.jpg" }
  ],

  /* ---------- 劇情（對話框） ----------
   * scenes：每段劇情是一串步驟，從上往下播（每個步驟都可以加 if：條件不成立就跳過）
   *   { text: "旁白" }                      沒寫 who = 旁白（沒有名字欄）
   *   { who: "m1", text: "台詞" }            who = 成員 id（顯示 cast 的名字）、"me" = 玩家、或直接寫名字（例如 "老師"）
   *   { bg: "images/xxx.jpg" }              換背景
   *   { choices: [ { text, effects, flag, goto, if } ] }   選項；goto = 跳到哪個 label，不寫就接著往下
   *   { label: "名稱" } / { goto: "名稱" }   標記／跳過去（goto 加 if = 條件成立才跳）
   *   { effects: { … } } / { flag: "旗標" }  套用效果、記錄旗標（畫面上不顯示）
   *   { end: true }                         劇情到這裡結束
   *   { ending: "結局id" }                   劇情到這裡結束，進入結局
   *   { hold: 2000 }                        停在手機畫面幾毫秒：對話框、按鈕、變暗都先消失，這段時間點什麼都沒反應
   *   文字裡寫 \n = 同一個對話框裡換行
   *   { intro: "m1" }                       播成員的出場介紹動畫（影片和介紹台詞寫在下面的 introVideos）
   *   文字裡寫 {name} = 玩家的名字（第一次開始遊戲時輸入，接著輸入生日）
   *   播完會記錄旗標 scene_劇情id
   * story：主線劇情。date = 哪一天（"09-01"）、phase = "morning" 早上／"afterschool" 放學
   *   activity = 主線強制日程（那天照這個日程加好感，月曆上不能放方塊）
   *   可以加 if；同一段看過就不會再播（repeat: true 可以重播）
   * 下面「（待寫）」的都是空白劇情，直接把台詞寫進去就好
   */
  // 標題畫面（js/title.js）：name = 遊戲名稱、subtitle = 副標、bg = 背景（不寫 = 主畫面桌布）
  title: {
    name: "RiiiiZE", subtitle: "拉完子學院",
    bg: "images/ui/title.jpg",   // 標題圖（9:16；圖上已經有遊戲名稱，所以畫面上不再打字）
    // 按鈕放在圖上的粉紅框裡：框在圖上的位置（百分比，從左上角算）；換圖時改這裡
    box: { left: 5.7, top: 28.9, width: 88.5, height: 22.7 }
  },
  // 成員出場介紹動畫（劇情裡寫 { intro: "m1" } 的地方播；js/story.js）
  //   影片 9:16；播到 captionAt 毫秒時介紹台詞出現在影片的粉紅框裡，影片播完台詞和影片一起消失
  //   box = 粉紅框在影片上的位置（百分比，從左上角算）；caption 用 \n 換行
  //   播放中點畫面沒反應（快轉模式會直接跳過）；音效關掉時影片靜音
  introVideo: { captionAt: 3000, box: { left: 30, top: 65, width: 54.4, height: 13.8 } },
  introVideos: {
    m1: { video: "videos/intro_m1.mp4", caption: "姓名：大﨑將太郎\n生日：11月25日\n常出沒的地點：社團活動、學生會、網咖" },
    m2: { video: "videos/intro_m2.mp4", caption: "姓名：宋恩奭\n生日：3月19日\n常出沒的地點：志工活動、學生會、網咖" },
    m3: { video: "videos/intro_m3.mp4", caption: "姓名：鄭成燦\n生日：9月13日\n常出沒的地點：學生會、體育館、KTV" },
    m4: { video: "videos/intro_m4.mp4", caption: "姓名：朴元彬\n生日：3月2日\n常出沒的地點：社團活動、學生會、體育館" },
    m5: { video: "videos/intro_m5.mp4", caption: "姓名：李炤熙\n生日：11月21日\n常出沒的地點：\n社團活動、學生會、KTV、網咖" },
    m6: { video: "videos/intro_m6.mp4", caption: "姓名：李燦榮\n生日：3月21日\n常出沒的地點：\n志工活動、學生會、體育館、KTV" }
  },
  storyGap: 2000,                // 兩段劇情之間至少隔幾毫秒（上一段結束到下一段開始）
  storySpeed: 22,                // 文字逐字出現的速度（每個字幾毫秒，越小越快）
  storyBg: "images/bg/school.jpg",   // 劇情的預設背景（手機以外的畫面都用這張）；劇情裡寫 { bg: "…" } 可以換，{ bg: "phone" } = 直接看到手機畫面
  // 第一次遊玩的開場（js/intro.js）：打開這些 App 就結束自由探索、開始 9/1
  //   seeMs = 探索時看到成員的照片多久（毫秒）就想起來、結束探索（KakaoTalk 一打開、IG／X 成員主頁、相簿裡寫了 cast 的照片）
  //   dayTime = 開場結束、進入 9/1 時手機上的時間
  //   endWait = 看到成員的照片、觸發探索結束後，到開場最後一段劇情開始前的空白（毫秒；這段時間點什麼都沒反應）
  intro: { seeMs: 1000, dayTime: "7:58", endWait: 2000 },
  // 劇情都搬到 js/story/ 了：每個月一個檔案（2025-09.js…2026-08.js），日程（schedule.js）、星期日（weekend.js）、覺醒反應（awake.js）、結局（ending.js）
  scenes: {




    /* ---- 六人的三階段覺醒線索：找到線索後播的反應（空白樣板，待寫） ----
     *   awake_線索：玩家在手機裡看到寫了 clue: "m3_1" 的東西 1 秒 → 覺醒度 +1 → 播 awake_m3_1（背景是變暗的手機畫面）
     *   1 = 異常察覺、2 = 記憶浮現、3 = 認知與接受；三個線索都找到（覺醒度 3）= 這位成員覺醒
     *   線索要放在手機裡，例如（data.js 對應的 App）：
     *     IG：posts 裡 { images: [...], caption: "…", time: "10月3日", from: "10-03", clue: "m3_1" }
     *     X：tweets 裡 { id: "t1", by: "sungchan913", text: "…", from: "10-03", clue: "m3_1" }
     *     相簿：photos 裡 { image: "…", date: "2025年10月3日", clue: "m3_1" }
     *     備忘錄：notes 裡 { id: "n1", text: "…", clue: "m3_1" }
     *     KakaoTalk：訊息、即時訊息（live）、每日聊天的步驟加 clue: "m3_1"
     *   不寫這段劇情也可以：找到線索照樣 +1，只是沒有反應
     */
    /* ---- 日程劇情（空白樣板，待寫） ----
     *   act_日程_次數：第幾次去的固定劇情（那天停下來播）
     *   rand_日程_編號：隨機劇情（遇到那個人／那兩個人時 30% 觸發，可重複）；配對 14 = 將太郎＋元彬
     */












    // 後日談（endings 的 epilogues）也寫在這裡，例如 ep_xxx: [ … ]
  },
  // 主線排程也在 js/story/ 每個月的檔案裡
  story: [
  ],

  /* ---------- 覺醒線索：找到之後要做的事 ----------
   * key = 線索 id（App 內容寫 clue: "m1_1" 的那個）；1 將太郎 m1、2 恩奭 m2、3 成燦 m3、4 元彬 m4、6 炤熙 m5、7 燦榮 m6
   *   see = 看到幾毫秒才算（不寫 = 1000；0 = 一看到就算）
   *   chat = 強制聊天（格式同 kakao.dayChats：room、steps；玩家要傳的話寫成只有一個選項的 choices = 強制傳送）
   *   comment = 強制 IG 留言 { text: 玩家的留言, reply: { user: 成員帳號, text: 成員回覆 } }
   *   onReply = 玩家在這個聊天室主動回任何話才觸發（after = 要先有的旗標）
   * 做完 → 那位成員覺醒度 +1、記錄旗標 clue_線索 → 播 scenes.awake_線索（沒寫就不播）
   * 第二、第三個線索（1～6 月）是 Claude 草稿，寫在 m6_1 下面
   * 第一個線索（10～12 月）：
   *   m1_1 10/1 置頂備忘錄（備忘錄 n_council）      m2_1 11/1 IG 簡介 ☃️（seokkkk）
   *   m3_1 12/1 行事曆 12/21「球賽」                 m4_1 11/12 IG 新貼文（bin032）
   *   m5_1 10/1 最近刪除的照片                       m6_1 12/7 星期日 燦榮突然傳訊息、玩家回話
   */
  clues: {
    // 1 將太郎（10/1）：置頂備忘錄「學生會：交接」→ 傳給將太郎
    m1_1: { see: 0, chat: { room: "f1", steps: [
      { choices: [ { text: "將太郎，我在備忘錄裡看到這個，是不是你要的交接？\n\n「學生會：交接\n・總務帳本 → 元彬\n・器材清單 → 恩奭\n・活動企劃書 → 成燦\n・海報檔案 → 燦榮\n・會議紀錄 → 炤熙\n・學生會 IG → 我\n・校慶企劃書 10/15 前交」" } ] },
      { text: "原來我們討論過這個嗎......？", wait: 1200 },
      { text: "總之幫大忙了🥺" },
      { text: "正愁打不出來呢ㅎㅎ" }
    ] } },
    // 2 恩奭（11/1）：IG 簡介多了 ☃️ → 傳訊息（依聖誕週 12/22～12/28 前／當週／之後不同）
    m2_1: { see: 0, chat: { room: "f2", steps: [
      { choices: [
        { text: "看來你很想過聖誕節呢kkk這麼快就在IG簡介堆雪人了嗎！", if: { day: "<113" } },
        { text: "好應景啊kkk我也要跟你一樣在IG簡介堆雪人！", if: { day: [113, 119] } },
        { text: "聖誕節都過了你IG簡介上的雪人怎麼還掛著kkk好堅強呀", if: { day: ">119" } }
      ] },
      { text: "我沒改過簡介啊……怎麼回事", wait: 1200 },
      { text: "我跟雪人一樣既堅強又柔軟~" },
      { choices: [ { text: "？" } ] }
    ] } },
    // 3 成燦（12/1）：行事曆 12/21 多了「🦌 球賽 16:00」→ 問他觀賽前要準備什麼
    m3_1: { chat: { room: "f3", steps: [
      { choices: [ { text: "12/21 的球賽，去看之前要準備什麼嗎？" } ] },
      { text: "你怎麼知道的！", wait: 1000 },
      { text: "今天教練才跟我們說" },
      { text: "我也才剛剛知道" },
      { text: "{name}人有到就很好了！", typing: 4500 }
    ] } },
    // 4 元彬（11/12）：IG 新貼文 → 強制留言 → 他回 → 玩家頭痛 → 玩家再回 → 🙄
    m4_1: { see: 0, comment: { steps: [
      { me: "老天下輩子投胎我也想長這樣" },
      { user: "bin032", text: "怎麼感覺你講過好多次……" },
      { scene: "clue_m4_1_ache" },
      { me: "可能吧因為這是真實的我的心願。" },
      { user: "bin032", text: "🙄", wait: 1500 }
    ] } },
    // 6 炤熙（10/1）：最近刪除的照片 → 傳給炤熙「好像忘記傳給你了」
    m5_1: { see: 0, chat: { room: "f5", steps: [
      { choices: [ { text: "好像忘記傳給你了", image: "images/photos/sohee_deleted.jpg" } ] },
      { text: "{name}", wait: 1400 },
      { text: "這是什麼？" },
      { text: "雖然不記得 但這個視角蠻帥的" },
      { choices: [ { text: "ㅇㅋ~" } ] }
    ] } },
    // 7 燦榮（12/7 星期日晚上）：突然傳來「你有看過〈Another Life〉的歌詞嗎？」；玩家主動回話才觸發（不回就沒有反應、不加覺醒度）
    m6_1: { see: 0, onReply: "f6", after: "anton_1207", chat: { room: "f6", steps: [
      { text: "我什麼時候傳的？", wait: 1500 },
      { text: "好像有印象，又好像沒有......" },
      { text: "總之，我很喜歡這首歌呢......" }
    ] } },
    /* ---- 第二個線索（1～3 月）、第三個線索（4～6 月）：Claude 草稿，之後再改 ---- */
    // 1 將太郎②（1/12）：相簿「已隱藏」多了一張白色房間的照片 → 傳給將太郎
    m1_2: { chat: { room: "f1", steps: [
      { choices: [ { text: "將太郎，我在已隱藏的相簿裡找到這張……你知道這是哪裡嗎？", image: "images/placeholder.jpg" } ] },
      { text: "……", wait: 1500 },
      { text: "這是我夢到的那個房間。" },
      { text: "白色的牆、機器、鏡子……" },
      { text: "我好像，在這裡待過很久很久。" }
    ] } },
    // 1 將太郎③（4/12）：X 上一則他不記得發過的貼文 → 問他
    m1_3: { chat: { room: "f1", steps: [
      { choices: [ { text: "你今天在 X 發的那則……是什麼意思？" } ] },
      { text: "我不記得我發過。", wait: 1200 },
      { text: "可是……那是我想說的話。" }
    ] } },
    // 2 恩奭②（2 月）：行事曆 2/23 多了「值班 07:00–19:00」→ 問他
    m2_2: { chat: { room: "f2", steps: [
      { choices: [ { text: "我行事曆上 2/23 有一個「值班 07:00–19:00」，是你的嗎？" } ] },
      { text: "……值班。", wait: 1500 },
      { text: "我好像，每天都穿著同一件衣服，站在同一個地方。" },
      { text: "看著有人受傷，卻什麼都做不了。" }
    ] } },
    // 2 恩奭③（5 月起）：KakaoTalk 關鍵字——跟恩奭聊天時提到「雪人」，他的回覆就是線索（沒有強制動作）
    m2_3: { see: 0 },
    // 3 成燦②（1/19）：X 上一則他沒發過的地鐵貼文 → 問他
    m3_2: { chat: { room: "f3", steps: [
      { choices: [ { text: "你今天發的地鐵那則……你不是都走路上學嗎？" } ] },
      { text: "地鐵？", wait: 1000 },
      { text: "我沒發過啊！" },
      { text: "……可是那個畫面，我好像每天都看到。", typing: 3500 }
    ] } },
    // 3 成燦③（6 月）：備忘錄多了一張「每週晚餐」（寫著 2032 年）→ 傳給成燦
    m3_3: { see: 0, chat: { room: "f3", steps: [
      { choices: [ { text: "成燦，我的備忘錄裡有這個……上面寫 2032 年。\n\n「每週晚餐\n・星期三 湯飯（燦榮）\n・星期三 湯飯（燦榮）\n・星期三 湯飯（燦榮）」" } ] },
      { text: "2032……", wait: 1500 },
      { text: "我想起來了。" },
      { text: "就算每天都一樣，每個星期跟燦榮吃一頓晚餐，就算數了。" }
    ] } },
    // 4 元彬②（2/22 星期日晚上）：他傳了一則又收回，再傳「……沒事」→ 問他
    m4_2: { chat: { room: "f4", steps: [
      { choices: [ { text: "你剛剛收回了什麼？" } ] },
      { text: "……我也不知道。", wait: 1500 },
      { text: "手指自己打的。" },
      { text: "好像是要跟誰說「為什麼每次都是我」。" }
    ] } },
    // 4 元彬③（6/5）：X「說得出來。」→ 問他
    m4_3: { chat: { room: "f4", steps: [
      { choices: [ { text: "「說得出來」是指你跟學長說不的事嗎？" } ] },
      { text: "……不只。", wait: 1200 },
      { text: "以前的我，在一個很大的地方，一直說不出來。" },
      { text: "現在說得出來了。" }
    ] } },
    // 6 炤熙②（1 月）：上鎖的備忘錄「提案 v12（最終）」→ 傳給炤熙
    m5_2: { see: 0, chat: { room: "f5", steps: [
      { choices: [ { text: "炤熙，我上鎖的備忘錄裡有這個……是你寫的嗎？\n\n「提案 v12（最終）\n做了三個月。\n發表的時候，上面寫的是組長的名字。\n……反正每次都這樣。」" } ] },
      { text: "……前輩。", wait: 1500 },
      { text: "這是我的辦公室。" },
      { text: "我想起來了。那些在背後說的話。" }
    ] } },
    // 6 炤熙③（5/28）：IG 新貼文「只給想給的人看。」→ 強制留言
    m5_3: { see: 0, comment: { steps: [
      { me: "我看到了。" },
      { user: "252525252_", text: "@briiii1ze._ 前輩是第一個。" }
    ] } },
    // 7 燦榮②（3/8）：X「4th place. again.」→ 問他
    m6_2: { chat: { room: "f6", steps: [
      { choices: [ { text: "你說的第四名是什麼？你最近有比賽嗎？" } ] },
      { text: "……沒有啊。", wait: 1200 },
      { text: "可是那個游泳池，我好像真的站過。" },
      { text: "第四名，差零點幾秒。" }
    ] } },
    // 7 燦榮③（6 月）：行事曆 6/27 多了「🦕 live house 20:00」→ 問他
    m6_3: { chat: { room: "f6", steps: [
      { choices: [ { text: "6/27 的 live house 是你要表演嗎？" } ] },
      { text: "……我沒有要表演啊。", wait: 1200 },
      { text: "可是，如果有一天我真的站上去，" },
      { text: "就算只有你一個人來，我也會唱完。", typing: 3500 }
    ] } }
  },


  /* ---------- 每月安排與日程 ----------
   * 9/7 之後（planFrom 那天起）每個月開始時跳出月曆：把日程方塊拖到星期一～六，一天一個；沒放 = 回家
   *   星期日、過去的日子、主線強制日程的日子不能放
   * 確認後自動往後跳、照安排加好感，停在有事的日子：主線、特殊劇情、節日、生日、送禮日（每月 14 日）、每個星期日
   *   手機只有星期日能用（鎖定畫面 → 自由使用手機 → 睡覺）；星期日先播 weekend.intro，再選今天要見誰
   *   其他有事的日子不解鎖手機：在黑底日期畫面上直接播劇情，播完自動往後跳
   * 好感度（每個日程每次的總量一樣，平分給在場的人；在場 = cast 的 activities 有這個日程）：
   *   每人好感 = affTotal ÷ 在場人數；每一對關係 = pairTotal ÷ 在場的對數
   *   每次去不會遇到全部的人：從會出現在那裡的成員裡隨機遇到 1 位～全部（閒晃 = 從全部成員裡隨機 1～wanderMeet 位）
   *   總量固定、平分給遇到的人：例如學生會遇到 3 位 → 各 +2；只遇到 1 位 → +6（一年下來每個人平均是公平的）
   *   回家：沒有
   *   有安排日程、沒有劇情的日子會用一句話顯示「去了哪裡、遇到誰」（plan.text.dayLine；活動也可以寫自己的 line，
   *   例如 { id: "council", label: "學生會", line: "{date}\n放學後在學生會辦公室幫忙，{who}也在。" }）
   * specials：特殊劇情 { activity, scene, if, date, title, repeat }
   *   那天安排的是這個日程、而且 if 成立（例如 visits: { council: ">=5" }、aff、pair…）→ 停下來播，那天不加好感
   *   寫 date 就只有那天會觸發；寫 title＋date 會顯示在行事曆上；看過就不再觸發（repeat: true 可以重複）
   * holidays：節日 { date, title, scene }
   * gift：每月 14 日（2/14、3/14 是節日）跳出送禮選單：送給一位 → 好感 +aff；請別人送（先選送禮的人、再選收禮的人）→ 兩人關係 +pair
   * weekend：星期日選人：intro = 開場劇情；見一位 → 好感 +single；見兩位 → 各 +pairAff、兩人關係 +pairBond
   *   scenes：[{ with: ["m1"] 或 ["m1", "m2"], scene, if }]；沒寫到的組合用一句話帶過；home = 待在家的劇情
   */
  plan: {
    planFrom: "09-08",
    affTotal: 6,
    pairTotal: 15,
    wanderMeet: 2,
    // cell = 月曆格子裡顯示的名字（"|" = 換行），沒寫就用 label
    // milestones = 第幾次去的時候有固定劇情（scenes.act_日程_次數，例如 act_club_5；那天會停下來播）
    // bg = 這個日程的背景（一句話、特殊劇情、主線強制日程的劇情都用它；劇情裡寫 { bg } 會換掉；沒寫就用 storyBg）
    activities: [
      { id: "club",      label: "社團活動", cell: "社團|活動", bg: "images/bg/club.jpg", milestones: [1, 5, 10, 20, 30, 50] },
      { id: "volunteer", label: "志工活動", cell: "志工|活動", bg: "images/bg/volunteer.jpg", milestones: [1, 5, 10, 20, 30, 50] },
      { id: "sports",    label: "體育館",   bg: "images/bg/sports.jpg", milestones: [1, 5, 10, 20, 30, 50] },
      { id: "council",   label: "學生會",   bg: "images/bg/council.jpg", milestones: [1, 5, 10, 20, 30, 40, 50] },
      { id: "games",     label: "網咖",     bg: "images/bg/games.jpg", milestones: [1, 5, 10, 20, 30, 50] },
      { id: "karaoke",   label: "KTV",      bg: "images/bg/karaoke.jpg", milestones: [1, 5, 10, 20, 30, 50] },
      { id: "wander",    label: "閒晃",     bg: "images/bg/wander.jpg", milestones: [1, 10, 30, 50] }
    ],
    specials: [
      // 例：{ activity: "council", if: { visits: { council: ">=5" } }, scene: "sp_council_5" },
      //     { activity: "sports", if: { pair: { "m3-m4": ">=100" } }, scene: "sp_m3_m4" },
      //     { activity: "club", date: "10-15", title: "社團發表會", scene: "sp_club_show" }
    ],
    // 黑底日期畫面上多顯示一行字的日子
    dayLabels: { "09-01": "開學日" },
    holidays: [
      { date: "05-05", title: "兒童節",  scene: "h0505" },
      { date: "02-17", title: "설날",  scene: "h0217" },
      { date: "12-31", title: "跨年夜",  scene: "d1231" },
      { date: "11-11", title: "빼빼로데이",  scene: "h1111" },
      { date: "10-06", title: "中秋節",     scene: "h1006" },
      { date: "01-01", title: "元旦",       scene: "h0101" },
      { date: "12-24", title: "平安夜",     scene: "h1224" },
      { date: "12-25", title: "聖誕節",     scene: "h1225" },
      { date: "02-14", title: "情人節",     scene: "h0214" },
      { date: "03-14", title: "白色情人節", scene: "h0314" }
    ],
    gift: { aff: 6, pair: 15 },
    homeBg: "images/bg/home.jpg",   // 回家、星期日待在家的背景
    homeMilestones: [1, 10, 30, 50],   // 平日沒安排（回家）第幾次有固定劇情（scenes.act_home_次數）
    /* 隨機劇情：去某個日程、遇到某人（或某兩人）時，有 chance 的機率觸發（目前 20%）（可以重複觸發；每一項各自擲，中的都播）
     *   寫編號：單人 "1"、配對 "14"（1 將太郎、2 恩奭、3 成燦、4 元彬、6 炤熙、7 燦榮）；回家寫 "me"（跟自己對話）
     *   劇情寫在 scenes.rand_日程_編號（例如 rand_club_14、rand_home_me）；沒寫劇情的不會觸發
     *   被跳過的日子觸發的，在「這週的放學後」之後依序播 */
    random: {
      chance: 0.2,
      club:      ["1", "4", "6", "14", "16", "46"],
      volunteer: ["2", "7", "27"],
      sports:    ["3", "4", "7", "34", "37", "47"],
      council:   ["1", "2", "3", "4", "6", "7", "13", "16", "17", "23", "24", "26", "27", "36", "46", "47"],
      games:     ["1", "2", "6", "12", "26"],
      karaoke:   ["3", "6", "7", "36", "37", "67"],
      wander:    ["1", "2", "3", "4", "12", "13", "14", "23", "24", "34", "17", "67"],
      home:      ["me"]
    },
    weekend: { bg: "images/bg/wander.jpg", intro: "weekend_intro", single: 6, pairAff: 3, pairBond: 15,
      scenes: [
        // 同一個人／同一組：沒寫 chance = 固定劇情（每次都一樣）；chance: 0.2 = 特殊劇情（20% 機率，可以重複）
        { with: ["m1"], scene: "wk_m1", repeat: true }, { with: ["m1"], scene: "wk_m1_sp", repeat: true, chance: 0.2 },
        { with: ["m2"], scene: "wk_m2", repeat: true }, { with: ["m2"], scene: "wk_m2_sp", repeat: true, chance: 0.2 },
        { with: ["m3"], scene: "wk_m3", repeat: true }, { with: ["m3"], scene: "wk_m3_sp", repeat: true, chance: 0.2 },
        { with: ["m4"], scene: "wk_m4", repeat: true }, { with: ["m4"], scene: "wk_m4_sp", repeat: true, chance: 0.2 },
        { with: ["m5"], scene: "wk_m5", repeat: true }, { with: ["m5"], scene: "wk_m5_sp", repeat: true, chance: 0.2 },
        { with: ["m6"], scene: "wk_m6", repeat: true }, { with: ["m6"], scene: "wk_m6_sp", repeat: true, chance: 0.2 },
        { with: ["m1", "m2"], scene: "wk_m1_m2", repeat: true }, { with: ["m1", "m2"], scene: "wk_m1_m2_sp", repeat: true, chance: 0.2 },
        { with: ["m1", "m3"], scene: "wk_m1_m3", repeat: true }, { with: ["m1", "m3"], scene: "wk_m1_m3_sp", repeat: true, chance: 0.2 },
        { with: ["m1", "m4"], scene: "wk_m1_m4", repeat: true }, { with: ["m1", "m4"], scene: "wk_m1_m4_sp", repeat: true, chance: 0.2 },
        { with: ["m1", "m5"], scene: "wk_m1_m5", repeat: true }, { with: ["m1", "m5"], scene: "wk_m1_m5_sp", repeat: true, chance: 0.2 },
        { with: ["m1", "m6"], scene: "wk_m1_m6", repeat: true }, { with: ["m1", "m6"], scene: "wk_m1_m6_sp", repeat: true, chance: 0.2 },
        { with: ["m2", "m3"], scene: "wk_m2_m3", repeat: true }, { with: ["m2", "m3"], scene: "wk_m2_m3_sp", repeat: true, chance: 0.2 },
        { with: ["m2", "m4"], scene: "wk_m2_m4", repeat: true }, { with: ["m2", "m4"], scene: "wk_m2_m4_sp", repeat: true, chance: 0.2 },
        { with: ["m2", "m5"], scene: "wk_m2_m5", repeat: true }, { with: ["m2", "m5"], scene: "wk_m2_m5_sp", repeat: true, chance: 0.2 },
        { with: ["m2", "m6"], scene: "wk_m2_m6", repeat: true }, { with: ["m2", "m6"], scene: "wk_m2_m6_sp", repeat: true, chance: 0.2 },
        { with: ["m3", "m4"], scene: "wk_m3_m4", repeat: true }, { with: ["m3", "m4"], scene: "wk_m3_m4_sp", repeat: true, chance: 0.2 },
        { with: ["m3", "m5"], scene: "wk_m3_m5", repeat: true }, { with: ["m3", "m5"], scene: "wk_m3_m5_sp", repeat: true, chance: 0.2 },
        { with: ["m3", "m6"], scene: "wk_m3_m6", repeat: true }, { with: ["m3", "m6"], scene: "wk_m3_m6_sp", repeat: true, chance: 0.2 },
        { with: ["m4", "m5"], scene: "wk_m4_m5", repeat: true }, { with: ["m4", "m5"], scene: "wk_m4_m5_sp", repeat: true, chance: 0.2 },
        { with: ["m4", "m6"], scene: "wk_m4_m6", repeat: true }, { with: ["m4", "m6"], scene: "wk_m4_m6_sp", repeat: true, chance: 0.2 },
        { with: ["m5", "m6"], scene: "wk_m5_m6", repeat: true }, { with: ["m5", "m6"], scene: "wk_m5_m6_sp", repeat: true, chance: 0.2 }
      ],
      home: [ { scene: "wk_home", repeat: true } ] }
  },

  /* ---------- 戀愛與覺醒的門檻 ----------
   * lover：玩家和成員是戀人 = 好感度到 aff，而且有 flag 旗標（{id} 換成成員 id，例如 confess_m1 = 和大﨑将太郎告白過）
   * couple：兩位成員是一對 = 關係到 pair，而且有 flag 旗標（{pair} 換成 "m1-m2"）
   * awake：六位的覺醒度都到這個數字 = allAwake（才能選「喚醒」）
   * 條件裡可以寫 lover: "m1"、notLover: "m1"、couple: "m1-m2"、notCouple、allAwake: true / false
   * （一年下來的好感度很高，下面的數字是暫定，之後照試玩結果調）
   */
  romance: {
    lover: { aff: 120, flag: "confess_{id}" },
    couple: { pair: 150, flag: "couple_{pair}" },
    // 個人覺醒 = 覺醒度到 value（每人一樣、不會下降）
    //   覺醒度只能靠「在手機裡找到線索」增加：IG 貼文／限動、X 貼文、照片、備忘錄、KakaoTalk 訊息寫 clue: "m3_1"，
    //   玩家看到 1 秒就算找到（覺醒度 +1、記錄旗標 clue_m3_1）；劇情、日程只會有跡象，不會加覺醒度
    //   沒找到線索的玩家會快樂地過完一年 → DREAM END 2 → 回到 9/1
    //   六位都覺醒 → 8/31 可以選 TRUE END／DREAM END 1；有人沒覺醒 → DREAM END 2
    awake: { value: 3 }
  },

  /* ---------- 結局 ----------
   * 主線劇情裡寫 { ending: "結局id" } → 那段劇情結束後進入結局：
   *   播 scene（結局劇情）→ 依序播 epilogues 裡條件成立的後日談 → 結局畫面（END＋title；點一下畫面回到手機，重新開始只能在設定裡選）
   *   after："explore" = 回到手機後只能探索 App、不再換天；"continue" = 照常過日子；
   *         "loop" = 時間循環：自動存一個「循環前的存檔」，回到 2025/9/1 重新過這一年（第二輪起，條件可以寫 loop: ">=2"）
   *   epilogues：[{ id, title（結局畫面、圖鑑顯示的名稱）, scene, if }]
   * 看過的結局、後日談記在「設定 → 結局圖鑑」，重新開始也不會清掉；結局會記錄旗標 ending_結局id
   */
  endings: {
    // 六人都覺醒、選擇喚醒：六人回到成人世界，玩家留在這個世界
    true: {
      title: "TRUE END", text: "即使不確定未來是否幸福，仍願意繼續生活。", scene: "ending_true", after: "explore",
      epilogues: [
        { id: "m1", title: "將太郎", scene: "ep_true_m1" },
        { id: "m2", title: "恩奭", scene: "ep_true_m2" },
        { id: "m3", title: "成燦", scene: "ep_true_m3" },
        { id: "m4", title: "元彬", scene: "ep_true_m4" },
        { id: "m5", title: "炤熙", scene: "ep_true_m5" },
        { id: "m6", title: "燦榮", scene: "ep_true_m6" }
      ]
    },
    // 六人都覺醒、選擇留下：七人繼續留在學院的一年
    dream1: {
      title: "DREAM END 1", text: "七人選擇留在這段美好的時光。", scene: "ending_dream1", after: "loop",
      epilogues: [
        { id: "again", title: "又是九月了", scene: "ep_dream1" }
      ]
    },
    // 8/31 時有人還沒覺醒：沒有選擇，直接進入這個結局
    dream2: {
      title: "DREAM END 2", text: "還有人沒有醒來。", scene: "ending_dream2", after: "loop",
      epilogues: [
        { id: "some", title: "一點點", scene: "ep_dream2_some", if: { awakeCount: ">=1" } }
      ]
    }
  },
  // 結局畫面最上面的小字（結局名稱已經有 END，所以留空）
  endingText: { end: "" },

  /* ---------- 遊戲時間與存檔 ----------
   * 一學年：startDate（2025-09-01，星期一）～ endDate（2026-08-31）
   * 有事的日子才會停下來；晚上主畫面出現「睡覺」，睡了就往後跳到下一個有事的日子（並自動存檔）
   * 每天記錄旗標 day_學年第幾天（例如 day_2）
   * saveSlots = 手動存檔的格數（設定 → 存檔與讀檔）
   */
  game: {
    debug: true,                 // true = 設定裡出現「數值（開發用）」；正式公開前改成 false
    startDate: "2025-09-01",
    endDate: "2026-08-31",
    saveSlots: 10,
    sleepLabel: "睡覺",
    sleepTitle: "要睡覺了嗎？",
    sleepText: "今天就會結束，接著會照安排往後過日子，直到下一個有事的日子。",
    cancelLabel: "取消",
    // 遊戲開頭的鬧鐘：往右滑停止 → 鎖定畫面；稍後提醒 = 過 snoozeMs 毫秒再響一次（時間 +9 分鐘）
    nightTime: "22:00",            // 星期日（能用手機的日子）晚上，手機上的時間從這裡開始走
    alarm: { time: "7:00", label: "鬧鐘", snooze: "稍後提醒", stop: "滑動來停止", snoozeMs: 4000 }
    // 設定 App 的文字可以在 settingsText: { … } 裡改（預設值寫在 js/apps/settings.js 的 T_DEFAULT）
  },

  /* ---------- 手機密碼鎖（每次打開網址都要先輸入；留空 "" = 不鎖） ---------- */
  lock: {
    wallpaper: "images/wallpaper.jpg",   // 鎖定畫面的預設背景（玩家可以在 設定 → 背景圖片 換）
    passcode: "birthday",        // "birthday" = 玩家的生日（月月日日，例如 10/14 → 1014）；也可以直接寫數字
    title: "輸入密碼",
    deleteLabel: "刪除",
    cancelLabel: "取消",
    // 鎖定畫面（輸入密碼前）：上方的字；KakaoTalk 有未讀訊息時會顯示通知，點了解鎖後直接打開那個聊天室
    swipeText: "滑動以解鎖"
  },

  /* ---------- 手機首頁 ---------- */
  home: {
    wallpaper: "images/wallpaper.jpg",   // 主畫面的預設桌布（玩家可以在 設定 → 背景圖片 換）
    // 上方的行事曆小工具：日期、月曆跟著現實的日期走；點月曆上的日期 → 左邊顯示那天的行程
    //   events = 行程：title = 文字、color = 顏色條、textColor = 文字顏色
    //   if = 條件（格式見上面 cast 的說明），不成立就不顯示這個行程
    //   date 可寫 "10-1"（每年 10/1）、"2026-10-1"（只有那天）、"15"（每個月 15 號）、
    //        "星期五" 或 "fri"（每個星期五）；不寫 = 每天都顯示
    //   noEvents = 那天沒有行程時顯示的字（不寫 = 空白）
    //   想改顯示的字：weekdays（星期日～六）、months（一月～十二月）、weekHeads（一～日）
    calendar: {
      events: [
        // 覺醒線索 m3_1（成燦）：12 月起，12/21 多了一個玩家沒加過的行程（球賽）
        { date: "2025-12-21", title: "🦌 球賽 16:00", from: "12-01", clue: "m3_1" },
        // 覺醒線索 m2_2（恩奭②）、m6_3（燦榮③）
        { date: "2026-02-23", title: "值班 07:00–19:00", from: "02-01", clue: "m2_2" },
        { date: "2026-06-27", title: "🦕 live house 20:00", from: "06-01", clue: "m6_3" }
      ]
    },
    // 行事曆下面的 App 圖示（有名稱；一排 4 個，照這裡的順序上到下、左到右排）
    icons: [
      { id: "photos", label: "相簿",      icon: "images/icon_photos.png" },
      { id: "notes",  label: "備忘錄",    icon: "images/icon_notes.png" },
      { id: "kakao",  label: "KakaoTalk", icon: "images/icon_kakao.png" },
      { id: "ig",     label: "Instagram", icon: "images/icon_insta.png" },
      { id: "x",      label: "X",         icon: "images/icon_x.png" },
      { id: "settings", label: "設定",     icon: "images/icon_settings.png" }
    ]
  },

  /* ---------- Instagram ----------
   * 貼文、限時動態、精選都可以寫 from: "09-15"（那天起才出現）或 if: 條件（例如 { awakened: "m1" }、{ loop: ">=2" }）
   * 這一段本身 = 帳號「shotaroo0」，同時放全部帳號共用的文字設定。
   * otherAccounts = 其他帳號；有寫 password 的可以從「新增帳號」登入。
   */
  instagram: {
    defaultAccount: "briiii1ze._",   // 打開 IG 時已經登入的帳號（玩家）
    username: "shotaroo0",         // 成員帳號都不能登入（不寫 password）
    private: true,                 // 非公開帳號：沒追蹤的人看不到貼文、限時、名單
    name: "SHOTARO",
    cast: "m1",                    // 成員帳號：名字、大頭照用 cast 的（不寫 cast → 用 avatar、name；沒有名字 → 顯示帳號 id）
    // 貼文數、粉絲、追蹤會自動計算；想顯示固定數字就加 postsCount / followersCount / followingCount
    following: others(IG_ALL, "shotaroo0"),
    closeFriendsList: [],
    postsLabel: "貼文",
    followersLabel: "位粉絲",
    followingLabel: "追蹤中",
    bio: [],                       // 簡介（一行一個字串；@帳號 會變成連結）
    // 也可以加：music: { title, artist, file }、highlights（精選動態）、story（限時動態）、saved（已儲存）
    editProfileLabel: "編輯個人檔案",
    shareProfileLabel: "分享個人檔案",
    highlights: [],
    // 例：{ images: [PH], caption: "內文", time: "1月2日", comments: [{ user: "帳號", text: "留言", time: "1天" }] }
    posts: [
      { images: ["images/ig/shotaro_20250716_1.jpg", "images/ig/shotaro_20250716_2.jpg"], caption: "", time: "7月16日" }   // 第一篇（2025/7/16）
    ],
    reposts: [],

    // IG 互動時出現的文字（{user} 會自動換成帳號）
    text: {
      commentsTitle: "留言",
      commentPlaceholder: "為 {user} 新增留言……",
      postButton: "發佈",
      reply: "回覆",
      noComments: "還沒有留言",
      justNow: "剛剛",
      linkCopied: "已複製連結",
      reposted: "已轉發到你的個人檔案",
      unreposted: "已取消轉發",
      savedTitle: "已儲存",
      noSaved: "還沒有儲存任何貼文",
      noReposts: "還沒有轉發任何貼文",
      noTagged: "還沒有被標註的相片",
      storyMessageSent: "訊息已傳送",
      editTitle: "編輯個人檔案",
      nameLabel: "名稱",
      bioLabel: "個人簡介",
      cancelLabel: "取消",
      doneLabel: "完成",
      closeFriendsTitle: "摯友",
      noCloseFriends: "還沒有摯友",
      archiveTitle: "典藏",
      archiveStories: "限時動態",
      archivePosts: "貼文",
      noArchive: "沒有典藏的內容",
      privateTitle: "此帳號不公開",
      privateDesc: "追蹤這個帳號即可查看相片和影片。",
      requestedLabel: "已要求"
    },

    postTitle: "貼文",
    likedBySuffix: "說讚",
    storyMessagePlaceholder: "傳送訊息……",
    followLabel: "追蹤",
    followingButtonLabel: "追蹤中",

    // 右上角三條線 → 設定頁：已儲存、典藏、帳號隱私設定、摯友可以點進去；其他項目顯示「尚未更新」
    settings: {
      title: "設定和動態",
      sections: [
        { title: "功能", items: [
          { icon: "saved",   label: "已儲存" },
          { icon: "archive", label: "典藏" }
        ] },
        { title: "隱私", items: [
          { icon: "lock", label: "帳號隱私設定" },
          { icon: "star", label: "摯友" }
        ] }
      ]
    },

    addAccountLabel: "新增帳號",
    // 「新增帳號」的登入畫面（只在網頁內比對帳密，不會送出）
    login: {
      usernamePlaceholder: "帳號",
      passwordPlaceholder: "密碼",
      loginLabel: "登入",
      errorText: "帳號或密碼錯誤"
    },

    otherAccounts: [
      // 玩家的帳號（名字＝玩家輸入的名字、頭貼＝玩家上傳的照片）
      {
        username: "briiii1ze._",
        password: "0000",
        following: others(IG_ALL, "briiii1ze._"),
        closeFriendsList: [],
        saved: [],
        archive: { stories: [], posts: [] },
        bio: [],
        story: [],
        highlights: [],
        posts: [],
        reposts: []
      }
    ],
    // 其他成員的帳號：只能從名單、搜尋點進去看，不能登入（不寫 password）
    searchOnlyAccounts: [
      { username: "seokkkk",     cast: "m2", name: "BLACK SHADOW", private: true, following: others(IG_ALL, "seokkkk"),     bio: [ { text: "☃️", from: "11-01", clue: "m2_1" } ],   // 覺醒線索 m2_1：11 月起簡介多了雪人 highlights: [], reposts: [],
        posts: [
          { images: ["images/ig/eunseok_20250709_1.jpg", "images/ig/eunseok_20250709_2.jpg", "images/ig/eunseok_20250709_3.jpg", "images/ig/eunseok_20250709_4.jpg"], caption: "", time: "7月9日" }   // 第一篇（2025/7/9）
        ] },
      { username: "sungchan913", cast: "m3", name: "🦌", private: true, following: others(IG_ALL, "sungchan913"), bio: [], highlights: [], reposts: [],
        posts: [
          { images: ["images/ig/sungchan_20250503_1.jpg", "images/ig/sungchan_20250503_2.jpg"], caption: "", time: "5月3日" }   // 第一篇（2025/5/3）
        ] },
      { username: "bin032",      cast: "m4", name: "원빈", private: true, following: others(IG_ALL, "bin032"),      bio: [], highlights: [], reposts: [],
        posts: [
          // 覺醒線索 m4_1：11/12 的新貼文（兩張）
          { images: ["images/ig/wonbin_20251112_1.jpg", "images/ig/wonbin_20251112_2.jpg"], caption: "天氣變冷了", time: "11月12日", from: "11-12", clue: "m4_1" },
          { images: ["images/ig/wonbin_20250603_1.jpg", "images/ig/wonbin_20250603_2.jpg", "images/ig/wonbin_20250603_3.jpg", "images/ig/wonbin_20250603_4.jpg", "images/ig/wonbin_20250603_5.jpg"], caption: "", time: "6月3日" }   // 第一篇（2025/6/3）
        ] },
      { username: "252525252_",  cast: "m5", name: "이소희", private: true, following: others(IG_ALL, "252525252_"),  bio: [], highlights: [], reposts: [],
        posts: [
          // 覺醒線索 m5_3（炤熙③）：5/28 的新貼文（圖片待換：先用 1/21 那篇的照片）
          { images: ["images/ig/sohee_20250121_2.jpg"], caption: "只給想給的人看。", time: "5月28日", from: "05-28", clue: "m5_3" },
          { images: ["images/ig/sohee_20250121_1.jpg", "images/ig/sohee_20250121_2.jpg", "images/ig/sohee_20250121_3.jpg"], caption: "", time: "1月21日" }   // 第一篇（2025/1/21）
        ] },
      { username: "antonnie",    cast: "m6", name: "Anton", private: true, following: others(IG_ALL, "antonnie"),    bio: [], highlights: [], reposts: [],
        posts: [
          { images: ["images/ig/chanyoung_20250811_1.jpg", "images/ig/chanyoung_20250811_2.jpg", "images/ig/chanyoung_20250811_3.jpg", "images/ig/chanyoung_20250811_4.jpg"], caption: "", time: "8月11日" }   // 第一篇（2025/8/11）
        ] }
    ]
  },

  /* ---------- 相簿（iPhone「照片」風格） ----------
   * photos：所有照片，照時間「舊 → 新」排（圖庫最下面是最新的）；每張的編號 = 在這個清單的位置（從 0 開始）
   *   image = 圖片或影片路徑（.mp4 = 影片，再寫 duration: "0:15" 顯示長度）
   *   date = "2026年1月1日"（年／月分組用）、time = "下午 3:20"、place = 地點、device = 拍攝裝置、caption = 說明
   *   favorite: true = 預設在「個人收藏」；hidden: true = 只在「已隱藏」相簿
   *   from: "09-15" = 那天起才出現；if: 條件 = 條件成立才出現（例如 { awakened: "m3" }）
   * albums：自己建的相簿（photos 寫照片編號）
   * hiddenPasscode：打開「已隱藏」相簿要輸入的密碼（留空 "" = 不鎖）；解開時記錄旗標 photos_hidden_unlocked
   */
  photos: {
    hiddenPasscode: "0000",
    photos: [                      // 例：{ image: PH, date: "2025年8月20日", time: "下午 6:40", place: "地點" }
      // 覺醒線索 m5_1（炤熙）：10 月起出現在「最近刪除」。炤熙站在高高的牆上張開雙手，背後是空著的觀眾席和一串燈泡（從下往上拍）
      { image: "images/photos/sohee_deleted.jpg", from: "10-01", deleted: true, deletedDays: 3, clue: "m5_1", date: "2025年10月4日", time: "下午 9:12" },
      // 覺醒線索 m1_2（將太郎②）：1/12 起，「已隱藏」裡一張白色房間（復健室）的照片（圖片待換）
      { image: "images/placeholder.jpg", from: "01-12", hidden: true, clue: "m1_2", date: "2032年3月2日", time: "上午 10:05" }
    ],
    albums: []                     // 例：{ id: "a1", name: "相簿名稱", photos: [0, 1] }
    // 介面文字可以在 text: { … } 裡改（預設值寫在 js/apps/photos.js 的 T_DEFAULT）
  },

  /* ---------- X ----------
   * me = 玩家用的帳號（左上角頭貼、回覆、發文都是這個帳號）
   * accounts：handle = @後面的 id、name、avatar、banner（封面）、bio、
   *   protected（鎖帳：沒跟隨就看不到貼文，按跟隨會變「已提出要求」）、followed（玩家一開始就有跟隨）、
   *   following / followers（顯示的數字；不寫 = 名單的人數）
   *   followingList / followersList：正在跟隨／跟隨者名單（點數字進去看）；寫 handle = 遊戲裡的帳號，
   *     寫 { handle, name, avatar, bio } = 路人（點不進去）。自己的「正在跟隨」會自動加上玩家跟隨中的帳號
   *   自己的帳號：玩家可以在「編輯個人資料」改名稱、簡介、保護你的貼文（不公開）；改成不公開／公開時記錄旗標
   *     x_private_帳號 / x_public_帳號
   *   likes / retweets：這個帳號按過喜歡／轉推的貼文 id（個人檔案的「喜歡」「轉推」分頁）；
   *   玩家自己的帳號不用寫，會顯示玩家按過的
   * tweets：照時間軸順序（新的在上面）；每則（和回覆）都可以寫 from: "09-15"（那天起才出現）或 if: 條件
   *   id（不要重複）、by（誰發的）、text（@帳號、#標籤 會變藍色）、images（最多 4 張）、
   *   time（時間軸上的「1小時」）、date（內頁的「下午 12:32 · 2026/9/1」）、retweets、likes、
   *   liked / retweeted: true = 玩家一開始就按過、retweetedBy = 顯示「xxx 已轉推」
   *   replies：[{ by, text, time, replyTo, images }]；replyTo = 回覆誰（不寫 = 回覆發文的人），
   *     下一則回覆的是上一則的人時，兩則會用直線連起來（回覆串）
   */
  x: {
    me: "briiii1ze._",              // 玩家的帳號（名字＝玩家輸入的名字、頭貼＝玩家上傳的照片）
    accounts: [
      { handle: "briiii1ze._", bio: "", followersList: others(X_ALL, "briiii1ze._") },
      { handle: "shotaroo0",   cast: "m1", name: "SHOTARO", protected: true, followed: true, bio: "", followingList: others(X_ALL, "shotaroo0"),   followersList: others(X_ALL, "shotaroo0") },
      { handle: "seokkkk",     cast: "m2", name: "BLACK SHADOW", protected: true, followed: true, bio: "", followingList: others(X_ALL, "seokkkk"),     followersList: others(X_ALL, "seokkkk") },
      { handle: "sungchan913", cast: "m3", name: "🦌", protected: true, followed: true, bio: "", followingList: others(X_ALL, "sungchan913"), followersList: others(X_ALL, "sungchan913") },
      { handle: "bin032",      cast: "m4", name: "원빈", protected: true, followed: true, bio: "", followingList: others(X_ALL, "bin032"),      followersList: others(X_ALL, "bin032") },
      { handle: "252525252_",  cast: "m5", name: "이소희", protected: true, followed: true, bio: "", followingList: others(X_ALL, "252525252_"),  followersList: others(X_ALL, "252525252_") },
      { handle: "antonnie",    cast: "m6", name: "Anton", protected: true, followed: true, bio: "", followingList: others(X_ALL, "antonnie"),    followersList: others(X_ALL, "antonnie") }
    ],
    // 例：{ id: "t1", by: "shotaroo0", text: "內容", time: "1小時", date: "下午 12:32 · 2025/9/1" }；from = 那天起才出現
    // X 貼文：在 js/story/ 每個月的檔案裡
    tweets: [
    ]
    // 介面文字可以在 text: { … } 裡改（預設值寫在 js/apps/x.js 的 T_DEFAULT）
  },

  /* ---------- 備忘錄 ----------
   * notes：第一行 = 標題；date = "2026年1月1日"、time = "下午 3:20"
   *   pinned: true = 放在「已釘選」；locked: true = 要輸入 passcode 才看得到（解開時記錄旗標 note_備忘錄id）
   *   lockedTitle：鎖住時列表上顯示的標題（不寫 = 照樣顯示第一行）
   *   from: "09-15" = 那天起才出現；if: 條件 = 條件成立才出現
   * 玩家可以直接改內容、新增、刪除（存在瀏覽器）
   */
  notes: {
    passcode: "0000",
    notes: [                       // 例：{ id: "n1", text: "標題\n內容", date: "2025年9月1日", time: "下午 3:20", pinned: true }
      // 覺醒線索 m1_1（將太郎）：10 月起出現在置頂，玩家沒印象寫過
      { id: "n_council", from: "10-01", pinned: true, clue: "m1_1", date: "2025年9月23日", time: "下午 5:47",
        text: "學生會：交接\n・總務帳本 → 元彬\n・器材清單 → 恩奭\n・活動企劃書 → 成燦\n・海報檔案 → 燦榮\n・會議紀錄 → 炤熙\n・學生會 IG → 我\n・校慶企劃書 10/15 前交" },
      // 覺醒線索 m5_2（炤熙②）：1 月起，上鎖的備忘錄（密碼同 notes.passcode）
      { id: "n_proposal", from: "01-05", locked: true, lockedTitle: "（已鎖定）", clue: "m5_2", date: "2032年3月18日", time: "上午 2:14",
        text: "提案 v12（最終）\n做了三個月。\n發表的時候，上面寫的是組長的名字。\n……反正每次都這樣。" },
      // 覺醒線索 m3_3（成燦③）：6 月起，一般備忘錄
      { id: "n_dinner", from: "06-01", clue: "m3_3", date: "2032年6月3日", time: "下午 7:30",
        text: "每週晚餐\n・星期三 湯飯（燦榮）\n・星期三 湯飯（燦榮）\n・星期三 湯飯（燦榮）" }
    ]
  },

  /* ---------- KakaoTalk ---------- */
  kakao: {
    // 「今天」= 遊戲裡的日期（game.startDate 開始，每睡一覺 +1 天）
    // 即時訊息：達成 when 的旗標後，過 delay 毫秒對方傳來（會跳通知橫幅）
    //   when 可寫一個旗標或陣列（全部達成）；unlessReplied: true = 玩家在那個聊天室回過話就不傳
    //   unless = 有這個旗標就不傳；unlessSent = 某則即時訊息已傳過就不傳
    //   if = 條件（好感度、天數…，格式見 cast 的說明），成立才會傳
    //   常用旗標：phone_unlocked（解鎖手機）、chat_聊天室id、locked_帳號
    live: [
      // 覺醒線索 m4_2（元彬②）：2/22 星期日晚上，傳了一則又收回，再傳「……沒事」
      { id: "wonbin_0222_a", when: "phone_unlocked", if: { date: "02-22", phase: "night" }, room: "f4", recalled: true },
      { id: "wonbin_0222_b", when: "phone_unlocked", if: { date: "02-22", phase: "night" }, room: "f4", text: "……沒事", clue: "m4_2" },
      // 客服小精靈：9/14 第一次自由使用手機的星期日，介紹新功能（Claude 草稿）
      { id: "helper_0914_1", when: "phone_unlocked", if: { date: "09-14", phase: "night" }, room: "helper", text: "今天是第一個可以自由用手機的星期日～" },
      { id: "helper_0914_2", when: "phone_unlocked", if: { date: "09-14", phase: "night" }, room: "helper", text: "小提示：App 圖示右上角出現紅點，就是那裡有新東西喔。" },
      { id: "helper_0914_3", when: "phone_unlocked", if: { date: "09-14", phase: "night" }, room: "helper", text: "設定裡有「線索收集」和「劇情回想」，想看的時候可以去逛逛。不想要震動的話，也可以在設定裡關掉。" },
      // 客服小精靈：每個月第一個星期日晚上（解鎖手機後）傳兩句：這個月的提醒＋模糊的提示（Claude 草稿）
      { id: "helper_1005_1", when: "phone_unlocked", if: { date: "10-05", phase: "night" }, room: "helper", text: "十月了！這個月學生會要開始忙校慶囉。" },
      { id: "helper_1005_2", when: "phone_unlocked", if: { date: "10-05", phase: "night" }, room: "helper", delay: 1500, text: "對了，置頂的東西、刪掉的東西，有時候比你想的還重要喔。" },
      { id: "helper_1102_1", when: "phone_unlocked", if: { date: "11-02", phase: "night" }, room: "helper", text: "十一月，校慶月！月曆排好了嗎？" },
      { id: "helper_1102_2", when: "phone_unlocked", if: { date: "11-02", phase: "night" }, room: "helper", delay: 1500, text: "大家的 IG 主頁，最近有沒有哪裡不太一樣？" },
      { id: "helper_1207_1", when: "phone_unlocked", if: { date: "12-07", phase: "night" }, room: "helper", text: "十二月了，天氣變冷，記得多穿一點。" },
      { id: "helper_1207_2", when: "phone_unlocked", if: { date: "12-07", phase: "night" }, room: "helper", delay: 1500, text: "行事曆上的每一個行程，你都記得是自己加的嗎？" },
      { id: "helper_0104_1", when: "phone_unlocked", if: { date: "01-04", phase: "night" }, room: "helper", text: "新年快樂！寒假也要好好玩～" },
      { id: "helper_0104_2", when: "phone_unlocked", if: { date: "01-04", phase: "night" }, room: "helper", delay: 1500, text: "已隱藏的照片、上鎖的備忘錄，你有多久沒打開了？" },
      { id: "helper_0201_1", when: "phone_unlocked", if: { date: "02-01", phase: "night" }, room: "helper", text: "二月了，寒假還剩一點點。" },
      { id: "helper_0201_2", when: "phone_unlocked", if: { date: "02-01", phase: "night" }, room: "helper", delay: 1500, text: "有些話，是只對你說的。仔細看看聊天室吧。" },
      { id: "helper_0301_1", when: "phone_unlocked", if: { date: "03-01", phase: "night" }, room: "helper", text: "新學期要開始了！" },
      { id: "helper_0301_2", when: "phone_unlocked", if: { date: "03-01", phase: "night" }, room: "helper", delay: 1500, text: "大家的 X，最近好像有點不一樣。" },
      { id: "helper_0405_1", when: "phone_unlocked", if: { date: "04-05", phase: "night" }, room: "helper", text: "四月，運動會的季節！" },
      { id: "helper_0405_2", when: "phone_unlocked", if: { date: "04-05", phase: "night" }, room: "helper", delay: 1500, text: "你有多久沒看大家的 X 了？" },
      { id: "helper_0503_1", when: "phone_unlocked", if: { date: "05-03", phase: "night" }, room: "helper", text: "五月了，期末考加油！" },
      { id: "helper_0503_2", when: "phone_unlocked", if: { date: "05-03", phase: "night" }, room: "helper", delay: 1500, text: "聊天的時候，說說你們一起看過的東西吧。說不定一個詞，就能讓他想起什麼。" },
      { id: "helper_0607_1", when: "phone_unlocked", if: { date: "06-07", phase: "night" }, room: "helper", text: "六月，畢業的季節。" },
      { id: "helper_0607_2", when: "phone_unlocked", if: { date: "06-07", phase: "night" }, room: "helper", delay: 1500, text: "想記住的東西，就記下來吧。備忘錄、相簿、行事曆，都可以。" },
      { id: "helper_0705_1", when: "phone_unlocked", if: { date: "07-05", phase: "night" }, room: "helper", text: "暑假開始了！瘋狂玩樂吧！" },
      { id: "helper_0705_2", when: "phone_unlocked", if: { date: "07-05", phase: "night" }, room: "helper", delay: 1500, text: "如果你發現了什麼，記得告訴他們。" },
      { id: "helper_0802_1", when: "phone_unlocked", if: { date: "08-02", phase: "night" }, room: "helper", text: "八月了。這一年，快要結束了。" },
      { id: "helper_0802_2", when: "phone_unlocked", if: { date: "08-02", phase: "night" }, room: "helper", delay: 1500, text: "還有沒找到的東西嗎？時間不多了喔。" },
      // 覺醒線索 m6_1（燦榮）：12/7 星期日晚上突然傳來一句話；玩家回任何話 → 觸發
      { id: "anton_1207", when: "phone_unlocked", if: { date: "12-07", phase: "night" }, room: "f6", text: "你有看過〈Another Life〉的歌詞嗎？", flag: "anton_1207" }
    ],
    // 來電：達成 when 的旗標後過 delay 毫秒，room 這個好友打來（任何畫面都會跳出來；手機解鎖後才會響）
    //   ringFor = 響多久沒接就算未接（預設 30 秒）
    //   branch：依玩家有沒有在那個聊天室回過話，選開頭段落 { replied: "段落", notReplied: "段落" }；不寫 = 從 start 開始
    //   拒接或沒接 → 記錄 declineFlag，聊天室多一則未接來電
    //   if = 條件，成立才會打來；段落、選項可以寫 effects（套用效果），選項可以寫 if（條件不成立就不出現）
    // 例：{ id: "call1", when: "chat_f2", delay: 10000, room: "f2", declineFlag: "call1_declined",
    //       start: "s", nodes: { s: { lines: [{ who: "them", text: "…" }] } } }
    incoming: [],
    // 每日聊天：那天的主線劇情結束後，自動打開這個聊天室跑一段聊天；聊完才進入下一天（星期日聊完 = 自由使用手機）
    //   room = 好友 id（f1～f6）或群組 id（g_club、g_volunteer、g_council、g_karaoke）
    //   steps（從上往下）：
    //     { text: "訊息" }                 對方傳來（先顯示「輸入中」）；群組要寫 from: "f4" = 誰傳的；image: "圖片" = 傳照片
    //     { choices: [ { text: "玩家要傳的話", effects, flag, reply: ["對方的回覆", { from: "f2", text: "群組裡誰回" }] } ] }
    //                                      玩家點選項 → 按送出 → 對方照 reply 回覆，再接著往下
    //     { wait: 1000 }                   停頓；typing: 毫秒 = 這則「輸入中」顯示多久；每一步都可以加 if
    // 每晚聊天：都在 js/story/ 每個月的檔案裡
    dayChats: [
    ],
    noAnswerMs: 8000,              // 打給沒有劇本的好友，響多久後顯示「對方未接聽」
    friends: [
      // 客服小精靈：放提示、進度提醒（不是成員）；之後用 live（即時訊息）或 messages 放內容
      {
        id: "helper",
        name: "客服小精靈",
        noCall: true,                 // 沒有電話鍵
        status: "",
        avatar: "images/default_avatar.png",
        unread: 0,
        messages: [],
        replies: [],
        defaultReply: []
      },
      {
        id: "f1",                     // 不要重複（用於網址）
        cast: "m1",
        name: "Shotaro",   // 預設顯示的名字（玩家可以在個人檔案改成自己的備註）；大頭照用 cast 的
        status: "",
        unread: 0,
        messages: [],
        replies: [],
        defaultReply: []
      },
      {
        id: "f2",
        cast: "m2",
        name: "은석",
        status: "",
        unread: 0,
        messages: [],
        // 覺醒線索 m2_3（恩奭③）：5 月起，聊天時提到「雪人」→ 他的回覆就是線索
        replies: [
          { keywords: ["雪人"], if: { day: ">=243" }, typing: [1500, 600, 2000], reply: [
            "……雪人。",
            "我想起來了，{name}。",
            { text: "雪人融化了會變成河。我改變不了很多事，可是可以陪在一個人旁邊。", clue: "m2_3" }
          ] }
        ],
        defaultReply: []
      },
      {
        id: "f3",
        cast: "m3",
        name: "성찬",
        status: "",
        unread: 0,
        messages: [],
        replies: [],
        defaultReply: []
      },
      {
        id: "f4",
        cast: "m4",
        name: "원빈",
        status: "",
        unread: 0,
        messages: [],
        replies: [],
        defaultReply: []
      },
      {
        id: "f5",
        cast: "m5",
        name: "소희",
        status: "",
        unread: 0,
        messages: [],
        replies: [],
        defaultReply: []
      },
      {
        id: "f6",
        cast: "m6",
        name: "Anton",
        status: "",
        unread: 0,
        messages: [],
        replies: [],
        defaultReply: []
      }
    ],
    // 群組：activity 寫日程 id = 自動放進那個日程會出現的成員（cast 的 activities）；name = 群組名稱（不寫 = 日程名稱）
    //   也可以不寫 activity，改寫 members（好友 id）；訊息的 from 寫好友 id（或 "me"）；name 留空 = 自動用成員名字
    // replies 的 reply 可以寫 { from: "f3", text: "..." } 指定誰回
    groups: [
      { id: "g_club", name: "放槍的伏地挺身100下", activity: "club", unread: 0, messages: [], replies: [], defaultReply: [] },   // 社團活動
      { id: "g_volunteer", name: "什麼水可以往上又往下：鼻水", activity: "volunteer", unread: 0, messages: [], replies: [], defaultReply: [] },   // 志工活動
      { id: "g_council", name: "重生之篡位學生會長", activity: "council", unread: 0, messages: [], replies: [], defaultReply: [] },   // 學生會
      { id: "g_karaoke", name: "KKKK歌！", activity: "karaoke", unread: 0, messages: [], replies: [], defaultReply: [] }   // KTV
    ],
    // 介面文字
    text: {
      olderHiddenText: "無法顯示更早的訊息",   // 成員聊天室、群組最上面的提示
      chatsTitle: "聊天",
      inputPlaceholder: "輸入訊息",
      choicePlaceholder: "選擇要回覆的內容",   // 有選項可以選時，輸入框裡的提示字
      ampm: ["上午", "下午"],
      photoLabel: "照片",
      videoLabel: "影片",
      recalledText: "已收回訊息",
      expiredText: "照片已過期",
      expiredVideoText: "影片已過期",
      voiceCall: "語音通話",
      cancelledCall: "已取消",
      missedCall: "未接",
      yesterday: "昨天",
      now: "現在",
      linkNotice: "傳送了一條連結",
      meTag: "我"
    }
  }
};

/* ---- js/story/*.js 用這個把內容併進 SITE_DATA ----
 * RIIIZE_ADD({ story: [...], scenes: {...}, dayChats: [...], tweets: [...] }) */
function RIIIZE_ADD(part) {
  var D = window.SITE_DATA;
  if (part.scenes) Object.keys(part.scenes).forEach(function (k) { D.scenes[k] = part.scenes[k]; });
  if (part.story) D.story = D.story.concat(part.story);
  if (part.dayChats) D.kakao.dayChats = D.kakao.dayChats.concat(part.dayChats);
  if (part.tweets) D.x.tweets = D.x.tweets.concat(part.tweets);
}
// js/story/ 裡的檔案（index.html 照這個順序載入）
var RIIIZE_STORY_FILES = ["2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05","2026-06","2026-07","2026-08","schedule","weekend","clues","awake","ending","common"];
