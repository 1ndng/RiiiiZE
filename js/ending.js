/* =========================================================
 * 結局
 *   劇情裡寫 { ending: "結局id" } → 這段劇情結束後進入結局：
 *     1. 播結局劇情（endings.結局id.scene）
 *     2. 依序播所有條件成立的後日談（endings.結局id.epilogues：[{ id, title, scene, if }]）
 *     3. 結局畫面：END＋結局名稱；點一下畫面回到手機（重新開始只能在 設定 裡選）
 *   回到手機之後：after = "continue" → 照常過日子（日程、睡覺都還在）；"explore" → 只能探索 App，不再換天
 *   結局圖鑑（設定 → 結局圖鑑）：看過的結局、後日談會記住，「重新開始」也不會清掉（存在 riiiizeGallery）
 * ========================================================= */
(function () {
  'use strict';

  var GKEY = 'riiiizeGallery';
  function D() { return window.SITE_DATA || {}; }
  function E() { return D().endings || {}; }
  function S() { return window.SOSHO; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function load() { try { return JSON.parse(localStorage.getItem(GKEY)) || {}; } catch (e) { return {}; } }
  function save(v) { try { localStorage.setItem(GKEY, JSON.stringify(v)); } catch (e) {} }
  function ok(c) { return !c || !window.GAME || window.GAME.check(c); }
  function T() {
    var t = D().endingText || {}, d = { end: 'END', epilogues: '後日談', tap: '點一下畫面繼續' };
    Object.keys(t).forEach(function (k) { d[k] = t[k]; });
    return d;
  }

  // 圖鑑：{ endings: { 結局id: 1 }, epilogues: { 結局id/後日談id: 1 } }
  function unlock(kind, key) { var g = load(); g[kind] = g[kind] || {}; g[kind][key] = 1; save(g); }

  function playAll(ids, done) {
    var k = 0;
    (function next() { if (k >= ids.length) { done(); return; } window.STORY.play(ids[k++], next); })();
  }

  var running = false;
  // done = 按「繼續」之後要做的事（讓這一天接著跑下去）
  function run(id, done) {
    var en = E()[id];
    if (!en || running) { done && done(); return; }
    running = true;
    if (S()) S().setFlag('ending_' + id);
    unlock('endings', id);
    // 後日談：條件現在就決定（播的過程中數值變了也不影響）
    var eps = (en.epilogues || []).filter(function (e) { return ok(e.if) && (D().scenes || {})[e.scene]; });
    var scenes = (en.scene ? [en.scene] : []).concat(eps.map(function (e) { return e.scene; }));
    playAll(scenes, function () {
      eps.forEach(function (e) { unlock('epilogues', id + '/' + e.id); });
      card(id, en, eps, done);
    });
  }

  // 結局畫面
  function card(id, en, eps, done) {
    var t = T(), el = document.createElement('div');
    el.className = 'end-card';
    el.innerHTML = '<div class="end-in">' +
      (t.end ? '<small>' + esc(t.end) + '</small>' : '') + '<b>' + esc(en.title || id) + '</b>' +
      (en.text ? '<p>' + esc(en.text) + '</p>' : '') +
      (eps.length ? '<div class="end-eps"><i>' + esc(t.epilogues) + '</i>' + eps.map(function (e) { return '<span>' + esc(e.title || e.id) + '</span>'; }).join('') + '</div>' : '') +
      '<div class="end-tap">' + esc(t.tap) + '</div>' +
    '</div>';
    document.getElementById('phone').appendChild(el);
    void el.offsetWidth; el.classList.add('show');
    if (S()) S().setDarkStatus(true);
    // 點一下畫面 → 回到手機（重新開始只能在 設定 裡選）
    el.addEventListener('click', function () {
      if (el.dataset.closing) return;
      el.dataset.closing = 1;
      // after: "loop" = 時間循環：存一個檔，回到 9/1 重新過這一年（js/game.js 的 newLoop）
      if (en.after === 'loop') { running = false; window.GAME.newLoop(); return; }
      window.GAME.setEnded(en.after === 'explore' ? 'explore' : 'continue');
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 800);
      if (S()) S().setDarkStatus(false);
      running = false;
      if (location.hash !== '#/home') location.hash = '#/home';
      done && done();
    });
  }

  window.ENDING = {
    run: run,
    running: function () { return running; },
    gallery: load,
    list: function () { return E(); }
  };
})();
