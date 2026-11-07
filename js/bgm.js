/* =========================================================
 * 背景音樂（檔案寫在 data.js 的 game.music；換曲時淡入淡出、每首都循環播放）
 *   title  標題音樂：標題畫面、第一次玩輸入名字／生日／照片
 *   alarm  鬧鐘聲：鬧鐘響的時候（按「稍後提醒」→ 停，再響時從頭）
 *   intro  成員介紹影片的音樂：影片播放中（影片本身的聲音關掉；每次從頭放）
 *   main   主線音樂：開場（鬧鐘之後）、主線、日程劇情、每週回顧、每月安排、每晚聊天、生日、節日
 *   aff    好感度音樂：星期日白天（開頭、選人、出門）、14 日送禮、友誼線／愛情線／CP 線
 *   home   待在家的音樂：待在家（wk_home、act_home、rand_home_me）、自由探索手機的時間
 *   awake  覺醒音樂：找到線索後的反應（強制聊天／留言、awake_ 劇情）、結局（最後的選擇、結局、後日談）
 *   音效（game.sounds）：message = KakaoTalk 收到訊息（跟震動一樣，1.5 秒內只響一次）
 *   「音效」關掉 → 全部不放；切換頁籤（看不到網頁）→ 暫停；換天的黑畫面 → 不換曲
 * 瀏覽器不讓網頁一打開就自己出聲音：玩家第一次點畫面之後才會開始放
 * ========================================================= */
(function () {
  'use strict';
  function cfg() { return ((window.SITE_DATA || {}).game || {}).music || {}; }
  var players = {}, now, unlocked = false;
  function player(k) {
    if (!players[k] && cfg()[k]) {
      var a = new Audio(cfg()[k]);
      a.loop = true; a.preload = 'auto'; a.volume = 0;
      players[k] = a;
    }
    return players[k] || null;
  }
  function soundOn() { return window.SOSHO_SOUND ? window.SOSHO_SOUND.on() : true; }
  // 劇情 id → 哪一首
  function byScene(id) {
    if (/^awake_/.test(id)) return 'awake';
    if (/^(final_choice|ending_|ep_)/.test(id)) return 'awake';
    if (id === 'wk_home' || /^act_home_/.test(id) || id === 'rand_home_me' || id === 'free_phone') return 'home';
    if (/^wk_/.test(id) || id === 'weekend_intro' || id === '__gift' || /^gift_/.test(id) || /^(fr|love|confess|cp)_/.test(id)) return 'aff';
    return 'main';
  }
  var awakeUntil = 0, INSTANT = { alarm: 1, intro: 1 };
  // 現在該放哪一首（null = 安靜）
  function want() {
    if (!soundOn() || document.hidden) return null;
    if (document.querySelector('.title-scr, .vn-name')) return 'title';
    var al = document.querySelector('.alarm');
    if (al) return al.classList.contains('sleeping') ? null : 'alarm';
    if (document.querySelector('.vn-intro')) return 'intro';
    var G = window.GAME, P = window.PLAN, K = window.SOSHO_KAKAO, St = window.STORY, E = window.ENDING;
    if (E && E.running && E.running() || document.querySelector('.end-card')) return 'awake';
    // 線索：強制聊天／留言 → 反應劇情之間的空檔也維持覺醒音樂（3 秒）
    if (St && St.clueBusy && St.clueBusy()) { awakeUntil = Date.now() + 3000; return 'awake'; }
    var id = St && St.scene && St.scene();
    if (id) { var k = byScene(id); if (k === 'awake') awakeUntil = Date.now() + 3000; return k; }
    if (Date.now() < awakeUntil) return 'awake';
    if (document.querySelector('.day-fade')) return now === undefined ? 'main' : now;   // 換天的黑畫面：不換曲
    if (K && K.dayChatting && K.dayChatting()) return 'main';
    if (!G) return 'main';
    if (P && P.phoneDay && G.phase === 'night' && P.phoneDay()) return 'home';   // 自由探索手機
    if (G.ended) return 'home';
    var sunday = G.date(G.day).getDay() === 0, gift = /-14$/.test(G.md(G.day));
    if (sunday && G.phase !== 'night') return 'aff';
    if (gift && document.querySelector('.sch')) return 'aff';
    return 'main';
  }
  // 還沒有檔案的（例如好感度音樂）先用主線音樂
  function resolve(k) { return k && !cfg()[k] ? (cfg().main ? 'main' : null) : k; }
  function target(k) { var v = (cfg().volume || {})[k]; return v != null ? v : .5; }
  // 每 0.1 秒：目前這首慢慢變大聲，其他的慢慢變小聲，變到 0 就暫停（換曲時淡入淡出）
  function tick() {
    var w = resolve(want());
    if (w !== now) {
      now = w;
      var p = w && player(w);
      if (p && INSTANT[w]) { p.currentTime = 0; p.volume = target(w); }   // 鬧鐘、介紹影片：每次從頭、馬上出聲
      if (p && unlocked && p.paused) { var q = p.play(); if (q && q.catch) q.catch(function () {}); }
    }
    Object.keys(players).forEach(function (k) {
      var a = players[k], goal = k === now ? target(k) : 0;
      if (INSTANT[k] && goal === 0) { a.volume = 0; if (!a.paused) a.pause(); return; }   // 鬧鐘停：馬上停
      if (k === now && a.paused && unlocked) { var q = a.play(); if (q && q.catch) q.catch(function () {}); }
      var v = a.volume + Math.max(-0.05, Math.min(0.05, goal - a.volume));
      a.volume = Math.max(0, Math.min(1, v));
      if (goal === 0 && a.volume <= 0.001 && !a.paused) a.pause();
    });
  }
  function unlock() {
    if (unlocked) return;
    unlocked = true; now = undefined; tick();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, unlock, { capture: true, passive: true }); });
  setInterval(tick, 100);
  // 音效：每次重新放一個（可以重疊）
  var lastSfx = {};
  function sfx(k, gap) {
    var src = (((window.SITE_DATA || {}).game || {}).sounds || {})[k];
    if (!src || !soundOn() || !unlocked) return;
    var t = Date.now(); if (gap && t - (lastSfx[k] || 0) < gap) return; lastSfx[k] = t;
    var a = new Audio(src), v = ((((window.SITE_DATA || {}).game || {}).sounds || {}).volume || {})[k];
    a.volume = v != null ? v : .7;
    var q = a.play(); if (q && q.catch) q.catch(function () {});
  }
  window.SOSHO_BGM = { now: function () { return now; }, want: want, sfx: sfx };
})();
