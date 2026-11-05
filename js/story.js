/* =========================================================
 * 劇情對話框（視覺小說）
 *   - 背景圖＋對話框（名字、逐字出現的文字），點一下下一句；右上角「紀錄」可以回看
 *   - 劇情寫在 data.js 的 scenes；主線劇情排在 data.js 的 story（第幾天、早上／放學）
 *   - 玩家名字：第一次開始遊戲時輸入；劇情、KakaoTalk、通話裡寫 {name} 會換成玩家的名字
 *
 * 一段劇情 = 一串步驟（scenes.劇情id = [ 步驟, 步驟, … ]），每個步驟可以加 if（條件不成立就跳過）：
 *   { text: "旁白" }                         沒寫 who = 旁白
 *   { who: "m1", text: "台詞" }               who = 成員 id（顯示 cast 的名字）、"me"（玩家的名字）或直接寫名字
 *   { bg: "images/xxx.jpg" }                 換背景
 *   { choices: [ { text, effects, flag, goto, if }, … ] }   選項；goto = 跳到哪個 label（不寫 = 接著往下）
 *   { label: "名稱" }                         標記，給 goto 用
 *   { goto: "名稱" }                          跳過去（常和 if 一起用：條件成立才跳）
 *   { effects: { … } } / { flag: "旗標" }     套用效果、記錄旗標（不會顯示）
 *   { end: true }                            劇情在這裡結束
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
      log: '紀錄', close: '關閉', nameTitle: '你的名字是？', nameHint: '之後大家都會這樣叫你。', namePlaceholder: '輸入名字', nameOk: '確定',
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
      store(PKEY, { name: v });
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
    return c ? c.name : who;
  }
  function ok(c) { return !c || !window.GAME || window.GAME.check(c); }

  function play(id, done) {
    var steps = (D().scenes || {})[id];
    if (!steps || !steps.length || cur) { done && done(); return; }
    var t = T(), el = document.createElement('div');
    el.className = 'vn';
    el.innerHTML =
      '<div class="vn-bg" id="vn-bg"></div>' +
      '<button type="button" class="vn-logbtn" data-vn-log>' + esc(t.log) + '</button>' +
      '<div class="vn-choices" id="vn-choices"></div>' +
      '<div class="vn-box" id="vn-box"><div class="vn-who" id="vn-who"></div><div class="vn-text" id="vn-text"></div><i class="vn-next"></i></div>';
    document.getElementById('phone').appendChild(el);
    void el.offsetWidth; el.classList.add('show');
    if (S()) S().setDarkStatus(true);
    cur = { id: id, steps: steps, i: 0, el: el, log: [], done: done };
    step();
  }

  function findLabel(name) {
    for (var k = 0; k < cur.steps.length; k++) if (cur.steps[k].label === name) return k;
    return -1;
  }
  function step() {
    if (!cur) return;
    while (cur.i < cur.steps.length) {
      var s = cur.steps[cur.i++];
      if (!ok(s.if)) continue;
      if (s.end) break;
      if (s.label != null && s.text == null) continue;
      if (s.bg != null) setBg(s.bg);
      if (s.effects && window.GAME) window.GAME.apply(s.effects);
      if (s.flag && S()) [].concat(s.flag).forEach(function (f) { S().setFlag(f); });
      if (s.goto && s.text == null && !s.choices) { var k = findLabel(s.goto); if (k >= 0) cur.i = k; continue; }
      if (s.choices) { showChoices(s.choices); return; }
      if (s.text != null) { say(s.who, s.text); return; }
    }
    finish();
  }
  function setBg(src) {
    var bg = cur.el.querySelector('#vn-bg');
    bg.classList.remove('in'); void bg.offsetWidth;
    bg.style.backgroundImage = src ? 'url("' + src + '")' : 'none';
    bg.classList.add('in');
  }
  // 逐字出現：點一下 → 整句顯示；再點 → 下一句
  function say(who, text) {
    var name = nameOf(who), full = fill(text);
    cur.log.push({ who: name, text: full });
    var box = cur.el.querySelector('#vn-box'), w = cur.el.querySelector('#vn-who'), tx = cur.el.querySelector('#vn-text');
    box.classList.toggle('narration', !name);
    box.classList.remove('done');
    w.textContent = name;
    w.hidden = !name;
    tx.textContent = '';
    cur.full = full; cur.typing = true;
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
  }
  function showChoices(list) {
    var box = cur.el.querySelector('#vn-choices');
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
    if (S()) S().setFlag('scene_' + c.id);
    c.el.classList.remove('show');
    setTimeout(function () { c.el.remove(); }, 400);
    if (S()) S().setDarkStatus(false);
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

  document.addEventListener('click', function (e) {
    if (!cur || !cur.el.contains(e.target)) return;
    var b;
    if (e.target.closest('[data-vn-logclose]')) { e.target.closest('.vn-log').remove(); return; }
    if (e.target.closest('.vn-log')) return;
    if (e.target.closest('[data-vn-log]')) { openLog(); return; }
    if ((b = e.target.closest('[data-vn-choice]'))) { choose(+b.dataset.vnChoice); return; }
    if (cur.choices) return;   // 等玩家選
    if (cur.typing) finishTyping(); else step();
  });

  /* ---- 主線劇情：data.js 的 story = [{ day, phase: "morning" / "afterschool", scene, if }] ----
   * 到了那天的那個時段就自動播；同一個時段有好幾段就依序播 */
  function storyFor(phase) {
    var g = window.GAME;
    return (D().story || []).filter(function (s) {
      return (s.phase || 'morning') === phase && (s.day == null || +s.day === g.day) && ok(s.if) &&
        !(S() && S().hasFlag('scene_' + s.scene) && !s.repeat);
    });
  }
  function playList(list, done) {
    var k = 0;
    (function next() { if (k >= list.length) { done(); return; } play(list[k++].scene, next); })();
  }
  if (window.GAME) {
    // 第一次開始：先輸入名字
    window.GAME.onPhase('morning', function (done) { if (playerName()) done(); else askName(done); });
    ['morning', 'afterschool'].forEach(function (ph) {
      window.GAME.onPhase(ph, function (done) {
        var list = storyFor(ph);
        if (!list.length) { done(); return; }
        if (location.hash !== '#/home') location.hash = '#/home';   // 劇情開始前先回主畫面
        setTimeout(function () { playList(list, done); }, 300);
      });
    });
  }

  window.STORY = {
    play: play, fill: fill, playerName: playerName,
    playing: function () { return !!cur || !!document.querySelector('.vn-name'); },   // 劇情或輸入名字進行中
    setName: function (n) { store(PKEY, { name: n }); },
    // 這個時段有沒有主線劇情（日程用：放學有主線就不能選日程）
    hasStory: function (phase) { return storyFor(phase).length > 0; }
  };
})();
