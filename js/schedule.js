/* =========================================================
 * 日程（放學後要做什麼）
 *   平日：放學時自動跳出活動選單（社團、學生會、志工、K歌、打遊戲、運動、閒晃），選一個
 *     → 今天有這個活動的特殊事件（行事曆上的事件）就先播那段
 *     → 不然從這個活動的劇情清單裡，挑第一段「條件成立、還沒看過」的（閒晃 = 隨機挑一段）
 *     → 都沒有就用一句話帶過
 *   週末：選要和誰見面（一位或兩位），或待在家
 *     一位 = 好感度增加；兩位 = 兩人之間的關係增加，和玩家的好感度也小幅增加
 *     有為這位／這兩位寫的劇情就播，沒有就用一句話帶過
 *   今天放學有主線劇情（data.js 的 story）→ 這天不能選日程
 *   設定都在 data.js 的 schedule
 * ========================================================= */
(function () {
  'use strict';

  function D() { return window.SITE_DATA || {}; }
  function C() { return D().schedule || {}; }
  function S() { return window.SOSHO; }
  function G() { return window.GAME; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ok(c) { return !c || G().check(c); }
  function seen(id) { return S() && S().hasFlag('scene_' + id); }
  function T() {
    var t = C().text || {}, d = {
      title: '放學後要做什麼？', weekendTitle: '今天要和誰見面？', weekendHint: '最多選兩位',
      go: '出門', home: '待在家', nothing: '今天的{activity}沒有發生什麼特別的事。',
      single: '你和{a}一起度過了週末。', pair: '你和{a}、{b}一起度過了週末。', stayHome: '今天待在家裡，好好休息了一天。'
    };
    Object.keys(t).forEach(function (k) { d[k] = t[k]; });
    return d;
  }
  function nameOf(id) { var c = (D().cast || []).filter(function (x) { return x.id === id; })[0]; return c ? c.name : id; }
  function isWeekend() { var d = G().date().getDay(); return d === 0 || d === 6; }
  // 今天放學有主線劇情（看過的也算）→ 不跳日程
  function storyToday() {
    return (D().story || []).some(function (s) { return s.phase === 'afterschool' && +s.day === G().day && ok(s.if); });
  }

  // 一句話帶過（沒有劇情時）：用對話框顯示一句旁白
  function narrate(text, done) {
    var id = '__narrate';
    D().scenes = D().scenes || {};
    D().scenes[id] = [{ bg: C().narrateBg || (D().home || {}).wallpaper || '' }, { text: text }];   // 背景：schedule.narrateBg，沒寫就用桌布
    window.STORY.play(id, done);
  }

  /* ---- 平日：選活動 ---- */
  // 今天、這個活動的特殊事件（schedule.special：{ day, title, activity, scene, if }）
  function specialFor(act) {
    return (C().special || []).filter(function (e) {
      return +e.day === G().day && e.activity === act && ok(e.if) && !seen(e.scene);
    })[0] || null;
  }
  // 這個活動要播哪段：清單從上往下第一段「條件成立、還沒看過」的（repeat: true 可以重複看）；閒晃 = 隨機
  function sceneFor(act) {
    var list = ((C().scenes || {})[act] || []).filter(function (e) {
      return ok(e.if) && (e.repeat || !seen(e.scene)) && (D().scenes || {})[e.scene];
    });
    if (!list.length) return null;
    return act === 'wander' ? list[Math.floor(Math.random() * list.length)] : list[0];
  }
  function runActivity(act, done) {
    var a = (C().activities || []).filter(function (x) { return x.id === act; })[0] || { id: act, label: act };
    S().setFlag('act_' + act);   // 做過這個活動（進度旗標）
    var sp = specialFor(act), sc = sp || sceneFor(act);
    if (sc) window.STORY.play(sc.scene, done);
    else narrate(T().nothing.replace('{activity}', a.label), done);
  }

  /* ---- 週末：選人 ---- */
  function sameSet(a, b) { a = [].concat(a || []).slice().sort(); b = b.slice().sort(); return a.length === b.length && a.every(function (x, i) { return x === b[i]; }); }
  function runWeekend(ids, done) {
    var w = C().weekend || {}, t = T();
    if (!ids.length) {   // 待在家
      S().setFlag('weekend_home');
      var hs = (w.home || []).filter(function (e) { return ok(e.if) && (e.repeat || !seen(e.scene)); })[0];
      if (hs) window.STORY.play(hs.scene, done); else narrate(t.stayHome, done);
      return;
    }
    // 數值：一位 = 好感度；兩位 = 他們之間的關係＋各一點好感度
    var fx = { aff: {}, pair: {} };
    if (ids.length === 1) fx.aff[ids[0]] = w.singleAff != null ? w.singleAff : 2;
    else {
      fx.pair[ids[0] + '-' + ids[1]] = w.pairBond != null ? w.pairBond : 2;
      ids.forEach(function (id) { fx.aff[id] = w.pairAff != null ? w.pairAff : 1; });
    }
    G().apply(fx);
    var sc = (w.scenes || []).filter(function (e) {
      return sameSet(e.with, ids) && ok(e.if) && (e.repeat || !seen(e.scene)) && (D().scenes || {})[e.scene];
    })[0];
    if (sc) window.STORY.play(sc.scene, done);
    else narrate((ids.length === 1 ? t.single : t.pair).replace('{a}', nameOf(ids[0])).replace('{b}', nameOf(ids[1] || '')), done);
  }

  /* ---- 選單畫面 ---- */
  function picker(done) {
    var t = T(), weekend = isWeekend(), el = document.createElement('div'), picked = [];
    el.className = 'sch';
    var dateLine = esc(G().dateText(null, true));
    if (!weekend) {
      el.innerHTML = '<div class="sch-in"><small>' + dateLine + '</small><b>' + esc(t.title) + '</b>' +
        '<div class="sch-grid">' + (C().activities || []).map(function (a) {
          return '<button type="button" data-act="' + esc(a.id) + '"><span>' + esc(a.label) + '</span></button>';
        }).join('') + '</div></div>';
    } else {
      el.innerHTML = '<div class="sch-in"><small>' + dateLine + '</small><b>' + esc(t.weekendTitle) + '</b><p>' + esc(t.weekendHint) + '</p>' +
        '<div class="sch-cast">' + (D().cast || []).map(function (c) {
          return '<button type="button" data-meet="' + esc(c.id) + '">' + esc(c.name) + '</button>';
        }).join('') + '</div>' +
        '<div class="sch-actions"><button type="button" class="sch-home" data-home>' + esc(t.home) + '</button>' +
        '<button type="button" class="sch-go" data-go disabled>' + esc(t.go) + '</button></div></div>';
    }
    document.getElementById('phone').appendChild(el);
    void el.offsetWidth; el.classList.add('show');
    if (S()) S().setDarkStatus(true);
    function close(after) {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); after(); }, 250);
    }
    el.addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-act]'))) { close(function () { runActivity(b.dataset.act, done); }); return; }
      if ((b = e.target.closest('[data-meet]'))) {
        var id = b.dataset.meet, k = picked.indexOf(id);
        if (k >= 0) picked.splice(k, 1);
        else { if (picked.length >= 2) picked.shift(); picked.push(id); }   // 最多兩位：再選第三位會換掉最早選的
        el.querySelectorAll('[data-meet]').forEach(function (x) { x.classList.toggle('on', picked.indexOf(x.dataset.meet) >= 0); });
        el.querySelector('[data-go]').disabled = !picked.length;
        return;
      }
      if (e.target.closest('[data-go]') && picked.length) { var ids = picked.slice(); close(function () { runWeekend(ids, done); }); return; }
      if (e.target.closest('[data-home]')) { close(function () { runWeekend([], done); }); return; }
    });
  }

  if (window.GAME) {
    window.GAME.onPhase('afterschool', function (done) {
      if (storyToday()) { done(); return; }   // 今天放學是主線劇情
      if (location.hash !== '#/home') location.hash = '#/home';
      setTimeout(function () { picker(done); }, 300);
    });
  }

  // 行事曆用：某一天的特殊事件（只給名稱，不說是哪個活動）
  window.SCHEDULE = {
    specialsOn: function (day) { return (C().special || []).filter(function (e) { return +e.day === day && ok(e.if); }); },
    isWeekend: isWeekend
  };
})();
