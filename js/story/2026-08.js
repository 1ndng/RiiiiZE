/* =========================================================
 * 2026 年 8 月：主線、節日、生日、每晚聊天、X 貼文
 * 寫法和 data.js 一樣（格式說明在 data.js 各區的註解）；這個檔案的內容會自動併進 SITE_DATA
 * ========================================================= */
RIIIZE_ADD({
  // 主線排程（data.js 的 story）
  story: [
    { date: "08-12", phase: "afterschool", scene: "g0812" },   // 8 月：恩奭「九月好像會又來」
    { date: "08-19", phase: "afterschool", scene: "g0819" },   // 8 月：頂樓看星星
  ],

  // 劇情（data.js 的 scenes）
  scenes: {
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
  ],

  // X 貼文（data.js 的 x.tweets）
  tweets: [
    { id: "x0819", by: "antonnie", from: "08-19", date: "上午 12:19 · 2026/8/20", time: "8月20日", text: "saw a shooting star with 6 people.\n大家都許願了。" },
  ]
});
