/* =========================================================
 * 背景音樂（檔案寫在 data.js 的 game.music）
 *   標題畫面 → title（標題音樂）
 *   自由探索手機的時間（開場探索、星期日／能用手機的晚上）→ 不放音樂
 *   成員介紹影片播放中 → 暫停（聽影片的聲音）
 *   其他時間（劇情、日程、每晚聊天…）→ bgm（背景音樂）
 *   「音效」關掉 → 全部不放；切換頁籤（看不到網頁）→ 暫停
 * 瀏覽器不讓網頁一打開就自己出聲音：玩家第一次點畫面之後才會開始放
 * ========================================================= */
(function () {
  'use strict';
  function cfg() { return ((window.SITE_DATA || {}).game || {}).music || {}; }
  var players = {}, now = null, unlocked = false;
  function player(k) {
    if (!players[k] && cfg()[k]) {
      var a = new Audio(cfg()[k]);
      a.loop = true; a.preload = 'auto'; a.volume = 0;
      players[k] = a;
    }
    return players[k] || null;
  }
  function soundOn() { return window.SOSHO_SOUND ? window.SOSHO_SOUND.on() : true; }
  // 現在該放哪一首（null = 安靜）
  function want() {
    if (!soundOn() || document.hidden) return null;
    if (document.querySelector('.title-scr')) return 'title';
    if (document.querySelector('.vn-intro, .alarm')) return null;
    var G = window.GAME, P = window.PLAN, I = window.INTRO, K = window.SOSHO_KAKAO;
    if (I && I.exploring && I.exploring()) return null;
    if (G && P && P.phoneDay && G.phase === 'night' && P.phoneDay() && !(K && K.dayChatting && K.dayChatting())) return null;
    return 'bgm';
  }
  function target(k) { var v = cfg().volume || {}; return k === 'title' ? (v.title != null ? v.title : .6) : (v.bgm != null ? v.bgm : .45); }
  // 每 0.1 秒：目前這首慢慢變大聲，其他的慢慢變小聲，變到 0 就暫停（換曲時淡入淡出）
  function tick() {
    var w = want();
    if (w !== now) {
      now = w;
      var p = w && player(w);
      if (p && unlocked && p.paused) { var q = p.play(); if (q && q.catch) q.catch(function () {}); }
    }
    Object.keys(players).forEach(function (k) {
      var a = players[k], goal = k === now ? target(k) : 0;
      if (k === now && a.paused && unlocked) { var q = a.play(); if (q && q.catch) q.catch(function () {}); }
      var v = a.volume + Math.max(-0.05, Math.min(0.05, goal - a.volume));
      a.volume = Math.max(0, Math.min(1, v));
      if (goal === 0 && a.volume <= 0.001 && !a.paused) a.pause();
    });
  }
  function unlock() {
    if (unlocked) return;
    unlocked = true; now = null; tick();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, unlock, { capture: true, passive: true }); });
  setInterval(tick, 100);
  window.SOSHO_BGM = { now: function () { return now; }, want: want };
})();
