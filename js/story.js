/* =========================================================
 * 劇情對話框（視覺小說）
 *   - 背景圖＋對話框（名字、逐字出現的文字），點一下下一句；右上角「紀錄」可以回看
 *   - 劇情寫在 data.js 的 scenes；主線劇情排在 data.js 的 story（第幾天、早上／放學）
 *   - 玩家名字：第一次開始遊戲時輸入；劇情、KakaoTalk、通話裡寫 {name} 會換成玩家的名字
 *
 * 一段劇情 = 一串步驟（scenes.劇情id = [ 步驟, 步驟, … ]），每個步驟可以加 if（條件不成立就跳過）：
 *   { text: "旁白" }                         沒寫 who = 旁白
 *   { who: "m1", text: "台詞" }               who = 成員 id（顯示 cast 的名字）、"me"（玩家的名字）或直接寫名字
 *   { bg: "images/xxx.jpg" }                 換背景；"phone" = 直接看到手機畫面；"phone-dim" = 看得到手機但變暗
 *   { text: "咚！", shake: true }            這句出現時畫面晃動
 *   { text: "頭好痛……", headache: true }     這句出現時畫面模糊（頭痛：想起原本的世界時）
 *   { wait: 1000 }                           停頓（毫秒）：對話框先收起來，時間到自動接下一句
 *   { choices: [ { text, effects, flag, goto, if }, … ] }   選項；goto = 跳到哪個 label（不寫 = 接著往下）
 *   { label: "名稱" }                         標記，給 goto 用
 *   { goto: "名稱" }                          跳過去（常和 if 一起用：條件成立才跳）
 *   { effects: { … } } / { flag: "旗標" }     套用效果、記錄旗標（不會顯示）
 *   { end: true }                            劇情在這裡結束
 *   { ending: "結局id" }                      劇情在這裡結束，進入結局（data.js 的 endings）
 * 播完記錄旗標 scene_劇情id
 * ========================================================= */
(function () {
  'use strict';

  var PKEY = 'riiiize-player';
  function S() { return window.SOSHO; }
  function D() { return window.SITE_DATA || {}; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function T() {
    var t = (D().storyText || {}), d = {
      log: '紀錄', auto: '自動', skip: '快轉', close: '關閉', save: '存檔', saveTitle: '存檔', back: '返回劇情', slot: '存檔 {n}', empty: '空的',
      dayLabel: '第 {n} 天', saved: '已存檔', overwrite: '要覆蓋這個存檔嗎？', overwriteOk: '覆蓋', cancel: '取消',
      saveNote: '讀取這個存檔時，會從現在這句話繼續。', nameTitle: '你的名字是？', nameHint: '之後大家都會這樣叫你。', bdayTitle: '你的生日是？', bdayHint: '生日那天會有特別的事。', month: '月', dayUnit: '日', namePlaceholder: '輸入名字', nameOk: '確定',
      defaultName: '轉學生', logEmpty: '還沒有對話'
    };
    Object.keys(t).forEach(function (k) { d[k] = t[k]; });
    return d;
  }

  /* ---- 玩家名字 ---- */
  function playerName() { return (load(PKEY, {}) || {}).name || ''; }
  function fill(s) { var n = playerName() || T().defaultName; return String(s == null ? '' : s).replace(/\{name\}/g, n); }
  function askName(done) {
    var t = T(), w = document.createElement('div');
    w.className = 'vn-name';
    w.innerHTML = '<form autocomplete="off"><b>' + esc(t.nameTitle) + '</b><p>' + esc(t.nameHint) + '</p>' +
      '<input name="n" maxlength="12" placeholder="' + esc(t.namePlaceholder) + '" autocomplete="off">' +
      '<button type="submit" disabled>' + esc(t.nameOk) + '</button></form>';
    document.getElementById('phone').appendChild(w);
    var f = w.querySelector('form');
    f.n.focus();
    f.n.addEventListener('input', function () { f.querySelector('button').disabled = !f.n.value.trim(); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = f.n.value.trim();
      if (!v) return;
      var pl = load(PKEY, {}) || {}; pl.name = v; store(PKEY, pl);
      w.remove();
      if (pl.birthday) { done && done(); return; }
      askBirthday(done);   // 名字之後接著填生日
    });
  }

  // 玩家生日（月、日）：生日那天會停下來播 scenes.birthday_me
  function askBirthday(done) {
    var t = T(), w = document.createElement('div'), opts = function (n) { var o = ''; for (var i = 1; i <= n; i++) o += '<option value="' + i + '">' + i + '</option>'; return o; };
    w.className = 'vn-name';
    w.innerHTML = '<form autocomplete="off"><b>' + esc(t.bdayTitle) + '</b><p>' + esc(t.bdayHint) + '</p>' +
      '<div class="vn-bday"><select name="m">' + opts(12) + '</select><span>' + esc(t.month) + '</span>' +
      '<select name="d">' + opts(31) + '</select><span>' + esc(t.dayUnit) + '</span></div>' +
      '<button type="submit">' + esc(t.nameOk) + '</button></form>';
    document.getElementById('phone').appendChild(w);
    var f = w.querySelector('form');
    // 每個月的天數（2 月算 29 天）
    f.m.addEventListener('change', function () {
      var max = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][f.m.value - 1], cur = +f.d.value;
      f.d.innerHTML = opts(max); f.d.value = Math.min(cur, max);
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var pl = load(PKEY, {}) || {};
      pl.birthday = ('0' + f.m.value).slice(-2) + '-' + ('0' + f.d.value).slice(-2);
      store(PKEY, pl);
      w.remove();
      done && done();
    });
  }

  /* ---- 播放一段劇情 ---- */
  var cur = null;   // { id, steps, i, el, log, typing, full, timer, done }
  function nameOf(who) {
    if (!who) return '';
    if (who === 'me') return playerName() || T().defaultName;
    var c = (D().cast || []).filter(function (x) { return x.id === who; })[0];
    return c ? (c.short || c.name) : who;   // 劇情裡只顯示名字（cast 的 short）
  }
  function ok(c) { return !c || !window.GAME || window.GAME.check(c); }

  // resume = 讀取劇情中的存檔時，從存檔的那一句繼續：{ at, bg, log, steps }
  // bg = 這段劇情的預設背景（例如日程的背景）；沒給就用 data.js 的 storyBg；劇情裡寫 { bg } 會換掉
  function play(id, done, resume, bg) {
    var steps = (resume && resume.steps) || (D().scenes || {})[id];
    if (!steps || !steps.length || cur) { done && done(); return; }
    var t = T(), el = document.createElement('div');
    el.className = 'vn';
    el.innerHTML =
      '<div class="vn-bg" id="vn-bg"></div>' +
      // 右上角：紀錄、存檔（結局進行中不能存檔）
      // 自動：一句講完自己接下一句；快轉：看過的台詞直接跳過（遇到沒看過的、或要選擇時停下）
      '<div class="vn-tools"><button type="button" data-vn-auto' + (mode === 'auto' ? ' class="on"' : '') + '>' + esc(t.auto) + '</button>' +
        '<button type="button" data-vn-skip' + (mode === 'skip' ? ' class="on"' : '') + '>' + esc(t.skip) + '</button>' +
        '<button type="button" data-vn-log>' + esc(t.log) + '</button>' +
        (window.ENDING && window.ENDING.running() ? '' : '<button type="button" data-vn-save>' + esc(t.save) + '</button>') + '</div>' +
      '<div class="vn-choices" id="vn-choices"></div>' +
      '<div class="vn-box" id="vn-box"><div class="vn-who" id="vn-who"></div><div class="vn-text" id="vn-text"></div><i class="vn-next"></i></div>';
    document.getElementById('phone').appendChild(el);
    void el.offsetWidth; el.classList.add('show');
    if (S()) S().setDarkStatus(true);
    cur = { id: id, steps: steps, i: 0, el: el, log: [], done: done };
    setBg(bg || D().storyBg || '');   // 預設背景：日程的背景 → data.js 的 storyBg；劇情裡寫 { bg } 會換掉
    if (resume) {
      cur.i = resume.at || 0; cur.log = resume.log || []; cur.resuming = true;
      if (resume.bg) setBg(resume.bg);
    }
    step();
  }

  function findLabel(name) {
    for (var k = 0; k < cur.steps.length; k++) if (cur.steps[k].label === name) return k;
    return -1;
  }
  /* ---- 自動、快轉 ----
   * 看過的台詞記在 riiiizeSeen（劇情 id＋那句話；「重新開始」、時間循環都不會清掉，所以第二輪看過的可以快轉） */
  var mode = null, SEEN_KEY = 'riiiizeSeen', seen = load(SEEN_KEY, {}) || {}, seenDirty = false;
  function seenKey(text) { return cur.id + '|' + text; }
  function markSeen(k) { if (!seen[k]) { seen[k] = 1; seenDirty = true; } }
  setInterval(function () { if (seenDirty) { seenDirty = false; store(SEEN_KEY, seen); } }, 2000);
  window.addEventListener('pagehide', function () { if (seenDirty) store(SEEN_KEY, seen); });
  function setMode(m) {
    mode = m;
    if (!cur) return;
    var a = cur.el.querySelector('[data-vn-auto]'), k = cur.el.querySelector('[data-vn-skip]');
    if (a) a.classList.toggle('on', mode === 'auto');
    if (k) k.classList.toggle('on', mode === 'skip');
    clearTimeout(cur.autoTimer);
    if (mode && !cur.choices && !cur.waiting) {
      if (cur.typing) { if (mode === 'skip' && cur.seen) finishTyping(); }
      else afterLine();
    }
  }
  // 一句顯示完之後：自動 → 等一下接下一句；快轉 → 馬上接下一句
  function afterLine() {
    if (!cur || cur.choices || cur.waiting) return;
    clearTimeout(cur.autoTimer);
    if (mode === 'skip') cur.autoTimer = setTimeout(step, 70);
    else if (mode === 'auto') cur.autoTimer = setTimeout(step, 1100 + Array.from(cur.full || '').length * 45);
  }

  function step() {
    if (!cur) return;
    clearTimeout(cur.autoTimer);
    while (cur.i < cur.steps.length) {
      var s = cur.steps[cur.i++], resumed = cur.resuming;
      cur.resuming = false;   // 從存檔繼續的那一句：效果、旗標存檔時已經套用過，不重複
      if (!resumed && !ok(s.if)) continue;
      if (s.end) break;
      if (s.ending) { cur.ending = s.ending; break; }   // 進入結局（js/ending.js）
      if (s.label != null && s.text == null) continue;
      if (s.bg != null) setBg(s.bg);
      if (!resumed && s.effects && window.GAME) window.GAME.apply(s.effects);
      if (!resumed && s.flag && S()) [].concat(s.flag).forEach(function (f) { S().setFlag(f); });
      if (s.goto && s.text == null && !s.choices) { var k = findLabel(s.goto); if (k >= 0) cur.i = k; continue; }
      if (s.wait && s.text == null) { pause(s.wait); return; }
      cur.at = cur.i - 1;   // 現在畫面上這一步（存檔用）
      if (s.choices) { showChoices(s.choices); return; }
      if (s.shake) shake();
      if (s.headache) headache();
      if (s.text != null) { say(s.who, s.text, resumed); return; }
    }
    finish();
  }
  // 畫面晃動
  function shake() {
    var el = cur.el;
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
    setTimeout(function () { el.classList.remove('shake'); }, 600);
  }
  // 頭痛：背景（或後面的手機畫面）一陣一陣地模糊，再慢慢恢復
  function headache() {
    var el = cur.el, b = el.querySelector('.vn-ache');
    if (!b) { b = document.createElement('div'); b.className = 'vn-ache'; el.insertBefore(b, el.querySelector('.vn-choices')); }
    b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
    setTimeout(function () { b.classList.remove('on'); }, 2600);
  }
  // 停頓：對話框收起來，這段時間點畫面沒反應
  function pause(ms) {
    var box = cur.el.querySelector('#vn-box'), mine = cur;
    cur.waiting = true; box.classList.add('hide');
    if (mode === 'skip') ms = 60;   // 快轉：停頓也縮短
    setTimeout(function () {
      if (cur !== mine) return;
      cur.waiting = false; box.classList.remove('hide');
      step();
    }, ms);
  }
  // 背景：寫圖片路徑；"phone" = 不放背景，直接看到後面的手機畫面；"phone-dim" = 手機畫面變暗
  function setBg(src) {
    var bg = cur.el.querySelector('#vn-bg'), orig = src;
    cur.el.classList.toggle('see-phone', src === 'phone' || src === 'phone-dim');
    cur.el.classList.toggle('dim', src === 'phone-dim');
    // 背景不是手機畫面：上面的狀態列（時間、電量）不顯示
    document.getElementById('phone').classList.toggle('story-full', src !== 'phone' && src !== 'phone-dim');
    if (src === 'phone' || src === 'phone-dim') src = '';
    bg.classList.remove('in'); void bg.offsetWidth;
    bg.style.backgroundImage = src ? 'url("' + src + '")' : 'none';
    cur.bg = orig;   // 存檔用（記原本寫的，例如 "phone-dim"）
    bg.classList.add('in');
  }
  // 逐字出現：點一下 → 整句顯示；再點 → 下一句
  function say(who, text, resumed) {
    var name = nameOf(who), full = fill(text);
    if (!resumed || !cur.log.length) cur.log.push({ who: name, text: full });   // 從存檔繼續：這句已經在紀錄裡
    var k = seenKey(full);
    cur.seen = !!seen[k]; markSeen(k);
    if (mode === 'skip' && !cur.seen) setMode(null);   // 快轉遇到沒看過的台詞：停下來
    var box = cur.el.querySelector('#vn-box'), w = cur.el.querySelector('#vn-who'), tx = cur.el.querySelector('#vn-text');
    box.classList.toggle('narration', !name);
    box.classList.remove('done');
    w.textContent = name;
    w.hidden = !name;
    tx.textContent = '';
    cur.full = full; cur.typing = true;
    if (mode === 'skip') { finishTyping(); return; }
    var chars = Array.from(full), n = 0;
    clearInterval(cur.timer);
    cur.timer = setInterval(function () {
      n++;
      tx.textContent = chars.slice(0, n).join('');
      if (n >= chars.length) finishTyping();
    }, (D().storySpeed || 38));
  }
  function finishTyping() {
    if (!cur) return;
    clearInterval(cur.timer);
    cur.typing = false;
    cur.el.querySelector('#vn-text').textContent = cur.full;
    cur.el.querySelector('#vn-box').classList.add('done');
    afterLine();
  }
  function showChoices(list) {
    var box = cur.el.querySelector('#vn-choices');
    if (mode === 'skip') setMode(null);   // 要選擇：快轉停下來（自動會在選完後繼續）
    cur.choices = list.filter(function (c) { return ok(c.if); });
    box.innerHTML = cur.choices.map(function (c, i) {
      return '<button type="button" data-vn-choice="' + i + '">' + esc(fill(c.text)) + '</button>';
    }).join('');
    box.classList.add('show');
  }
  function choose(i) {
    var c = cur.choices[i];
    if (!c) return;
    cur.choices = null;
    var box = cur.el.querySelector('#vn-choices');
    box.classList.remove('show'); box.innerHTML = '';
    cur.log.push({ choice: true, text: fill(c.text) });
    if (window.GAME) window.GAME.apply(c.effects);
    if (c.flag && S()) [].concat(c.flag).forEach(function (f) { S().setFlag(f); });
    if (c.goto) { var k = findLabel(c.goto); if (k >= 0) cur.i = k; }
    step();
  }
  function finish() {
    if (!cur) return;
    clearInterval(cur.timer);
    var c = cur;
    cur = null;
    document.getElementById('phone').classList.remove('story-full');
    if (S()) S().setFlag('scene_' + c.id);
    c.el.classList.remove('show');
    setTimeout(function () { c.el.remove(); }, 400);
    if (S()) S().setDarkStatus(false);
    // 這段劇情進入結局 → 結局播完、玩家按「繼續」後才接著往下
    if (c.ending && window.ENDING) { window.ENDING.run(c.ending, c.done); return; }
    c.done && c.done();
  }

  // 對話紀錄
  function openLog() {
    var t = T(), w = document.createElement('div');
    w.className = 'vn-log';
    w.innerHTML = '<div class="vn-log-head"><b>' + esc(t.log) + '</b><button type="button" data-vn-logclose>' + esc(t.close) + '</button></div>' +
      '<div class="vn-log-list">' + (cur.log.length ? cur.log.map(function (l) {
        return l.choice ? '<div class="vn-log-choice">▸ ' + esc(l.text) + '</div>'
          : '<div class="vn-log-line">' + (l.who ? '<b>' + esc(l.who) + '</b>' : '') + '<p>' + esc(l.text) + '</p></div>';
      }).join('') : '<p class="vn-log-empty">' + esc(t.logEmpty) + '</p>') + '</div>';
    cur.el.appendChild(w);
    var list = w.querySelector('.vn-log-list'); list.scrollTop = list.scrollHeight;
  }

  /* ---- 劇情中存檔：存檔頁面蓋在劇情上，存完或按返回就回到劇情 ----
   * 存檔時另外記下「現在播到哪一句」（riiiize-resume），讀檔後從這一句繼續 */
  var RKEY = 'riiiize-resume';
  function openSave() {
    var t = T(), G = window.GAME, w = document.createElement('div');
    w.className = 'vn-save';
    function paint() {
      var s = G.saves(), rows = '';
      for (var i = 1; i <= G.slots(); i++) {
        var sl = s.slots[i], m = sl && sl.meta;
        rows += '<button type="button" data-vn-slot="' + i + '"><b>' + esc(t.slot.replace('{n}', i)) + '</b>' +
          (m ? '<small>' + esc(m.date || '') + '</small><small class="dim">' + esc(m.savedAt || '') + '</small>'
             : '<small class="dim">' + esc(t.empty) + '</small>') + '</button>';
      }
      w.innerHTML = '<div class="vn-save-head"><button type="button" data-vn-saveclose>‹ ' + esc(t.back) + '</button><b>' + esc(t.saveTitle) + '</b><span></span></div>' +
        '<p class="vn-save-note">' + esc(t.saveNote) + '</p><div class="vn-save-list">' + rows + '</div>';
    }
    paint();
    cur.el.appendChild(w);
    w.addEventListener('click', function (e) {
      var b = e.target.closest('[data-vn-slot]');
      if (e.target.closest('[data-vn-saveclose]')) { w.remove(); return; }
      if (!b) return;
      var id = +b.dataset.vnSlot;
      function doSave() {
        // 記下現在這一句，存進存檔裡，再拿掉（目前的進度不需要它）
        store(RKEY, { scene: cur.id, at: cur.at || 0, bg: cur.bg || '', log: cur.log, day: G.day, phase: G.phase,
          steps: cur.id.indexOf('__') === 0 ? cur.steps : null });
        G.save(id);
        try { localStorage.removeItem(RKEY); } catch (err) {}
        if (S()) S().toast(t.saved);
        w.remove();   // 存完回到劇情
      }
      if (G.saves().slots[id] && !confirm(t.overwrite)) return;
      doSave();
    });
  }
  // 讀檔後：如果存檔時正在播劇情，從那一句繼續
  var resumedPhase = null;
  function takeResume(phase) {
    var r = load(RKEY, null);
    try { localStorage.removeItem(RKEY); } catch (e) {}
    if (!r || !window.GAME || r.day !== window.GAME.day || r.phase !== phase) return null;
    return r;
  }

  document.addEventListener('click', function (e) {
    if (!cur || !cur.el.contains(e.target)) return;
    var b;
    if (e.target.closest('.vn-save')) return;
    if (e.target.closest('[data-vn-save]')) { openSave(); return; }
    if (e.target.closest('[data-vn-logclose]')) { e.target.closest('.vn-log').remove(); return; }
    if (e.target.closest('.vn-log')) return;
    if (e.target.closest('[data-vn-log]')) { openLog(); return; }
    if (e.target.closest('[data-vn-auto]')) { setMode(mode === 'auto' ? null : 'auto'); return; }
    if (e.target.closest('[data-vn-skip]')) { setMode(mode === 'skip' ? null : 'skip'); return; }
    if ((b = e.target.closest('[data-vn-choice]'))) { choose(+b.dataset.vnChoice); return; }
    if (cur.choices || cur.waiting) return;   // 等玩家選／停頓中
    if (cur.typing) finishTyping(); else step();
  });

  /* ---- 主線劇情：data.js 的 story = [{ day, phase: "morning" / "afterschool", scene, if }] ----
   * 到了那天的那個時段就自動播；同一個時段有好幾段就依序播 */
  function storyFor(phase) {
    var g = window.GAME;
    return (D().story || []).filter(function (s) {
      // date: "09-01"（學年裡的那一天）或 day: 第幾天
      var onDay = s.date ? g.dayOf(s.date) === g.day : (s.day == null || +s.day === g.day);
      return (s.phase || 'morning') === phase && onDay && ok(s.if) &&
        !(S() && S().hasFlag('scene_' + s.scene) && !s.repeat);
    });
  }
  // 日程的背景（data.js 的 plan.activities 的 bg）
  function actBg(act) {
    var a = (((D().plan || {}).activities) || []).filter(function (x) { return x.id === act; })[0];
    return a && a.bg;
  }
  function playList(list, done) {
    var k = 0;
    (function next() { if (k >= list.length) { done(); return; } var e = list[k++]; play(e.scene, next, null, e.bg || actBg(e.activity)); })();
  }
  if (window.GAME) {
    // 第一次開始：先輸入名字
    window.GAME.onPhase('morning', function (done) {
      if (!playerName()) askName(done);
      else if (!(load(PKEY, {}) || {}).birthday) askBirthday(done);
      else done();
    });
    ['morning', 'afterschool'].forEach(function (ph) {
      window.GAME.onPhase(ph, function (done) {
        var r = takeResume(ph);
        if (r) {   // 讀檔：先把存檔時那段劇情播完，再接這個時段剩下的主線
          resumedPhase = ph;
          if (location.hash !== '#/home') location.hash = '#/home';
          setTimeout(function () {
            play(r.scene, function () { var rest = storyFor(ph); if (rest.length) playList(rest, done); else done(); }, r);
          }, 300);
          return;
        }
        var list = storyFor(ph);
        if (!list.length) { done(); return; }
        if (location.hash !== '#/home') location.hash = '#/home';   // 劇情開始前先回主畫面
        setTimeout(function () { playList(list, done); }, 300);
      });
    });
  }

  /* ---- 覺醒線索：手機裡看到寫了 clue 的東西 → js/game.js 的 findClue（覺醒度 +1）
   *   有 scenes.awake_線索（例如 awake_m3_1）就在找到後播（背景是變暗的手機畫面；劇情或強制聊天進行中就等結束再播） */
  /* 覺醒線索：找到 → 做 data.js 的 clues[線索] 寫的事（強制聊天 chat／強制留言 comment）→ 覺醒度 +1 → 播 awake_線索
   *   沒寫 clues 的線索 = 直接算找到、播 awake_線索 */
  var clueRunning = {};
  function clueDef(key) { return (D().clues || {})[key] || null; }
  function clue(c) {
    if (!c || !window.GAME) return;
    var key = typeof c === 'object' ? c.id : c, def = clueDef(key) || {};
    if (clueRunning[key] || (window.SOSHO && window.SOSHO.hasFlag('clue_' + key))) return;
    clueRunning[key] = true;
    function busy() { return cur || (window.SOSHO_KAKAO && window.SOSHO_KAKAO.dayChatting && window.SOSHO_KAKAO.dayChatting()); }
    function found() {
      clueRunning[key] = false;
      if (!window.GAME.findClue(key)) return;
      var id = 'awake_' + key;
      if (!(D().scenes || {})[id]) return;
      (function tryPlay(n) {
        if (busy()) { if (n < 600) setTimeout(function () { tryPlay(n + 1); }, 1000); return; }
        play(id, null, null, 'phone-dim');
      })(0);
    }
    (function start(n) {
      if (busy()) { if (n < 600) setTimeout(function () { start(n + 1); }, 1000); else clueRunning[key] = false; return; }
      if (def.chat && window.SOSHO_KAKAO) {
        var ch = {}; Object.keys(def.chat).forEach(function (k) { ch[k] = def.chat[k]; }); ch.id = 'clue_' + key;
        setTimeout(function () { window.SOSHO_KAKAO.dayChat(ch, found, true); }, def.delay != null ? def.delay : 600);
      } else if (def.comment && window.SOSHO && window.SOSHO.forceComment) {
        setTimeout(function () { window.SOSHO.forceComment(def.comment, found); }, def.delay != null ? def.delay : 600);
      } else found();
    })(0);
  }

  window.STORY = {
    // 看到幾秒後才算（clues[線索].see 毫秒，不寫 = 1 秒；0 = 一看到就算）；時間到之前離開那一頁就不算
    clue: function (c) {
      if (!c) return;
      var key = typeof c === 'object' ? c.id : c, def = clueDef(key) || {}, ms = def.see != null ? def.see : 1000, h = location.hash;
      if (!ms) { clue(c); return; }
      setTimeout(function () { if (location.hash === h) clue(c); }, ms);
    },
    play: play, fill: fill, playerName: playerName,
    askName: askName, askBirthday: askBirthday,
    playerBirthday: function () { return (load(PKEY, {}) || {}).birthday || ''; },
    // 劇情、輸入名字、日程選單、結局畫面進行中（KakaoTalk 橫幅、來電會等這些結束）
    playing: function () { return !!cur || !!document.querySelector('.vn-name, .sch, .end-card, .day-stage, .pl, .alarm, .wk, .title-scr'); },
    setName: function (n) { var pl = load(PKEY, {}) || {}; pl.name = n; store(PKEY, pl); },
    // 這個時段有沒有主線劇情（日程用：放學有主線就不能選日程）
    hasStory: function (phase) { return storyFor(phase).length > 0; },
    // 這個時段是讀檔後接著播的劇情（日程用：放學的活動劇情已經播完，就不再跳選單）
    resumed: function (phase) { var r = resumedPhase === phase; if (r) resumedPhase = null; return r; }
  };
})();
