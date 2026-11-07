/* =========================================================
 * 標題畫面：打開網頁先看到遊戲名稱
 *   有進度：繼續／讀取存檔／從頭開始
 *   沒進度：開始遊戲／讀取存檔（有存檔才出現）
 *   文字、背景在 data.js 的 title
 *   讀檔、時間循環、重新開始之後重新整理的那一次不會再出現（sessionStorage 的 riiiizeSkipTitle）
 * ========================================================= */
(function () {
  'use strict';

  var SKIP = 'riiiizeSkipTitle';
  function D() { return window.SITE_DATA || {}; }
  function G() { return window.GAME; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function T() {
    var t = D().title || {}, d = {
      name: 'RiiiiZE', subtitle: '拉完子學院', bg: '', credit: 'dng',
      start: '開始遊戲', cont: '繼續', load: '讀取存檔', restart: '從頭開始', back: '返回',
      btnStart: '開始', btnCont: '繼續', btnLoad: '讀取', btnLang: '語言', btnSound: '音效', on: '開', off: '關',
      langTitle: '語言', tw: '繁體中文', cn: '简体中文',
      autoSave: '自動存檔', loopSave: '循環前的存檔', slot: '存檔 {n}', noSaves: '還沒有存檔',
      restartTitle: '要從頭開始嗎？', restartText: '目前的進度會清除，回到第 1 天。\n存檔會保留。', ok: '從頭開始', cancel: '取消'
    };
    Object.keys(t).forEach(function (k) { d[k] = t[k]; });
    return d;
  }
  function hasProgress() {
    try { return !!(localStorage.getItem('riiiize-game') || localStorage.getItem('riiiize-player')); } catch (e) { return false; }
  }
  function skipNext() { try { sessionStorage.setItem(SKIP, '1'); } catch (e) {} }

  function show(done) {
    var skip = false;
    try { skip = sessionStorage.getItem(SKIP) === '1'; sessionStorage.removeItem(SKIP); } catch (e) {}
    if (skip) { done(); return; }
    var t = T(), el = document.createElement('div'), phone = document.getElementById('phone');
    el.className = 'title-scr';
    var bg = t.bg || (D().home || {}).wallpaper || '', bx = t.box || null;
    // 標題圖照 9:16 完整顯示（不裁切）；螢幕比例不同時，旁邊用同一張圖模糊填滿
    // 有 box（圖上的框）→ 按鈕放進框裡、不打遊戲名稱；沒有 box → 跟以前一樣置中顯示名稱和按鈕
    el.innerHTML = '<div class="title-blur" style="background-image:url(\'' + esc(bg) + '\')"></div>' +
      '<div class="title-art" style="background-image:url(\'' + esc(bg) + '\')">' +
        (bx ? '<div class="title-box" style="left:' + bx.left + '%;top:' + bx.top + '%;width:' + bx.width + '%;height:' + bx.height + '%"></div>' : '') +
        (t.credit ? '<div class="title-credit">' + esc(t.credit) + '</div>' : '') +   // 最下面粉色花邊上方的小字（比照 SOSHO 論壇頁面底部）
      '</div><div class="title-layer"></div>';
    var box = el.querySelector('.title-box'), layer = el.querySelector('.title-layer');
    phone.appendChild(el);
    phone.classList.add('story-full');
    void el.offsetWidth; el.classList.add('show');

    /* 框裡固定五個直式按鈕：開始、繼續、讀檔、語言、音效
     *   沒有進度：「繼續」變淺色不能按；沒有存檔：「讀檔」變淺色不能按
     *   有進度時按「開始」= 從頭開始（先確認） */
    function main() {
      var saves = G() ? G().saves() : { slots: {} }, any = saves.auto || saves.loop || Object.keys(saves.slots || {}).length;
      var prog = hasProgress(), sound = window.SOSHO_SOUND ? window.SOSHO_SOUND.on() : true;
      var b = function (act, label, enabled, extra) {
        return '<button type="button" class="title-v"' + (enabled ? ' data-t="' + act + '"' : ' disabled') + '>' + esc(label) + (extra ? '<small>' + esc(extra) + '</small>' : '') + '</button>';
      };
      var btns = '<div class="title-btns title-row">' +
        b(prog ? 'restart' : 'go', t.btnStart, true) +
        b('go', t.btnCont, prog) +
        b('load', t.btnLoad, !!any) +
        b('lang', t.btnLang, !!window.SOSHO_LANG) +
        b('sound', t.btnSound, true, sound ? t.on : t.off) +
      '</div>';
      if (box) { box.innerHTML = btns; layer.innerHTML = ''; }
      else layer.innerHTML = '<div class="title-logo"><b>' + esc(t.name) + '</b><span>' + esc(t.subtitle) + '</span></div>' + btns;
    }
    function langPanel() {
      var cur = window.SOSHO_LANG.lang === 'cn' ? 'cn' : 'tw';
      panel('<div class="title-panel"><b>' + esc(t.langTitle) + '</b><div class="title-btns">' +
        ['tw', 'cn'].map(function (l) {
          return '<button type="button"' + (l === cur ? ' class="on" disabled' : ' data-t="lang-' + l + '"') + '><span data-noconv>' + esc(t[l]) + '</span>' + (l === cur ? ' ✓' : '') + '</button>';
        }).join('') +
        '<button type="button" class="quiet" data-t="back">' + esc(t.back) + '</button></div></div>');
    }
    // 讀檔清單、確認從頭開始：蓋在畫面中間（框裡的按鈕先收起來）
    function panel(html) { if (box) box.innerHTML = ''; layer.innerHTML = html; }
    function loadList() {
      var s = G().saves(), rows = '', n = G().slots();
      function row(id, label, slot) {
        return '<button type="button" data-slot="' + id + '"><b>' + esc(label) + '</b><small>' + esc(slot.meta.date || '') + '</small></button>';
      }
      if (s.auto) rows += row('auto', t.autoSave, s.auto);
      if (s.loop) rows += row('loop', t.loopSave, s.loop);
      for (var i = 1; i <= n; i++) if (s.slots[i]) rows += row(i, t.slot.replace('{n}', i), s.slots[i]);
      panel('<div class="title-panel"><b>' + esc(t.load) + '</b>' +
        '<div class="title-list">' + (rows || '<p>' + esc(t.noSaves) + '</p>') + '</div>' +
        '<button type="button" class="quiet" data-t="back">' + esc(t.back) + '</button></div>');
    }
    function confirmRestart() {
      panel('<div class="title-panel"><b>' + esc(t.restartTitle) + '</b><p>' + esc(t.restartText).replace(/\n/g, '<br>') + '</p>' +
        '<div class="title-btns"><button type="button" data-t="restart-ok">' + esc(t.ok) + '</button>' +
        '<button type="button" class="quiet" data-t="back">' + esc(t.cancel) + '</button></div></div>');
    }
    function close() {
      el.classList.remove('show');
      phone.classList.remove('story-full');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 450);
      done();
    }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var a = b.getAttribute('data-t'), slot = b.getAttribute('data-slot');
      if (slot) { skipNext(); G().load(slot === 'auto' || slot === 'loop' ? slot : +slot); return; }
      if (a === 'go') close();
      else if (a === 'load') loadList();
      else if (a === 'back') main();
      else if (a === 'restart') confirmRestart();
      else if (a === 'lang') langPanel();
      else if (a === 'lang-tw' || a === 'lang-cn') window.SOSHO_LANG.toggle();   // 換語言：重新整理後回到標題畫面
      else if (a === 'sound') { if (window.SOSHO_SOUND) window.SOSHO_SOUND.toggle(); main(); }
      else if (a === 'restart-ok') {
        try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('riiiize-') === 0) localStorage.removeItem(k); }); } catch (err) {}
        skipNext();
        location.href = location.pathname;
      }
    });
    main();
  }

  window.TITLE = { show: show, skipNext: skipNext };
})();
