/* =========================================================
 * 背景音樂（檔案寫在 data.js 的 game.music；換曲時淡入淡出、每首都循環播放）
 *   title  標題音樂：標題畫面、第一次玩輸入名字／生日／照片
 *   alarm  鬧鐘聲：鬧鐘響的時候（按「稍後提醒」→ 停，再響時從頭）
 *   ring   KakaoTalk 來電鈴聲：響鈴中（從 ringStart 秒開始放；接起來馬上停）
 *   intro  成員介紹影片的音樂：影片播放中（影片本身的聲音關掉；每次從頭放；開始時馬上出聲，結束時淡出、接下來的音樂淡入）
 *   main   主線音樂：開場（鬧鐘之後）、主線、日程劇情、每週回顧、每月安排、每晚聊天、生日、節日
 *   aff    好感度音樂：星期日白天（開頭、選人、出門）、14 日送禮、友誼線／愛情線／CP 線
 *   home   待在家的音樂：待在家（wk_home、act_home、rand_home_me）、自由探索手機的時間
 *   awake  覺醒音樂：找到線索後的反應（強制聊天／留言、awake_ 劇情）、結局（最後的選擇、結局、後日談）
 *   音效（game.sounds）：message = KakaoTalk 收到訊息（跟震動一樣，1.5 秒內只響一次）
 *   「音效」關掉 → 全部不放；切換頁籤（看不到網頁）→ 暫停；換天的黑畫面 → 不換曲
 * 瀏覽器不讓網頁一打開就自己出聲音：玩家第一次點畫面之後才會開始放
 * Safari（iPhone／iPad）：只有「點畫面當下」開始播的播放器之後才能出聲，而且不能用 volume 調音量 →
 *   第一次點畫面時把固定的三個播放器（兩個放音樂、輪流用來淡入淡出；一個放音效）先「解鎖」，之後換歌只換檔案；
 *   音量用 Web Audio 的 GainNode 調（Safari 也有效）；每次點畫面都會叫醒被系統暫停的音訊
 * ========================================================= */
(function () {
  'use strict';
  function cfg() { return ((window.SITE_DATA || {}).game || {}).music || {}; }
  var SILENT = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//NwwAAAAAAAAAAAAEluZm8AAAAPAAAACAAAA/oAR0dHR0dHR0dHR0dHYmJiYmJiYmJiYmJifHx8fHx8fHx8fHx8fJaWlpaWlpaWlpaWlrGxsbGxsbGxsbGxsbHLy8vLy8vLy8vLy8vl5eXl5eXl5eXl5eXl////////////////AAAAAExhdmM2MC4zMQAAAAAAAAAAAAAAACQC1AAAAAAAAAP6yysejgAAAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NAxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==';
  var now, unlocked = false, ctx = null, pos = {};   // pos = 每首離開時放到第幾秒（之後回來接著放）
  // 播放器：decks = 兩個放音樂（換曲時一個淡出、一個淡入）；fx = 放音效
  function mk(loop) { var el = new Audio(); el.preload = 'auto'; el.loop = loop; el.setAttribute('playsinline', ''); return { el: el, k: null, v: 0, node: null }; }
  var decks = [mk(true), mk(true)], fx = mk(false), active = null;
  function setV(d, v) { d.v = v; if (d.node) d.node.gain.value = v; else d.el.volume = Math.max(0, Math.min(1, v)); }
  // 接到 Web Audio（音量用 GainNode 調，Safari 才有效）
  function wire(d) {
    if (!ctx || d.node) return;
    try { var src = ctx.createMediaElementSource(d.el), g = ctx.createGain(); src.connect(g); g.connect(ctx.destination); d.node = g; g.gain.value = d.v; d.el.volume = 1; } catch (e) {}
  }
  // 重新整理前放的那首、放到第幾秒（sessionStorage）：重新整理後同一首從那裡接著放，不會從頭重放
  var resumeAt = null;
  try { resumeAt = JSON.parse(sessionStorage.getItem('riiiizeBgmAt')); sessionStorage.removeItem('riiiizeBgmAt'); } catch (e) {}
  window.addEventListener('pagehide', function () {
    if (active && active.k && !active.el.paused && !INSTANT[active.k]) try { sessionStorage.setItem('riiiizeBgmAt', JSON.stringify({ k: active.k, t: active.el.currentTime })); } catch (e) {}
  });
  function seek(d, t) {
    if (d.el.readyState >= 1) { try { d.el.currentTime = t; } catch (e) {} }
    else d.el.addEventListener('loadedmetadata', function () { try { d.el.currentTime = t; } catch (e) {} }, { once: true });
  }
  // 把 k 這首放進播放器 d（換掉原本的那首，記下原本的放到哪裡）
  function load(d, k) {
    if (d.k === k) return;
    if (d.k && !INSTANT[d.k]) pos[d.k] = d.el.currentTime;
    d.el.pause(); d.k = k; d.el.src = cfg()[k]; setV(d, 0);
    if (INSTANT[k]) return;
    if (resumeAt && resumeAt.k === k) { seek(d, resumeAt.t); d.resume = true; resumeAt = null; }
    else if (pos[k]) seek(d, pos[k]);
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
  var awakeUntil = 0, INSTANT = { alarm: 1, intro: 1, ring: 1 }, STOPNOW = { alarm: 1, ring: 1 };
  // 現在該放哪一首（null = 安靜）
  function want() {
    if (!soundOn() || document.hidden) return null;
    if (document.querySelector('.title-scr, .vn-name')) return 'title';
    var al = document.querySelector('.alarm');
    if (al) return al.classList.contains('sleeping') ? null : 'alarm';
    if (document.querySelector('#kc.ringing')) return 'ring';   // KakaoTalk 來電響鈴中
    if (document.querySelector('.vn-intro')) return 'intro';
    var G = window.GAME, P = window.PLAN, K = window.SOSHO_KAKAO, St = window.STORY, E = window.ENDING;
    var mo = St && St.music && St.music();
    if (mo && cfg()[mo]) return mo;   // 劇情指定的音樂（例如 9/7 KTV 的〈Another Life〉；還沒放檔案就照原本的）
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
    var planFrom = G.dayOf ? G.dayOf((((window.SITE_DATA || {}).plan || {}).planFrom) || '09-08') : 0;
    if (sunday && G.phase !== 'night' && G.day >= planFrom) return 'aff';   // 開學週的星期日（9/7）有主線：照主線音樂
    if (gift && document.querySelector('.sch')) return 'aff';
    return 'main';
  }
  // 還沒有檔案的（例如好感度音樂）先用主線音樂
  function resolve(k) { return k && !cfg()[k] ? (cfg().main ? 'main' : null) : k; }
  function target(k) { var v = (cfg().volume || {})[k]; return v != null ? v : .5; }
  // 每 0.1 秒：目前這首慢慢變大聲，另一個播放器慢慢變小聲，變到 0 就暫停（換曲時淡入淡出）
  function tick() {
    var w = resolve(want());
    if (w !== now) {
      now = w;
      if (w) {
        var d = decks.filter(function (x) { return x.k === w; })[0] || (decks[0] === active ? decks[1] : decks[0]);
        load(d, w); active = d;
        if (INSTANT[w]) {   // 鬧鐘、介紹影片：每次從頭、馬上出聲；另一個播放器馬上停（不淡出）
          seek(d, w === 'ring' ? (cfg().ringStart || 0) : 0); setV(d, target(w));
          decks.forEach(function (x) { if (x !== d) { setV(x, 0); x.el.pause(); } });
        }
        if (d.el.paused) tryPlay(d.el);
      } else active = null;
    }
    decks.forEach(function (d) {
      var goal = d === active && now ? target(now) : 0;
      if (STOPNOW[d.k] && goal === 0) { if (d.v) setV(d, 0); if (!d.el.paused) d.el.pause(); return; }   // 鬧鐘、來電鈴聲停：馬上停
      if (goal > 0 && d.el.paused) tryPlay(d.el);
      if (d.resume && goal > 0 && !d.el.paused) { setV(d, goal); d.resume = false; }   // 重新整理後接著放：不用再淡入
      if (d.v !== goal) setV(d, Math.max(0, Math.min(1, d.v + Math.max(-0.05, Math.min(0.05, goal - d.v)))));
      if (goal === 0 && d.v <= 0.001 && !d.el.paused) d.el.pause();
    });
  }
  // 播放：還沒點過畫面時也先試（重新整理後有些瀏覽器允許），被擋就等玩家點畫面；每秒最多試一次
  function tryPlay(el) {
    var t = Date.now(); if (!unlocked && t - (el._tried || 0) < 1000) return; el._tried = t;
    var q = el.play(); if (q && q.catch) q.catch(function () {});
  }
  // 點畫面：第一次 → 建立 Web Audio、解鎖三個播放器；之後每次 → 叫醒被系統暫停的音訊
  function unlock() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!ctx && AC) { try { ctx = new AC(); } catch (e) {} }
    if (ctx && ctx.state !== 'running' && ctx.resume) { var r = ctx.resume(); if (r && r.catch) r.catch(function () {}); }
    if (unlocked) return;
    unlocked = true;
    decks.concat([fx]).forEach(function (d) {
      wire(d);
      if (d === active) return;   // 現在這首：下面的 tick 會在這次點擊裡播放（也就解鎖了）
      if (!d.k) d.el.src = SILENT;
      d.el.muted = true;   // 靜音播一下再停 = 解鎖這個播放器
      var q = d.el.play(), done = function () { if (d !== active || !d.k) d.el.pause(); d.el.muted = false; };
      if (q && q.then) q.then(done, done); else done();
    });
    now = undefined; tick();
  }
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(function (ev) { document.addEventListener(ev, unlock, { capture: true, passive: true }); });
  setInterval(tick, 100);
  // 音效：用固定的音效播放器，每次從頭放
  var lastSfx = {};
  function sfx(k, gap) {
    var S = ((window.SITE_DATA || {}).game || {}).sounds || {}, src = S[k];
    if (!src || !soundOn() || !unlocked) return;
    var t = Date.now(); if (gap && t - (lastSfx[k] || 0) < gap) return; lastSfx[k] = t;
    if (fx.k !== k) { fx.k = k; fx.el.src = src; }
    setV(fx, (S.volume || {})[k] != null ? S.volume[k] : .7);
    try { fx.el.currentTime = 0; } catch (e) {}
    var q = fx.el.play(); if (q && q.catch) q.catch(function () {});
  }
  window.SOSHO_BGM = { now: function () { return now; }, want: want, sfx: sfx };
})();
