/* =========================================================
 * 遊戲時間與存檔
 *   - 一學年：data.js 的 game.startDate（預設 2025-09-01）是第 1 天，到 game.endDate（預設 2026-08-31）
 *   - 有事的日子（js/plan.js 決定）：早上 → 放學 → 晚上；晚上在主畫面按「睡覺」，
 *     沒事的日子自動跳過（照月曆安排加好感），停在下一個有事的日子
 *     （早上、放學之後放主線劇情和日程；那個時段沒有內容就自動跳過）
 *   - 存檔：手動存檔好幾格＋每天早上自動存檔一格；存在 riiiizeSaves（「重新開始」不會清掉）
 *   - 進度本身存在 riiiize-game；所有 riiiize- 開頭的資料都算這次遊玩的進度
 * ========================================================= */
(function () {
  'use strict';

  var D = window.SITE_DATA || {}, G = D.game || {};

  /* ---- KakaoTalk 好友、IG 帳號、X 帳號寫 cast: "m1" = 這個帳號是那位成員：
   *      大頭照一律用 cast 的 avatar；名字沒寫的話用 cast 的 name ---- */
  (function linkCast() {
    var map = {};
    (D.cast || []).forEach(function (c) { map[c.id] = c; });
    function fill(o) {
      var c = o && map[o.cast];
      if (!c) return;
      if (c.avatar) o.avatar = c.avatar;
      if (!o.name) o.name = c.name;
    }
    if (D.kakao) (D.kakao.friends || []).forEach(fill);
    if (D.instagram) [D.instagram].concat(D.instagram.otherAccounts || [], D.instagram.searchOnlyAccounts || []).forEach(fill);
    if (D.x) (D.x.accounts || []).forEach(fill);
  })();
  var KEY = 'riiiize-game', SAVES = 'riiiizeSaves', PREFIX = 'riiiize-';
  var PHASES = ['morning', 'afterschool', 'night'];
  var WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  function load(k, def) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var st = load(KEY, null) || { day: 1, phase: 'morning' };
  function persist() { store(KEY, st); }

  // 第 1 天的日期（"2025-09-01"）
  function parseDate(s) { var m = /(\d{4})\D+(\d+)\D+(\d+)/.exec(s); return new Date(+m[1], m[2] - 1, +m[3]); }
  function startDate() { return parseDate(G.startDate || '2025-09-01'); }
  // 總天數（到 endDate 為止，含當天）
  function totalDays() { return Math.round((parseDate(G.endDate || '2026-08-31') - startDate()) / 864e5) + 1; }
  // "12-24" → 學年裡的第幾天（9～12 月是第一年，1～8 月是隔年）
  function dayOfMD(md) {
    var m = /(\d+)\D+(\d+)/.exec(String(md)); if (!m) return 0;
    var s = startDate(), y = s.getFullYear() + (+m[1] < s.getMonth() + 1 ? 1 : 0);
    return Math.round((new Date(y, m[1] - 1, +m[2]) - s) / 864e5) + 1;
  }
  function mdOf(day) { var d = dateOf(day); return ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dateOf(day) { var d = startDate(); d.setDate(d.getDate() + (day || st.day) - 1); return d; }
  function fmt(d, withWeek) {
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日' + (withWeek ? ' ' + WEEK[d.getDay()] : '');
  }

  /* ---- 時段：之後的劇情、日程用 GAME.onPhase('morning', fn) 掛上來；fn(done) 做完呼叫 done() ---- */
  var handlers = { morning: [], afterschool: [], night: [] }, listeners = [], nightFns = [];
  function emit() { listeners.forEach(function (fn) { try { fn(st); } catch (e) { console.error(e); } }); }
  function runPhase() {
    if (st.ended === 'explore') { emit(); return; }   // 喚醒結局之後：只能探索 App，不再換天
    var list = handlers[st.phase] || [], i = 0;
    (function next() {
      if (st.phase === 'night') {   // 晚上：星期日自由使用手機；其他日子由 js/plan.js 直接往後跳
        emit();
        nightFns.forEach(function (fn) { try { fn(st); } catch (e) { console.error(e); } });
        return;
      }
      if (i >= list.length) { advance(); return; }
      var fn = list[i++];
      var called = false;
      fn(function done() { if (!called) { called = true; next(); } }, st);
    })();
  }
  function advance() {
    var k = PHASES.indexOf(st.phase);
    st.phase = PHASES[Math.min(k + 1, PHASES.length - 1)];
    persist(); emit(); runPhase();
  }

  /* ---- 存檔 ---- */
  function snapshot() {
    var data = {};
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(PREFIX) === 0) data[k] = localStorage.getItem(k); }); } catch (e) {}
    return data;
  }
  function saves() { var s = load(SAVES, null) || {}; s.slots = s.slots || {}; return s; }
  function meta() {
    var now = new Date();
    return { day: st.day, date: fmt(dateOf(st.day), true),
      savedAt: now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDate() + ' ' + now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0') };
  }
  function writeSlot(id) { var s = saves(); s.slots[id] = { meta: meta(), data: snapshot() }; store(SAVES, s); }
  function restore(data) {
    try {
      Object.keys(localStorage).forEach(function (k) { if (k.indexOf(PREFIX) === 0) localStorage.removeItem(k); });
      Object.keys(data || {}).forEach(function (k) { localStorage.setItem(k, data[k]); });
    } catch (e) {}
  }

  /* ---- 隱藏數值（玩家看不到；設定 → 數值（開發用）可以檢查） ----
   * aff   = 好感度：玩家對每位成員（data.js 的 cast）
   * pair  = 成員之間的關係：每兩位一組，key 寫 "m1-m2"（順序不拘）
   * awake = 覺醒度：每位成員對「自己其實已經長大」的察覺程度 */
  var SKEY = 'riiiize-stats';
  function cast() { return (D.cast || []); }
  // visits = 每個日程去過幾次（條件可以寫 visits: { council: ">=3" }）
  function stats() { var v = load(SKEY, null) || {}; v.aff = v.aff || {}; v.pair = v.pair || {}; v.awake = v.awake || {}; v.visits = v.visits || {}; return v; }
  // "m2-m1" → "m1-m2"（照 cast 的順序排）
  function pairKey(k) {
    var ids = cast().map(function (c) { return c.id; });
    var ab = String(k).split(/\s*[-–,&]\s*/);
    return ab.sort(function (x, y) { return ids.indexOf(x) - ids.indexOf(y); }).join('-');
  }
  function statGet(kind, id) { var v = stats()[kind] || {}; return +(v[kind === 'pair' ? pairKey(id) : id] || 0); }
  function statAdd(kind, id, n) {
    var v = stats(), k = kind === 'pair' ? pairKey(id) : id;
    v[kind][k] = (+(v[kind][k] || 0)) + (+n || 0);
    store(SKEY, v);
  }
  function statSet(kind, id, n) { var v = stats(), k = kind === 'pair' ? pairKey(id) : id; v[kind][k] = +n || 0; store(SKEY, v); }
  function hasFlag(f) {
    if (window.SOSHO) return window.SOSHO.hasFlag(f);
    return !!(load('riiiize-flags', {}) || {})[f];
  }

  /* ---- 效果：選項、訊息回覆、電話段落都可以寫 effects ----
   *   { aff: { m1: 2 }, pair: { "m1-m2": 1 }, awake: { m3: 1 }, flag: "旗標" 或 ["旗標", …] } */
  function apply(fx) {
    if (!fx) return;
    ['aff', 'pair', 'awake'].forEach(function (kind) {
      Object.keys(fx[kind] || {}).forEach(function (id) { statAdd(kind, id, fx[kind][id]); });
    });
    [].concat(fx.flag || []).forEach(function (f) { if (window.SOSHO) window.SOSHO.setFlag(f); });
  }

  /* ---- 條件：劇情、訊息、電話、日程都可以寫 if ----
   *   { day: ">=5" 或 [3, 7]（第 3～7 天）, phase: "night",
   *     date: "12-24" 或 ["10-01", "10-31"], weekday: 0（星期日）～6, month: 9 或 [9, 10],
   *     visits: { council: ">=3" }（去過某個日程幾次）,
   *     flag: "旗標" 或 ["旗標", …]（全部要有）, notFlag: "旗標" 或 [...]（全部不能有）,
   *     aff: { m1: ">=10" }, pair: { "m1-m2": ">=5" }, awake: { m3: ">=3" },
   *     lover: "m1"（是戀人）, notLover: "m1", couple: "m1-m2"（兩位是一對）, notCouple: "m1-m2",
   *     allAwake: true（六位覺醒度都夠）／false,
   *     any: [ 條件, 條件 ]（其中一個成立就好）, not: 條件（不成立才算） }
   *   數字比較可寫 ">=10"、">3"、"<=2"、"<5"、"=4"，或只寫數字（= 至少這個數字）
   *   只寫一個字串 = 有這個旗標 */
  function cmp(val, rule) {
    if (rule == null) return true;
    if (Array.isArray(rule)) return val >= rule[0] && val <= rule[1];
    var m = /^\s*(>=|<=|>|<|==|=|!=)?\s*(-?\d+(?:\.\d+)?)\s*$/.exec(String(rule));
    if (!m) return true;
    var n = +m[2];
    switch (m[1] || '>=') {
      case '>': return val > n; case '<': return val < n; case '<=': return val <= n;
      case '=': case '==': return val === n; case '!=': return val !== n; default: return val >= n;
    }
  }
  /* ---- 戀愛和覺醒：data.js 的 romance ----
   *   lover：玩家和某位成員是戀人 = 好感度到 lover.aff，而且有 lover.flag 旗標（{id} = 成員 id，例如 confess_m1）
   *   couple：兩位成員是一對 = 關係到 couple.pair，而且有 couple.flag 旗標（{pair} = "m1-m2"）
   *   allAwake：六位的覺醒度都到 awake */
  function R() { return D.romance || {}; }
  function isLover(id) {
    var r = R().lover || {};
    return cmp(statGet('aff', id), r.aff != null ? r.aff : 20) && hasFlag(String(r.flag || 'confess_{id}').replace('{id}', id));
  }
  function isCouple(k) {
    var r = R().couple || {}, key = pairKey(k);
    return cmp(statGet('pair', key), r.pair != null ? r.pair : 10) && hasFlag(String(r.flag || 'couple_{pair}').replace('{pair}', key));
  }
  function allAwake() {
    var need = R().awake != null ? R().awake : 10;
    return cast().length > 0 && cast().every(function (c) { return cmp(statGet('awake', c.id), need); });
  }
  function check(c) {
    if (c == null || c === true) return true;
    if (typeof c === 'string') return hasFlag(c);
    if (Array.isArray(c)) return c.every(check);
    if (c.day != null && !cmp(st.day, c.day)) return false;
    // 日期：date: "12-24" 或 ["10-01", "10-31"]（範圍）；weekday: 0（日）～6（六）；month: 9 或 [9, 10]
    if (c.date != null) {
      if (Array.isArray(c.date)) { if (st.day < dayOfMD(c.date[0]) || st.day > dayOfMD(c.date[1])) return false; }
      else if (mdOf(st.day) !== String(c.date).replace(/^(\d)-/, '0$1-').replace(/-(\d)$/, '-0$1')) return false;
    }
    if (c.weekday != null && [].concat(c.weekday).indexOf(dateOf(st.day).getDay()) < 0) return false;
    if (c.month != null && [].concat(c.month).indexOf(dateOf(st.day).getMonth() + 1) < 0) return false;
    if (c.visits && !Object.keys(c.visits).every(function (id) { return cmp(statGet('visits', id), c.visits[id]); })) return false;
    if (c.phase && [].concat(c.phase).indexOf(st.phase) < 0) return false;
    if (c.flag && ![].concat(c.flag).every(hasFlag)) return false;
    if (c.notFlag && [].concat(c.notFlag).some(hasFlag)) return false;
    var ok = ['aff', 'pair', 'awake'].every(function (kind) {
      return Object.keys(c[kind] || {}).every(function (id) { return cmp(statGet(kind, id), c[kind][id]); });
    });
    if (!ok) return false;
    // 戀愛、覺醒（門檻寫在 data.js 的 romance）
    if (c.lover && ![].concat(c.lover).every(isLover)) return false;
    if (c.notLover && [].concat(c.notLover).some(isLover)) return false;
    if (c.couple && ![].concat(c.couple).every(isCouple)) return false;
    if (c.notCouple && [].concat(c.notCouple).some(isCouple)) return false;
    if (c.allAwake != null && !!c.allAwake !== allAwake()) return false;
    if (c.any && !c.any.some(check)) return false;
    if (c.not && check(c.not)) return false;
    return true;
  }

  window.GAME = {
    cast: cast,
    pairs: function () {   // 所有兩兩一組：["m1-m2", "m1-m3", …]
      var ids = cast().map(function (c) { return c.id; }), out = [];
      for (var i = 0; i < ids.length; i++) for (var j = i + 1; j < ids.length; j++) out.push(ids[i] + '-' + ids[j]);
      return out;
    },
    pairKey: pairKey,
    stat: function (kind, id) { return statGet(kind, id); },
    addStat: function (kind, id, n) { statAdd(kind, id, n); },
    setStat: function (kind, id, n) { statSet(kind, id, n); },
    apply: apply,
    check: check,
    // 開發用：直接跳到第幾天（設定 → 數值）
    setDay: function (n) { st.day = Math.max(1, n | 0); persist(); emit(); },
    get day() { return st.day; },
    get phase() { return st.phase; },
    get ended() { return st.ended || null; },   // 看完結局後：'explore'（不再換天）或 'continue'（照常過日子）
    setEnded: function (mode) { st.ended = mode; if (mode !== 'explore') delete st.ended; persist(); emit(); },
    isLover: function (id) { return isLover(id); },
    isCouple: function (k) { return isCouple(k); },
    allAwake: function () { return allAwake(); },
    date: function (day) { return dateOf(day); },
    dateText: function (day, withWeek) { return fmt(dateOf(day), withWeek); },
    weekday: function (d) { return WEEK[(d || dateOf()).getDay()]; },
    onChange: function (fn) { listeners.push(fn); },
    onNight: function (fn) { nightFns.push(fn); },
    onPhase: function (phase, fn) { (handlers[phase] = handlers[phase] || []).push(fn); },
    // 解鎖手機後呼叫：從目前的時段開始跑（早上、放學沒有內容就直接到晚上）
    start: function () { runPhase(); },
    // 進入某一天的早上，並自動存檔（睡覺後由 js/plan.js 決定跳到哪一天）
    goTo: function (day) {
      st.day = day; st.phase = 'morning'; persist();
      if (window.SOSHO) window.SOSHO.setFlag('day_' + st.day);
      var s = saves(); s.auto = { meta: meta(), data: snapshot() }; store(SAVES, s);
      emit();
    },
    sleep: function () { window.GAME.goTo(st.day + 1); },
    totalDays: totalDays,
    dayOf: dayOfMD,            // "12-24" → 第幾天
    md: mdOf,                  // 第幾天 → "12-24"
    setPhase: function (p) { st.phase = p; persist(); emit(); },
    slots: function () { return G.saveSlots || 10; },
    saves: function () { return saves(); },
    save: function (id) { writeSlot(id); },
    remove: function (id) { var s = saves(); delete s.slots[id]; store(SAVES, s); },
    // 讀檔：換成那個存檔的進度後重新整理（回到鎖定畫面）
    load: function (id) {
      var s = saves(), slot = id === 'auto' ? s.auto : s.slots[id];
      if (!slot) return;
      restore(slot.data);
      location.href = location.pathname;
    }
  };
})();
