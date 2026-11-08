/* =========================================================
 * 其他劇情
 * 寫法和 data.js 一樣（格式說明在 data.js 各區的註解）；這個檔案的內容會自動併進 SITE_DATA
 * ========================================================= */
RIIIZE_ADD({
  // 劇情（data.js 的 scenes）
  scenes: {
    birthday_me: [
      { bg: "images/bg/home.jpg" },
      { text: "今天是你的生日。" },
      { text: "對於你來說，生日是屬於自己的節日。你總是會趁這一天買下平常捨不得買的東西、去平常不會去的地方，或是吃頓好的。" },
      { text: "當然，你還是忍不住希望，那幾個人能記得這一天。" },
      { phone: { id: "bday_me_chat", room: "f4", time: "19:30", before: [{ text: "有急事 你方便出來嗎？", time: "下午 7:30" }], steps: [{ choices: [{ text: "方便", flag: "bday_me_ok" }, { text: "不方便", flag: "bday_me_no", reply: ["好吧"] }] }] } },
      { goto: "call", if: { flag: "bday_me_no" } },
      { bg: "images/bg/outing.jpg" },
      { text: "你到了約定地點，但並沒有看到人。" },
      { who: "me", text: "我該不會被耍了吧？" },
      { text: "正當你準備傳訊息詢問元彬時，後方有人輕點了你的肩膀。" },
      { text: "你回頭，那六個人就站在那裡，手上拿著一個看不出形狀的蛋糕。" },
      { who: "m1", text: "{name}生日快樂🎂🎂" },
      { who: "m2", text: "happy birthday" },
      { who: "m6", text: "HBD！" },
      { who: "m3", text: "生日快樂{name}！！" },
      { who: "m5", text: "生日快樂~" },
      { who: "m4", text: "{name}" },
      { who: "m4", text: "生日快樂" },
      { who: "me", text: "謝⋯⋯謝謝你們⋯⋯TT" },
      { who: "m3", text: "剛剛在路上的時候不小心摔到蛋糕了⋯⋯{name}" },
      { who: "m2", text: "感覺不意外呢。" },
      { who: "m5", text: "{name}不介意的吧！" },
      { who: "m1", text: "我們下次再買一個完整的給你！" },
      { who: "me", text: "不用啦！完全不介意。" },
      { who: "me", text: "你們記得我的生日就已經很感謝了⋯⋯" },
      { who: "m4", text: "嗯。趕快許願吧。" },
      { goto: "wish" },
      { label: "call" },
      { call: { room: "g_council", from: "f1", forced: true, start: "start", nodes: { start: { lines: [{ who: "f1", text: "{name}生日快樂🎂🎂" }, { who: "f2", text: "happy birthday" }, { who: "f6", text: "HBD！" }, { who: "f3", text: "生日快樂{name}！！" }, { who: "f5", text: "生日快樂~" }, { who: "f4", text: "{name}" }, { who: "f4", text: "生日快樂" }, { who: "me", text: "謝⋯⋯謝謝你們⋯⋯TT" }, { who: "f3", text: "我們應該早點約你出來的⋯⋯" }, { who: "f5", text: "就算隔著螢幕，還是許個願吧！" }] } } } },
      { label: "wish" },
      { text: "你閉上眼睛。" },
      { text: "不知道為什麼，在許願的那一瞬間，你想到的不是自己，是眼前這六個人。", if: { flag: "bday_me_ok" } },
      { text: "不知道為什麼，在許願的那一瞬間，你想到的不是自己，是電話那頭的六個人。", if: { flag: "bday_me_no" } },
      { text: "你希望——" },
      { wish: { aff: 10, pair: 15 } },
      { text: "你在心裡，把願望說得很清楚。", wishIs: "aff" },
      { who: "me", text: "（希望我和{wish}，可以再更靠近一點。）", wishIs: "aff" },
      { who: "me", text: "（希望{wish}，可以一直好好的。一直、一直在一起。）", wishIs: "pair" }
    ],
  }
});
