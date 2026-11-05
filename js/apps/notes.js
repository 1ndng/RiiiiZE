/* 備忘錄（iPhone 內建「備忘錄」風格）
 *   #/notes          備忘錄列表（已釘選、其他）
 *   #/notes/n/id     打開一則備忘錄（可以直接編輯）
 *   #/notes/new      新增備忘錄
 * 鎖住的備忘錄要輸入密碼（data.js 的 notes.passcode）才看得到內容；解開時記錄旗標 note_備忘錄id
 * 玩家改過、新增、刪除的內容存在瀏覽器（riiiize-notes），重新開始會清掉 */
(function () {
  'use strict';

  var KEY = 'riiiize-notes';
  var ICON = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 4l-8 8 8 8" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    compose: '<svg viewBox="0 0 24 24"><path d="M19 13.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M17.6 3.4a1.9 1.9 0 0 1 2.7 2.7L12 14.4l-3.6.9.9-3.6z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 6.5h16M9.5 6.5V4.5h5v2M6.5 6.5l1 13.5h9l1-13.5M10 10v7M14 10v7" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2.5" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M9 3h6l-1 6 4 4H6l4-4zM12 13v8" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round" stroke-linecap="round"/></svg>'
  };

  function S() { return window.SOSHO; }
  function N() { return S().data.notes || { notes: [] }; }
  function esc(s) { return S().esc(s); }
  var T_DEFAULT = {
    title: '備忘錄', pinned: '已釘選', others: '備忘錄', count: '{n} 則備忘錄', newNote: '新增備忘錄', noText: '沒有其他文字',
    locked: '此備忘錄已鎖定', lockedHint: '輸入密碼來檢視此備忘錄。', viewNote: '檢視備忘錄', passcode: '密碼',
    wrong: '密碼錯誤', ok: '好', cancel: '取消', done: '完成', back: '備忘錄', lockedRow: '已鎖定', empty: '沒有備忘錄'
  };
  function T() {
    var t = N().text || {}, o = {};
    Object.keys(T_DEFAULT).forEach(function (k) { o[k] = t[k] != null ? t[k] : T_DEFAULT[k]; });
    return o;
  }
  function state() {
    var st = S().load(KEY, null) || {};
    st.edits = st.edits || {}; st.deleted = st.deleted || {}; st.created = st.created || []; st.unlocked = st.unlocked || {};
    return st;
  }
  function save(st) { S().save(KEY, st); }

  // 日期 = 遊戲裡的今天；時間 = 現在的時間
  function gdate() { return window.GAME ? window.GAME.date() : new Date(); }
  function stamp() {
    var d = new Date(), h = d.getHours(), g = gdate();
    return { date: g.getFullYear() + '年' + (g.getMonth() + 1) + '月' + g.getDate() + '日', time: (h < 12 ? '上午 ' : '下午 ') + (h % 12 || 12) + ':' + String(d.getMinutes()).padStart(2, '0'), ts: d.getTime() };
  }
  // 全部備忘錄（玩家改過的內容、新增的、刪除的都算進去），新的在前
  function all() {
    var st = state();
    var base = (N().notes || []).map(function (n, i) {
      var e = st.edits[n.id];
      return { id: String(n.id), text: e ? e.text : n.text || '', date: e ? e.date : n.date, time: e ? e.time : n.time, pinned: !!n.pinned, locked: !!n.locked, order: e ? e.ts : -i };
    });
    var mine = st.created.map(function (n) {
      var e = st.edits[n.id] || n;
      return { id: n.id, text: e.text, date: e.date, time: e.time, order: e.ts, mine: true };
    });
    return base.concat(mine).filter(function (n) { return !st.deleted[n.id]; })
      .sort(function (a, b) { return b.order - a.order; });
  }
  function find(id) { return all().filter(function (n) { return n.id === String(id); })[0] || null; }
  function lines(t) { return String(t || '').split('\n').filter(function (l) { return l.trim(); }); }
  function isOpen(n) { return !n.locked || state().unlocked[n.id]; }

  function rowHTML(n) {
    var t = T(), ls = lines(n.text), title = ls[0] || t.newNote;
    var sub = !isOpen(n) ? t.lockedRow : (ls[1] || t.noText);
    return '<a class="nt-row" href="#/notes/n/' + encodeURIComponent(n.id) + '">' +
      '<b>' + (n.locked ? '<i class="nt-lockico">' + ICON.lock + '</i>' : '') + esc(n.locked && !isOpen(n) ? (N().lockedTitle || title) : title) + '</b>' +
      '<span><em>' + esc(shortDate(n)) + '</em>' + esc(sub) + '</span></a>';
  }
  // 列表上的日期：今天 → 時間；其他 → 年/月/日
  function shortDate(n) {
    var m = /(\d{4})\D+(\d+)\D+(\d+)/.exec(n.date || ''), d = gdate();
    if (!m) return n.time || '';
    if (+m[1] === d.getFullYear() && +m[2] === d.getMonth() + 1 && +m[3] === d.getDate()) return (n.time || '').replace(/^(上午|下午)\s*/, '$1');
    return m[1] + '/' + m[2] + '/' + m[3];
  }

  /* ---- 列表 ---- */
  function renderList() {
    var t = T(), list = all(), pins = list.filter(function (n) { return n.pinned; }), rest = list.filter(function (n) { return !n.pinned; });
    S().$('#notes-overlay').innerHTML =
      '<div class="nt-bottom"><span></span><small>' + esc(t.count.replace('{n}', list.length)) + '</small>' +
        '<a href="#/notes/new" class="nt-ico" aria-label="new">' + ICON.compose + '</a></div>';
    S().$('#notes-scroll').innerHTML =
      '<h1 class="nt-h1">' + esc(t.title) + '</h1>' +
      (pins.length ? '<div class="nt-sec">' + esc(t.pinned) + '</div><div class="nt-group">' + pins.map(rowHTML).join('') + '</div>' : '') +
      (rest.length ? (pins.length ? '<div class="nt-sec">' + esc(t.others) + '</div>' : '') + '<div class="nt-group">' + rest.map(rowHTML).join('') + '</div>' : '') +
      (!list.length ? '<div class="nt-empty">' + esc(t.empty) + '</div>' : '');
  }

  /* ---- 單則備忘錄 ---- */
  function renderNote(id) {
    var t = T(), n = find(id);
    if (!n) { S().replaceHash('#/notes'); return; }
    var head =
      '<div class="nt-nav"><a href="#/notes" data-nback>' + ICON.back + '<span>' + esc(t.back) + '</span></a>' +
        '<span class="nt-nav-r">' + (isOpen(n) ? '<button type="button" data-ndelete class="nt-ico">' + ICON.trash + '</button>' +
          '<button type="button" class="nt-done" data-ndone>' + esc(t.done) + '</button>' : '') + '</span></div>';
    S().$('#notes-overlay').innerHTML = '';
    if (!isOpen(n)) {
      S().$('#notes-scroll').innerHTML = head +
        '<div class="nt-locked">' + ICON.lock + '<b>' + esc(t.locked) + '</b><p>' + esc(t.lockedHint) + '</p>' +
          '<button type="button" data-nunlock="' + esc(n.id) + '">' + esc(t.viewNote) + '</button></div>';
      return;
    }
    S().$('#notes-scroll').innerHTML = head +
      '<div class="nt-date">' + esc((n.date || '') + ' ' + (n.time || '')) + '</div>' +
      '<textarea class="nt-text" id="nt-text" spellcheck="false">' + esc(n.text) + '</textarea>';
    var ta = S().$('#nt-text');
    function fit() { ta.style.height = 'auto'; ta.style.height = Math.max(ta.scrollHeight, 300) + 'px'; }
    fit();
    ta.addEventListener('input', function () {
      fit();
      var st = state(), s = stamp();
      st.edits[n.id] = { text: ta.value, date: s.date, time: s.time, ts: s.ts };
      save(st);
    });
    if (n.mine && !n.text) ta.focus();
  }

  // 解鎖：輸入密碼的小視窗
  function askPasscode(id) {
    var t = T(), w = document.createElement('div');
    w.className = 'nt-alert-wrap';
    w.innerHTML = '<form class="nt-alert" autocomplete="off"><b>' + esc(t.locked) + '</b><p>' + esc(t.lockedHint) + '</p>' +
      '<input type="password" name="p" placeholder="' + esc(t.passcode) + '" autocomplete="off">' +
      '<div class="nt-alert-btns"><button type="button" data-nalert-close>' + esc(t.cancel) + '</button><button type="submit">' + esc(t.ok) + '</button></div></form>';
    S().$('#notes-overlay').appendChild(w);
    var f = w.querySelector('form');
    f.p.focus();
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.p.value === String(N().passcode || '')) {
        var st = state(); st.unlocked[id] = 1; save(st);
        S().setFlag('note_' + id);
        renderNote(id);
      } else {
        f.p.value = '';
        f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
        f.querySelector('p').textContent = t.wrong;
      }
    });
  }

  function newNote() {
    var st = state(), s = stamp(), id = 'my' + s.ts;
    st.created.push({ id: id, text: '', date: s.date, time: s.time, ts: s.ts });
    save(st);
    S().replaceHash('#/notes/n/' + id);
  }

  function route(parts) {
    S().$('#notes-scroll').scrollTop = 0;
    if (parts[0] === 'new') newNote();
    else if (parts[0] === 'n') renderNote(parts[1]);
    else renderList();
  }

  // 離開備忘錄 App → 鎖住的備忘錄重新上鎖（和 iPhone 一樣）
  window.addEventListener('hashchange', function () {
    if (location.hash.indexOf('#/notes') === 0) return;
    var st = S() && state();
    if (st && Object.keys(st.unlocked).length) { st.unlocked = {}; save(st); }
  });

  document.addEventListener('click', function (e) {
    var app = document.getElementById('app-notes');
    if (!app || !app.contains(e.target)) return;
    var el;
    if (e.target.closest('[data-nback]') || e.target.closest('[data-ndone]')) {
      e.preventDefault();
      // 空白的新備忘錄不留下來
      var id = decodeURIComponent((location.hash.split('/')[3] || '')), n = find(id);
      if (n && n.mine && !n.text.trim()) { var st = state(); st.deleted[id] = 1; save(st); }
      S().goBack('#/notes');
      return;
    }
    if (e.target.closest('[data-ndelete]')) {
      var did = decodeURIComponent(location.hash.split('/')[3] || ''), st2 = state();
      st2.deleted[did] = 1; save(st2);
      S().goBack('#/notes');
      return;
    }
    if ((el = e.target.closest('[data-nunlock]'))) { askPasscode(el.dataset.nunlock); return; }
    if (e.target.closest('[data-nalert-close]')) { e.target.closest('.nt-alert-wrap').remove(); return; }
  });

  (window.SOSHO_APPS = window.SOSHO_APPS || {}).notes = route;
})();
