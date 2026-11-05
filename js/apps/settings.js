/* 設定（iPhone「設定」風格）
 *   #/settings         遊戲進度（第幾天）、存檔與讀檔、語言、重新開始
 *   #/settings/saves   存檔與讀檔：每天早上的自動存檔＋好幾格手動存檔（格數 = data.js 的 game.saveSlots）
 *   #/settings/wallpaper  背景圖片：鎖定畫面、主畫面各自換一張自己的照片，或恢復預設
 *   #/settings/stats   數值（開發用）：看、調整隱藏數值、跳天數；data.js 的 game.debug 設成 false 就不會出現
 * 存檔放在 riiiizeSaves，「重新開始」不會清掉 */
(function () {
  'use strict';

  var ICON = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 4l-8 8 8 8" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    save: '<svg viewBox="0 0 24 24"><path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="currentColor"/><rect x="8" y="3" width="7" height="5" rx="1" fill="#fff"/><rect x="8" y="13" width="8" height="5" rx="1" fill="#fff"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="1.6" fill="none"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" stroke="#fff" stroke-width="1.6" fill="none"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14.5" rx="2.5" fill="#fff"/><path d="M4 10h16" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 3.5v4M15.5 3.5v4" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
    wrench: '<svg viewBox="0 0 24 24"><path d="M14.5 3.5a5 5 0 0 0-4.7 6.7L3.6 16.4a1.9 1.9 0 0 0 2.7 2.7l6.2-6.2a5 5 0 0 0 6.7-4.7l-2.9 2.9-2.7-.7-.7-2.7z" fill="#fff"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="#fff"/></svg>',
    image: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="14" rx="2.5" stroke="#fff" stroke-width="1.8" fill="none"/><circle cx="9" cy="10" r="1.7" fill="#fff"/><path d="M4 17l5-5 4 4 2.5-2.5L20 18" stroke="#fff" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>',
    restart: '<svg viewBox="0 0 24 24"><path d="M5.5 9A7.5 7.5 0 1 1 4.6 14" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M4 4.5v5h5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function S() { return window.SOSHO; }
  function D() { return S().data; }
  function esc(s) { return S().esc(s); }
  var T_DEFAULT = {
    title: '設定', progress: '遊戲進度', today: '今天', savesTitle: '存檔與讀檔', language: '語言', restart: '重新開始',
    back: '設定', autoSave: '自動存檔', autoNote: '每天早上自動存一次，只能讀取。', manual: '手動存檔', slot: '存檔 {n}', empty: '空的',
    saveHere: '存到這裡', loadThis: '讀取這個存檔', deleteThis: '刪除這個存檔', cancel: '取消', saved: '已存檔',
    overwriteTitle: '要覆蓋這個存檔嗎？', overwriteText: '原本的存檔會被取代。', overwrite: '覆蓋',
    loadTitle: '要讀取這個存檔嗎？', loadText: '目前還沒存的進度會不見。', load: '讀取',
    deleteTitle: '要刪除這個存檔嗎？', deleteText: '刪除之後就沒辦法復原。', del: '刪除',
    restartTitle: '要從頭開始嗎？', restartText: '目前的進度都會清除，回到第 1 天。存檔會保留，之後還能讀取。',
    dayLabel: '第 {n} 天', savedAt: '存於 {t}',
    statsTitle: '數值（開發用）', statsNote: '玩家看不到這一頁。正式公開前把 data.js 的 game.debug 改成 false。',
    day: '第幾天', aff: '好感度', awake: '覺醒度（還要看過那位成員的第三階段覺醒劇情才算覺醒）', pair: '成員之間的關係', flags: '旗標', noFlags: '還沒有旗標',
    gallery: '結局圖鑑', galleryCount: '已收集 {n} / {all}', locked: '？？？', epilogue: '後日談',
    galleryNote: '看過的結局和後日談會記在這裡，「重新開始」也不會清掉。點一下可以重看。',
    visits: '去過幾次（日程）', planNow: '打開這個月的月曆安排',
    scenes: '劇情（播放測試）', playerName: '玩家名字', rename: '改名字', renameTitle: '輸入新的名字',
    loopSave: '循環前的存檔', loopSaveName: '第 {n} 輪結束時', loopNote: 'DREAM END 之後回到 9/1 之前自動存的檔，只能讀取。讀取後在 8/31 晚上睡覺，就會再次回到 9/1。', loopNo: '第 {n} 輪',
    wallpaper: '背景圖片', wpLock: '鎖定畫面', wpHome: '主畫面', wpChange: '更換', wpDefault: '恢復預設',
    wpNote: '選一張自己的照片當鎖定畫面或主畫面的背景。存在這個瀏覽器裡，「重新開始」也不會清掉。', wpTooBig: '照片太大了，換一張試試看。',
    resetStats: '數值全部歸零', resetTitle: '要把數值全部歸零嗎？', resetText: '好感度、關係、覺醒度都會變回 0（旗標和天數不變）。', reset: '歸零'
  };
  function T() {
    var t = (D().game || {}).settingsText || {}, o = {};
    Object.keys(T_DEFAULT).forEach(function (k) { o[k] = t[k] != null ? t[k] : T_DEFAULT[k]; });
    return o;
  }
  function G() { return window.GAME; }

  function row(icon, color, label, value, attrs, chevron) {
    return '<button type="button" class="st-row" ' + (attrs || '') + '>' +
      (icon ? '<span class="st-ico" style="background:' + color + '">' + icon + '</span>' : '') +
      '<span class="st-label">' + label + '</span>' +
      (value ? '<span class="st-val">' + value + '</span>' : '') +
      (chevron ? '<span class="st-arrow">' + ICON.right + '</span>' : '') +
    '</button>';
  }

  /* ---- 設定首頁 ---- */
  function renderMain() {
    var t = T(), g = G();
    S().$('#settings-overlay').innerHTML = '';
    S().$('#settings-scroll').innerHTML =
      '<h1 class="st-h1">' + esc(t.title) + '</h1>' +
      '<div class="st-group">' +
        row(ICON.calendar, '#ff3b30', esc(t.progress), esc(g.dateText(null, true)), 'data-st-na disabled', false) +
        row(ICON.save, '#007aff', esc(t.savesTitle), '', 'data-st-go="#/settings/saves"', true) +
        row(ICON.image, '#30b0c7', esc(t.wallpaper), '', 'data-st-go="#/settings/wallpaper"', true) +
        (window.ENDING ? row(ICON.star, '#ff9500', esc(t.gallery), '', 'data-st-go="#/settings/gallery"', true) : '') +
      '</div>' +
      ((D().game || {}).debug ? '<div class="st-group">' + row(ICON.wrench, '#34c759', esc(t.statsTitle), '', 'data-st-go="#/settings/stats"', true) + '</div>' : '') +
      '<div class="st-group">' +
        (window.SOSHO_LANG ? row(ICON.globe, '#5856d6', esc(t.language), '<span data-noconv>' + (window.SOSHO_LANG.lang === 'cn' ? '简体中文' : '繁體中文') + '</span>', 'data-st-lang', true) : '') +
        row(ICON.restart, '#8e8e93', '<span class="st-red">' + esc(t.restart) + '</span>', '', 'data-st-restart', false) +
      '</div>';
  }

  /* ---- 存檔與讀檔 ---- */
  function slotText(slot) {
    var t = T();
    if (!slot) return '<small class="st-empty">' + esc(t.empty) + '</small>';
    var m = slot.meta || {};
    return '<small>' + esc(m.date || '') + '</small>' +
      '<small class="st-dim">' + esc(t.savedAt.replace('{t}', m.savedAt || '')) + '</small>';
  }
  function renderSaves() {
    var t = T(), s = G().saves(), n = G().slots(), rows = '';
    for (var i = 1; i <= n; i++) {
      rows += '<button type="button" class="st-slot" data-slot="' + i + '"><b>' + esc(t.slot.replace('{n}', i)) + '</b>' + slotText(s.slots[i]) + '</button>';
    }
    S().$('#settings-overlay').innerHTML = '';
    S().$('#settings-scroll').innerHTML =
      '<div class="st-nav"><a href="#/settings" data-st-back>' + ICON.back + '<span>' + esc(t.back) + '</span></a></div>' +
      '<h1 class="st-h1 st-h1-s">' + esc(t.savesTitle) + '</h1>' +
      '<div class="st-sec">' + esc(t.autoSave) + '</div>' +
      '<div class="st-group"><button type="button" class="st-slot" data-slot="auto"' + (s.auto ? '' : ' disabled') + '><b>' + esc(t.autoSave) + '</b>' + slotText(s.auto) + '</button></div>' +
      '<div class="st-note">' + esc(t.autoNote) + '</div>' +
      // 時間循環：DREAM END 之後回到 9/1 前自動存的檔（最近一次）
      (s.loop ? '<div class="st-sec">' + esc(t.loopSave) + '</div>' +
        '<div class="st-group"><button type="button" class="st-slot" data-slot="loop"><b>' + esc(t.loopSaveName.replace('{n}', s.loop.meta.loop || 1)) + '</b>' + slotText(s.loop) + '</button></div>' +
        '<div class="st-note">' + esc(t.loopNote) + '</div>' : '') +
      '<div class="st-sec">' + esc(t.manual) + '</div>' +
      '<div class="st-group">' + rows + '</div>';
  }

  // 下方滑出的選單
  function sheet(buttons) {
    var t = T(), w = document.createElement('div');
    w.className = 'st-sheet-wrap';
    w.innerHTML = '<div class="st-sheet-bg" data-sheet-close></div><div class="st-sheet">' +
      '<div class="st-sheet-grp">' + buttons.map(function (b) {
        return '<button type="button" class="' + (b.red ? 'st-red' : '') + '" data-sheet-act="' + b.act + '">' + esc(b.label) + '</button>';
      }).join('') + '</div>' +
      '<button type="button" class="st-sheet-cancel" data-sheet-close>' + esc(t.cancel) + '</button></div>';
    S().$('#settings-overlay').appendChild(w);
    void w.offsetWidth; w.classList.add('show');
    return w;
  }
  // 確認視窗（iPhone 的置中提示框）
  function confirmBox(title, text, okLabel, red, onOk) {
    var t = T(), w = document.createElement('div');
    w.className = 'ios-alert-wrap';
    w.innerHTML = '<div class="ios-alert"><b>' + esc(title) + '</b><p>' + esc(text) + '</p>' +
      '<div class="ios-alert-btns"><button type="button" data-alert-no>' + esc(t.cancel) + '</button>' +
      '<button type="button" data-alert-yes' + (red ? ' class="st-red"' : '') + '>' + esc(okLabel) + '</button></div></div>';
    S().$('#settings-overlay').appendChild(w);
    w.addEventListener('click', function (e) {
      if (e.target.closest('[data-alert-no]')) w.remove();
      else if (e.target.closest('[data-alert-yes]')) { w.remove(); onOk(); }
    });
  }

  var pickedSlot = null;
  function openSlot(id) {
    var t = T(), s = G().saves(), fixed = id === 'auto' || id === 'loop', has = id === 'auto' ? !!s.auto : id === 'loop' ? !!s.loop : !!s.slots[id];
    pickedSlot = id;
    var acts = [];
    if (!fixed) acts.push({ act: 'save', label: t.saveHere });
    if (has) acts.push({ act: 'load', label: t.loadThis });
    if (has && !fixed) acts.push({ act: 'delete', label: t.deleteThis, red: true });
    sheet(acts);
  }
  function doAct(act) {
    var t = T(), id = pickedSlot, s = G().saves(), has = !!s.slots[id];
    if (act === 'save') {
      var go = function () { G().save(id); S().toast(t.saved); renderSaves(); };
      if (has) confirmBox(t.overwriteTitle, t.overwriteText, t.overwrite, false, go); else go();
    } else if (act === 'load') {
      confirmBox(t.loadTitle, t.loadText, t.load, false, function () { G().load(id); });
    } else if (act === 'delete') {
      confirmBox(t.deleteTitle, t.deleteText, t.del, true, function () { G().remove(id); renderSaves(); });
    }
  }

  /* ---- 數值（開發用） ---- */
  function nameOf(id) { var c = G().cast().filter(function (x) { return x.id === id; })[0]; return c ? c.name : id; }
  function stepper(kind, id, label) {
    return '<div class="st-stat"><span>' + label + '</span>' +
      '<button type="button" data-stat="' + kind + '|' + id + '|-1">−</button>' +
      '<b>' + (kind === 'day' ? G().day : G().stat(kind, id)) + '</b>' +
      '<button type="button" data-stat="' + kind + '|' + id + '|1">＋</button></div>';
  }
  function renderStats() {
    var t = T(), g = G(), cast = g.cast(), flags = Object.keys(S().load('riiiize-flags', {}) || {});
    var top = S().$('#settings-scroll').scrollTop;
    S().$('#settings-overlay').innerHTML = '';
    S().$('#settings-scroll').innerHTML =
      '<div class="st-nav"><a href="#/settings" data-st-back>' + ICON.back + '<span>' + esc(t.back) + '</span></a></div>' +
      '<h1 class="st-h1 st-h1-s">' + esc(t.statsTitle) + '</h1>' +
      '<div class="st-note st-note-top">' + esc(t.statsNote) + '</div>' +
      '<div class="st-sec">' + esc(t.day) + '</div>' +
      '<div class="st-group">' + stepper('day', '', esc(g.dateText(null, true) + '（' + t.loopNo.replace('{n}', g.loop ? g.loop() : 1) + '）')) + '</div>' +
      '<div class="st-sec">' + esc(t.aff) + '</div>' +
      '<div class="st-group">' + cast.map(function (c) { return stepper('aff', c.id, '<img class="st-av" src="' + esc(c.avatar || 'images/default_avatar.png') + '" alt="">' + esc(c.name)); }).join('') + '</div>' +
      '<div class="st-sec">' + esc(t.awake) + '</div>' +
      '<div class="st-group">' + cast.map(function (c) { return stepper('awake', c.id, '<img class="st-av" src="' + esc(c.avatar || 'images/default_avatar.png') + '" alt="">' + esc(c.name) + (g.isAwake && g.isAwake(c.id) ? '<small class="st-awoke">已覺醒</small>' : '')); }).join('') + '</div>' +
      '<div class="st-sec">' + esc(t.pair) + '</div>' +
      '<div class="st-group">' + g.pairs().map(function (k) {
        var ab = k.split('-');
        return stepper('pair', k, esc(nameOf(ab[0])) + ' × ' + esc(nameOf(ab[1])));
      }).join('') + '</div>' +
      '<div class="st-sec">' + esc(t.visits) + '</div>' +
      '<div class="st-group">' + ((D().plan || {}).activities || []).map(function (a) { return stepper('visits', a.id, esc(a.label)); }).join('') + '</div>' +
      '<div class="st-sec">' + esc(t.flags) + '</div>' +
      '<div class="st-group st-flags">' + (flags.length ? flags.map(function (f) { return '<i>' + esc(f) + '</i>'; }).join('') : '<small>' + esc(t.noFlags) + '</small>') + '</div>' +
      (window.PLAN ? '<div class="st-group">' + row('', '', esc(t.planNow), '', 'data-st-plan', true) + '</div>' : '') +
      '<div class="st-sec">' + esc(t.scenes) + '</div>' +
      '<div class="st-group">' + Object.keys(D().scenes || {}).filter(function (id) { return id.indexOf('__') !== 0; }).map(function (id) {
        return row('', '', esc(id), S().hasFlag('scene_' + id) ? '✓' : '', 'data-st-scene="' + esc(id) + '"', true);
      }).join('') + '</div>' +
      '<div class="st-sec">' + esc(t.playerName) + '</div>' +
      '<div class="st-group">' + row('', '', esc(window.STORY ? window.STORY.playerName() || '—' : '—'), esc(t.rename), 'data-st-rename', true) + '</div>' +
      '<div class="st-group">' + row('', '', '<span class="st-red">' + esc(t.resetStats) + '</span>', '', 'data-st-reset', false) + '</div>';
    S().$('#settings-scroll').scrollTop = top;
  }

  /* ---- 結局圖鑑 ---- */
  function renderGallery() {
    var t = T(), all = window.ENDING.list(), g = window.ENDING.gallery(), got = 0, total = 0, body = '';
    Object.keys(all).forEach(function (id) {
      var en = all[id], has = (g.endings || {})[id];
      total++; if (has) got++;
      var eps = (en.epilogues || []).map(function (e) {
        var k = id + '/' + e.id, open = (g.epilogues || {})[k];
        total++; if (open) got++;
        return '<button type="button" class="st-slot st-ep"' + (open ? ' data-replay="' + esc(e.scene) + '"' : ' disabled') + '>' +
          '<small>' + esc(t.epilogue) + '</small><b>' + esc(open ? e.title || e.id : t.locked) + '</b></button>';
      }).join('');
      body += '<div class="st-group">' +
        '<button type="button" class="st-slot"' + (has && en.scene ? ' data-replay="' + esc(en.scene) + '"' : (has ? '' : ' disabled')) + '>' +
          '<b>' + esc(has ? en.title || id : t.locked) + '</b>' + (has && en.text ? '<small class="st-dim">' + esc(en.text) + '</small>' : '') + '</button>' +
        eps + '</div>';
    });
    S().$('#settings-overlay').innerHTML = '';
    S().$('#settings-scroll').innerHTML =
      '<div class="st-nav"><a href="#/settings" data-st-back>' + ICON.back + '<span>' + esc(t.back) + '</span></a></div>' +
      '<h1 class="st-h1 st-h1-s">' + esc(t.gallery) + '</h1>' +
      '<div class="st-note st-note-top">' + esc(t.galleryCount.replace('{n}', got).replace('{all}', total)) + '　' + esc(t.galleryNote) + '</div>' + body;
  }

  /* ---- 背景圖片 ---- */
  function renderWallpaper() {
    var t = T();
    function card(kind, label) {
      return '<div class="st-wp">' +
        '<div class="st-wp-img ' + kind + '" style="background-image:url(&quot;' + esc(S().wallpaper(kind)) + '&quot;)">' +
          (kind === 'lock' ? '<b>9:41</b>' : '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>') + '</div>' +
        '<span>' + esc(label) + '</span>' +
        '<label class="st-wp-btn">' + esc(t.wpChange) + '<input type="file" accept="image/*" data-wp-file="' + kind + '" hidden></label>' +
        (S().isCustomWallpaper(kind) ? '<button type="button" class="st-wp-reset" data-wp-reset="' + kind + '">' + esc(t.wpDefault) + '</button>' : '') +
      '</div>';
    }
    S().$('#settings-overlay').innerHTML = '';
    S().$('#settings-scroll').innerHTML =
      '<div class="st-nav"><a href="#/settings" data-st-back>' + ICON.back + '<span>' + esc(t.back) + '</span></a></div>' +
      '<h1 class="st-h1 st-h1-s">' + esc(t.wallpaper) + '</h1>' +
      '<div class="st-note st-note-top">' + esc(t.wpNote) + '</div>' +
      '<div class="st-wps">' + card('lock', t.wpLock) + card('home', t.wpHome) + '</div>';
  }
  // 選了照片：縮小（最長邊 1170）存成 JPEG
  function pickWallpaper(kind, file) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var k = Math.min(1, 1170 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        if (!S().setWallpaper(kind, c.toDataURL('image/jpeg', .85)) && S().toast) S().toast(T().wpTooBig);
        renderWallpaper();
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }
  document.addEventListener('change', function (e) {
    var k = e.target.dataset && e.target.dataset.wpFile;
    if (k && e.target.files && e.target.files[0]) pickWallpaper(k, e.target.files[0]);
  });

  function route(parts) {
    S().$('#settings-scroll').scrollTop = 0;
    if (parts[0] === 'gallery' && window.ENDING) { renderGallery(); return; }
    if (parts[0] === 'stats' && (D().game || {}).debug) renderStats();
    else if (parts[0] === 'saves') renderSaves();
    else if (parts[0] === 'wallpaper') renderWallpaper();
    else renderMain();
  }

  document.addEventListener('click', function (e) {
    var app = document.getElementById('app-settings');
    if (!app || !app.contains(e.target)) return;
    var el, t = T();
    if ((el = e.target.closest('[data-st-go]'))) { location.hash = el.dataset.stGo; return; }
    if ((el = e.target.closest('[data-st-back]'))) { e.preventDefault(); S().goBack(el.getAttribute('href')); return; }
    if (e.target.closest('[data-st-lang]')) { window.SOSHO_LANG.toggle(); return; }
    if ((el = e.target.closest('[data-wp-reset]'))) { S().setWallpaper(el.dataset.wpReset, null); renderWallpaper(); return; }
    if (e.target.closest('[data-st-restart]')) {
      confirmBox(t.restartTitle, t.restartText, t.restart, true, function () {
        try {
          Object.keys(localStorage).forEach(function (k) { if (k.indexOf('riiiize-') === 0) localStorage.removeItem(k); });
        } catch (err) {}
        try { sessionStorage.setItem('riiiizeSkipTitle', '1'); } catch (err) {}
        location.href = location.pathname;
      });
      return;
    }
    if ((el = e.target.closest('[data-stat]'))) {
      var a = el.dataset.stat.split('|'), d = +a[2];
      if (a[0] === 'day') G().setDay(G().day + d); else G().addStat(a[0], a[1], d);
      renderStats(); return;
    }
    if (e.target.closest('[data-st-plan]')) { window.PLAN.openPlanner(renderStats); return; }
    if ((el = e.target.closest('[data-replay]'))) { window.STORY.play(el.dataset.replay); return; }
    if ((el = e.target.closest('[data-st-scene]'))) { window.STORY.play(el.dataset.stScene, renderStats); return; }
    if (e.target.closest('[data-st-rename]')) {
      var n = prompt(t.renameTitle, window.STORY.playerName());
      if (n && n.trim()) { window.STORY.setName(n.trim()); renderStats(); }
      return;
    }
    if (e.target.closest('[data-st-reset]')) {
      confirmBox(t.resetTitle, t.resetText, t.reset, true, function () {
        G().cast().forEach(function (c) { G().setStat('aff', c.id, 0); G().setStat('awake', c.id, 0); });
        G().pairs().forEach(function (k) { G().setStat('pair', k, 0); });
        renderStats();
      });
      return;
    }
    if ((el = e.target.closest('[data-slot]'))) { openSlot(el.dataset.slot === 'auto' || el.dataset.slot === 'loop' ? el.dataset.slot : +el.dataset.slot); return; }
    if ((el = e.target.closest('[data-sheet-act]'))) { e.target.closest('.st-sheet-wrap').remove(); doAct(el.dataset.sheetAct); return; }
    if (e.target.closest('[data-sheet-close]')) { e.target.closest('.st-sheet-wrap').remove(); return; }
  });

  (window.SOSHO_APPS = window.SOSHO_APPS || {}).settings = route;
})();
