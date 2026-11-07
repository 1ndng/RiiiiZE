/* =========================================================
 * 2026 年 8 月：主線、節日、生日、每晚聊天、X 貼文
 * 寫法和 data.js 一樣（格式說明在 data.js 各區的註解）；這個檔案的內容會自動併進 SITE_DATA
 * ========================================================= */
RIIIZE_ADD({
  // 主線排程（data.js 的 story）
  story: [
    { date: "08-05", phase: "afterschool", scene: "g0805" },   // 8 月：九月以後呢？
    { date: "08-12", phase: "afterschool", scene: "g0812" },   // 8 月：恩奭「九月好像會又來」
    { date: "08-19", phase: "afterschool", scene: "g0819" },   // 8 月：頂樓看星星
    { date: "08-22", phase: "afterschool", scene: "g0822" },   // 8 月：漢江野餐（最後一週之前）
    { date: "08-24", phase: "afterschool", scene: "w0824" },   // 最後一週：開始（依覺醒程度不同）
    { date: "08-26", phase: "afterschool", scene: "w0826" },   // 最後一週：照片牆
    { date: "08-28", phase: "afterschool", scene: "w0828" },   // 最後一週：你聽到的對話（全員覺醒時玩家也想起來）
    { date: "08-30", phase: "morning", scene: "w0830" }   // 最後一週：時光膠囊（第二輪以後挖到上一輪的）
  ],

  // 劇情（data.js 的 scenes）
  scenes: {
    g0805: [
      { bg: "images/bg/council.jpg" },
      { text: "八月。很熱。" },
      { text: "學生會辦公室的冷氣開到最強，七個人癱在各個角落。" },
      { who: "m3", text: "……欸。" },
      { who: "m3", text: "你們有人申請大學了嗎？" },
      { text: "沒有人回答。" },
      { who: "m1", text: "……我還沒。" },
      { who: "m2", text: "……我也是。" },
      { who: "m3", text: "我也是。" },
      { who: "me", text: "（……三個人都還沒。明明平常最愛計畫東計畫西的。）" },
      { text: "三個畢業生，互相看了一眼。" },
      { who: "m3", text: "好奇怪喔。" },
      { who: "m3", text: "畢業都兩個月了，我們好像什麼都沒有做。" },
      { who: "m3", text: "每天就是來這裡、去 KTV、去網咖。好像……時間停在這裡了。" },
      { who: "m4", text: "……九月以後呢？" },
      { text: "元彬問。" },
      { text: "沒有人回答得出來。" },
      { text: "就像二月寫畢業紀念冊的時候一樣——想到「九月以後」，就像走到一面牆前面。" },
      { who: "m6", text: "……不想了啦。" },
      { text: "燦榮小聲地說，把冷氣的溫度又調低了一度。" },
      { who: "m6", text: "現在很好。現在就好。" },
      { choices: [
        { text: "「嗯，現在就好。」", effects: { aff: { m6: 2 } } },
        { text: "「……可是九月總會來的吧。」", effects: { aff: { m2: 2 } } }
      ] },
      { text: "冷氣嗡嗡地響。" },
      { text: "窗外的蟬，叫得很大聲。" }
    ],
    g0812: [
      { bg: "images/bg/wander.jpg" },
      { text: "你一個人在學校附近閒晃，經過那家鯛魚燒的小攤子。" },
      { text: "老闆說：「夏天不賣鯛魚燒啦，九月再來。」" },
      { who: "me", text: "九月……" },
      { text: "你站在空空的攤子前面，突然覺得很不安。" },
      { text: "手機響了。是恩奭。" },
      { who: "m2", text: "（電話）你在哪裡。" },
      { who: "me", text: "鯛魚燒那邊。" },
      { who: "m2", text: "（電話）……我也在附近。" },
      { text: "五分鐘後，恩奭出現了，手上拿著兩支冰棒。" },
      { text: "你們坐在路邊，一起吃冰棒。" },
      { who: "m2", text: "{name}。" },
      { who: "m2", text: "如果九月又來了，你會怎麼樣？" },
      { who: "me", text: "……什麼意思？" },
      { who: "m2", text: "我也不知道。" },
      { who: "m2", text: "只是最近一直覺得，九月好像會「又」來。" },
      { who: "m2", text: "跟去年九月一模一樣的那種，又來。" },
      { text: "冰棒在手上慢慢融化。" },
      { choices: [
        { text: "「那我們就再過一次這一年。」", effects: { aff: { m2: 2 } } },
        { text: "「不管九月怎麼來，我都會在。」", effects: { aff: { m2: 3 } } }
      ] },
      { who: "m2", text: "……嗯。" },
      { text: "恩奭沒有再說話。你們吃完冰棒，在路邊坐了很久。" }
    ],
    g0819: [
      { bg: "images/bg/school.jpg" },
      { text: "晚上，七個人偷偷爬上了學校的頂樓。" },
      { text: "是成燦提議的：「夏天的最後，要在學校的頂樓看星星。」" },
      { text: "大家躺在還有一點熱度的水泥地上，看著天空。" },
      { who: "m5", text: "……跟十月停電那次一樣。" },
      { who: "m4", text: "嗯。" },
      { who: "m1", text: "那次大家擠在窗邊。現在大家躺在一起。" },
      { who: "m6", text: "一年過得好快。" },
      { who: "m2", text: "……也好慢。" },
      { text: "過了很久，將太郎小聲地說：" },
      { who: "m1", text: "大家。" },
      { who: "m1", text: "不管以後怎麼樣，" },
      { who: "m1", text: "我都很高興，這一年有大家。" },
      { text: "沒有人說話。可是你聽到旁邊有人吸了一下鼻子。" },
      { text: "然後是第二個。第三個。" },
      { who: "m3", text: "……誰在哭啦。" },
      { who: "m3", text: "是我。" },
      { who: "me", text: "（……成燦，你這一年到底哭了幾次啊TT）" },
      { text: "大家笑了。笑著笑著，又更想哭了。" },
      { choices: [
        { text: "「我也很高興，這一年有你們。」", effects: { aff: { m1: 1, m2: 1, m3: 1, m4: 1, m5: 1, m6: 1 } } },
        { text: "伸出手，握住旁邊的人的手", effects: { aff: { m1: 1, m2: 1, m3: 1, m4: 1, m5: 1, m6: 1 } } }
      ] },
      { text: "一顆流星劃過天空。" },
      { text: "七個人同時看到了。同時閉上眼睛，同時許了願。" },
      { text: "沒有人說出自己許了什麼。" }
    ],
    g0822: [
      { bg: "images/bg/wander.jpg" },
      { text: "八月的最後一個星期六。" },
      { text: "七個人在漢江邊野餐。和跨年那天是同一個地方。" },
      { text: "燦榮帶了吉他，炤熙帶了零食，元彬帶了防蚊液，成燦帶了炸雞，將太郎帶了飯糰，恩奭帶了冷笑話。" },
      { who: "m2", text: "這次是新的冷笑話。" },
      { who: "m6", text: "真的嗎~~" },
      { who: "me", text: "（恩奭的新冷笑話，我已經做好不笑的準備了。）" },
      { who: "m2", text: "為什麼八月很難過？" },
      { who: "m6", text: "為什麼？" },
      { who: "m2", text: "因為它知道，下一個是九月。" },
      { text: "燦榮沒有笑。" },
      { text: "大家都沒有笑。" },
      { who: "m2", text: "……不好笑。對不起。" },
      { who: "m3", text: "……很好笑啦。" },
      { who: "me", text: "（……一點都不好笑。可是為什麼，我笑不出來。）" },
      { text: "成燦用力地拍了拍恩奭的背。" },
      { text: "太陽慢慢地下山了。燦榮彈起吉他，唱了〈七〉。" },
      { text: "這次，大家一起唱。" },
      { text: "唱到最後一句——「如果這一年會重來，我還是想再遇見你們一次」——的時候，" },
      { text: "你發現，每個人都唱得很用力。" },
      { choices: [
        { text: "跟著大家一起唱到最後", effects: { aff: { m1: 1, m2: 1, m3: 1, m4: 1, m5: 1, m6: 1 } } },
        { text: "唱不出來，只是看著大家", effects: { aff: { m1: 1, m6: 2 } } }
      ] },
      { text: "回家的路上，你看了一眼手機上的日曆。" },
      { text: "下個星期，就是八月的最後一週了。" }
    ],
    // ↓ 最後一週（8/24～8/30）：依覺醒程度有不同的台詞（Claude 草稿）
    w0824: [
      { bg: "images/bg/council.jpg" },
      { text: "八月的最後一週。" },
      { text: "學生會辦公室裡，月曆只剩下最後一行。" },
      { who: "m3", text: "……這週過完，就九月了。" },
      { who: "m5", text: "成燦哥，你這句話已經說第三次了。" },
      { who: "m3", text: "因為我很在意嘛。" },
      { text: "大家像平常一樣，各自待在各自的位子上。" },
      { text: "可是你發現，今天每個人都有一點不一樣。" },
      { who: "m1", text: "……{name}。我最近，常常夢到那個白色的房間。", if: { awakened: "m1" } },
      { who: "m1", text: "可是我現在不怕了。我知道那是哪裡。", if: { awakened: "m1" } },
      { who: "m1", text: "大家~這週要每天都來喔~", if: { notAwakened: "m1" } },
      { who: "m2", text: "……還有一週。這次，我知道一週之後會發生什麼。", if: { awakened: "m2" } },
      { who: "m2", text: "……還有一週。", if: { notAwakened: "m2" } },
      { who: "m3", text: "我想起來了。每天早上的地鐵。我想起來，我其實已經很久沒有這樣笑了。", if: { awakened: "m3" } },
      { who: "m4", text: "……我想起來那些「每次」是什麼了。可是現在，好像沒那麼痛了。", if: { awakened: "m4" } },
      { who: "m5", text: "{name}。那些辦公室裡的聲音，我想起來是誰的了。", if: { awakened: "m5" } },
      { who: "m6", text: "計時板上的第四名，三個讚的歌。那些都是真的，對不對。", if: { awakened: "m6" } },
      { goto: "none", if: { awakeCount: "==0" } },
      { text: "辦公室安靜了一下。" },
      { text: "記得的人，互相看了一眼。不記得的人，困惑地看著他們。" },
      { goto: "end" },
      { label: "none" },
      { text: "大家說著和平常一樣的話。" },
      { text: "可是你心裡有一個聲音，一直在說：好像有什麼，你忘了去找。" },
      { label: "end" },
      { choices: [
        { text: "「這週，我們每天都一起過吧。」", effects: { aff: { m1: 1, m2: 1, m3: 1, m4: 1, m5: 1, m6: 1 } } },
        { text: "看著大家，什麼都沒說", effects: { aff: { m2: 1 } } }
      ] }
    ],
    w0826: [
      { bg: "images/bg/council.jpg" },
      { text: "燦榮在整理牆上的照片。" },
      { text: "九月的白板、中秋的松片、校慶的手電筒、聖誕節的雪、跨年的煙火、運動會、畢業典禮、海邊、祭典。" },
      { text: "一整面牆，滿滿的，都是七個人。" },
      { who: "m6", text: "……如果九月又來了，這面牆會怎麼樣？" },
      { text: "沒有人回答。" },
      { goto: "some", if: { awakeCount: ">=1" } },
      { who: "m3", text: "不會怎麼樣啦！照片又不會跑掉！" },
      { text: "成燦笑著說。可是他的手，一直放在燦榮的肩膀上，沒有拿開。" },
      { goto: "end" },
      { label: "some" },
      { who: "m2", text: "……會變成空白的。" },
      { text: "恩奭說。" },
      { who: "m2", text: "每一次九月來的時候，這裡都是空白的。我們會重新認識，重新貼。" },
      { who: "m2", text: "然後忘記，我們貼過。" },
      { text: "燦榮的手停在牆上。" },
      { who: "m6", text: "……每一次？" },
      { who: "m2", text: "……嗯。" },
      { goto: "end", if: { notAwakened: "m6" } },
      { who: "m6", text: "我知道。我也想起來了。" },
      { who: "m6", text: "可是就算會變成空白的，我還是想貼。" },
      { label: "end" },
      { choices: [
        { text: "幫燦榮把最後一張照片貼上去", effects: { aff: { m6: 2 } } },
        { text: "拍下整面牆", effects: { aff: { m1: 1, m2: 1, m3: 1, m4: 1, m5: 1, m6: 1 } } }
      ] },
      { text: "最後一張照片，是上週在漢江邊，七個人唱歌的背影。" }
    ],
    w0828: [
      { bg: "images/bg/council.jpg" },
      { text: "你回學生會辦公室拿忘記的東西。" },
      { text: "門沒有關好。裡面傳來說話的聲音。" },
      { goto: "all", if: { allAwake: true } },
      { goto: "some", if: { awakeCount: ">=2" } },
      { text: "是成燦和恩奭。" },
      { who: "m3", text: "……恩奭，你最近是不是常常覺得，好像忘了什麼很重要的事？" },
      { who: "m2", text: "……嗯。" },
      { who: "m3", text: "我也是。可是想不起來。" },
      { who: "m3", text: "算了！想不起來的事，一定是不重要的事！" },
      { text: "成燦笑了。恩奭沒有笑。" },
      { text: "你在門口站了很久，最後沒有進去。" },
      { goto: "end" },
      { label: "some" },
      { text: "是記得的那幾個人。" },
      { who: "m2", text: "……所以，那個願望是真的。" },
      { who: "m2", text: "我們許願，回到這一年。然後就一直待在這裡了。" },
      { text: "沉默。" },
      { text: "然後有人小聲地說：「可是，{name}呢？」" },
      { text: "「{name}，不在那個願望裡。」" },
      { text: "你屏住呼吸。" },
      { text: "「可是我們從來沒有懷疑過，{name}一直都在。」" },
      { text: "你轉身離開，心跳得很快。" },
      { goto: "end" },
      { label: "all" },
      { text: "六個人都在。" },
      { who: "m1", text: "……所以，大家都想起來了。" },
      { who: "m1", text: "七年後的那個夏天。我們終於又聚在一起，在漢江邊喝酒。" },
      { who: "m4", text: "大家都過得不好。" },
      { who: "m5", text: "每個人，都被這個世界弄得有點傷痕累累。" },
      { who: "m3", text: "然後我說：「如果可以回到那一年就好了。」" },
      { who: "m2", text: "……然後，我們就回來了。" },
      { who: "m6", text: "一次、又一次。" },
      { text: "沉默了很久。" },
      { who: "m1", text: "……可是，{name}呢？" },
      { who: "m1", text: "{name}不在那個夏天。可是在這裡，{name}一直都在。" },
      { who: "m5", text: "{name}是誰？" },
      { who: "m2", text: "……是來找我們的人吧。" },
      { text: "你站在門外，眼淚掉了下來。" },
      { text: "你想起來了。" },
      { text: "那首〈Insomnia〉、睡不著的夜晚、一直播放的歌、螢幕上的六個人。" },
      { text: "你是從那個世界來的。你一直在看著他們。" },
      { text: "……然後，你推開了門。" },
      { who: "m1", text: "{name}……" },
      { who: "me", text: "我都聽到了。" },
      { who: "me", text: "……我也想起來了。" },
      { label: "end" }
    ],
    w0830: [
      { bg: "images/bg/school.jpg" },
      { text: "八月的最後一個星期日。" },
      { text: "成燦提議：「我們來埋時光膠囊吧！」" },
      { text: "七個人帶著鏟子，偷偷溜進學校的後花園，在那棵最大的樹下開始挖。" },
      { goto: "old", if: { loop: ">=2" } },
      { text: "挖了很久，終於挖出一個夠深的洞。" },
      { goto: "bury" },
      { label: "old" },
      { text: "挖到一半，鏟子碰到了一個硬硬的東西。" },
      { who: "m4", text: "……有東西。" },
      { text: "是一個生鏽的鐵盒子。" },
      { text: "打開之後，裡面是七封信。" },
      { text: "信封上，是七個人的字跡。" },
      { text: "是你們的字跡。" },
      { who: "m3", text: "……這是什麼？我們什麼時候埋的？" },
      { text: "你打開寫著自己名字的那一封。" },
      { text: "「如果你又看到這封信，代表又是九月了。」" },
      { text: "「這一年，你很幸福。下一年，也要記得找他們。」" },
      { text: "你的手在發抖。" },
      { who: "m2", text: "……我們埋過。" },
      { who: "m2", text: "在上一個八月。" },
      { text: "沒有人說話。" },
      { text: "最後，將太郎把舊的信，小心地放回盒子裡。" },
      { who: "m1", text: "……那我們就再寫一次。" },
      { label: "bury" },
      { text: "每個人寫了一封信，放進新的盒子裡。" },
      { text: "你寫的是：" },
      { choices: [
        { text: "「請記得，你曾經很幸福。」", effects: { aff: { m1: 1, m2: 1, m3: 1, m4: 1, m5: 1, m6: 1 } } },
        { text: "「下一次，也要找到他們。」", effects: { aff: { m1: 1, m2: 1, m3: 1, m4: 1, m5: 1, m6: 1 } } },
        { text: "「謝謝你們，讓我來到這裡。」", effects: { aff: { m1: 1, m2: 1, m3: 1, m4: 1, m5: 1, m6: 1 } } }
      ] },
      { text: "大家把盒子埋進土裡，用力踩平。" },
      { who: "m3", text: "明年九月，一起來挖！" },
      { text: "成燦說。" },
      { text: "大家都說好。" },
      { text: "那個「好」，大家說得很小聲。" }
    ]
  },

  // 每晚聊天（data.js 的 kakao.dayChats）
  dayChats: [
    { date: "08-12", room: "f2", steps: [
      { text: "今天的話" },
      { text: "不要放在心上" },
      { choices: [
        { text: "已經放了。但是沒關係", reply: ["……", "那就一起放著"], effects: { aff: { m2: 3 } } },
        { text: "冰棒很好吃，謝謝", reply: ["下次換你請", "……九月也要"], effects: { aff: { m2: 2 } } }
      ] }
    ] },
    { date: "08-22", room: "g_council", steps: [
      { from: "f6", text: "今天謝謝大家一起唱" },
      { from: "f3", text: "我唱到喉嚨啞了TT" },
      { from: "f1", text: "下週就是八月的最後一週了耶" },
      { from: "f2", text: "……嗯。" },
      { from: "f5", text: "大家早點睡" },
      { from: "f4", text: "嗯" },
      { choices: [
        { text: "晚安。明天見", reply: [{ from: "f3", text: "明天見！！！" }, { from: "f6", text: "明天見" }], effects: { aff: { m1: 1, m2: 1, m3: 1, m4: 1, m5: 1, m6: 1 } } },
        { text: "下週也要一起過", reply: [{ from: "f1", text: "當然~" }, { from: "f2", text: "一起。" }], effects: { aff: { m1: 1, m2: 1, m3: 1, m4: 1, m5: 1, m6: 1 } } }
      ] }
    ] },
    // ↓ 最後一週的晚上（Claude 草稿）
    { date: "08-24", room: "g_council", steps: [
      { from: "f3", text: "最後一週！！！" },
      { from: "f1", text: "每天都要見面喔~" },
      { from: "f2", text: "……嗯。" },
      { choices: [
        { text: "每天都見", reply: [{ from: "f6", text: "每天！" }, { from: "f4", text: "嗯" }], effects: { aff: { m1: 1, m2: 1, m3: 1, m4: 1, m5: 1, m6: 1 } } },
        { text: "為什麼覺得有點想哭", reply: [{ from: "f5", text: "{name}……" }, { from: "f5", text: "我也是" }], effects: { aff: { m5: 2 } } }
      ] }
    ] },
    { date: "08-30", room: "g_council", steps: [
      { from: "f3", text: "時光膠囊埋好了！！！" },
      { from: "f6", text: "明年九月要一起挖喔" },
      { from: "f2", text: "一起。" },
      { from: "f1", text: "明天，學生會辦公室" },
      { from: "f1", text: "大家都來" },
      { choices: [
        { text: "一定到", reply: [{ from: "f4", text: "嗯" }, { from: "f5", text: "{name}不要遲到" }], effects: { aff: { m1: 1, m2: 1, m3: 1, m4: 1, m5: 1, m6: 1 } } },
        { text: "晚安，大家", reply: [{ from: "f3", text: "晚安！！！" }, { from: "f6", text: "晚安" }, { from: "f2", text: "……晚安。" }], effects: { aff: { m1: 1, m2: 1, m3: 1, m4: 1, m5: 1, m6: 1 } } }
      ] }
    ] }
  ],

  // X 貼文（data.js 的 x.tweets）
  tweets: [
    { id: "x0805", by: "bin032", from: "08-05", date: "下午 4:05 · 2026/8/5", time: "8月5日", text: "九月以後呢。" },
    { id: "x0819", by: "antonnie", from: "08-19", date: "上午 12:19 · 2026/8/20", time: "8月20日", text: "saw a shooting star with 6 people.\n大家都許願了。" },
    { id: "x0822", by: "sungchan913", from: "08-22", date: "下午 10:22 · 2026/8/22", time: "8月22日", text: "如果這一年會重來，我還是想再遇見你們一次。" },
    { id: "x0824", by: "seokkkk", from: "08-24", date: "下午 11:24 · 2026/8/24", time: "8月24日", text: "還有一週。" },
    { id: "x0830", by: "sungchan913", from: "08-30", date: "下午 9:30 · 2026/8/30", time: "8月30日", text: "時光膠囊埋好了！明年九月一起挖！" }
  ]
});
