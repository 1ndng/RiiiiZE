/* 設定（iPhone「設定」風格）
 *   #/settings         遊戲進度（第幾天）、存檔與讀檔、語言、重新開始
 *   #/settings/saves   存檔與讀檔：每天早上的自動存檔＋好幾格手動存檔（格數 = data.js 的 game.saveSlots）
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
    day: '第幾天', aff: '好感度', awake: '覺醒度', pair: '成員之間的關係', flags: '旗標', noFlags: '還沒有旗標',
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
        row(ICON.calendar, '#ff3b30', esc(t.progress), esc(t.dayLabel.replace('{n}', g.day)) + ' · ' + esc(g.dateText(null, true)), 'data-st-na disabled', false) +
        row(ICON.save, '#007aff', esc(t.savesTitle), '', 'data-st-go="#/settings/saves"', true) +
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
    return '<small>' + esc(t.dayLabel.replace('{n}', m.day)) + ' · ' + esc(m.date || '') + '</small>' +
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
    var t = T(), s = G().saves(), has = id === 'auto' ? !!s.auto : !!s.slots[id];
    pickedSlot = id;
    var acts = [];
    if (id !== 'auto') acts.push({ act: 'save', label: t.saveHere });
    if (has) acts.push({ act: 'load', label: t.loadThis });
    if (has && id !== 'auto') acts.push({ act: 'delete', label: t.deleteThis, red: true });
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
      '<div class="st-group">' + stepper('day', '', esc(g.dateText(null, true))) + '</div>' +
      '<div class="st-sec">' + esc(t.aff) + '</div>' +
      '<div class="st-group">' + cast.map(function (c) { return stepper('aff', c.id, esc(c.name)); }).join('') + '</div>' +
      '<div class="st-sec">' + esc(t.awake) + '</div>' +
      '<div class="st-group">' + cast.map(function (c) { return stepper('awake', c.id, esc(c.name)); }).join('') + '</div>' +
      '<div class="st-sec">' + esc(t.pair) + '</div>' +
      '<div class="st-group">' + g.pairs().map(function (k) {
        var ab = k.split('-');
        return stepper('pair', k, esc(nameOf(ab[0])) + ' × ' + esc(nameOf(ab[1])));
      }).join('') + '</div>' +
      '<div class="st-sec">' + esc(t.flags) + '</div>' +
      '<div class="st-group st-flags">' + (flags.length ? flags.map(function (f) { return '<i>' + esc(f) + '</i>'; }).join('') : '<small>' + esc(t.noFlags) + '</small>') + '</div>' +
      '<div class="st-group">' + row('', '', '<span class="st-red">' + esc(t.resetStats) + '</span>', '', 'data-st-reset', false) + '</div>';
    S().$('#settings-scroll').scrollTop = top;
  }

  function route(parts) {
    S().$('#settings-scroll').scrollTop = 0;
    if (parts[0] === 'stats' && (D().game || {}).debug) renderStats();
    else if (parts[0] === 'saves') renderSaves();
    else renderMain();
  }

  document.addEventListener('click', function (e) {
    var app = document.getElementById('app-settings');
    if (!app || !app.contains(e.target)) return;
    var el, t = T();
    if ((el = e.target.closest('[data-st-go]'))) { location.hash = el.dataset.stGo; return; }
    if ((el = e.target.closest('[data-st-back]'))) { e.preventDefault(); S().goBack(el.getAttribute('href')); return; }
    if (e.target.closest('[data-st-lang]')) { window.SOSHO_LANG.toggle(); return; }
    if (e.target.closest('[data-st-restart]')) {
      confirmBox(t.restartTitle, t.restartText, t.restart, true, function () {
        try {
          Object.keys(localStorage).forEach(function (k) { if (k.indexOf('riiiize-') === 0) localStorage.removeItem(k); });
        } catch (err) {}
        location.href = location.pathname;
      });
      return;
    }
    if ((el = e.target.closest('[data-stat]'))) {
      var a = el.dataset.stat.split('|'), d = +a[2];
      if (a[0] === 'day') G().setDay(G().day + d); else G().addStat(a[0], a[1], d);
      renderStats(); return;
    }
    if (e.target.closest('[data-st-reset]')) {
      confirmBox(t.resetTitle, t.resetText, t.reset, true, function () {
        G().cast().forEach(function (c) { G().setStat('aff', c.id, 0); G().setStat('awake', c.id, 0); });
        G().pairs().forEach(function (k) { G().setStat('pair', k, 0); });
        renderStats();
      });
      return;
    }
    if ((el = e.target.closest('[data-slot]'))) { openSlot(el.dataset.slot === 'auto' ? 'auto' : +el.dataset.slot); return; }
    if ((el = e.target.closest('[data-sheet-act]'))) { e.target.closest('.st-sheet-wrap').remove(); doAct(el.dataset.sheetAct); return; }
    if (e.target.closest('[data-sheet-close]')) { e.target.closest('.st-sheet-wrap').remove(); return; }
  });

  (window.SOSHO_APPS = window.SOSHO_APPS || {}).settings = route;
})();
