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
  cast: [
    { id: "m1", name: "大﨑将太郎", birthday: "11-25", activities: ["club", "council", "games"], avatar: "images/cast/m1.jpg" },
    { id: "m2", name: "宋恩奭",     birthday: "03-19", activities: ["volunteer", "council", "games"], avatar: "images/cast/m2.jpg" },
    { id: "m3", name: "鄭成燦",     birthday: "09-13", activities: ["council", "sports", "karaoke"], avatar: "images/cast/m3.jpg" },
    { id: "m4", name: "朴元彬",     birthday: "03-02", activities: ["club", "council", "sports"], avatar: "images/cast/m4.jpg" },
    { id: "m5", name: "李炤熙",     birthday: "11-21", activities: ["club", "council", "karaoke", "games"], avatar: "images/cast/m5.jpg" },
    { id: "m6", name: "李燦榮",     birthday: "03-21", activities: ["volunteer", "council", "sports", "karaoke"], avatar: "images/cast/m6.jpg" }
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
  // 標題畫面（js/title.js）：name = 遊戲名稱、subtitle = 副標、bg = 背景（不寫 = 主畫面桌布）
  title: { name: "RiiiiZE", subtitle: "拉完子學院", bg: "" },
  storySpeed: 22,                // 文字逐字出現的速度（每個字幾毫秒，越小越快）
  storyBg: "images/bg/school.jpg",   // 劇情的預設背景（手機以外的畫面都用這張）；劇情裡寫 { bg: "…" } 可以換，{ bg: "phone" } = 直接看到手機畫面
  // 第一次遊玩的開場（js/intro.js）：打開這些 App 就結束自由探索、開始 9/1
  //   seeMs = 探索時看到成員的照片多久（毫秒）就想起來、結束探索（KakaoTalk 一打開、IG／X 成員主頁、相簿裡寫了 cast 的照片）
  //   dayTime = 開場結束、進入 9/1 時手機上的時間
  intro: { seeMs: 1000, dayTime: "7:58" },
  scenes: {
    // ↓ 開場：解鎖手機後在主畫面上播（bg: "phone-dim" = 看得到手機畫面但變暗）
    intro_wake: [
      { bg: "phone-dim" },
      { who: "me", text: "？？？" },
      { who: "me", text: "這是我手機沒錯啊......我睡懵了嗎......" },
      { wait: 1000 },
      { who: "me", text: "我的破塔呢怎麼被刪了！！！" },
      { text: "尚未完全清醒的你勉強將自己身子從床上撐起，抬眼環顧四周，發現不只是手機，身旁是充滿熟悉感、讓人安心，卻又完全陌生的裝潢。" },
      { who: "me", text: "......" },
      { who: "me", text: "還是睡回去好了看起來也不是穿越到有錢人家抱歉我來錯地方了系統呢你在哪快送我回家。" },
      { text: "雖然這麼想著，但你還是下意識地摸索起了手機，試圖從中找出一些線索。" }
    ],
    // 開場自由探索時，點行事曆上成員生日的那天
    // 9/7 晚上，打開客服小精靈的聊天室時先播（背景是變暗的手機畫面）
    helper_intro: [
      { text: "群組安靜下來後，手機又震了一下。" },
      { text: "一個你不記得什麼時候加過的好友——「客服小精靈」，傳來了新訊息。" },
      { text: "這裡是遊戲的說明小幫手。玩法說明、進度提醒，之後都會傳到這個聊天室。" },
      { text: "想不起來怎麼玩的時候，隨時回來看看吧。" }
    ],
    intro_bday: [ { bg: "phone-dim" }, { who: "me", text: "怎麼在這個世界我還在追拉完子==" } ],
    // 開場自由探索時，打開 IG、相簿、KakaoTalk → 播完畫面變黑、顯示 9/1 → 9/1 主線
    intro_end: [
      { bg: "phone-dim" },
      { text: "你被手機畫面中的照片吸引了注意力。" },
      { who: "me", text: "啊！" },
      { text: "回憶如海水般灌進腦袋，你終於想起了自己的身份。" },
      { text: "你，{name}，是拉完子學院的學生，今年就讀的第二年，而今天則是開學日。" },
      { text: "你感到頭一陣劇痛，好像想起了什麼，同時有什麼被遺忘了。", headache: true },
      { who: "me", text: "呃......" },
      { who: "me", text: "不管了......趕緊出門吧。" },
      { who: "me", text: "我可不想開學第一天就遲到啊啊啊" }
    ],
    // ↓ 主線：開學第一週（9/1～9/7）
    d0901: [
      { text: "你匆匆忙忙地奔跑進入校園，手機時間顯示7:58。" },
      { text: "嘴裡叼著的吐司軟趴趴的，你覺得現在的自己比起日本美少女高中生更像快流下口水的狗，嘴巴用力得發酸。" },
      { text: "下一秒，日本美少女高中生必經的劇情發生了。" },
      { text: "咚！", shake: true },
      { text: "在跑過走廊轉角時，你一頭撞上了直行的那個人。" },
      { text: "在你重心不穩屁股即將落地前，餘光中你瞥見了對方柔順的黑髮。" },
      { text: "隱約地還聞到了一絲香氣。有些強烈，但又不會讓人不舒服的那種。" },
      { who: "me", text: "呃好痛——！" },
      { who: "m4", text: "你、你還好嗎？" },
      // （朴元彬出場動畫：待放入）
      { who: "me", text: "好個屁^^！我屁股要爛了55555" },
      { text: "怨天尤人了好一陣子之後，你才緩緩抬頭——" },
      { who: "me", text: "喔天吶是朴、朴元彬！" },
      { text: "你的頭又傳來一陣劇痛。", headache: true },
      { who: "me", text: "是元彬啊......好久沒見了！拍謝啦剛剛太急了才(<ゝω・)☆" },
      { who: "m4", text: "......" },
      { text: "認出是你後，你感覺朴元彬好像翻了你一個白眼。" }
      // （待更......）
    ],
    d0902: [ { text: "（9/2 放學：學生會（強制日程）待寫）" } ],
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
      // 有人還沒覺醒 → 直接進 DREAM END 2
      { goto: "dream2", if: { allAwake: false } },
      { text: "——全部都想起來了。" },
      { text: "這裡不是真正的高中。他們早就長大了，只是被困在這段時間裡。" },
      { choices: [
        { text: "喚醒大家", goto: "true" },
        { text: "讓大家留在這裡", goto: "dream1" }
      ] },
      { label: "true" }, { text: "（喚醒六人：待寫）" }, { ending: "true" },
      { label: "dream1" }, { text: "（選擇留下：待寫）" }, { ending: "dream1" },
      { label: "dream2" }, { text: "（還有人沒有醒來，一年又要結束了：待寫）" }, { ending: "dream2" }
    ],
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
    // 大﨑将太郎（身體跟不上自己）
    awake_m1_1: [ { text: "（大﨑将太郎・第一階段：異常察覺。待寫）" } ],
    awake_m1_2: [ { text: "（大﨑将太郎・第二階段：記憶浮現。待寫）" } ],
    awake_m1_3: [ { text: "（大﨑将太郎・第三階段：認知與接受。待寫）" } ],
    // 宋恩奭（看見憾事卻無能為力）
    awake_m2_1: [ { text: "（宋恩奭・第一階段：異常察覺。待寫）" } ],
    awake_m2_2: [ { text: "（宋恩奭・第二階段：記憶浮現。待寫）" } ],
    awake_m2_3: [ { text: "（宋恩奭・第三階段：認知與接受。待寫）" } ],
    // 鄭成燦（失去生活中的火花）
    awake_m3_1: [ { text: "（鄭成燦・第一階段：異常察覺。待寫）" } ],
    awake_m3_2: [ { text: "（鄭成燦・第二階段：記憶浮現。待寫）" } ],
    awake_m3_3: [ { text: "（鄭成燦・第三階段：認知與接受。待寫）" } ],
    // 朴元彬（善良成為被利用的理由）
    awake_m4_1: [ { text: "（朴元彬・第一階段：異常察覺。待寫）" } ],
    awake_m4_2: [ { text: "（朴元彬・第二階段：記憶浮現。待寫）" } ],
    awake_m4_3: [ { text: "（朴元彬・第三階段：認知與接受。待寫）" } ],
    // 李炤熙（努力與成果不再屬於自己）
    awake_m5_1: [ { text: "（李炤熙・第一階段：異常察覺。待寫）" } ],
    awake_m5_2: [ { text: "（李炤熙・第二階段：記憶浮現。待寫）" } ],
    awake_m5_3: [ { text: "（李炤熙・第三階段：認知與接受。待寫）" } ],
    // 李燦榮（無法突破極限，也無法被看見）
    awake_m6_1: [ { text: "（李燦榮・第一階段：異常察覺。待寫）" } ],
    awake_m6_2: [ { text: "（李燦榮・第二階段：記憶浮現。待寫）" } ],
    awake_m6_3: [ { text: "（李燦榮・第三階段：認知與接受。待寫）" } ],
    // 三個結局的劇情（endings 的 scene）
    ending_true: [ { text: "（TRUE END：六人重新面對現實。待寫）" } ],
    ending_dream1: [ { text: "（DREAM END 1：七人選擇留在這段時光。待寫）" } ],
    ending_dream2: [ { text: "（DREAM END 2：沒能喚醒所有人。待寫）" } ]
    // 後日談（endings 的 epilogues）也寫在這裡，例如 ep_xxx: [ … ]
  },
  story: [
    { date: "09-01", phase: "morning",     scene: "d0901" },                          // 開學
    { date: "09-02", phase: "afterschool", scene: "d0902", activity: "council" },     // 強制日程：學生會
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
    // bg = 這個日程的背景（一句話、特殊劇情、主線強制日程的劇情都用它；劇情裡寫 { bg } 會換掉；沒寫就用 storyBg）
    activities: [
      { id: "club",      label: "社團活動", cell: "社團|活動", bg: "images/bg/club.jpg" },
      { id: "volunteer", label: "志工活動", cell: "志工|活動", bg: "images/bg/volunteer.jpg" },
      { id: "sports",    label: "體育館",   bg: "images/bg/sports.jpg" },
      { id: "council",   label: "學生會",   bg: "images/bg/council.jpg" },
      { id: "games",     label: "網咖",     bg: "images/bg/games.jpg" },
      { id: "karaoke",   label: "KTV",      bg: "images/bg/karaoke.jpg" },
      { id: "wander",    label: "閒晃",     bg: "images/bg/wander.jpg" }
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
    homeBg: "images/bg/home.jpg",   // 回家、星期日待在家的背景
    weekend: { bg: "images/bg/wander.jpg", intro: "weekend_intro", single: 6, pairAff: 3, pairBond: 15, scenes: [], home: [] }
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
      epilogues: []
    },
    // 六人都覺醒、選擇留下：七人繼續留在學院的一年
    dream1: {
      title: "DREAM END 1", text: "七人選擇留在這段美好的時光。", scene: "ending_dream1", after: "loop",
      epilogues: []
    },
    // 8/31 時有人還沒覺醒：沒有選擇，直接進入這個結局
    dream2: {
      title: "DREAM END 2", text: "還有人沒有醒來。", scene: "ending_dream2", after: "loop",
      epilogues: []
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
      events: []
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
      { username: "seokkkk",     cast: "m2", name: "BLACK SHADOW", private: true, following: others(IG_ALL, "seokkkk"),     bio: [], highlights: [], reposts: [],
        posts: [
          { images: ["images/ig/eunseok_20250709_1.jpg", "images/ig/eunseok_20250709_2.jpg", "images/ig/eunseok_20250709_3.jpg", "images/ig/eunseok_20250709_4.jpg"], caption: "", time: "7月9日" }   // 第一篇（2025/7/9）
        ] },
      { username: "sungchan913", cast: "m3", name: "🦌", private: true, following: others(IG_ALL, "sungchan913"), bio: [], highlights: [], reposts: [],
        posts: [
          { images: ["images/ig/sungchan_20250503_1.jpg", "images/ig/sungchan_20250503_2.jpg"], caption: "", time: "5月3日" }   // 第一篇（2025/5/3）
        ] },
      { username: "bin032",      cast: "m4", name: "원빈", private: true, following: others(IG_ALL, "bin032"),      bio: [], highlights: [], reposts: [],
        posts: [
          { images: ["images/ig/wonbin_20250603_1.jpg", "images/ig/wonbin_20250603_2.jpg", "images/ig/wonbin_20250603_3.jpg", "images/ig/wonbin_20250603_4.jpg", "images/ig/wonbin_20250603_5.jpg"], caption: "", time: "6月3日" }   // 第一篇（2025/6/3）
        ] },
      { username: "252525252_",  cast: "m5", name: "이소희", private: true, following: others(IG_ALL, "252525252_"),  bio: [], highlights: [], reposts: [],
        posts: [
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
    photos: [],                    // 例：{ image: PH, date: "2025年8月20日", time: "下午 6:40", place: "地點" }
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
    tweets: []                     // 例：{ id: "t1", by: "shotaroo0", text: "內容", time: "1小時", date: "下午 12:32 · 2025/9/1" }
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
    notes: []                      // 例：{ id: "n1", text: "標題\n內容", date: "2025年9月1日", time: "下午 3:20", pinned: true }
  },

  /* ---------- KakaoTalk ---------- */
  kakao: {
    passcode: "",                  // 進入 KakaoTalk 的密碼；留空 "" = 不用密碼
    // 「今天」= 遊戲裡的日期（game.startDate 開始，每睡一覺 +1 天）
    // 即時訊息：達成 when 的旗標後，過 delay 毫秒對方傳來（會跳通知橫幅）
    //   when 可寫一個旗標或陣列（全部達成）；unlessReplied: true = 玩家在那個聊天室回過話就不傳
    //   unless = 有這個旗標就不傳；unlessSent = 某則即時訊息已傳過就不傳
    //   if = 條件（好感度、天數…，格式見 cast 的說明），成立才會傳
    //   常用旗標：phone_unlocked（解鎖手機）、kakao_unlocked、chat_聊天室id、login_帳號、public_帳號
    live: [],
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
    dayChats: [
      { date: "09-01", room: "f4",          steps: [ { text: "（9/1 和元彬的聊天：待寫）" } ] },
      { date: "09-02", room: "g_council",   steps: [ { from: "f1", text: "（9/2 學生會群組的聊天：待寫）" } ] },
      { date: "09-03", room: "g_volunteer", steps: [ { from: "f2", text: "（9/3 志工活動群組的聊天：待寫）" } ] },
      { date: "09-04", room: "f3",          steps: [ { text: "（9/4 和成燦的聊天：待寫）" } ] },
      { date: "09-05", room: "g_club",      steps: [ { from: "f1", text: "（9/5 社團活動群組的聊天：待寫）" } ] },
      { date: "09-06", room: "f2",          steps: [ { text: "（9/6 和恩奭的聊天：待寫）" } ] },
      { date: "09-07", room: "g_karaoke",   steps: [ { from: "f3", text: "（9/7 KTV 群組的聊天：待寫）" } ] },
      // 9/7 KTV 群組聊完 → 客服小精靈的玩法說明（intro = 打開聊天室後先播的劇情，旁白說明這裡是什麼）
      //   同一天有好幾段時，每段要寫 id
      { id: "0907_helper", date: "09-07", room: "helper", intro: "helper_intro", steps: [
        { text: "（此為智能回覆）" },
        { text: "叮咚～晚安呀，{name}！" },
        { text: "我是客服小精靈。開學第一週辛苦了！" },
        { choices: [
          { text: "你是誰？", reply: ["我是這支手機的客服小精靈呀。", "其他的嘛……等你在這裡待久一點就知道了。"] },
          { text: "你好！", reply: ["你好你好～很高興認識你！"] }
        ] },
        { text: "從明天（9/8）開始，放學後要去哪裡，就要你自己決定囉。" },
        { text: "【每月安排】\n每個月開始時會跳出月曆，把日程方塊拖到星期一～六，一天放一個。\n沒有放的日子，放學就直接回家。" },
        { text: "可以去的地方有：社團活動、志工活動、體育館、學生會、網咖、KTV，還有到處閒晃。\n每個地方會遇到的人不一樣，遇到誰是隨機的。常去同一個地方，說不定會發生特別的事喔。" },
        { text: "【星期日】\n平日忙著上課，只有星期日能好好用手機。\n早上可以約一兩個朋友出門，或待在家休息；晚上就能自由滑手機。" },
        { text: "【每月 14 日】\n每個月 14 號可以送禮物給一個人，也可以請朋友送禮給另一個人。" },
        { text: "【存檔】\n睡覺換日時會自動存檔。\n看劇情時右上角有「存檔」，也可以到 設定 → 存檔與讀檔。" },
        { text: "今天想休息的時候，回到主畫面按「睡覺」，就會到下一天。" },
        { choices: [
          { text: "知道了，謝謝！", reply: ["不客氣～", "之後有什麼提醒，我也會傳到這裡。", "祝你在拉完子學院的生活愉快！"] },
          { text: "可以再說一次嗎？", reply: ["往上滑就看得到剛才的說明囉。", "之後有什麼提醒，我也會傳到這裡。", "祝你在拉完子學院的生活愉快！"] }
        ] }
      ] }
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
        replies: [],
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
    // 群組：activity 寫日程 id = 自動放進那個日程會出現的成員（cast 的 activities），名字用日程名稱
    //   也可以不寫 activity，改寫 members（好友 id）；訊息的 from 寫好友 id（或 "me"）；name 留空 = 自動用成員名字
    // replies 的 reply 可以寫 { from: "f3", text: "..." } 指定誰回
    groups: [
      { id: "g_club", activity: "club", unread: 0, messages: [], replies: [], defaultReply: [] },   // 社團活動
      { id: "g_volunteer", activity: "volunteer", unread: 0, messages: [], replies: [], defaultReply: [] },   // 志工活動
      { id: "g_council", activity: "council", unread: 0, messages: [], replies: [], defaultReply: [] },   // 學生會
      { id: "g_karaoke", activity: "karaoke", unread: 0, messages: [], replies: [], defaultReply: [] }   // KTV
    ],
    // 介面文字
    text: {
      olderHiddenText: "無法顯示更早的訊息",   // 成員聊天室、群組最上面的提示
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
