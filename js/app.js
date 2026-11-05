(function () {
  'use strict';

  var D = window.SITE_DATA;
  window.SITE_MEDIA = window.SITE_MEDIA || [];
  var $ = function (sel, el) { return (el || document).querySelector(sel); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // 文字換行 \n → <br>
  function multiline(s) { return esc(s).replace(/\n/g, '<br>'); }

  /* ---------------- 禁止縮放：兩指放大不會改變畫面大小（連點兩下靠 CSS 的 touch-action） ---------------- */
  document.addEventListener('dblclick', function (e) { e.preventDefault(); }, { passive: false });
  ['gesturestart', 'gesturechange'].forEach(function (t) {
    document.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false });
  });

  /* ---------------- 狀態列時間 ---------------- */
  function tick() {
    var d = new Date();
    $('#sb-time').textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  tick();
  setInterval(tick, 15000);

  /* ---------------- 列表排序：照字首順序（數字 → 英文 → 韓文／中文，不分大小寫） ---------------- */
  var collator = window.Intl && Intl.Collator ? new Intl.Collator(['en', 'ko', 'zh-Hant'], { sensitivity: 'base', numeric: true }) : null;
  function sortByName(list, key) {
    return list.slice().sort(function (a, b) {
      var x = String(key(a) || ''), y = String(key(b) || '');
      return collator ? collator.compare(x, y) : (x < y ? -1 : x > y ? 1 : 0);
    });
  }

  /* ---------------- 提示框 ---------------- */
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg || D.notUpdatedText;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1600);
  }

  /* ---------------- 上一頁（自己記錄瀏覽紀錄，避免「上一頁」繞回限時動態） ---------------- */
  var navStack = [];
  var replacing = false;
  function trackNav() {
    var h = location.hash;
    if (replacing) { navStack[navStack.length - 1] = h; replacing = false; return; }
    if (navStack.length > 1 && navStack[navStack.length - 2] === h) navStack.pop();   // 按了上一頁
    else if (navStack[navStack.length - 1] !== h) navStack.push(h);
  }
  // 取代目前這一頁（不會多一筆「上一頁」）
  function replaceHash(h) {
    if (location.hash === h) return;
    replacing = true;
    location.replace(h);
  }
  // 回上一頁；沒有上一頁就到 fallback
  function goBack(fallback) {
    if (navStack.length > 1) history.back();
    else replaceHash(fallback || '#/home');
  }
  function prevHash() { return navStack[navStack.length - 2]; }


  /* ---------------- 首頁 ---------------- */
  function renderHome() {
    var h = D.home;
    var home = $('#home');
    home.style.backgroundImage = 'url("' + h.wallpaper + '")';
    home.innerHTML =
      // 上方的行事曆小工具（中型）：日期跟著現實走，每天的行程寫在 data.js 的 home.calendar.events
      (h.calendar ? '<div class="cal-widget" id="cal-widget"></div>' : '') +
      // 行事曆下面的 App 圖示（有名稱，一排 4 個，上到下、左到右照 data.js 的 home.icons 排）
      ((h.icons || []).length ? '<div class="home-grid">' + h.icons.map(function (a) {
        return '<a class="app-icon" href="#/' + esc(a.id) + '" aria-label="' + esc(a.label) + '">' +
          '<img src="' + esc(a.icon) + '" alt=""><span>' + esc(a.label) + '</span></a>';
      }).join('') + '</div>' : '') +
      // 晚上才有「睡覺」：結束這一天
      (window.GAME ? '<button type="button" class="home-sleep" id="home-sleep" data-sleep>' + ICON_MOON + '<span>' + esc((D.game || {}).sleepLabel || '睡覺') + '</span></button>' : '');
    renderCalendar();
    paintSleep();
  }
  var ICON_MOON = '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="currentColor"/></svg>';
  function paintSleep() {
    var b = $('#home-sleep');
    if (b) b.hidden = !window.GAME || window.GAME.phase !== 'night' || window.GAME.ended === 'explore';   // 喚醒結局之後不能再睡覺換天
  }
  if (window.GAME) window.GAME.onChange(paintSleep);

  /* ---------------- 睡覺：確認 → 畫面變暗、顯示隔天日期 → 鎖定畫面 ---------------- */
  function askSleep() {
    var g = D.game || {}, w = document.createElement('div');
    w.className = 'ios-alert-wrap';
    w.innerHTML = '<div class="ios-alert"><b>' + esc(g.sleepTitle || '要睡覺了嗎？') + '</b>' +
      '<p>' + esc(g.sleepText || '今天就會結束，進入隔天早上。') + '</p>' +
      '<div class="ios-alert-btns"><button type="button" data-alert-no>' + esc(g.cancelLabel || '取消') + '</button>' +
      '<button type="button" data-alert-yes>' + esc(g.sleepLabel || '睡覺') + '</button></div></div>';
    $('#phone').appendChild(w);
    w.addEventListener('click', function (e) {
      if (e.target.closest('[data-alert-no]')) w.remove();
      else if (e.target.closest('[data-alert-yes]')) { w.remove(); sleep(); }
    });
  }
  // 睡覺：往後跳到下一個有事的日子（js/plan.js）
  function sleep() {
    if (window.PLAN) { window.PLAN.go(); return; }
    window.GAME.sleep(); renderLock();
  }
  $('#home').addEventListener('click', function (e) { if (e.target.closest('[data-sleep]')) askSleep(); });

  /* ---------------- 行事曆小工具 ----------------
   * 左邊：星期、今天幾號、今天的行程；右邊：這個月的月曆（星期一開頭，週末灰色，今天紅色圓圈）
   * events：{ title, color, date }；date 可寫 "10-1"（每年 10/1）、"2026-10-1"（那一天）、"15"（每個月 15 號）、
   *   "fri" 或 "星期五"（每個星期五），不寫 = 每天
   * 點月曆上的日期 → 左邊換成那天的星期、日期和行程；再點今天（或點左邊）回到今天
   * 日期是遊戲裡的日期（data.js 的 game.startDate 是第 1 天） */
  var calDay = '', calPick = null;   // calPick = 玩家點的那天（幾號），null = 今天
  var calShift = 0;                  // 往前／往後翻了幾個月（0 = 今天這個月；範圍：學年的 9 月～隔年 8 月）
  var WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  var MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  var WEEK_EN = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  function eventToday(ev, d) {
    var k = String(ev.date || '').trim().toLowerCase();
    if (!k) return true;
    if (/^[a-z]{3}/.test(k)) return WEEK_EN[d.getDay()] === k.slice(0, 3);
    if (/^(星期|週|周)/.test(k)) return '日一二三四五六天'.indexOf(k.slice(-1)) % 7 === d.getDay();
    var n = k.split(/\D+/).filter(Boolean).map(Number);
    if (n.length === 1) return n[0] === d.getDate();
    if (n.length === 3) return n[0] === d.getFullYear() && n[1] === d.getMonth() + 1 && n[2] === d.getDate();
    return n[0] === d.getMonth() + 1 && n[1] === d.getDate();
  }
  function renderCalendar() {
    var box = $('#cal-widget'), c = D.home.calendar;
    if (!box || !c) return;
    var g = gameDate();
    calDay = g.getFullYear() + '-' + g.getMonth() + '-' + g.getDate();
    // 翻到的月份（不能早於學年第一個月、不能晚於最後一個月）
    var first = window.GAME ? window.GAME.date(1) : g, last = window.GAME ? window.GAME.date(window.GAME.totalDays()) : g;
    var mi = function (dt) { return dt.getFullYear() * 12 + dt.getMonth(); };
    var vm = Math.max(mi(first), Math.min(mi(last), mi(g) + calShift));
    calShift = vm - mi(g);
    var y = Math.floor(vm / 12), m = vm % 12, same = calShift === 0;
    var today = same ? g.getDate() : -1;   // 只有翻到這個月才標出今天
    var pd = calPick ? new Date(y, m, calPick) : g, pick = calPick || (same ? today : 0);   // 左邊顯示的那天（沒點 = 今天）
    var wd = c.weekdays || WEEKDAYS, mn = c.months || MONTHS, heads = c.weekHeads || ['一', '二', '三', '四', '五', '六', '日'];
    var events = (c.events || []).filter(function (ev) { return eventToday(ev, pd) && (!ev.if || !window.GAME || window.GAME.check(ev.if)); });
    // 日程的特殊事件（data.js 的 schedule.special）：只顯示名稱，不說要選哪個活動
    function gameDayOf(date) { return window.GAME ? Math.round((date - window.GAME.date(1)) / 864e5) + 1 : 0; }
    // 節日、生日、送禮日、特殊事件、當天的安排（js/plan.js）
    function dayEvents(date) { return window.PLAN ? window.PLAN.eventsOn(gameDayOf(date)) : []; }
    function specials(date) { return dayEvents(date).filter(function (e) { return e.mark; }); }
    events = events.concat(dayEvents(pd));
    var lead = (new Date(y, m, 1).getDay() + 6) % 7;   // 這個月 1 號前面空幾格（星期一開頭）
    var days = new Date(y, m + 1, 0).getDate(), cells = [];
    for (var i = 0; i < lead; i++) cells.push('<i></i>');
    for (var n = 1; n <= days; n++) {
      var col = (lead + n - 1) % 7;
      cells.push('<i data-calday="' + n + '" class="' + (col >= 5 ? 'we' : '') + (n === today ? ' today' : '') + (n === pick && n !== today ? ' pick' : '') +
        (specials(new Date(y, m, n)).length ? ' has-ev' : '') + '">' + n + '</i>');
    }
    box.innerHTML =
      '<div class="cal-l" data-caltoday>' +
        '<b class="cal-red">' + esc(wd[pd.getDay()]) + (calPick && !same || (!calPick && !same) ? ' · ' + (pd.getMonth() + 1) + '月' : '') + '</b>' +
        '<div class="cal-big">' + pd.getDate() + '</div>' +
        events.map(function (ev) {
          return '<div class="cal-ev"><i style="background:' + esc(ev.color || '#b36ad9') + '"></i>' +
            '<span style="color:' + esc(ev.textColor || ev.color || '#7b3f9e') + '">' + esc(ev.title) + '</span></div>';
        }).join('') +
        (!events.length && c.noEvents ? '<div class="cal-none">' + esc(c.noEvents) + '</div>' : '') +
      '</div>' +
      '<div class="cal-r">' +
        '<div class="cal-mhead"><b class="cal-red">' + esc(mn[m]) + '</b>' +
          '<span class="cal-nav"><button type="button" data-calnav="-1"' + (vm <= mi(first) ? ' disabled' : '') + '>‹</button>' +
          '<button type="button" data-calnav="1"' + (vm >= mi(last) ? ' disabled' : '') + '>›</button></span></div>' +
        '<div class="cal-grid' + (cells.length > 35 ? ' six' : '') + '">' +
          heads.map(function (x, k) { return '<i class="cal-h' + (k >= 5 ? ' we' : '') + '">' + esc(x) + '</i>'; }).join('') +
          cells.join('') +
        '</div>' +
      '</div>';
  }
  // 遊戲裡的「今天」（js/game.js；沒有的話用現實日期）
  function gameDate() { return window.GAME ? window.GAME.date() : new Date(); }
  // 換到隔天（睡覺）→ 行事曆回到今天
  if (window.GAME) window.GAME.onChange(function () {
    var d = gameDate();
    if (d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate() !== calDay) { calPick = null; calShift = 0; renderCalendar(); }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#cal-widget')) return;
    var day = e.target.closest('[data-calday]');
    var nav = e.target.closest('[data-calnav]');
    if (nav) { calShift += +nav.dataset.calnav; calPick = null; renderCalendar(); return; }   // 翻月份
    if (day) { calPick = calShift === 0 && +day.dataset.calday === gameDate().getDate() ? null : +day.dataset.calday; renderCalendar(); }
    else if (e.target.closest('[data-caltoday]') && (calPick || calShift)) { calPick = null; calShift = 0; renderCalendar(); }   // 點左邊 = 回到今天
  });

  /* ---------------- 進度旗標 ---------------- */
  // 進度旗標（給電話來電、Kakao 即時訊息、自動回覆的 when / flag 用）
  // kakao_lock_seen = 看過 KakaoTalk 的密碼畫面；kakao_unlocked = 解開 KakaoTalk 密碼；
  // locked_帳號 = 看過那個帳號「此帳號不公開」的頁面；login_帳號 = 登入過某個 IG 帳號；
  // chat_好友id = 打開過某個 Kakao 聊天室；電話對話段落寫 flag: "名稱" → 走到那段就記錄
  var FLAG_KEY = 'riiiize-flags';
  var flags = {};
  try { flags = JSON.parse(localStorage.getItem(FLAG_KEY)) || {}; } catch (e) {}
  function setFlag(name) {
    if (!name || flags[name]) return;
    flags[name] = 1;
    try { localStorage.setItem(FLAG_KEY, JSON.stringify(flags)); } catch (e) {}
  }
  function hasFlag(name) { return !name || !!flags[name]; }

  /* ---------------- Instagram ---------------- */
  var ICON = {
    plus: '<svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>',
    chevron: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#3b6ef5"/><path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 4l-8 8 8 8" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M3 5h18M3 12h18M3 19h18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M9.5 8v8M14.5 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    play: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M10 8l6 4-6 4z" fill="currentColor"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><g fill="currentColor"><rect x="2" y="2" width="5.5" height="5.5" rx="1.3"/><rect x="9.25" y="2" width="5.5" height="5.5" rx="1.3"/><rect x="16.5" y="2" width="5.5" height="5.5" rx="1.3"/><rect x="2" y="9.25" width="5.5" height="5.5" rx="1.3"/><rect x="9.25" y="9.25" width="5.5" height="5.5" rx="1.3"/><rect x="16.5" y="9.25" width="5.5" height="5.5" rx="1.3"/><rect x="2" y="16.5" width="5.5" height="5.5" rx="1.3"/><rect x="9.25" y="16.5" width="5.5" height="5.5" rx="1.3"/><rect x="16.5" y="16.5" width="5.5" height="5.5" rx="1.3"/></g></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20.5s-8-4.9-8-11A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8 2.9c0 6.1-8 11-8 11z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/></svg>',
    comment: '<svg viewBox="0 0 24 24"><g transform="translate(12 12.6) scale(.8) translate(-12 -12)"><path d="M20.66 17A9.99 9.99 0 1 0 17.07 20.62L22 22z" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linejoin="round"/></g></svg>',
    bookmark: '<svg viewBox="0 0 24 24"><path d="M5.5 3h13v18L12 14.8 5.5 21z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/></svg>',
    saved: '<svg viewBox="0 0 24 24"><path d="M5.5 3h13v18L12 14.8 5.5 21z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/></svg>',
    archive: '<svg viewBox="0 0 24 24"><path d="M5.9 7.4A8.3 8.3 0 1 1 4.2 10.3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M2.9 7.1 7.6 4.4l.3 5.3z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/><path d="M12.6 8.2v4.6l-2.6 2.4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    starFill: '<svg viewBox="0 0 24 24"><path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor"/></svg>',
    star: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="m12 6.8 1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="currentColor"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    // 多張照片的貼文：白色實心圓角方塊＋右下的 L 形線
    multi: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="14.5" height="14.5" rx="3" fill="#fff"/><path d="M21 7.5v10.5a3 3 0 0 1-3 3H7.5" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/></svg>',
    soundOn: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
    soundOff: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    heartFill: '<svg viewBox="0 0 24 24"><path d="M12 20.5s-8-4.9-8-11A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8 2.9c0 6.1-8 11-8 11z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    bookmarkFill: '<svg viewBox="0 0 24 24"><path d="M5.5 3h13v18L12 14.8 5.5 21z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
  };

  // 簡介裡的 @帳號：bioLinks 有寫 → 開外部網址；遊戲裡有這個帳號 → 進它的頁面；其他 → 尚未更新
  function bioLine(s, g) {
    var links = (g && g.bioLinks) || {};
    return esc(s).replace(/(@[\w.]+)/g, function (m) {
      if (links[m]) return '<a class="ig-mention" href="' + esc(links[m]) + '" target="_blank" rel="noopener">' + m + '</a>';
      var acc = profileByName(m.slice(1));
      if (acc) return '<a class="ig-mention" href="' + (acc === currentAccount() ? '#/ig' : '#/ig/u/' + encodeURIComponent(acc.username)) + '">' + m + '</a>';
      return '<span class="ig-mention" data-na>' + m + '</span>';
    });
  }

  /* ---- 帳號：主帳號 + 用帳密登入的其他帳號（登入狀態存在瀏覽器裡） ---- */
  var ACC_KEY = 'riiiize-ig-accounts-v2';   // 換了預設帳號，用新的 key 讓舊的登入狀態重來
  var accState = { current: null, loggedIn: [] };
  try { accState = JSON.parse(localStorage.getItem(ACC_KEY)) || accState; } catch (e) {}
  function saveAcc() {
    try { localStorage.setItem(ACC_KEY, JSON.stringify(accState)); } catch (e) {}
  }
  function otherAccounts() { return D.instagram.otherAccounts || []; }
  function findAccount(username) {
    if (!username) return null;
    if (username === D.instagram.username) return D.instagram;
    return otherAccounts().filter(function (a) { return a.username === username; })[0] || null;
  }
  // 打開 IG 時已經登入的帳號（data.js 的 defaultAccount）
  function startAccount() { return findAccount(D.instagram.defaultAccount) || D.instagram; }
  // 目前帳號；data.js 改過帳號名稱導致找不到時，回到預設帳號
  function currentAccount() { return findAccount(accState.current) || startAccount(); }
  // 帳號清單：預設帳號 + 已登入過的帳號
  function listedAccounts() {
    var first = startAccount();
    return byUsername([first].concat(accState.loggedIn.map(findAccount).filter(function (a) {
      return a && a !== first;
    })));
  }
  // IG 的列表都照帳號 id 的字首排序
  function byUsername(list) { return sortByName(list, function (a) { return a.username; }); }
  // 可以用帳密登入的帳號：有寫 password、而且不是預設帳號
  function loginAccounts() {
    return [D.instagram].concat(otherAccounts()).filter(function (a) {
      return a.password != null && a !== startAccount();
    });
  }

  // 看過的限時動態、追蹤狀態（存在瀏覽器裡）
  var STORE_KEY = 'riiiize-ig-state';
  // likes / saves / reposts / commentLikes / storyLikes 的 key 都是「目前帳號|對象」，換帳號各自分開
  var store = { privacy: {}, archivedStories: {}, archived: {}, seen: {}, follows: {}, likes: {}, saves: {}, reposts: {}, comments: {}, commentLikes: {}, storyLikes: {}, profileEdits: {} };
  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (saved) Object.keys(store).forEach(function (k) { if (saved[k]) store[k] = saved[k]; });
  } catch (e) {}
  function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {}
  }
  // 追蹤是「目前登入的帳號」追蹤「對方」，換帳號登入就各自分開
  function followKey(g) { return currentAccount().username + '>' + g.username; }

  // 非公開帳號：沒追蹤就看不到內容（自己看自己不受影響）
  // 公開／不公開：設定 → 帳號隱私設定 改過的以玩家設定為準，沒改過就照 data.js 的 private
  function isPrivate(g) {
    var v = (store.privacy || {})[g.username];
    return v == null ? !!g.private : !!v;
  }
  function isLocked(g) {
    var me = currentAccount();
    return isPrivate(g) && g !== me && !isFollowing(me, g);
  }
  function isRequested(g) { return store.follows[followKey(g)] === 'req'; }

  // a 有沒有追蹤 b：玩家按過追蹤／取消就以那個為準，否則看 data.js 的 following 名單
  function isFollowing(a, b) {
    var k = a.username + '>' + b.username;
    if (k in store.follows) return store.follows[k] === 1 || store.follows[k] === true;   // 'req' = 已要求，還不算追蹤
    return (a.following || []).indexOf(b.username) >= 0;
  }
  function followingOf(g) {
    return allProfiles().filter(function (b) { return b !== g && isFollowing(g, b); });
  }
  function followersOf(g) {
    return allProfiles().filter(function (a) { return a !== g && isFollowing(a, g); });
  }
  // 有手動填數字就用手動的，沒有就自動計算
  function counts(g) {
    return {
      posts: g.postsCount != null ? g.postsCount : shownPosts(g).length,
      followers: g.followersCount != null ? g.followersCount : g.followersList ? g.followersList.length : followersOf(g).length,
      following: g.followingCount != null ? g.followingCount : g.followingList ? g.followingList.length : followingOf(g).length
    };
  }

  // 遊戲裡所有的 IG 帳號：主帳號 + 可登入帳號 + 只能點進去看的帳號
  function allProfiles() {
    return [D.instagram].concat(otherAccounts(), D.instagram.searchOnlyAccounts || []);
  }
  function profileByName(name) {
    return allProfiles().filter(function (a) { return a.username === name; })[0] || null;
  }
  // 摯友限時動態：只有自己或在 closeFriendsList 裡的帳號看得到
  function canSee(owner, item) {
    if (!item || !item.closeFriends) return true;
    var me = currentAccount();
    return me === owner || (owner.closeFriendsList || []).indexOf(me.username) >= 0;
  }
  // 玩家從「⋯」典藏的限時動態（用圖片路徑記錄）：從限時動態／精選拿掉，移到 設定 → 典藏
  function storyKey(g, it) { return g.username + '|' + (it.image || ''); }
  function storyArchived(g, it) { return !!store.archivedStories[storyKey(g, it)]; }
  function visibleStory(g) { return (g.story || []).filter(function (it) { return canSee(g, it) && !storyArchived(g, it); }); }
  function visibleHighlight(g, h) {
    var items = h.stories && h.stories.length ? h.stories : [{ image: h.image }];
    return items.filter(function (it) { return canSee(g, it) && !storyArchived(g, it); });
  }
  // 典藏頁的限時動態：發過的限時動態都會在這裡（有沒有放精選都算）＋ data.js 的 archive.stories，依日期排（舊的在前）
  // mine = 玩家從「⋯」典藏的（典藏頁的「⋯」可以放回個人檔案）
  function storyDate(it) {
    var m = /_(\d{8}|\d{6})(?:-(\d+))?(?:_\w+)?\.\w+$/.exec(it.image || '');
    if (m) return (m[1].length === 6 ? '20' + m[1] : m[1]) + '-' + ('0' + (m[2] || 1)).slice(-2);
    // 檔名沒有日期（例如影片）→ 看 time「2025年5月24日」／「5月24日」（沒寫年份 = 2026）
    var t = /(?:(\d{4})年)?(\d+)月(\d+)日/.exec(it.time || '');
    return t ? (t[1] || '2026') + ('0' + t[2]).slice(-2) + ('0' + t[3]).slice(-2) + '-01' : '';
  }
  function archivedStories(g) {
    var seen = {}, list = [];
    [].concat.apply(g.story || [], (g.highlights || []).map(function (h) { return h.stories || []; }))
      .concat((g.archive || {}).stories || [])
      .forEach(function (it) {
        var k = storyKey(g, it);
        if (!it.image || seen[k]) return;
        seen[k] = 1;
        list.push({ image: it.image, time: it.time, closeFriends: it.closeFriends, note: it.note, noteBy: it.noteBy, notes: it.notes, pos: it.pos, likedBy: it.likedBy, mine: storyArchived(g, it), n: list.length });
      });
    return list.sort(function (a, b) {
      var da = storyDate(a), db = storyDate(b);
      return da && db && da !== db ? (da < db ? -1 : 1) : a.n - b.n;
    });
  }

  // g = 要顯示的帳號；base = 這個帳號頁面的網址（自己 #/ig，別人 #/ig/u/帳號）
  function renderIG(g, base) {
    var L = D.instagram;          // 共用文字（按鈕、標籤）
    g = g || currentAccount();
    base = base || '#/ig';
    var visitor = base !== '#/ig';   // true = 從搜尋點進去看別人的頁面
    var locked = visitor && isLocked(g);
    if (locked) setFlag('locked_' + g.username);   // 看過這個帳號「此帳號不公開」的頁面（解鎖提示用）
    var vis = locked ? [] : visibleStory(g);   // 非公開又沒追蹤：看不到限時動態
    var showRing = vis.length > 0 || (g.hasStory && !g.story);
    var cf = vis.some(function (it) { return it.closeFriends; });
    if (locked) showRing = false;
    var ring = showRing ? ' has-story' + (cf ? ' cf' : '') + (store.seen[g.username] ? ' seen' : '') : '';
    var followed = visitor && isFollowing(currentAccount(), g);
    var c = counts(g);
    // 欄位被刪掉或註解掉時也不會整頁空白
    var bio = g.bio || [], posts = g.posts || [];
    // 精選裡的內容全部看不到（都是摯友限時、又不是摯友）就不顯示這個精選
    var highlights = (g.highlights || []).map(function (h, i) { return { h: h, i: i }; })
      .filter(function (x) { return visibleHighlight(g, x.h).length; });
    var na = ' data-na';   // 標記：點擊後跳出「尚未更新」

    $('#ig-scroll').innerHTML =
      (visitor
        ? '<div class="ig-top">' +
            '<a class="ig-ico" href="#/ig" data-back>' + ICON.back + '</a>' +
            '<span class="ig-user">' + esc(g.username) + '</span>' +
            '<span class="ig-top-r"></span>' +
          '</div>'
        : '<div class="ig-top">' +
            '<span></span>' +   // 沒有搜尋功能：只能從粉絲／追蹤中名單找到其他帳號
            '<button class="ig-user" data-sheet>' + esc(g.username) + ICON.chevron + '</button>' +
            '<span class="ig-top-r">' +
              '<a class="ig-ico" href="#/ig/settings">' + ICON.menu + '</a>' +
            '</span>' +
          '</div>') +

      '<div class="ig-profile">' +
        // 有限時動態 → 點頭像進入；沒有 → 尚未更新。看過的限時動態外框變淺灰色
        (vis.length
          ? '<a class="ig-avatar' + ring + '" href="' + base + '/story/me">'
          : '<button class="ig-avatar' + ring + '" type="button">') +
          '<img src="' + esc(g.avatar) + '" alt="">' +
        (vis.length ? '</a>' : '</button>') +
        '<div class="ig-right">' +
          '<div class="ig-name">' + esc(g.name || g.username) + '</div>' +
          '<div class="ig-stats">' +
            '<div><b>' + esc(c.posts) + '</b>' + esc(L.postsLabel) + '</div>' +
            (locked
              ? '<div><b>' + esc(c.followers) + '</b>' + esc(L.followersLabel) + '</div>' +
                '<div><b>' + esc(c.following) + '</b>' + esc(L.followingLabel) + '</div>'
              : '<a href="' + base + '/follows/followers"><b>' + esc(c.followers) + '</b>' + esc(L.followersLabel) + '</a>' +
                '<a href="' + base + '/follows/following"><b>' + esc(c.following) + '</b>' + esc(L.followingLabel) + '</a>') +
          '</div>' +
        '</div>' +
      '</div>' +

      (bio.length ? '<div class="ig-bio">' + bio.map(function (l) { return '<div>' + bioLine(l, g) + '</div>'; }).join('') + '</div>' : '') +

      (g.music && g.music.title ?
        '<button class="ig-music' + (music && music.src.indexOf(g.music.file) !== -1 && !music.paused ? ' playing' : '') + '"' + (g.music.file ? ' data-music="' + esc(g.music.file) + '"' : na) + '>' + ICON.play + ICON.pause +
          '<b>' + esc(g.music.title) + '</b><span> · ' + esc(g.music.artist) + '</span></button>' : '') +

      (visitor
        ? '<div class="ig-btns ig-btns-visit">' +
            (followed
              ? '<button class="ig-following" data-follow>' + esc(L.followingButtonLabel) + ICON.chevron + '</button>'
              : isRequested(g)
                ? '<button class="ig-following" data-follow>' + esc(T().requestedLabel) + '</button>'
                : '<button class="ig-follow" data-follow>' + esc(L.followLabel) + '</button>') +
          '</div>'
        : '<div class="ig-btns">' +
            '<a class="ig-btn-a" href="#/ig/edit">' + esc(L.editProfileLabel) + '</a>' +
            '<button data-share-profile>' + esc(L.shareProfileLabel) + '</button>' +
          '</div>') +

      (locked
        ? '<div class="ig-private">' +
            '<span class="ig-private-ico">' + ICON.lock + '</span>' +
            '<b>' + esc(T().privateTitle) + '</b>' +
            '<small>' + esc(T().privateDesc) + '</small>' +
          '</div>'
        : '') +

      (locked ? '' : (highlights.length ? '<div class="ig-hl">' + highlights.map(function (x) {
        var h = x.h, i = x.i;
        return '<a class="ig-hl-item" href="' + base + '/story/' + i + '"><span class="ig-hl-img"><img src="' + esc(h.image) + '" alt=""></span>' +
          '<span class="ig-hl-label">' + esc(h.label) + '</span></a>';
      }).join('') + '</div>' : '') +

      // 貼文／轉發／被標註 三個分頁，在同一頁切換
      '<div class="ig-tabs">' +
        '<button data-ptab="grid" class="active">' + ICON.grid + '</button>' +

      '</div>' +
      '<div data-pane="grid">' + gridHTML(shownPosts(g).map(function (i) { return { owner: g, idx: i }; }), '') + '</div>' +
      '<div data-pane="reposts" hidden>' + gridHTML(repostsOf(g), T().noReposts) + '</div>' +
      '<div data-pane="tagged" hidden>' + gridHTML(taggedOf(g), T().noTagged) + '</div>');

    if (visitor) { $('#ig-overlay').innerHTML = ''; return; }

    // 切換帳號清單（從下方滑出）
    $('#ig-overlay').innerHTML =
      '<div class="ig-sheet-wrap" id="ig-sheet">' +
        '<div class="ig-sheet-bg" data-close-sheet></div>' +
        '<div class="ig-sheet">' +
          '<div class="ig-sheet-handle" data-close-sheet></div>' +
          '<div class="ig-acc-list">' +
            listedAccounts().map(function (a) {
              return '<button class="ig-acc" data-switch="' + esc(a.username) + '">' +
                '<img src="' + esc(a.avatar) + '" alt="">' +
                '<span class="ig-acc-name">' + esc(a.username) + '</span>' +
                (a === g ? '<span class="ig-acc-check">' + ICON.check + '</span>' : '') +
              '</button>';
            }).join('') +
            '<a class="ig-acc" href="#/ig/login">' +
              '<span class="ig-acc-plus">' + ICON.plus + '</span>' +
              '<span class="ig-acc-name">' + esc(L.addAccountLabel) + '</span>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // 貼文可以只寫圖片路徑（字串），或寫成 { images: [...], caption, comments, tagged, ... }
  function postObj(p) {
    if (typeof p === 'string') return { images: [p], comments: [], tagged: [] };
    p = p || {};
    return {
      images: p.images && p.images.length ? p.images : [''],
      likes: p.likes, likedBy: p.likedBy, caption: p.caption, time: p.time,
      comments: p.comments || [], tagged: p.tagged || []
    };
  }

  // IG 互動用的固定文字（data.js 的 instagram.text，沒寫就用預設）
  var T_DEFAULT = {
    storyCommentsTitle: '為你推薦', storyCommentAuthor: '作者',
    commentsTitle: '留言', commentPlaceholder: '為 {user} 新增留言……', postButton: '發佈', reply: '回覆',
    noComments: '還沒有留言', justNow: '剛剛',
    linkCopied: '已複製連結',
    reposted: '已轉發到你的個人檔案', unreposted: '已取消轉發',
    savedTitle: '已儲存', noSaved: '還沒有儲存任何貼文', noReposts: '還沒有轉發任何貼文', noTagged: '還沒有被標註的相片',
    storyMessageSent: '訊息已傳送',
    editTitle: '編輯個人檔案', nameLabel: '名稱', bioLabel: '個人簡介', cancelLabel: '取消', doneLabel: '完成',
    closeFriendsTitle: '摯友', noCloseFriends: '還沒有摯友',
    privateTitle: '此帳號不公開', privateDesc: '追蹤這個帳號即可查看相片和影片。', requestedLabel: '已要求',
    soundOn: '開啟聲音', soundOff: '關閉聲音',
    privacyTitle: '帳號隱私設定', privacyLabel: '不公開帳號', privateOn: '不公開', privateOff: '公開',
    privacyNoteOn: '只有你核准的粉絲才能看到你的相片和影片。', privacyNoteOff: '所有人都能看到你的相片和影片。',
    archiveStory: '典藏', unarchiveStory: '在個人檔案顯示', archivedStoryToast: '已典藏限時動態',
    archivePost: '典藏', unarchivePost: '在個人檔案顯示', archivedToast: '已典藏貼文', unarchivedToast: '已在個人檔案顯示',
    archiveTitle: '典藏', archiveStories: '限時動態', archivePosts: '貼文', noArchive: '沒有典藏的內容'
  };
  function T() {
    var t = D.instagram.text || {}, out = {};
    Object.keys(T_DEFAULT).forEach(function (k) { out[k] = t[k] != null ? t[k] : T_DEFAULT[k]; });
    return out;
  }
  function fill(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : ''; });
  }

  function postKey(owner, idx) { return owner.username + '/' + idx; }
  // 玩家自己典藏的貼文（從個人頁拿掉、移到 設定 → 典藏）
  function isArchived(owner, idx) { return !!(store.archived || {})[postKey(owner, idx)]; }
  function shownPosts(g) {
    return (g.posts || []).map(function (_, i) { return i; }).filter(function (i) { return !isArchived(g, i); });
  }
  function actKey(k) { return currentAccount().username + '|' + k; }
  function postHref(owner, idx) {
    return owner === currentAccount() ? '#/ig/post/' + idx : '#/ig/u/' + encodeURIComponent(owner.username) + '/post/' + idx;
  }
  // k = "帳號/貼文編號" 或 "帳號/圖片檔名"（例如 "252525252_/2_post_20240822.jpg"）
  function refFromKey(k) {
    var cut = k.indexOf('/'), owner = profileByName(k.slice(0, cut)), rest = k.slice(cut + 1), idx = +rest;
    if (owner && !/^\d+$/.test(rest)) {
      idx = (owner.posts || []).map(function (p) { return postObj(p).images[0] || ''; })
        .findIndex(function (src) { return src.split('/').pop() === rest; });
    }
    return owner && idx >= 0 && (owner.posts || [])[idx] != null ? { owner: owner, idx: idx } : null;
  }
  // data.js 裡預先儲存的貼文（換成 "帳號/編號"）
  // 影片的封面圖（GitHub 自動產生的 xxx_poster.jpg；沒有就空白）
  function posterOf(src) {
    var p = String(src || '').replace(/\.\w+$/, '') + '_poster.jpg';
    return (window.SITE_MEDIA || []).indexOf(p) >= 0 ? p : '';
  }
  function presetSaved(acc) {
    return (acc.saved || []).map(refFromKey).filter(Boolean).map(function (r) { return postKey(r.owner, r.idx); });
  }
  // 這則貼文目前有沒有被儲存：玩家按過就照玩家的；沒按過就看 data.js 有沒有預先儲存
  function isSaved(key) {
    var k = actKey(key);
    if (k in store.saves) return !!store.saves[k];
    return presetSaved(currentAccount()).indexOf(key) >= 0;
  }
  function gridHTML(refs, emptyText) {
    if (!refs.length) return emptyText ? '<div class="ig-empty">' + esc(emptyText) + '</div>' : '';
    return '<div class="ig-grid">' + refs.map(function (r) {
      var po = postObj(r.owner.posts[r.idx]);
      return '<a href="' + postHref(r.owner, r.idx) + '"><img src="' + esc(po.images[0]) + '" alt="">' +
        (po.images.length > 1 ? '<span class="ig-multi">' + ICON.multi + '</span>' : '') + '</a>';
    }).join('') + '</div>';
  }
  // 轉發：data.js 的 reposts（"帳號/貼文編號"）＋玩家按的轉發（新的在前）
  function repostsOf(g) {
    var mine = Object.keys(store.reposts).filter(function (k) {
      return store.reposts[k] && k.indexOf(g.username + '|') === 0;
    }).sort(function (x, y) { return store.reposts[y] - store.reposts[x]; }).map(function (k) { return k.slice(g.username.length + 1); });
    var seen = {};
    return mine.concat(g.reposts || []).filter(function (k) { return !seen[k] && (seen[k] = 1); }).map(refFromKey).filter(Boolean);
  }
  // 被標註：任何帳號的貼文裡 tagged 有這個帳號
  function taggedOf(g) {
    var out = [];
    allProfiles().forEach(function (o) {
      (o.posts || []).forEach(function (p, i) {
        if (postObj(p).tagged.indexOf(g.username) >= 0) out.push({ owner: o, idx: i });
      });
    });
    return out;
  }
  // 已儲存：玩家按的收藏（新的在前）＋ data.js 的 saved
  function savedOf() {
    var acc = currentAccount(), me = acc.username + '|', seen = {};
    var mine = Object.keys(store.saves).filter(function (k) { return store.saves[k] && k.indexOf(me) === 0; })
      .sort(function (x, y) { return store.saves[y] - store.saves[x]; })
      .map(function (k) { return k.slice(me.length); });
    var preset = presetSaved(acc).filter(function (k) { return !((me + k) in store.saves); });
    return mine.concat(preset).filter(function (k) { return !seen[k] && (seen[k] = 1); })
      .map(refFromKey).filter(Boolean);
  }

  function backBtn(href) {
    return '<a class="ig-round-back" href="' + (href || '#/ig') + '" data-back>' + ICON.back + '</a>';
  }
  // 返回上一頁（從轉發、已儲存點進貼文時回到原本的地方）
  function historyBackBtn(fallback) {
    return '<a class="ig-round-back" href="' + fallback + '" data-back>' + ICON.back + '</a>';
  }

  // 設定和動態（右上角三條線）；「已儲存」會進入已儲存的貼文
  function renderIGSettings() {
    var st = D.instagram.settings || { sections: [] };
    $('#ig-overlay').innerHTML = '';
    $('#ig-scroll').innerHTML =
      '<div class="ig-pagehead">' + backBtn() + '<div class="ig-pagehead-t"><b>' + esc(st.title) + '</b></div></div>' +
      st.sections.map(function (sec) {
        return '<section class="ig-set-sec">' +
          '<div class="ig-set-title">' + esc(sec.title) + '</div>' +
          (sec.items || []).map(function (it) {
            var inner =
              '<span class="ig-set-ico">' + (ICON[it.icon] || '') + '</span>' +
              '<span class="ig-set-label">' + esc(it.label) + '</span>' +
              (it.icon === 'star'
                ? '<span class="ig-set-val">' + (currentAccount().closeFriendsList || []).length + '</span>'
                : it.icon === 'lock'
                ? '<span class="ig-set-val">' + esc(isPrivate(currentAccount()) ? T().privateOn : T().privateOff) + '</span>'
                : it.value != null ? '<span class="ig-set-val">' + esc(it.value) + '</span>' : '') +
              '<span class="ig-set-arrow">' + ICON.right + '</span>';
            var links = { saved: '#/ig/saved', archive: '#/ig/archive', star: '#/ig/closefriends', lock: '#/ig/privacy' };
            return links[it.icon]
              ? '<a class="ig-set-row" href="' + links[it.icon] + '">' + inner + '</a>'
              : '<button class="ig-set-row" data-na>' + inner + '</button>';
          }).join('') +
        '</section>';
      }).join('');
  }

  // 設定 → 帳號隱私設定：不公開帳號開關
  function renderIGPrivacy() {
    var t = T(), me = currentAccount(), on = isPrivate(me);
    $('#ig-overlay').innerHTML = '';
    $('#ig-scroll').innerHTML =
      '<div class="ig-pagehead">' + backBtn('#/ig/settings') + '<div class="ig-pagehead-t"><b>' + esc(t.privacyTitle) + '</b></div></div>' +
      '<button class="ig-privacy-card" type="button" data-privacy>' +
        '<span>' + esc(t.privacyLabel) + '</span>' +
        '<span class="ig-switch' + (on ? ' on' : '') + '"><i></i></span>' +
      '</button>' +
      '<p class="ig-privacy-note">' + esc(on ? t.privacyNoteOn : t.privacyNoteOff) + '</p>';
  }

  // 典藏：限時動態（過期）／貼文（下架）兩個分頁
  var archiveTab = 'stories';
  function renderIGArchive() {
    var t = T(), me = currentAccount(), ar = me.archive || {}, st = archivedStories(me);
    // 玩家典藏的貼文排前面，再來是 data.js 寫好的典藏貼文
    var ps = (me.posts || []).map(function (p, i) { return { p: p, href: '#/ig/post/' + i, i: i }; })
      .filter(function (x) { return isArchived(me, x.i); })
      .concat((ar.posts || []).map(function (p, i) { return { p: p, href: '#/ig/archive/post/' + i }; }));
    var body = archiveTab === 'stories'
      ? (st.length ? '<div class="ig-grid ig-arch-grid">' + st.map(function (it, i) {
          var isVideo = /\.(mp4|mov|webm)$/i.test(it.image || '');
          return '<a href="#/ig/story/archive-' + i + '">' +
            (isVideo ? '<video src="' + esc(it.image) + '" poster="' + esc(posterOf(it.image)) + '" muted playsinline preload="metadata"></video>' : '<img src="' + esc(it.image) + '" alt="">') +
            (it.time ? '<span class="ig-arch-date">' + esc(it.time) + '</span>' : '') + '</a>';
        }).join('') + '</div>' : '<div class="ig-empty">' + esc(t.noArchive) + '</div>')
      : (ps.length ? '<div class="ig-grid">' + ps.map(function (x) {
          var po = postObj(x.p);
          return '<a href="' + x.href + '"><img src="' + esc(po.images[0]) + '" alt="">' +
            (po.images.length > 1 ? '<span class="ig-multi">' + ICON.multi + '</span>' : '') + '</a>';
        }).join('') + '</div>' : '<div class="ig-empty">' + esc(t.noArchive) + '</div>');
    $('#ig-overlay').innerHTML = '';
    $('#ig-scroll').innerHTML =
      '<div class="ig-pagehead">' + backBtn('#/ig/settings') + '<div class="ig-pagehead-t"><b>' + esc(t.archiveTitle) + '</b></div></div>' +
      '<div class="ig-ftabs">' +
        '<a href="#/ig/archive" data-atab="stories"' + (archiveTab === 'stories' ? ' class="on"' : '') + '>' + esc(t.archiveStories) + '</a>' +
        '<a href="#/ig/archive" data-atab="posts"' + (archiveTab === 'posts' ? ' class="on"' : '') + '>' + esc(t.archivePosts) + '</a>' +
      '</div>' + body;
  }

  // 摯友名單（設定 → 摯友）
  function renderIGCloseFriends() {
    var t = T(), me = currentAccount();
    var list = byUsername((me.closeFriendsList || []).map(function (u) {
      var f = fillerInfo(u) || {};
      return profileByName(u) || { username: u, name: f.name || '', avatar: f.avatar || DEFAULT_AVATAR, filler: true };
    }));
    $('#ig-overlay').innerHTML = '';
    $('#ig-scroll').innerHTML =
      '<div class="ig-pagehead">' + backBtn('#/ig/settings') + '<div class="ig-pagehead-t"><b>' + esc(t.closeFriendsTitle) + '</b></div></div>' +
      (list.length ? list.map(function (a) {
        return personRow(a, '<span class="ig-cf-star">' + ICON.starFill + '</span>');
      }).join('') : '<div class="ig-empty">' + esc(t.noCloseFriends) + '</div>');
  }

  // 名單裡的一列：真的帳號可以點進去；路人（filler）點不進去
  var DEFAULT_AVATAR = 'images/default_avatar.png';
  // 路人的資料：從所有帳號的粉絲／追蹤名單裡找同一個 username 的 { name, avatar }
  function fillerInfo(username) {
    var hit = null;
    allProfiles().forEach(function (a) {
      (a.followersList || []).concat(a.followingList || []).forEach(function (x) {
        if (!hit && x && typeof x === 'object' && x.username === username) hit = x;
      });
    });
    return hit;
  }
  function personRow(a, right) {
    var me = currentAccount();
    var inner = '<img src="' + esc(a.avatar || DEFAULT_AVATAR) + '" alt="">' +
      '<span><b>' + esc(a.username) + '</b>' + (a.name ? '<small>' + esc(a.name) + '</small>' : '') + '</span>';
    var main = a.filler
      ? '<div class="ig-frow-main">' + inner + '</div>'
      : '<a class="ig-frow-main" href="' + (a === me ? '#/ig' : '#/ig/u/' + encodeURIComponent(a.username)) + '">' + inner + '</a>';
    return '<div class="ig-frow">' + main + right + '</div>';
  }

  function renderIGSaved() {
    $('#ig-overlay').innerHTML = '';
    $('#ig-scroll').innerHTML =
      '<div class="ig-pagehead">' + backBtn('#/ig/settings') + '<div class="ig-pagehead-t"><b>' + esc(T().savedTitle) + '</b></div></div>' +
      gridHTML(savedOf(), T().noSaved);
  }

  /* ---- 貼文頁 ---- */
  var curPost = null;   // { owner, idx, p, key }

  function allComments(cp) {
    var added = store.comments[cp.key] || [];
    return cp.p.comments.concat(added.map(function (c) { return { user: c.user, text: c.text, time: T().justNow, mine: true }; }));
  }
  function avatarOf(user, fallback) {
    var a = profileByName(user);
    return a ? a.avatar : (fallback || '');
  }

  // 這則貼文目前帳號有沒有按讚：玩家按過就照玩家的；沒按過就看 likedBy 是不是目前帳號
  function postLiked(cp) {
    var k = actKey(cp.key);
    if (k in store.likes) return !!store.likes[k];
    return !cp.archived && !!(cp.p.likedBy && cp.p.likedBy.name === currentAccount().username);
  }
  function postActionsHTML() {
    var cp = curPost, L = D.instagram, t = T();
    var liked = postLiked(cp), saved = isSaved(cp.key), reposted = !!store.reposts[actKey(cp.key)];
    return '<div class="ig-actions">' +
        '<button data-act="like" class="' + (liked ? 'on-like' : '') + '">' + (liked ? ICON.heartFill : ICON.heart) + '</button>' +
        '<button data-act="comments">' + ICON.comment + '</button>' +


        '<button data-act="save" class="ig-act-save">' + (saved ? ICON.bookmarkFill : ICON.bookmark) + '</button>' +
      '</div>' +
      (!cp.archived && cp.p.likedBy && cp.p.likedBy.name && (cp.p.likedBy.name !== currentAccount().username || liked) ?
        '<div class="ig-likedby"><img src="' + esc(cp.p.likedBy.avatar || avatarOf(cp.p.likedBy.name)) + '" alt=""><b>' + esc(cp.p.likedBy.name) + '</b>' + esc(L.likedBySuffix) + '</div>' : '') +
      (cp.p.caption ? '<div class="ig-caption"><b>' + esc(cp.owner.username) + '</b> ' + multiline(cp.p.caption) + '</div>' : '') +

      (cp.p.time ? '<div class="ig-time">' + esc(cp.p.time) + '</div>' : '');
  }
  function refreshPostActions() {
    var box = $('#ig-post-actions');
    if (box && curPost) box.innerHTML = postActionsHTML();
  }

  // src = 'archive' 時顯示典藏裡的貼文
  function renderIGPost(idx, g, base, src) {
    var L = D.instagram;
    g = g || currentAccount(); base = base || '#/ig';
    var raw = src === 'archive' ? ((g.archive || {}).posts || [])[idx] : (g.posts || [])[idx];
    if (raw == null) { replaceHash(base); return; }
    var p = postObj(raw), n = p.images.length;
    curPost = { owner: g, idx: idx, p: p, key: src === 'archive' ? g.username + '/archive' + idx : postKey(g, idx),
      archived: src === 'archive' || isArchived(g, idx) };   // 典藏的貼文不顯示「xxx 說讚」
    $('#ig-overlay').innerHTML = '';
    $('#ig-scroll').innerHTML =
      '<div class="ig-pagehead">' + historyBackBtn(base) +
        '<div class="ig-pagehead-t"><b>' + esc(L.postTitle) + '</b><small>' + esc(g.username) + '</small></div></div>' +
      '<div class="ig-post-user">' +
        '<a class="ig-post-user-link" href="' + (g === currentAccount() ? '#/ig' : '#/ig/u/' + encodeURIComponent(g.username)) + '">' +
          '<img src="' + esc(g.avatar) + '" alt=""><b>' + esc(g.username) + '</b></a>' +
        (g === currentAccount() && src !== 'archive' ? '<button class="ig-ico" data-post-menu>' + ICON.more + '</button>' : '') +
      '</div>' +
      '<div class="ig-car-wrap">' +
        '<div class="ig-car" id="ig-car">' + p.images.map(function (src) {
          return '<img src="' + esc(src) + '" alt="">';
        }).join('') + '</div>' +
        (n > 1 ? '<span class="ig-car-count" id="ig-car-count">1/' + n + '</span>' : '') +
        '<span class="ig-bigheart" id="ig-bigheart">' + ICON.heartFill + '</span>' +
      '</div>' +
      (n > 1 ? '<div class="ig-dots" id="ig-dots">' + p.images.map(function (_, i) {
        return '<i' + (i ? '' : ' class="on"') + '></i>';
      }).join('') + '</div>' : '<div class="ig-dots"></div>') +
      '<div id="ig-post-actions">' + postActionsHTML() + '</div>';

    var car = $('#ig-car');
    // 和 IG 一樣：整篇貼文的框照第一張照片的比例（最高 3:4、最寬 1.91:1），其他張填滿同一個框
    var firstImg = car.querySelector('img');
    function fitRatio() {
      if (!firstImg.naturalWidth) return;
      var r = Math.min(1.91, Math.max(0.75, firstImg.naturalWidth / firstImg.naturalHeight));
      car.style.setProperty('--ar', r);
    }
    if (firstImg.complete) fitRatio(); else firstImg.addEventListener('load', fitRatio);
    if (n > 1) car.addEventListener('scroll', function () {
      var i = Math.round(car.scrollLeft / car.clientWidth);
      $('#ig-car-count').textContent = (i + 1) + '/' + n;
      document.querySelectorAll('#ig-dots i').forEach(function (d, k) { d.classList.toggle('on', k === i); });
    });
    // 圖片點兩下 → 按讚（只會按讚，不會取消）
    var lastTap = 0;
    car.addEventListener('click', function () {
      var now = Date.now();
      if (now - lastTap < 320) {
        store.likes[actKey(curPost.key)] = 1; saveStore(); refreshPostActions();
        var h = $('#ig-bigheart'); h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop');
        lastTap = 0;
      } else lastTap = now;
    });
  }

  function slideUp() {
    var el = $('#ig-sheet');
    void el.offsetWidth;
    el.classList.add('show');
  }

  /* ---- 留言 ---- */
  function commentsListHTML() {
    var list = allComments(curPost), t = T();
    if (!list.length) return '<div class="ig-empty">' + esc(t.noComments) + '</div>';
    return list.map(function (c, i) {
      var ck = actKey(curPost.key + '#' + i), liked = !!store.commentLikes[ck];
      var href = profileByName(c.user) ? (profileByName(c.user) === currentAccount() ? '#/ig' : '#/ig/u/' + encodeURIComponent(c.user)) : null;
      var av = '<img src="' + esc(avatarOf(c.user, c.avatar)) + '" alt="">';
      return '<div class="ig-cmt">' +
        (href ? '<a href="' + href + '">' + av + '</a>' : av) +
        '<div class="ig-cmt-body">' +
          '<div class="ig-cmt-head"><b>' + esc(c.user) + '</b><span>' + esc(c.time || '') + '</span></div>' +
          '<div class="ig-cmt-text">' + multiline(c.text) + '</div>' +
          '<button class="ig-cmt-reply" data-reply="' + esc(c.user) + '">' + esc(t.reply) + '</button>' +
        '</div>' +
        '<button class="ig-cmt-like' + (liked ? ' on-like' : '') + '" data-clike="' + i + '">' + (liked ? ICON.heartFill : ICON.heart) + '</button>' +
      '</div>';
    }).join('');
  }
  function openComments() {
    var t = T(), me = currentAccount();
    $('#ig-overlay').innerHTML =
      '<div class="ig-sheet-wrap" id="ig-sheet">' +
        '<div class="ig-sheet-bg" data-close-sheet></div>' +
        '<div class="ig-sheet ig-sheet-tall">' +
          '<div class="ig-sheet-handle" data-close-sheet></div>' +
          '<div class="ig-sheet-title">' + esc(t.commentsTitle) + '</div>' +
          '<div class="ig-cmt-list" id="ig-cmt-list">' + commentsListHTML() + '</div>' +
          '<form class="ig-cmt-form" id="ig-cmt-form" autocomplete="off">' +
            '<img src="' + esc(me.avatar) + '" alt="">' +
            '<input name="c" placeholder="' + esc(fill(t.commentPlaceholder, { user: curPost.owner.username })) + '" autocomplete="off">' +
            '<button type="submit" disabled>' + esc(t.postButton) + '</button>' +
          '</form>' +
        '</div>' +
      '</div>';
    slideUp();
    var f = $('#ig-cmt-form');
    f.c.addEventListener('input', function () { f.querySelector('button').disabled = !f.c.value.trim(); });
  }

  // 限時動態 / 精選動態（which = "me" 或精選的編號）
  var storyTimer = null;
  var storyMuted = true;   // 限時動態影片預設靜音（和 IG 一樣），按聲音鍵開啟
  function stopStory() {
    clearTimeout(storyTimer);
    $('#phone').classList.remove('dark-status');
  }
  function renderIGStory(which, g, base) {
    var L = D.instagram, items;
    g = g || currentAccount(); base = base || '#/ig';
    var startAt = 0, fromArchive = /^archive-/.test(String(which));
    if (which === 'me') items = visibleStory(g);
    else if (fromArchive) {
      // 典藏的限時動態：從點的那一則開始播
      items = archivedStories(g);
      startAt = Math.min(items.length - 1, +String(which).slice(8) || 0);
      base = '#/ig/archive';
    } else {
      var h = (g.highlights || [])[which];
      items = h ? visibleHighlight(g, h) : [];
    }
    // 精選動態上方顯示精選的封面和名稱；限時動態／典藏顯示帳號
    var headImg = h ? h.image : g.avatar, headName = h ? h.label : g.username;
    if (!items.length) { replaceHash(base); return; }
    if (which === 'me') { store.seen[g.username] = 1; saveStore(); }
    if (fromArchive) renderIGArchive(); else renderIG(g, base);   // 背後保留原本的頁面，關掉時直接回到這裡
    $('#phone').classList.add('dark-status');
    var i = 0;
    $('#ig-overlay').innerHTML =
      '<div class="ig-story">' +
        '<div class="ig-story-bars">' + items.map(function () { return '<i><b></b></i>'; }).join('') + '</div>' +
        '<div class="ig-story-head">' +
          '<img src="' + esc(headImg) + '" alt="">' +
          '<b>' + esc(headName) + '</b>' +
          '<span class="ig-story-time"></span>' +
          // 摯友標籤：綠色膠囊＋白色星星＋小箭頭（只是標示，不能點）
          '<span class="ig-story-cf" id="ig-story-cf">' + ICON.starFill + ICON.chevron + '</span>' +
          '<button class="ig-ico ig-story-sound" id="ig-story-sound" type="button" aria-label="sound"></button>' +
          (g === currentAccount() ? '<button class="ig-ico" type="button" data-story-menu>' + ICON.more + '</button>' : '') +
          '<button class="ig-ico" type="button" data-story-close>' + ICON.close + '</button>' +
        '</div>' +
        '<div class="ig-story-img" id="ig-story-media"></div>' +
        '<div class="ig-story-tap"><span data-prev></span><span data-next></span></div>' +
        // 帳號主人自己在限動下方的留言（data.js 限動加 note: "文字"）
        '<div class="ig-story-note" id="ig-story-note"><img src="' + esc(g.avatar) + '" alt=""><span></span></div>' +
        '<form class="ig-story-foot" id="ig-story-form" autocomplete="off">' +
          '<input class="ig-story-msg" name="m" placeholder="' + esc(L.storyMessagePlaceholder) + '" autocomplete="off">' +
          '<button type="button" class="ig-ico" id="ig-story-like">' + ICON.heart + '</button>' +
        '</form>' +
      '</div>';

    // 關閉：如果是從原本那頁點進來的，就回上一頁（不會留下一筆「上一頁 = 限時動態」）
    function closeStory() {
      clearTimeout(storyTimer);
      if (prevHash() === base) history.back(); else replaceHash(base);
    }
    $('[data-story-close]').onclick = closeStory;
    var bars = document.querySelectorAll('.ig-story-bars i');
    var startedAt = 0, remaining = 5000;
    function likeKey() { return actKey(g.username + '/story/' + which + '/' + i); }
    // data.js 限動的 likedBy: ["帳號"] = 預設已按讚的人（玩家按過就照玩家的）
    function likedNow() {
      var k = likeKey();
      return k in store.storyLikes ? !!store.storyLikes[k] : (items[i].likedBy || []).indexOf(currentAccount().username) >= 0;
    }
    function paintLike() {
      var on = likedNow(), btn = $('#ig-story-like');
      btn.innerHTML = on ? ICON.heartFill : ICON.heart;
      btn.classList.toggle('on-like', on);
    }
    function video() { return document.querySelector('#ig-story-media video'); }
    // 限動左下角的留言：note / noteBy（一則），或 notes: [{ text, by }]（好幾則：泡泡輪流顯示，點開看全部）
    // by = 留言的人（不寫就是帳號主人自己）
    var noteTimer = null;
    function notesOf(it) {
      return it.notes || (it.note ? [{ text: it.note, by: it.noteBy }] : []);
    }
    function noteAvatar(by) {
      return by ? avatarOf(by, (fillerInfo(by) || {}).avatar || DEFAULT_AVATAR) : g.avatar;
    }
    function paintNotes() {
      clearInterval(noteTimer);
      var list = notesOf(items[i]), note = $('#ig-story-note'), k = 0;
      note.style.display = list.length ? '' : 'none';
      note.classList.toggle('multi', list.length > 1);
      function put() {
        var n = list[k], span = note.querySelector('span');
        note.querySelector('img').src = noteAvatar(n.by);
        span.textContent = n.text;
        span.classList.remove('in'); void span.offsetWidth; span.classList.add('in');
      }
      if (!list.length) return;
      put();
      if (list.length > 1) noteTimer = setInterval(function () {
        if (!document.body.contains(note)) { clearInterval(noteTimer); return; }
        k = (k + 1) % list.length; put();
      }, 1600);   // 幾毫秒換下一則留言
    }
    function openNotes() {
      var list = notesOf(items[i]);
      pause();
      var wrap = document.createElement('div');
      wrap.className = 'ig-sheet-wrap ig-cmt-wrap';
      wrap.innerHTML = '<div class="ig-sheet-bg" data-story-sheet-close></div>' +
        '<div class="ig-sheet ig-cmt-sheet"><div class="ig-sheet-handle" data-story-sheet-close></div>' +
        '<div class="ig-cmt-head">' + esc(T().storyCommentsTitle) + ICON.chevron + '</div>' +
        list.map(function (n) {
          var who = n.by || g.username;
          return '<div class="ig-cmt-row"><img src="' + esc(noteAvatar(n.by)) + '" alt="">' +
            '<div><b>' + esc(who) + '</b>' + (who === g.username ? '<em> · ' + esc(T().storyCommentAuthor) + '</em>' : '') +
            '<p>' + esc(n.text) + '</p><small>' + esc(T().reply) + '</small></div></div>';
        }).join('') + '</div>';
      storyEl.appendChild(wrap); void wrap.offsetWidth; wrap.classList.add('show');
    }
    // 聲音按鈕：只有影片時出現；按一下開／關聲音（整段限時動態期間都記得）
    function paintSound(show) {
      var b = $('#ig-story-sound');
      b.style.display = show ? '' : 'none';
      b.innerHTML = storyMuted ? ICON.soundOff : ICON.soundOn;
    }
    $('#ig-story-sound').onclick = function () {
      storyMuted = !storyMuted;
      var v = video();
      if (v) { v.muted = storyMuted; v.play().catch(function () {}); }
      paintSound(!!v);
    };
    function pause() {
      clearTimeout(storyTimer);
      remaining = Math.max(300, remaining - (Date.now() - startedAt));
      bars[i].firstChild.style.animationPlayState = 'paused';
      if (video()) video().pause();
    }
    function resume() {
      if (!document.body.contains(form)) return;   // 已經離開限時動態
      startedAt = Date.now();
      bars[i].firstChild.style.animationPlayState = 'running';
      if (video()) video().play().catch(function () {});
      clearTimeout(storyTimer);
      storyTimer = setTimeout(function () { show(i + 1); }, remaining);
    }
    function show(k) {
      if (k < 0) k = 0;
      if (k >= items.length) { closeStory(); return; }
      i = k;
      // 影片（.mp4 / .mov / .webm）播完才換下一則；圖片 5 秒
      var src = items[i].image || '', isVideo = /\.(mp4|mov|webm)$/i.test(src);
      $('#ig-story-media').innerHTML = isVideo
        ? '<video src="' + esc(src) + '" poster="' + esc(posterOf(src)) + '"' + (storyMuted ? ' muted' : '') + ' playsinline autoplay preload="auto"></video>'
        : '<img src="' + esc(src) + '" alt=""' + (items[i].pos ? ' style="object-position:' + esc(items[i].pos) + '"' : '') + '>';
      paintSound(isVideo);
      $('.ig-story-time').textContent = items[i].time || '';
      $('#ig-story-cf').style.display = items[i].closeFriends ? '' : 'none';
      paintNotes();
      // 典藏頁：只有玩家自己典藏的才有「⋯」（可以放回個人檔案）
      var menu = document.querySelector('[data-story-menu]');
      if (menu && fromArchive) menu.style.visibility = items[i].mine ? '' : 'hidden';
      bars.forEach(function (b, j) {
        b.className = j < i ? 'done' : '';
        b.firstChild.style.animation = 'none';
      });
      void bars[i].offsetWidth;                 // 重新開始進度條動畫
      bars[i].firstChild.style.animation = '';
      bars[i].className = 'run';
      var dur = 5000;
      remaining = dur; startedAt = Date.now();
      bars[i].firstChild.style.animationDuration = '';
      clearTimeout(storyTimer);
      storyTimer = setTimeout(function () { show(i + 1); }, dur);
      if (isVideo) {
        var v = video(), shown = i;
        clearTimeout(storyTimer);                // 等影片長度出來再計時
        bars[i].firstChild.style.animationPlayState = 'paused';
        v.addEventListener('loadedmetadata', function () {
          if (shown !== i) return;
          dur = (isFinite(v.duration) && v.duration > 0 ? v.duration : 15) * 1000;
          remaining = dur; startedAt = Date.now();
          bars[i].firstChild.style.animationDuration = dur + 'ms';
          bars[i].firstChild.style.animationPlayState = 'running';
          storyTimer = setTimeout(function () { show(i + 1); }, dur);
        });
        // 播不出來（格式不支援）就當作圖片，5 秒後換下一則
        v.addEventListener('error', function () {
          if (shown !== i) return;
          remaining = 5000; startedAt = Date.now();
          bars[i].firstChild.style.animationPlayState = 'running';
          storyTimer = setTimeout(function () { show(i + 1); }, 5000);
        });
        v.play().catch(function () {
          // 瀏覽器不允許有聲自動播放時，改成靜音播放
          if (!v.muted) { v.muted = true; storyMuted = true; paintSound(true); v.play().catch(function () {}); }
        });
      }
      paintLike();
    }
    // 輸入訊息時暫停；送出後顯示「訊息已傳送」
    var form = $('#ig-story-form');
    form.m.addEventListener('focus', pause);
    form.m.addEventListener('blur', resume);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.m.value.trim()) return;
      form.m.value = '';
      form.m.blur();
      toast(T().storyMessageSent);
    });
    $('#ig-story-like').onclick = function () {
      var k = likeKey();
      store.storyLikes[k] = likedNow() ? 0 : 1;
      saveStore(); paintLike();
    };
    // 往下滑關閉；只是點一下才換上一則／下一則
    var storyEl = $('.ig-story'), dragY = null, dragDy = 0, dragged = false;
    storyEl.addEventListener('pointerdown', function (e) {
      if (e.target.closest('form, .ig-story-head, .ig-sheet-wrap, .ig-story-note.multi')) return;
      dragY = e.clientY; dragDy = 0; dragged = false;
    });
    storyEl.addEventListener('pointermove', function (e) {
      if (dragY === null) return;
      dragDy = Math.max(0, e.clientY - dragY);
      if (dragDy > 8 && !dragged) { dragged = true; pause(); storyEl.style.transition = 'none'; }
      if (dragged) {
        storyEl.style.transform = 'translateY(' + dragDy + 'px) scale(' + Math.max(.85, 1 - dragDy / 2000) + ')';
        storyEl.style.borderRadius = Math.min(24, dragDy / 4) + 'px';
      }
    });
    function dragEnd() {
      if (dragY === null) return;
      dragY = null;
      if (!dragged) return;
      storyEl.style.transition = '';
      if (dragDy > 110) {
        storyEl.style.transform = 'translateY(100%)';
        setTimeout(closeStory, 180);
      } else {
        storyEl.style.transform = ''; storyEl.style.borderRadius = '';
        resume();
      }
    }
    storyEl.addEventListener('pointerup', dragEnd);
    storyEl.addEventListener('pointercancel', dragEnd);
    // 自己的限時動態右上角「⋯」→ 典藏／在個人檔案顯示（data.js 寫好的典藏沒有這個選項）
    storyEl.addEventListener('click', function (e) {
      if (e.target.closest('.ig-story-note.multi')) { openNotes(); return; }
      if (e.target.closest('[data-story-menu]')) {
        var it = items[i], canToggle = !fromArchive || it.mine;
        if (!canToggle) return;
        pause();
        var wrap = document.createElement('div');
        wrap.className = 'ig-sheet-wrap';
        wrap.innerHTML = '<div class="ig-sheet-bg" data-story-sheet-close></div>' +
          '<div class="ig-sheet"><div class="ig-sheet-handle" data-story-sheet-close></div>' +
          '<button class="ig-sheet-act" type="button" data-story-archive>' + ICON.archive +
            '<span>' + esc(fromArchive ? T().unarchiveStory : T().archiveStory) + '</span></button></div>';
        storyEl.appendChild(wrap); void wrap.offsetWidth; wrap.classList.add('show');
      } else if (e.target.closest('[data-story-sheet-close]')) {
        e.target.closest('.ig-sheet-wrap').remove(); resume();
      } else if (e.target.closest('[data-story-archive]')) {
        var k = storyKey(g, items[i]);
        if (fromArchive) { delete store.archivedStories[k]; toast(T().unarchivedToast); }
        else { store.archivedStories[k] = 1; toast(T().archivedStoryToast); }
        saveStore(); closeStory();
      }
    });
    $('.ig-story-tap').onclick = function (e) {
      if (dragged) return;
      if (e.target.hasAttribute('data-prev')) show(i - 1); else show(i + 1);
    };
    show(startAt);
  }

  // 粉絲／追蹤中名單（tab = "followers" 或 "following"）
  function renderIGFollows(tab, g, base) {
    var L = D.instagram;
    g = g || currentAccount(); base = base || '#/ig';
    var c = counts(g);
    // data.js 有 followersList / followingList 就照它顯示（帳號 id → 真的帳號；{ username, name } → 路人）
    var manual = tab === 'followers' ? g.followersList : g.followingList;
    var list = byUsername(manual
      ? manual.map(function (x) {
          if (typeof x === 'string') {
            var f = fillerInfo(x) || {};
            return profileByName(x) || { username: x, name: f.name, avatar: f.avatar, filler: true };
          }
          return { username: x.username, name: x.name, avatar: x.avatar, filler: true };
        })
      : (tab === 'followers' ? followersOf(g) : followingOf(g)));
    $('#ig-overlay').innerHTML = '';
    $('#ig-scroll').innerHTML =
      '<div class="ig-pagehead">' + backBtn(base) +
        '<div class="ig-pagehead-t"><b>' + esc(g.username) + '</b></div>' +

      '</div>' +
      '<div class="ig-ftabs">' +
        '<a data-tab href="' + base + '/follows/followers"' + (tab === 'followers' ? ' class="on"' : '') + '>' + esc(c.followers) + ' ' + esc(L.followersLabel) + '</a>' +
        '<a data-tab href="' + base + '/follows/following"' + (tab === 'following' ? ' class="on"' : '') + '>' + esc(c.following) + ' ' + esc(L.followingLabel) + '</a>' +
      '</div>' +
      list.map(function (a) {
        return personRow(a, '');
      }).join('');
  }

  // 編輯個人檔案：改名字和簡介（存在瀏覽器裡，重新開始會清掉）
  function applyEdits() {
    Object.keys(store.profileEdits || {}).forEach(function (u) {
      var a = profileByName(u), ed = store.profileEdits[u];
      if (!a) return;
      if (!a._orig) a._orig = { name: a.name, bio: a.bio };
      if (ed.name != null) a.name = ed.name;
      if (ed.bio) a.bio = ed.bio;
    });
  }
  function renderIGEdit() {
    var g = currentAccount(), t = T();
    $('#ig-overlay').innerHTML = '';
    $('#ig-scroll').innerHTML =
      '<form class="ig-edit" id="ig-edit" autocomplete="off">' +
        '<div class="ig-edit-head">' +
          '<a href="#/ig">' + esc(t.cancelLabel) + '</a>' +
          '<b>' + esc(t.editTitle) + '</b>' +
          '<button type="submit">' + esc(t.doneLabel) + '</button>' +
        '</div>' +
        '<div class="ig-edit-av"><img src="' + esc(g.avatar) + '" alt=""></div>' +
        '<label class="ig-edit-row"><span>' + esc(t.nameLabel) + '</span><input name="nm" value="' + esc(g.name || '') + '" placeholder="' + esc(g.username) + '"></label>' +
        '<label class="ig-edit-row"><span>' + esc(t.bioLabel) + '</span><textarea name="bio" rows="4">' + esc((g.bio || []).join('\n')) + '</textarea></label>' +
      '</form>';
    $('#ig-edit').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      store.profileEdits = store.profileEdits || {};
      store.profileEdits[g.username] = {
        name: f.nm.value.trim(),
        bio: f.bio.value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean)
      };
      saveStore(); applyEdits();
      goBack('#/ig');
    });
  }

  // 分享個人檔案：複製目前網頁的連結
  function copyLink() {
    var url = location.href;
    function done() { toast(T().linkCopied); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, fallback);
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      ta.remove(); done();
    }
  }

  // 登入畫面：只在網頁內比對 data.js 裡的帳密，不會把輸入送到任何地方
  function renderIGLogin() {
    var l = D.instagram.login;
    $('#ig-overlay').innerHTML = '';
    $('#ig-scroll').innerHTML =
      '<div class="ig-login">' +
        '<div class="ig-login-top">' +
          '<a class="ig-login-back" href="#/ig">' + ICON.back + '</a>' +
          (l.logo ? '<img class="ig-login-logo" src="' + esc(l.logo) + '" alt="">' : '') +
        '</div>' +
        '<form class="ig-login-form" autocomplete="off">' +
          '<input type="text" name="u" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="' + esc(l.usernamePlaceholder) + '" autocomplete="off">' +
          '<input type="password" name="p" placeholder="' + esc(l.passwordPlaceholder) + '" autocomplete="off">' +
          '<button type="submit" class="ig-login-btn">' + esc(l.loginLabel) + '</button>' +
        '</form>' +
      '</div>';
  }

  $('#app-ig').addEventListener('click', function (e) {
    var el;
    if (e.target.closest('[data-share-profile]')) { copyLink(); return; }
    if ((el = e.target.closest('[data-back]'))) {
      e.preventDefault();
      goBack(el.getAttribute('href'));
      return;
    }
    if ((el = e.target.closest('[data-atab]'))) {
      e.preventDefault();
      archiveTab = el.dataset.atab; renderIGArchive();
      return;
    }
    if ((el = e.target.closest('[data-ptab]'))) {
      var tab = el.dataset.ptab;
      document.querySelectorAll('.ig-tabs [data-ptab]').forEach(function (b) { b.classList.toggle('active', b === el); });
      document.querySelectorAll('#ig-scroll [data-pane]').forEach(function (p) { p.hidden = p.dataset.pane !== tab; });
      return;
    }
    if ((el = e.target.closest('[data-act]')) && curPost) {
      var act = el.dataset.act, k = actKey(curPost.key);
      if (act === 'like') { store.likes[k] = postLiked(curPost) ? 0 : 1; }
      else if (act === 'save') { store.saves[k] = isSaved(curPost.key) ? 0 : Date.now(); }   // 0 = 取消儲存（連預先儲存的也能取消）
      else if (act === 'repost') {
        if (store.reposts[k]) { delete store.reposts[k]; toast(T().unreposted); }
        else { store.reposts[k] = Date.now(); toast(T().reposted); }
      }
      else if (act === 'comments') { openComments(); return; }
      saveStore(); refreshPostActions();
      return;
    }
    if ((el = e.target.closest('[data-clike]'))) {
      var ck = actKey(curPost.key + '#' + el.dataset.clike);
      if (store.commentLikes[ck]) delete store.commentLikes[ck]; else store.commentLikes[ck] = 1;
      saveStore(); $('#ig-cmt-list').innerHTML = commentsListHTML();
      return;
    }
    if ((el = e.target.closest('[data-reply]'))) {
      var inp = $('#ig-cmt-form').c;
      inp.value = '@' + el.dataset.reply + ' '; inp.focus();
      inp.dispatchEvent(new Event('input'));
      return;
    }
    if (e.target.closest('[data-follow]')) {
      var who = profileByName(decodeURIComponent(location.hash.split('/')[3] || ''));
      if (who) {
        var fk = followKey(who);
        // 追蹤中／已要求 → 再按一次就退追／取消要求；沒追蹤 → 追蹤（非公開帳號只會變「已要求」）
        if (isFollowing(currentAccount(), who) || store.follows[fk] === 'req') store.follows[fk] = 0;
        else store.follows[fk] = isPrivate(who) ? 'req' : 1;
        saveStore();
        var top = $('#ig-scroll').scrollTop;
        renderIG(who, '#/ig/u/' + encodeURIComponent(who.username));
        $('#ig-scroll').scrollTop = top;
      }
      return;
    }
    // 粉絲／追蹤中切換分頁：取代目前這頁，返回鍵直接回個人頁
    var tb = e.target.closest('[data-tab]');
    if (tb) { e.preventDefault(); replaceHash(tb.getAttribute('href')); return; }
    // 自己的貼文右上角「⋯」→ 典藏／在個人檔案顯示
    if (e.target.closest('[data-post-menu]') && curPost) {
      var arch = isArchived(curPost.owner, curPost.idx);
      $('#ig-overlay').innerHTML =
        '<div class="ig-sheet-wrap" id="ig-sheet">' +
          '<div class="ig-sheet-bg" data-close-sheet></div>' +
          '<div class="ig-sheet">' +
            '<div class="ig-sheet-handle" data-close-sheet></div>' +
            '<button class="ig-sheet-act" data-archive-post>' + ICON.archive +
              '<span>' + esc(arch ? T().unarchivePost : T().archivePost) + '</span></button>' +
          '</div>' +
        '</div>';
      var sh = $('#ig-sheet'); void sh.offsetWidth; sh.classList.add('show');
      return;
    }
    if (e.target.closest('[data-archive-post]') && curPost) {
      var k = postKey(curPost.owner, curPost.idx), was = !!store.archived[k];
      if (was) delete store.archived[k]; else store.archived[k] = 1;
      saveStore();
      toast(was ? T().unarchivedToast : T().archivedToast);
      goBack(was ? '#/ig/archive' : '#/ig');
      return;
    }
    if (e.target.closest('[data-privacy]')) {
      var me = currentAccount();
      store.privacy[me.username] = !isPrivate(me); saveStore(); renderIGPrivacy();
      if (!isPrivate(me)) setFlag('public_' + me.username);   // 設成公開過（可用來觸發 Kakao 即時訊息）
      return;
    }
    var mu = e.target.closest('[data-music]');
    if (mu) { toggleMusic(mu); return; }
    var sw = e.target.closest('[data-switch]');
    if (sw) {
      accState.current = sw.dataset.switch;
      saveAcc();
      renderIG();
      $('#ig-scroll').scrollTop = 0;
    }
    else if (e.target.closest('[data-sheet]')) $('#ig-sheet').classList.add('show');
    else if (e.target.closest('[data-close-sheet]')) $('#ig-sheet').classList.remove('show');
    else if (e.target.closest('[data-na]')) toast();
  });
  $('#ig-overlay').addEventListener('submit', function (e) {
    if (e.target.id !== 'ig-cmt-form') return;
    e.preventDefault();
    var text = e.target.c.value.trim();
    if (!text || !curPost) return;
    (store.comments[curPost.key] = store.comments[curPost.key] || []).push({ user: currentAccount().username, text: text });
    saveStore();
    e.target.c.value = '';
    e.target.querySelector('button').disabled = true;
    var list = $('#ig-cmt-list');
    list.innerHTML = commentsListHTML();
    list.scrollTop = list.scrollHeight;
    refreshPostActions();
  });
  $('#ig-scroll').addEventListener('submit', function (e) {
    if (!e.target.classList.contains('ig-login-form')) return;   // 只處理登入表單
    e.preventDefault();
    var form = e.target;
    var u = form.u.value.trim(), pw = form.p.value;
    var acc = loginAccounts().filter(function (a) {
      return a.username === u && String(a.password) === pw;
    })[0];
    if (!acc) {
      form.p.value = '';
      toast(D.instagram.login.errorText || '帳號或密碼錯誤');
      return;
    }
    if (accState.loggedIn.indexOf(acc.username) < 0) accState.loggedIn.push(acc.username);
    setFlag('login_' + acc.username);
    accState.current = acc.username;
    saveAcc();
    form.reset();
    $('#toast').classList.remove('show');
    replaceHash('#/ig');
  });

  /* ---------------- 路由（網址 #/home、#/ig、#/kakao、#/photos、#/x、#/notes） ---------------- */
  var currentApp = null;

  function openApp(name) {
    var el = $('#app-' + name);
    if (currentApp === name) return el;
    document.querySelectorAll('.app.open').forEach(function (a) { a.classList.remove('open'); });
    el.style.transform = '';
    el.classList.add('open');
    currentApp = name;
    $('#phone').classList.remove('on-home');
    $('#phone').setAttribute('data-open', name);   // 狀態列漸層用 App 的底色
    return el;
  }

  function showHome() {
    document.querySelectorAll('.app.open').forEach(function (a) {
      a.classList.remove('open');
      a.style.transform = '';
    });
    currentApp = null;
    $('#phone').classList.add('on-home');
    $('#phone').removeAttribute('data-open');
  }

  /* ---------------- IG 個人頁音樂（audio/ 資料夾） ---------------- */
  var music = null;
  function toggleMusic(btn) {
    var src = btn.getAttribute('data-music');
    if (!music) { music = new Audio(); music.loop = true; }
    if (music.src.indexOf(src) === -1) music.src = src;
    if (music.paused) {
      music.play().then(function () { btn.classList.add('playing'); }, function () { toast(); });
    } else { music.pause(); btn.classList.remove('playing'); }
  }
  function stopMusic() { if (music && !music.paused) music.pause(); }

  function route() {
    stopMusic();
    try { doRoute(); } catch (err) {
      console.error(err);
      toast('data.js 有欄位填錯：' + err.message);
    }
  }
  // 其他 App（js/apps/*.js）用 window.SOSHO_APPS 註冊：網址 #/名稱/... → 呼叫它的函式
  var APPS = window.SOSHO_APPS || {};

  function doRoute() {
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    stopStory();
    if (APPS[parts[0]]) {
      openApp(parts[0]);
      APPS[parts[0]](parts.slice(1).map(decodeURIComponent));
    } else if (parts[0] === 'ig') {
      openApp('ig');
      stopStory();
      if (parts[1] === 'u') {
        // 別人的頁面：#/ig/u/帳號[/post/編號 | /story/編號]
        var who = profileByName(decodeURIComponent(parts[2] || ''));
        if (!who) { replaceHash('#/ig'); return; }
        if (who === currentAccount()) { replaceHash('#/ig' + (parts[3] ? '/' + parts.slice(3).join('/') : '')); return; }
        var base = '#/ig/u/' + encodeURIComponent(who.username);
        if (parts[3] && isLocked(who)) { replaceHash(base); return; }   // 非公開又沒追蹤：不能看貼文、限時、名單
        if (parts[3] === 'post') renderIGPost(+parts[4], who, base);
        else if (parts[3] === 'follows') renderIGFollows(parts[4], who, base);
        else if (parts[3] === 'story') renderIGStory(parts[4] === 'me' ? 'me' : +parts[4], who, base);
        else renderIG(who, base);
      }
      else if (parts[1] === 'login') renderIGLogin();
      else if (parts[1] === 'edit') renderIGEdit();
      else if (parts[1] === 'settings') renderIGSettings();
      else if (parts[1] === 'saved') renderIGSaved();
      else if (parts[1] === 'archive' && parts[2] === 'post') renderIGPost(+parts[3], null, '#/ig/archive', 'archive');
      else if (parts[1] === 'archive') renderIGArchive();
      else if (parts[1] === 'closefriends') renderIGCloseFriends();
      else if (parts[1] === 'privacy') renderIGPrivacy();
      else if (parts[1] === 'post') renderIGPost(+parts[2]);
      else if (parts[1] === 'follows') renderIGFollows(parts[2]);
      else if (parts[1] === 'story') renderIGStory(parts[2] === 'me' || /^archive-/.test(parts[2]) ? parts[2] : +parts[2]);
      else renderIG();
      // 粉絲／追蹤中名單只顯示一頁，不能滑動
      $('#app-ig').classList.remove('ig-noscroll');
      $('#ig-scroll').scrollTop = 0;
    } else {
      showHome();
    }
  }

  /* ---------------- 上滑回首頁 ---------------- */
  (function swipeHome() {
    var zone = $('#home-gesture');
    var startY = null, dy = 0, appEl = null;
    // 加到主畫面時（全螢幕 App）
    if (window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches)) {
      document.documentElement.classList.add('standalone');
    }

    function drag(y) {
      dy = Math.min(0, y - startY);
      var s = Math.max(0.6, 1 + dy / 900);
      appEl.style.transform = 'translateY(' + dy * 0.6 + 'px) scale(' + s + ')';
      appEl.style.borderRadius = Math.min(40, -dy / 3) + 'px';
    }
    // 手指：從畫面最下面 80px 內往上滑就算（比橫條本身寬鬆），滑超過 45px 放開就回首頁
    var EDGE = 80, touchId = null;
    document.addEventListener('touchstart', function (e) {
      if (!currentApp || e.touches.length !== 1) return;
      var t = e.touches[0], r = $('#phone').getBoundingClientRect();
      if (t.clientY < r.bottom - EDGE) return;
      touchId = t.identifier; startY = t.clientY; dy = 0;
      appEl = $('#app-' + currentApp);
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (touchId === null) return;
      var t = [].filter.call(e.changedTouches, function (x) { return x.identifier === touchId; })[0];
      if (!t) return;
      if (t.clientY - startY < -10) { appEl.classList.add('dragging'); drag(t.clientY); }
    }, { passive: true });
    function touchEnd() {
      if (touchId === null) return;
      touchId = null;
      if (dy < -45) { appEl.style.transform = ''; appEl.style.borderRadius = ''; appEl.classList.remove('dragging'); startY = null; appEl = null; location.hash = '#/home'; return; }
      end();
    }
    document.addEventListener('touchend', touchEnd);
    document.addEventListener('touchcancel', touchEnd);

    // 滑鼠（電腦）：拖橫條
    zone.addEventListener('pointerdown', function (e) {
      if (!currentApp || e.pointerType === 'touch') return;
      startY = e.clientY; dy = 0;
      appEl = $('#app-' + currentApp);
      appEl.classList.add('dragging');
      zone.setPointerCapture(e.pointerId);
    });
    zone.addEventListener('pointermove', function (e) {
      if (startY === null || touchId !== null) return;
      drag(e.clientY);
    });
    function end() {
      if (startY === null) return;
      appEl.classList.remove('dragging');
      appEl.style.borderRadius = '';
      if (dy < -45) {
        location.hash = '#/home';
      } else {
        appEl.style.transform = '';
      }
      startY = null; appEl = null;
    }
    zone.addEventListener('pointerup', function () { if (touchId === null) end(); });
    zone.addEventListener('pointercancel', function () { if (touchId === null) end(); });
  })();

  /* ---------------- 啟動 ---------------- */
  // 給 js/apps/*.js 用的共用工具
  window.SOSHO = {
    data: D, $: $, esc: esc, multiline: multiline, toast: toast, sortByName: sortByName, setFlag: setFlag, hasFlag: hasFlag, goBack: goBack, replaceHash: replaceHash,
    setDarkStatus: function (on) { $('#phone').classList.toggle('dark-status', !!on); },
    lock: function () { renderLock(); },
    load: function (key, def) {
      try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? def : v; } catch (e) { return def; }
    },
    save: function (key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
    }
  };

  /* ---------------- 手機密碼鎖 ---------------- */
  function renderLock() {
    var L = D.lock || {}, code = String(L.passcode || ''), typed = '';
    if (!code) { if (window.GAME) window.GAME.start(); return; }   // 沒設密碼就不鎖，直接開始這一天
    var keys = [['1', ''], ['2', 'A B C'], ['3', 'D E F'], ['4', 'G H I'], ['5', 'J K L'], ['6', 'M N O'],
                ['7', 'P Q R S'], ['8', 'T U V'], ['9', 'W X Y Z'], ['', ''], ['0', ''], ['del', '']];
    var lock = $('#lock');
    if (!lock) {   // 睡覺後再鎖一次：重新放一個鎖定畫面
      lock = document.createElement('div');
      lock.className = 'lock'; lock.id = 'lock';
      $('#phone').insertBefore(lock, $('#toast'));
    }
    lock.style.backgroundImage = 'url("' + (D.home && D.home.wallpaper) + '")';
    // 先是鎖定畫面（滑動以解鎖、時間、未讀訊息通知），往上滑才出現輸入密碼
    lock.innerHTML =
      '<div class="lock-shade"></div>' +
      '<div class="lock-cover" id="lock-cover">' +
        '<div class="lc-hint"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2.5" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2" fill="none"/></svg>' + esc(L.swipeText || '滑動以解鎖') + '</div>' +
        '<div class="lc-date" id="lc-date"></div>' +
        '<div class="lc-time" id="lc-time"></div>' +
        '<div class="lc-notes" id="lc-notes"></div>' +
      '</div>' +
      '<div class="lock-inner">' +
        '<svg class="lock-ico" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2.5" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2" fill="none"/></svg>' +
        '<div class="lock-title">' + esc(L.title) + '</div>' +
        '<div class="lock-dots" id="lock-dots">' + code.split('').map(function () { return '<i></i>'; }).join('') + '</div>' +
        '<div class="lock-keys">' + keys.map(function (k) {
          if (k[0] === '') return '<span></span>';
          if (k[0] === 'del') return '<button class="lock-del" data-lock-del>' + esc(L.deleteLabel) + '</button>';
          return '<button class="lock-key" data-lock="' + k[0] + '"><b>' + k[0] + '</b>' + (k[1] ? '<small>' + k[1] + '</small>' : '') + '</button>';
        }).join('') + '</div>' +
      '</div>';
    var target = null;   // 點了哪則通知：解鎖後直接打開那個聊天室
    var cover = $('#lock-cover');

    // 日期、時間（跟著現實走）：「11月2日 星期一」
    function paintTime() {
      var el = $('#lc-time'), de = $('#lc-date'), d = new Date(), gd = gameDate();
      if (el) el.textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
      if (de) de.textContent = (gd.getMonth() + 1) + '月' + gd.getDate() + '日 ' + WEEKDAYS[gd.getDay()];   // 日期 = 遊戲裡的今天
    }
    // 通知：KakaoTalk 的每一則未讀訊息各一張，分開排（新的在上面）
    function kakaoIcon() {
      var hit = (D.home.icons || []).concat(D.home.apps || []).filter(function (a) { return a.id === 'kakao'; })[0];
      return hit ? hit.icon : 'images/icon_kakao.png';
    }
    function paintNotes() {
      var box = $('#lc-notes');
      if (!box || !window.SOSHO_KAKAO) return;
      var list = window.SOSHO_KAKAO.unreadList(), html = list.map(function (n) {
        return '<button type="button" class="lc-note" data-lock-open="#/kakao/chat/' + encodeURIComponent(n.id) + '">' +
          '<img src="' + esc(kakaoIcon()) + '" alt="">' +
          '<span class="lc-note-t"><b>' + esc(n.title) + '</b><span>' + esc(n.text) + '</span></span>' +
          '<small>' + esc(n.time) + '</small>' +
        '</button>';
      }).join('');
      if (box.innerHTML !== html) box.innerHTML = html;
    }
    paintTime(); paintNotes(); paint();
    var lockTimer = setInterval(function () {
      if (!document.body.contains(lock)) { clearInterval(lockTimer); return; }
      paintTime(); paintNotes();
    }, 2000);

    // 往上滑 → 出現輸入密碼；「取消」回到鎖定畫面
    function showPin() { lock.classList.add('pin'); cover.style.transform = ''; }
    function hidePin() { lock.classList.remove('pin'); typed = ''; paint(); target = null; }
    var y0 = null, dy = 0, moved = false;
    cover.addEventListener('pointerdown', function (e) { y0 = e.clientY; dy = 0; moved = false; cover.style.transition = 'none'; });
    cover.addEventListener('pointermove', function (e) {
      if (y0 === null) return;
      dy = Math.min(0, e.clientY - y0);
      if (dy < -6) moved = true;
      if (moved) cover.style.transform = 'translateY(' + dy + 'px)';
    });
    function endDrag(e) {
      if (y0 === null) return;
      y0 = null; cover.style.transition = '';
      if (dy < -60) {
        showPin();
      } else {
        cover.style.transform = '';
        // 點一下通知（沒有滑動）→ 記住要打開的聊天室，再出現輸入密碼（和 iPhone 一樣要先解鎖）
        var note = !moved && e && e.target && e.target.closest && e.target.closest('[data-lock-open]');
        if (note) { target = note.dataset.lockOpen; showPin(); return; }
        // 在空白處點兩下 → 也會出現輸入密碼
        if (!moved && e) {
          var now = Date.now();
          if (now - lastTap < 350) { lastTap = 0; showPin(); } else lastTap = now;
        }
      }
    }
    var lastTap = 0;
    cover.addEventListener('pointerup', endDrag);
    cover.addEventListener('pointercancel', function () { endDrag(null); });
    $('#phone').classList.add('locked');
    function paint() {
      lock.querySelectorAll('.lock-dots i').forEach(function (d, i) { d.classList.toggle('on', i < typed.length); });
      var del = lock.querySelector('[data-lock-del]');
      if (del) del.textContent = typed ? L.deleteLabel || '刪除' : L.cancelLabel || '取消';
    }
    lock.addEventListener('click', function (e) {
      var k = e.target.closest('[data-lock]');
      if (k && typed.length < code.length) {
        typed += k.dataset.lock; paint();
        if (typed.length === code.length) {
          if (typed === code) {
            // 解鎖：往上滑走
            setTimeout(function () {
              lock.classList.add('unlocked');
              setFlag('phone_unlocked');   // 解鎖手機（即時訊息從這裡開始算時間）
              $('#phone').classList.remove('locked');
              if (target) location.hash = target;   // 點通知解鎖 → 打開那個聊天室
              setTimeout(function () { lock.remove(); }, 450);
              if (window.GAME) window.GAME.start();   // 開始這一天（早上、放學的劇情之後會接在這裡）
            }, 120);
          } else {
            var dots = $('#lock-dots');
            dots.classList.remove('shake'); void dots.offsetWidth; dots.classList.add('shake');
            setTimeout(function () { typed = ''; paint(); }, 450);
          }
        }
      } else if (e.target.closest('[data-lock-del]')) {
        // 還沒輸入 → 「取消」回到鎖定畫面；有輸入 → 「刪除」一個數字
        if (!typed) hidePin(); else { typed = typed.slice(0, -1); paint(); }
      }
    });
  }

  applyEdits();
  // 能用手機的日子（星期日等）先出現鎖定畫面；其他日子直接開始那天的劇情（js/plan.js）
  if (window.PLAN && window.GAME) window.PLAN.boot(); else renderLock();
  renderHome();
  if (!location.hash) history.replaceState(null, '', '#/home');  // 一進網頁先到桌面
  navStack.push(location.hash);
  window.addEventListener('hashchange', function () { trackNav(); route(); });
  route();
})();
