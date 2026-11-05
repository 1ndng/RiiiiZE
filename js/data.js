/* =========================================================
 * 網頁上所有「顯示文字」與「圖片路徑」都集中在這個檔案。
 * 目前全部是測試用的佔位內容：照片都先用 images/placeholder.jpg，
 * 之後把文字、圖片路徑換成正式內容即可。
 * - 文字中的換行：在字串裡寫 \n。
 * - 影片：路徑寫 .mp4（限時動態、Kakao 都能放）；同名的 xxx_poster.jpg 會當作封面。
 * ========================================================= */
var PH = "images/placeholder.jpg";   // 佔位照片（全部先用同一張）

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
  cast: [
    { id: "m1", name: "大﨑将太郎", birthday: "11-25", activities: ["club", "council", "games"], avatar: "images/cast/m1.jpg" },
    { id: "m2", name: "宋恩奭",     birthday: "03-19", activities: ["volunteer", "council", "games"], avatar: "images/cast/m2.jpg" },
    { id: "m3", name: "鄭成燦",     birthday: "09-13", activities: ["council", "sports", "karaoke"], avatar: "images/cast/m3.jpg" },
    { id: "m4", name: "朴元彬",     birthday: "03-02", activities: ["club", "council", "sports"], avatar: "images/cast/m4.jpg" },
    { id: "m5", name: "李炤熙",     birthday: "11-21", activities: ["club", "council", "karaoke", "games"], avatar: "images/cast/m5.jpg" },
    { id: "m6", name: "李燦榮",     birthday: "03-21", activities: ["volunteer", "council", "karaoke"], avatar: "images/cast/m6.jpg" }
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
   *   文字裡寫 {name} = 玩家的名字（第一次開始遊戲時輸入，接著輸入生日）
   *   播完會記錄旗標 scene_劇情id
   * story：主線劇情。date = 哪一天（"09-01"）、phase = "morning" 早上／"afterschool" 放學
   *   activity = 主線強制日程（那天照這個日程加好感，月曆上不能放方塊）
   *   可以加 if；同一段看過就不會再播（repeat: true 可以重播）
   * 下面「（待寫）」的都是空白劇情，直接把台詞寫進去就好
   */
  storySpeed: 38,                // 文字逐字出現的速度（每個字幾毫秒，越小越快）
  storyBg: "images/bg/school.jpg",   // 劇情的預設背景（手機以外的畫面都用這張）；劇情裡寫 { bg: "…" } 可以換，{ bg: "phone" } = 直接看到手機畫面
  // 第一次遊玩的開場（js/intro.js）：打開這些 App 就結束自由探索、開始 9/1
  intro: { endApps: ["ig", "photos", "kakao"] },
  scenes: {
    // ↓ 開場：解鎖手機後在主畫面上播（bg: "phone" = 看得到手機畫面）
    intro_wake: [
      { bg: "phone" },
      { who: "me", text: "？？？" },
      { who: "me", text: "這是我手機沒錯啊......我睡懵了嗎......破塔呢怎麼被刪了......" },
      { who: "me", text: "頭好痛......" },
      { text: "尚未清醒的你勉強將自己身子從床上撐起，抬眼環顧四周，發現不只是手機畫面，身旁是充滿熟悉感、讓人安心，卻又完全陌生的裝潢。" },
      { who: "me", text: "還是睡回去好了這看起來也不是有錢人家啊抱歉我穿越錯地方了系統呢你在哪。" },
      { text: "雖然這麼想著，但你還是摸索你手機，試圖從中找出一些線索。" }
    ],
    // 開場自由探索時，點行事曆上成員生日的那天
    intro_bday: [ { bg: "phone" }, { who: "me", text: "怎麼在這個世界我還在追拉完子==" } ],
    // 開場自由探索時，打開 IG、相簿、KakaoTalk → 播完開始 9/1 主線
    intro_end: [
      { bg: "phone" },
      { text: "你被手機畫面中的照片吸引了注意力。" },
      { who: "me", text: "我去" },
      { text: "回憶如海水般灌進腦袋，你終於想起自己的身份。" },
      { text: "你是拉完子學院的學生，今年是你就讀的第二年，恰好今天還是開學日。" },
      { text: "你感到頭一陣劇痛，好像想起了什麼，同時有什麼被遺忘了。" },
      { who: "me", text: "呃......" },
      { who: "me", text: "不管了......趕緊出門吧我可不想開學第一天就遲到啊啊啊。" }
    ],
    // ↓ 主線：開學第一週（9/1～9/7）
    d0901: [
      { text: "九月一日，開學。" },
      { text: "這是我在拉完子學院的第二年。" },
      { who: "m4", text: "{name}！我們又同班了。" },
      { who: "me", text: "……元彬？" },
      { who: "m4", text: "幹嘛那個表情，我們不是已經同班一年了嗎？" },
      { text: "（9/1 開學：待寫）" }
    ],
    d0902: [ { text: "（9/2 放學：學生會（強制日程）待寫）" } ],
    d0903_club: [
      { text: "（9/3 早上：選社團　待寫）" },
      { choices: [ { text: "（選項待寫）" }, { text: "（選項待寫）" } ] }
    ],
    d0903: [ { text: "（9/3 放學：志工活動（強制日程）待寫）" } ],
    d0904: [ { text: "（9/4 放學：體育館（強制日程）待寫）" } ],
    d0905: [ { text: "（9/5 放學：社團活動（強制日程）待寫）" } ],
    d0906: [ { text: "（9/6 放學：網咖（強制日程）待寫）" } ],
    d0907: [ { text: "（9/7 放學：KTV（強制日程）待寫）" } ],

    // ↓ 節日（plan.holidays）
    h0101: [ { text: "（1/1 元旦：待寫）" } ],
    h1224: [ { text: "（12/24 平安夜：待寫）" } ],
    h1225: [ { text: "（12/25 聖誕節：待寫）" } ],
    h0214: [ { text: "（2/14 情人節：待寫）" } ],
    h0314: [ { text: "（3/14 白色情人節：待寫）" } ],

    // ↓ 生日（birthday_成員id；玩家是 birthday_me）
    birthday_m1: [ { text: "（11/25 大﨑将太郎生日：待寫）" } ],
    birthday_m2: [ { text: "（3/19 宋恩奭生日：待寫）" } ],
    birthday_m3: [ { text: "（9/13 鄭成燦生日：待寫）" } ],
    birthday_m4: [ { text: "（3/2 朴元彬生日：待寫）" } ],
    birthday_m5: [ { text: "（11/21 李炤熙生日：待寫）" } ],
    birthday_m6: [ { text: "（3/21 李燦榮生日：待寫）" } ],
    birthday_me: [ { text: "（{name}的生日：待寫）" } ],

    // ↓ 星期日：選要見誰之前的劇情樣式開場（plan.weekend.intro）
    weekend_intro: [ { text: "星期日。" } ],

    // ↓ 結局（8/31 早上）
    final_choice: [
      { text: "——全部都想起來了。" },
      { text: "這裡不是真正的高中。他們早就長大了，只是被困在這段時間裡。" },
      { text: "（只有六位的覺醒度都夠，才能選「喚醒」）", if: { allAwake: false } },
      { choices: [
        { text: "喚醒大家", if: { allAwake: true }, goto: "wake" },
        { text: "讓大家留在這裡", goto: "stay" }
      ] },
      { label: "wake" }, { text: "你握住了他們的手。" }, { ending: "awaken" },
      { label: "stay" }, { text: "你決定什麼都不說。" }, { ending: "stay" }
    ],
    ending_awaken: [ { text: "睜開眼睛，窗外是另一個季節。" } ],
    ending_stay: [ { text: "隔天早上，鐘聲照常響起。" } ],
    ep_m1_lover: [ { who: "m1", text: "{name}，這次換我來找你。" } ],
    ep_m1_friend: [ { who: "m1", text: "以後也要常常聯絡喔。" } ],
    ep_m2_m3: [ { text: "宋恩奭和鄭成燦並肩走在街上。" } ]
  },
  story: [
    { date: "09-01", phase: "morning",     scene: "d0901" },                          // 開學
    { date: "09-02", phase: "afterschool", scene: "d0902", activity: "council" },     // 強制日程：學生會
    { date: "09-03", phase: "morning",     scene: "d0903_club" },                     // 選社團
    { date: "09-03", phase: "afterschool", scene: "d0903", activity: "volunteer" },   // 強制日程：志工活動
    { date: "09-04", phase: "afterschool", scene: "d0904", activity: "sports" },      // 強制日程：體育館
    { date: "09-05", phase: "afterschool", scene: "d0905", activity: "club" },        // 強制日程：社團活動
    { date: "09-06", phase: "afterschool", scene: "d0906", activity: "games" },       // 強制日程：網咖
    { date: "09-07", phase: "afterschool", scene: "d0907", activity: "karaoke" },     // 強制日程：KTV（之後開始每月安排）
    { date: "08-31", phase: "morning",     scene: "final_choice" }                    // 最後一天：喚醒或留下 → 結局
  ],

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
   * gift：每月 14 日（2/14、3/14 是節日）跳出送禮選單：送給一位 → 好感 +aff；請 A 送給 B → 兩人關係 +pair
   * weekend：星期日選人：intro = 開場劇情；見一位 → 好感 +single；見兩位 → 各 +pairAff、兩人關係 +pairBond
   *   scenes：[{ with: ["m1"] 或 ["m1", "m2"], scene, if }]；沒寫到的組合用一句話帶過；home = 待在家的劇情
   */
  plan: {
    planFrom: "09-08",
    affTotal: 6,
    pairTotal: 15,
    wanderMeet: 2,
    activities: [
      { id: "club",      label: "社團活動" },
      { id: "volunteer", label: "志工活動" },
      { id: "sports",    label: "體育館" },
      { id: "council",   label: "學生會" },
      { id: "games",     label: "網咖" },
      { id: "karaoke",   label: "KTV" },
      { id: "wander",    label: "閒晃" }
    ],
    specials: [
      // 例：{ activity: "council", if: { visits: { council: ">=5" } }, scene: "sp_council_5" },
      //     { activity: "sports", if: { pair: { "m3-m4": ">=100" } }, scene: "sp_m3_m4" },
      //     { activity: "club", date: "10-15", title: "社團發表會", scene: "sp_club_show" }
    ],
    holidays: [
      { date: "01-01", title: "元旦",       scene: "h0101" },
      { date: "12-24", title: "平安夜",     scene: "h1224" },
      { date: "12-25", title: "聖誕節",     scene: "h1225" },
      { date: "02-14", title: "情人節",     scene: "h0214" },
      { date: "03-14", title: "白色情人節", scene: "h0314" }
    ],
    gift: { aff: 6, pair: 15 },
    weekend: { intro: "weekend_intro", single: 6, pairAff: 3, pairBond: 15, scenes: [], home: [] }
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
    awake: 3
  },

  /* ---------- 結局 ----------
   * 主線劇情裡寫 { ending: "結局id" } → 那段劇情結束後進入結局：
   *   播 scene（結局劇情）→ 依序播 epilogues 裡條件成立的後日談 → 結局畫面（END＋title；點一下畫面回到手機，重新開始只能在設定裡選）
   *   after："explore" = 回到手機後只能探索 App、不再換天；"continue" = 照常過日子
   *   epilogues：[{ id, title（結局畫面、圖鑑顯示的名稱）, scene, if }]
   * 看過的結局、後日談記在「設定 → 結局圖鑑」，重新開始也不會清掉；結局會記錄旗標 ending_結局id
   */
  endings: {
    awaken: {
      title: "醒來", text: "大家都回到了屬於自己的時間。", scene: "ending_awaken", after: "explore",
      epilogues: [
        { id: "m1_lover", title: "大﨑将太郎・戀人", scene: "ep_m1_lover", if: { lover: "m1" } },
        { id: "m1_friend", title: "大﨑将太郎・朋友", scene: "ep_m1_friend", if: { notLover: "m1", aff: { m1: ">=30" } } },
        { id: "m2_m3", title: "宋恩奭 × 鄭成燦", scene: "ep_m2_m3", if: { couple: "m2-m3" } }
      ]
    },
    stay: {
      title: "留下", text: "這段時光，會一直持續下去。", scene: "ending_stay", after: "continue",
      epilogues: [
        { id: "m1_lover", title: "大﨑将太郎・戀人", scene: "ep_m1_lover", if: { lover: "m1" } },
        { id: "m2_m3", title: "宋恩奭 × 鄭成燦", scene: "ep_m2_m3", if: { couple: "m2-m3" } }
      ]
    }
  },

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
    alarm: { time: "7:00", label: "鬧鐘", snooze: "稍後提醒", stop: "滑動來停止", snoozeMs: 4000 }
    // 設定 App 的文字可以在 settingsText: { … } 裡改（預設值寫在 js/apps/settings.js 的 T_DEFAULT）
  },

  /* ---------- 手機密碼鎖（每次打開網址都要先輸入；留空 "" = 不鎖） ---------- */
  lock: {
    passcode: "birthday",        // "birthday" = 玩家的生日（月月日日，例如 10/14 → 1014）；也可以直接寫數字
    title: "輸入密碼",
    deleteLabel: "刪除",
    cancelLabel: "取消",
    // 鎖定畫面（輸入密碼前）：上方的字；KakaoTalk 有未讀訊息時會顯示通知，點了解鎖後直接打開那個聊天室
    swipeText: "滑動以解鎖"
  },

  /* ---------- 手機首頁 ---------- */
  home: {
    wallpaper: PH,
    // 上方的行事曆小工具：日期、月曆跟著現實的日期走；點月曆上的日期 → 左邊顯示那天的行程
    //   events = 行程：title = 文字、color = 顏色條、textColor = 文字顏色
    //   if = 條件（格式見上面 cast 的說明），不成立就不顯示這個行程
    //   date 可寫 "10-1"（每年 10/1）、"2026-10-1"（只有那天）、"15"（每個月 15 號）、
    //        "星期五" 或 "fri"（每個星期五）；不寫 = 每天都顯示
    //   noEvents = 那天沒有行程時顯示的字（不寫 = 空白）
    //   想改顯示的字：weekdays（星期日～六）、months（一月～十二月）、weekHeads（一～日）
    calendar: {
      events: [
        { title: "每月 15 號的行程", date: "15", color: "#ff9500" },
        { title: "星期五的行程", date: "星期五", color: "#34c759" }
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
   * 這一段本身 = 帳號「shotaroo0」，同時放全部帳號共用的文字設定。
   * otherAccounts = 其他帳號；有寫 password 的可以從「新增帳號」登入。
   */
  instagram: {
    defaultAccount: "account_a",   // 打開 IG 時已經登入的帳號
    username: "shotaroo0",
    password: "0000",              // 從「新增帳號」輸入對的帳號＋密碼才登得進去
    private: true,                 // 非公開帳號：沒追蹤的人看不到貼文、限時、名單
    cast: "m1",                    // 成員帳號：名字、大頭照用 cast 的（不寫 cast → 用 avatar、name；沒有名字 → 顯示帳號 id）
    // 貼文數、粉絲、追蹤會自動計算；想顯示固定數字就加 postsCount / followersCount / followingCount
    closeFriendsList: [],
    following: ["account_a"],
    postsLabel: "貼文",
    followersLabel: "位粉絲",
    followingLabel: "追蹤中",
    bio: ["簡介第一行", "簡介第二行 @account_a"],   // @帳號 會變成連結
    music: { title: "歌名", artist: "歌手" },        // 個人頁音樂列；加 file: "audio/xxx.mp3" 才能播放
    saved: ["account_a/0"],        // 預先儲存的貼文（"帳號/貼文編號"，從 0 開始）
    editProfileLabel: "編輯個人檔案",
    shareProfileLabel: "分享個人檔案",
    // 精選動態：image = 圓圈封面，stories = 點進去看到的內容
    highlights: [
      { image: PH, label: "精選",
        stories: [
          // notes：好幾則留言輪流顯示，點一下打開全部（by 不寫 = 帳號主人自己）
          { image: PH, time: "1月1日", notes: [{ text: "留言 1" }, { text: "留言 2", by: "account_a" }] },
          { image: PH, time: "1月2日", note: "單則留言" }
        ] }
    ],
    posts: [
      { images: [PH], caption: "貼文內文", time: "1月2日" },
      { images: [PH, PH], caption: "多張照片的貼文（左右滑）", time: "1月1日" }
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
      {
        username: "account_a",
        password: "0000",
        avatar: PH,
        name: "帳號 A",
        following: ["seokkkk"],
        // 粉絲／追蹤中名單：寫帳號 id = 遊戲裡的帳號（可點進去）；{ username, name, avatar } = 路人
        followersList: [
          "shotaroo0",
          "seokkkk",
          { username: "passerby_1", name: "路人 1", avatar: PH },
          { username: "passerby_2", name: "路人 2" }
        ],
        followingList: [
          "seokkkk",
          { username: "passerby_1", name: "路人 1", avatar: PH }
        ],
        // 摯友名單：寫在這裡的帳號才看得到 closeFriends: true 的限時動態
        closeFriendsList: ["seokkkk", "passerby_1"],
        saved: [],
        // 典藏：stories = 過期的限時動態；posts = 下架的貼文
        archive: {
          stories: [
            { image: PH, time: "2025年12月31日" },
            { image: PH, time: "2025年12月31日", closeFriends: true }
          ],
          posts: [
            { images: [PH], caption: "典藏的貼文", time: "2025年12月1日" }
          ]
        },
        bio: ["帳號 A 的簡介"],
        music: { title: "歌名", artist: "歌手" },
        // 目前的限時動態（頭像外圈）
        story: [
          { image: PH, time: "1小時" },
          { image: PH, time: "30分鐘", closeFriends: true, likedBy: ["seokkkk"] }
        ],
        highlights: [
          { image: PH, label: "精選 1",
            stories: [
              { image: PH, time: "2025年12月1日" },
              { image: PH, time: "2025年12月2日", note: "限動留言", pos: "50% 50%" }
            ] },
          { image: PH, label: "精選 2", stories: [{ image: PH, time: "2025年12月3日" }] }
        ],
        posts: [
          {
            images: [PH, PH, PH],
            caption: "貼文內文\n第二行",
            time: "1月3日",
            likedBy: { name: "seokkkk" },   // 「seokkkk 說讚」
            comments: [
              { user: "seokkkk", text: "留言", time: "1天" },
              { user: "passerby_1", avatar: PH, text: "路人的留言", time: "1天" }
            ],
            tagged: ["seokkkk"]
          },
          { images: [PH], caption: "", time: "1月2日" },
          { images: [PH], caption: "", time: "1月1日" }
        ],
        reposts: []
      },
      {
        username: "seokkkk",
        password: "0000",
        cast: "m2",
        following: ["account_a"],
        closeFriendsList: ["account_a"],
        bio: ["帳號 C 的簡介"],
        highlights: [],
        posts: [
          { images: [PH], caption: "帳號 C 的貼文", time: "1月1日" }
        ],
        reposts: ["account_a/1"]   // 轉發的貼文（"帳號/貼文編號"）
      }
    ],
    // 只能從名單點進去看、不能登入的帳號（不寫 password）
    searchOnlyAccounts: [
      { username: "sungchan913", cast: "m3", private: true, posts: [] },
      { username: "bin032", cast: "m4", private: true, posts: [] },
      { username: "252525252_", cast: "m5", private: true, posts: [] },
      { username: "antonnie", cast: "m6", private: true, posts: [] }
    ]
  },

  /* ---------- 相簿（iPhone「照片」風格） ----------
   * photos：所有照片，照時間「舊 → 新」排（圖庫最下面是最新的）；每張的編號 = 在這個清單的位置（從 0 開始）
   *   image = 圖片或影片路徑（.mp4 = 影片，再寫 duration: "0:15" 顯示長度）
   *   date = "2026年1月1日"（年／月分組用）、time = "下午 3:20"、place = 地點、device = 拍攝裝置、caption = 說明
   *   favorite: true = 預設在「個人收藏」；hidden: true = 只在「已隱藏」相簿
   * albums：自己建的相簿（photos 寫照片編號）
   * hiddenPasscode：打開「已隱藏」相簿要輸入的密碼（留空 "" = 不鎖）；解開時記錄旗標 photos_hidden_unlocked
   */
  photos: {
    hiddenPasscode: "0000",
    photos: [
      { image: PH, date: "2025年6月1日", time: "上午 10:12", place: "地點 A" },
      { image: PH, date: "2025年6月1日", time: "上午 10:15" },
      { image: PH, date: "2025年8月20日", time: "下午 6:40", favorite: true },
      { image: PH, date: "2025年12月24日", time: "下午 8:03", place: "地點 B", caption: "照片說明" },
      { image: PH, date: "2025年12月31日", time: "下午 11:59", hidden: true },
      { image: PH, date: "2026年1月1日", time: "上午 12:00", favorite: true },
      { image: PH, date: "2026年1月1日", time: "上午 9:30", device: "iPhone" },
      { image: PH, date: "2026年1月1日", time: "下午 2:45" }
    ],
    albums: [
      { id: "a1", name: "相簿 1", photos: [0, 1, 3] },
      { id: "a2", name: "相簿 2", photos: [5, 6, 7] }
    ]
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
   * tweets：照時間軸順序（新的在上面）
   *   id（不要重複）、by（誰發的）、text（@帳號、#標籤 會變藍色）、images（最多 4 張）、
   *   time（時間軸上的「1小時」）、date（內頁的「下午 12:32 · 2026/9/1」）、retweets、likes、
   *   liked / retweeted: true = 玩家一開始就按過、retweetedBy = 顯示「xxx 已轉推」
   *   replies：[{ by, text, time, replyTo, images }]；replyTo = 回覆誰（不寫 = 回覆發文的人），
   *     下一則回覆的是上一則的人時，兩則會用直線連起來（回覆串）
   */
  x: {
    me: "my_account",
    accounts: [
      { handle: "my_account", name: "我的帳號", avatar: PH, bio: "簡介",
        followersList: ["shotaroo0", { handle: "passerby_1", name: "路人 1", avatar: PH, bio: "路人的簡介" }] },
      { handle: "shotaroo0", cast: "m1", banner: PH, followed: true,
        bio: "使用者 A 的簡介 #標籤", following: 120, followers: "1.2萬",
        followingList: ["my_account", "seokkkk", { handle: "passerby_1", name: "路人 1", avatar: PH }],
        followersList: ["seokkkk", { handle: "passerby_2", name: "路人 2" }],
        likes: ["t2"], retweets: [] },
      { handle: "seokkkk", cast: "m2", protected: true, followed: true, bio: "鎖帳", following: 30, followers: 41,
        likes: ["t1", "t4"] },
      { handle: "sungchan913", cast: "m3", protected: true, bio: "鎖帳（沒跟隨）", following: 8, followers: 9 },
      { handle: "bin032", cast: "m4", protected: true, bio: "", following: 0, followers: 0 },
      { handle: "252525252_", cast: "m5", protected: true, bio: "", following: 0, followers: 0 },
      { handle: "antonnie", cast: "m6", protected: true, bio: "", following: 0, followers: 0 }
    ],
    tweets: [
      { id: "t1", by: "shotaroo0", text: "貼文內容\n第二行 @seokkkk #標籤", images: [PH], time: "1小時", date: "下午 12:32 · 2026/9/1",
        retweets: 18, likes: 457,
        replies: [
          { by: "seokkkk", text: "回覆 1", time: "6秒" },
          { by: "shotaroo0", text: "回覆 2（回覆串）", time: "2秒", replyTo: "seokkkk" }
        ] },
      { id: "t2", by: "seokkkk", text: "鎖帳的貼文", time: "3小時", date: "上午 9:15 · 2026/9/1", likes: 4, liked: true },
      { id: "t3", by: "sungchan913", text: "看不到的貼文", time: "5小時", date: "上午 7:00 · 2026/9/1" },
      { id: "t4", by: "shotaroo0", text: "多張照片", images: [PH, PH], time: "1天", date: "下午 8:00 · 2026/8/31", retweets: 2, likes: 30, retweetedBy: "seokkkk" }
    ]
    // 介面文字可以在 text: { … } 裡改（預設值寫在 js/apps/x.js 的 T_DEFAULT）
  },

  /* ---------- 備忘錄 ----------
   * notes：第一行 = 標題；date = "2026年1月1日"、time = "下午 3:20"
   *   pinned: true = 放在「已釘選」；locked: true = 要輸入 passcode 才看得到（解開時記錄旗標 note_備忘錄id）
   *   lockedTitle：鎖住時列表上顯示的標題（不寫 = 照樣顯示第一行）
   * 玩家可以直接改內容、新增、刪除（存在瀏覽器）
   */
  notes: {
    passcode: "0000",
    notes: [
      { id: "n1", text: "釘選的備忘錄\n第二行會顯示在列表上", date: "2026年1月1日", time: "上午 10:00", pinned: true },
      { id: "n2", text: "鎖住的備忘錄\n要輸入密碼才看得到", date: "2025年12月31日", time: "下午 11:00", locked: true },
      { id: "n3", text: "一般備忘錄\n內容", date: "2025年12月1日", time: "下午 3:20" }
    ]
  },

  /* ---------- KakaoTalk ---------- */
  kakao: {
    passcode: "0000",              // 進入 KakaoTalk 的密碼；留空 "" = 不用密碼
    // 「今天」= 遊戲裡的日期（game.startDate 開始，每睡一覺 +1 天）
    // 나와의 채팅（自己傳給自己）
    me: {
      name: "我",
      avatar: PH,
      messages: [
        { date: "2025年12月1日" },
        { from: "me", text: "自己的筆記", time: "下午 11:33" }
      ]
    },
    // 即時訊息：達成 when 的旗標後，過 delay 毫秒對方傳來（會跳通知橫幅）
    //   when 可寫一個旗標或陣列（全部達成）；unlessReplied: true = 玩家在那個聊天室回過話就不傳
    //   unless = 有這個旗標就不傳；unlessSent = 某則即時訊息已傳過就不傳
    //   if = 條件（好感度、天數…，格式見 cast 的說明），成立才會傳
    //   常用旗標：phone_unlocked（解鎖手機）、kakao_unlocked、chat_聊天室id、login_帳號、public_帳號
    live: [
      { id: "demo1", when: "phone_unlocked", delay: 8000, room: "f1", text: "即時訊息測試" }
    ],
    // 來電：達成 when 的旗標後過 delay 毫秒，room 這個好友打來（任何畫面都會跳出來；手機解鎖後才會響）
    //   ringFor = 響多久沒接就算未接（預設 30 秒）
    //   branch：依玩家有沒有在那個聊天室回過話，選開頭段落 { replied: "段落", notReplied: "段落" }；不寫 = 從 start 開始
    //   拒接或沒接 → 記錄 declineFlag，聊天室多一則未接來電
    //   if = 條件，成立才會打來；段落、選項可以寫 effects（套用效果），選項可以寫 if（條件不成立就不出現）
    // 例：{ id: "call1", when: "chat_f2", delay: 10000, room: "f2", declineFlag: "call1_declined",
    //       start: "s", nodes: { s: { lines: [{ who: "them", text: "…" }] } } }
    incoming: [
      { id: "demoCall", when: "chat_f2", delay: 6000, room: "f2",
        start: "s", nodes: { s: { lines: [{ who: "them", text: "來電測試" }, { who: "them", text: "掰掰" }] } } }
    ],
    noAnswerMs: 8000,              // 打給沒有劇本的好友，響多久後顯示「對方未接聽」
    friends: [
      {
        id: "f1",                     // 不要重複（用於網址）
        cast: "m1",                   // 成員：名字、大頭照用 cast 的
        status: "",
        unread: 1,                    // 一開始顯示的未讀數
        // 訊息種類：文字 text、照片 image、影片 video、語音通話 call: "voice"（duration 沒寫 = 未接；cancelled: true = 已取消）、
        // 收回 recalled: true、過期照片 expired: true、過期影片 expired: "video"、連結 link（＋ linkTitle、linkSite）
        // read: true = 對方已讀（我傳的訊息旁不顯示 1）
        messages: [
          { date: "2025年12月30日" },
          { from: "them", text: "文字訊息", time: "下午 8:34" },
          { from: "me", image: PH, time: "下午 8:48" },
          { from: "me", text: "我傳的訊息", time: "下午 8:48" },
          { from: "them", expired: true, time: "下午 8:50" },
          { from: "them", recalled: true, time: "下午 8:51" },
          { from: "me", call: "voice", duration: "3:21", time: "下午 9:00" },
          { from: "them", call: "voice", time: "下午 9:10" },
          { date: "2025年12月31日" },
          { from: "them", link: "https://example.com", linkTitle: "連結標題", linkSite: "example.com", time: "上午 10:00" },
          { from: "me", text: "最後一則", time: "上午 10:05" }
        ],
        // 關鍵字自動回覆：玩家傳的訊息「包含」任一個 keywords 就回 reply（可多句，依序送出）
        //   flag = 達成這個旗標後才有效；exclude = 包含這些字就不算；keywords 留空 = 任何訊息都算
        //   if = 條件（格式見 cast 的說明）；effects = 回覆成立時套用的效果（好感度…）
        //   read: true = 秒讀；typing: [毫秒, 毫秒…] = 「輸入中」顯示／消失輪流
        replies: [
          { keywords: ["你好", "hi"], read: true, typing: [1500], reply: ["你好！"], effects: { aff: { m1: 1 } } }
        ],
        // 打給這個好友時的通話劇本（沒寫 = 打過去會「對方未接聽」）
        //   ringMs = 響多久才接
        //   也可以寫成清單 [ { flag: "旗標", … }, { … } ]：用第一個 flag 已達成（或沒寫 flag）的那個
        //   每個劇本也可以寫 if（條件）；段落、選項可以寫 effects，選項可以寫 if（不成立就不出現）
        //   nodes 的格式：lines（who = "them" / "me"、text、sub）、choices（label、next、hangup、say: false）、
        //   flag（走到這段記錄旗標）、沒有 choices 的段落講完自動掛斷（waitMs、endFlag）
        call: {
          ringMs: 3000,
          start: "greet",
          nodes: {
            greet: {
              lines: [{ who: "them", text: "喂？", sub: "字幕下的小字" }],
              choices: [
                { label: "選項 A", next: "a", effects: { aff: { m1: 2 } } },          // 選了 → 大﨑将太郎 好感 +2
                { label: "選項 B（不說出口）", say: false, next: "b" },
                { label: "只有大﨑将太郎 好感 ≥ 5 才出現的選項", next: "a", if: { aff: { m1: ">=5" } } },
                { label: "（直接掛斷）", hangup: true, effects: { aff: { m1: -1 } } }
              ]
            },
            a: { lines: [{ who: "them", text: "選了 A" }, { who: "me", text: "玩家的話" }] },
            b: { lines: [{ who: "them", text: "選了 B" }], endFlag: "call_f1_done", effects: { pair: { "m1-m2": 1 } } }
          }
        },
        defaultReply: []              // 沒有符合任何關鍵字時的回覆；空的 = 不回
      },
      {
        id: "f2",
        cast: "m2",                   // 成員：名字、大頭照用 cast 的
        status: "",
        unread: 0,
        messages: [
          { date: "2025年12月1日" },
          { from: "me", text: "訊息", time: "下午 4:24" },
          { from: "them", text: "訊息", time: "下午 4:30" }
        ],
        replies: [],
        defaultReply: ["自動回覆"]
      },
      {
        id: "f3",
        cast: "m3",                   // 成員：名字、大頭照用 cast 的
        status: "",
        unread: 0,
        messages: [],
        // 選項式回覆：從上往下找第一組「還沒用過、if 成立」的選項，顯示在輸入框上面
        //   選項排成一行（太多可以左右滑）；點選項 → 文字放進輸入框（不能修改；點別的選項 = 換掉），按送出才傳
        //   有選項時玩家不能自己打字；每組只能選一次
        //   options：text = 回覆的文字、effects = 效果、flag = 選了記錄的旗標、
        //            reply = 對方的回覆（可多句；寫 { text, flag } 可以在那句傳來時記錄旗標）、read: true = 秒讀、typing = 輸入中的時間
        //   即時訊息（live）也可以寫 flag：傳來時記錄旗標，用來讓下一組選項出現
        choices: [
          { id: "c3_1", options: [
            { text: "今天謝謝你！", effects: { aff: { m3: 2 } }, read: true, typing: [1500], reply: [{ text: "不客氣～", flag: "c3_round2" }] },
            { text: "嗯", effects: { aff: { m3: -1 } }, reply: [{ text: "……好吧", flag: "c3_round2" }] },
            { text: "你也是今天的值日生嗎？", reply: [{ text: "對啊ㅋㅋ", flag: "c3_round2" }] }
          ] },
          { id: "c3_2", if: { flag: "c3_round2" }, options: [
            { text: "明天見", reply: ["明天見！"] },
            { text: "晚安", effects: { aff: { m3: 1 } }, reply: ["晚安😊"] }
          ] }
        ],
        replies: [],
        defaultReply: []
      },
      {
        id: "f4",
        cast: "m4",
        status: "",
        unread: 0,
        messages: [],
        replies: [],
        defaultReply: []
      },
      {
        id: "f5",
        cast: "m5",
        status: "",
        unread: 0,
        messages: [],
        replies: [],
        defaultReply: []
      },
      {
        id: "f6",
        cast: "m6",
        status: "",
        unread: 0,
        messages: [],
        replies: [],
        defaultReply: []
      }
    ],
    // 群組：activity 寫日程 id = 自動放進那個日程會出現的成員（cast 的 activities），名字用日程名稱
    //   也可以不寫 activity，改寫 members（好友 id）；訊息的 from 寫好友 id（或 "me"）；name 留空 = 自動用成員名字
    // replies 的 reply 可以寫 { from: "f3", text: "..." } 指定誰回
    groups: [
      { id: "g_club", activity: "club", unread: 0, messages: [], replies: [], defaultReply: [] },   // 社團活動
      { id: "g_volunteer", activity: "volunteer", unread: 0, messages: [], replies: [], defaultReply: [] },   // 志工活動
      { id: "g_sports", activity: "sports", unread: 0, messages: [], replies: [], defaultReply: [] },   // 體育館
      { id: "g_council", activity: "council", unread: 0, messages: [], replies: [], defaultReply: [] },   // 學生會
      { id: "g_games", activity: "games", unread: 0, messages: [], replies: [], defaultReply: [] },   // 網咖
      { id: "g_karaoke", activity: "karaoke", unread: 0, messages: [], replies: [], defaultReply: [] }   // KTV
    ],
    // 介面文字
    text: {
      lockTitle: "輸入密碼",
      lockHint: "請輸入密碼。",
      lockDelete: "刪除",
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
