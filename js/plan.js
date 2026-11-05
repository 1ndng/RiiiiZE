/* =========================================================
 * 每月安排與時間推進（一學年：2025/9/1～2026/8/31）
 *
 * 月曆安排：每個月開始時（9 月是 9/7 之後）跳出那個月的月曆，把日程方塊拖到平日上（一天一個）
 *   沒放 = 回家；週末、已經過去的日子、主線強制日程的日子不能放；按「確認」後開始過日子
 *   點方塊再點日子也可以放；點已經放了方塊的日子 = 拿掉
 *
 * 時間推進：照月曆加好感、自動往後跳，停在「有事的日子」：
 *   主線劇情（story）、特殊劇情（specials 條件成立）、節日（holidays）、生日（cast 的 birthday、玩家生日）、
 *   送禮日（每月 14 日，2/14、3/14 是節日劇情）、每個星期日
 *   有事的日子：早上主線 → 放學（今天的日程／特殊劇情 → 節日、生日 → 送禮 → 星期日選人）
 *   手機只有星期日能用：星期日會出現鎖定畫面，解鎖後可以自由使用手機，晚上按「睡覺」繼續
 *   其他有事的日子：不解鎖手機，在黑底日期畫面上直接播劇情，播完自動往後跳
 *   （最後一天、看完結局之後也可以用手機）
 *
 * 好感度（公平：每個日程每次的總量一樣，平分給在場的人）：
 *   好感：affTotal（預設 6）÷ 在場人數；成員之間：pairTotal（預設 15）÷ 在場的對數
 *   在場的人 = cast 的 activities 有這個日程的成員；閒晃 = 隨機 wanderMeet（預設 2）位
 *   特殊劇情發生的那天不加好感
 * ========================================================= */
(function () {
  'use strict';

  var PKEY = 'riiiize-plan';
  function D() { return window.SITE_DATA || {}; }
  function C() { return D().plan || {}; }
  function G() { return window.GAME; }
  function S() { return window.SOSHO; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function ok(c) { return !c || G().check(c); }
  function seen(id) { return S() && S().hasFlag('scene_' + id); }
  function scene(id) { return (D().scenes || {})[id]; }
  function T() {
    var t = C().text || {}, d = {
      planTitle: '{m}月的安排', planHint: '把日程拖到星期一～六（一天一個），沒放的日子會直接回家', confirm: '確認', weekend: '週日', home: '回家',
      tutorialTitle: '每月安排', tutorialText: '從現在開始，每個月可以自由安排放學後要去哪裡。\n把日程方塊拖到月曆上，確認後就會照著過日子。',
      ok: '好', clear: '清除',
      weekendTitle: '今天要和誰見面？', weekendHint: '最多選兩位', go: '出門', stayHome: '待在家',
      single: '今天和{a}一起度過了。', pair: '今天和{a}、{b}一起度過了。', stayHomeText: '今天待在家裡，好好休息了一下。',
      giftTitle: '{m}月14日', giftHint: '要送禮物嗎？', giftMe: '我送禮物', giftAsk: '請 A 送給 B', giftNo: '不送',
      giftPickOne: '要送給誰？', giftPickTwo: '請誰送給誰？（先選送禮的人）', giftOk: '確定', back: '返回',
      giftMeText: '你把禮物送給了{a}。', giftAskText: '你請{a}送禮物給{b}。', birthday: '{name}生日', myBirthday: '我的生日', giftDay: '送禮日',
      skipped: '{from} ～ {to}',
      dayLine: '{date}\n放學後去了{act}，遇到了{who}。'
    };
    Object.keys(t).forEach(function (k) { d[k] = t[k]; });
    return d;
  }
  function cast() { return D().cast || []; }
  function nameOf(id) { var c = cast().filter(function (x) { return x.id === id; })[0]; return c ? c.name : id; }
  function acts() { return C().activities || []; }
  // 月曆格子裡的名字：data.js 的 cell（"|" = 換行）；沒寫就用 label
  function cellOf(id) { var a = actOf(id); return esc(a.cell || a.label).replace(/\|/g, '<br>'); }
  function actOf(id) { return acts().filter(function (a) { return a.id === id; })[0] || { id: id, label: id }; }
  function dateOf(day) { return G().date(day); }
  // 只有星期日是假日（星期六可以排日程）
  function isWeekend(day) { return dateOf(day).getDay() === 0; }
  // 這天能不能用手機：星期日、最後一天、看完結局之後
  function phoneDay(day) { return dateOf(day).getDay() === 0 || day >= G().totalDays() || !!G().ended; }
  function ym(day) { var d = dateOf(day); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2); }
  function plans() { return load(PKEY, null) || { months: {}, days: {} }; }

  /* ---- 這天有什麼 ---- */
  function storyOn(day) {
    return (D().story || []).filter(function (s) { return (s.date ? G().dayOf(s.date) : +s.day) === day; });
  }
  function forcedOn(day) { return storyOn(day).filter(function (s) { return s.activity; })[0] || null; }
  function holidaysOn(day) { return (C().holidays || []).filter(function (h) { return G().dayOf(h.date) === day; }); }
  function birthdaysOn(day) {
    var md = G().md(day), out = cast().filter(function (c) { return c.birthday && normMD(c.birthday) === md; })
      .map(function (c) { return { id: c.id, name: c.name, scene: 'birthday_' + c.id }; });
    var pb = window.STORY && window.STORY.playerBirthday();
    if (pb && normMD(pb) === md) out.push({ id: 'me', name: window.STORY.playerName(), scene: 'birthday_me', me: true });
    return out;
  }
  function normMD(s) { var m = /(\d+)\D+(\d+)/.exec(String(s)); return m ? ('0' + m[1]).slice(-2) + '-' + ('0' + m[2]).slice(-2) : ''; }
  // 送禮日：每月 14 日，但有節日劇情的 14 日（2/14、3/14）不算
  function isGiftDay(day) { return dateOf(day).getDate() === 14 && !holidaysOn(day).length; }
  function plannedOn(day) { return plans().days[G().md(day)] || null; }
  // 今天這個日程會觸發的特殊劇情（specials：{ activity, if, scene, date }；看過就不再觸發，repeat: true 可以重複）
  function specialFor(day, act) {
    if (!act) return null;
    return (C().specials || []).filter(function (e) {
      return e.activity === act && (!e.date || G().dayOf(e.date) === day) && ok(e.if) && (e.repeat || !seen(e.scene)) && scene(e.scene);
    })[0] || null;
  }
  // 有事的日子 = 要停下來（可以使用手機）
  function isStop(day) {
    if (storyOn(day).length || holidaysOn(day).length || birthdaysOn(day).length || isGiftDay(day)) return true;
    if (dateOf(day).getDay() === 0) return true;   // 星期日：夜間自由使用手機
    if (day >= G().totalDays()) return true;
    return !isWeekend(day) && !!specialFor(day, plannedOn(day));
  }

  /* ---- 好感度：日程每次的總量平分給在場的人 ---- */
  // 這次去會遇到誰：從會出現在這個日程的成員裡隨機挑 1 位～全部（每次都重新抽）
  //   閒晃 = 從全部成員裡隨機挑 1～wanderMeet 位
  function membersOf(act) {
    var pool = act === 'wander' ? cast().map(function (c) { return c.id; })
      : cast().filter(function (c) { return (c.activities || []).indexOf(act) >= 0; }).map(function (c) { return c.id; });
    if (!pool.length) return [];
    var max = act === 'wander' ? Math.min(C().wanderMeet || 2, pool.length) : pool.length;
    var k = 1 + Math.floor(Math.random() * max), out = [];
    while (out.length < k) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    return cast().map(function (c) { return c.id; }).filter(function (id) { return out.indexOf(id) >= 0; });   // 照 cast 的順序
  }
  function shareEffects(ids, affTotal, pairTotal) {
    var fx = { aff: {}, pair: {} }, pairs = [];
    ids.forEach(function (a, i) { ids.slice(i + 1).forEach(function (b) { pairs.push(a + '-' + b); }); });
    ids.forEach(function (id) { fx.aff[id] = affTotal / ids.length; });
    pairs.forEach(function (k) { fx.pair[k] = pairTotal / pairs.length; });
    return fx;
  }
  // 回傳這次遇到的人（日程的一句話用）
  function doActivity(act) {
    if (!act) return [];
    var ids = membersOf(act);
    G().addStat('visits', act, 1);
    if (S()) S().setFlag('act_' + act);
    if (ids.length) G().apply(shareEffects(ids, C().affTotal != null ? C().affTotal : 6, C().pairTotal != null ? C().pairTotal : 15));
    return ids;
  }
  // 「9月8日（星期一）\n放學後去了學生會，遇到了鄭成燦和李炤熙。」（plan.text.dayLine 可以改；活動可以寫自己的 line）
  function joinNames(ids) {
    var n = ids.map(nameOf);
    return n.length <= 1 ? (n[0] || '') : n.slice(0, -1).join('、') + '和' + n[n.length - 1];
  }
  function dayLine(day, act, ids) {
    var t = T(), d = dateOf(day), a = actOf(act);
    return (a.line || t.dayLine)
      .replace('{date}', (d.getMonth() + 1) + '月' + d.getDate() + '日（' + G().weekday(d) + '）')
      .replace('{act}', a.label).replace('{who}', joinNames(ids));
  }

  /* ---- 一句話帶過（用對話框） ---- */
  function narrate(text, done) {
    D().scenes = D().scenes || {};
    D().scenes.__narrate = [{ bg: C().narrateBg || D().storyBg || (D().home || {}).wallpaper || '' }, { text: text }];
    window.STORY.play('__narrate', done);
  }
  function playIf(id, done) { if (id && scene(id)) window.STORY.play(id, done); else done(); }
  function series(fns, done) { var i = 0; (function next() { if (i >= fns.length) { done(); return; } fns[i++](next); })(); }

  /* ---- 選人的畫面（星期日、送禮）---- */
  function chooser(opt, done) {
    var t = T(), el = document.createElement('div'), picked = [];
    el.className = 'sch';
    function render() {
      el.innerHTML = '<div class="sch-in"><small>' + esc(G().dateText(null, true)) + '</small><b>' + esc(opt.title) + '</b>' +
        (opt.hint ? '<p>' + esc(opt.hint) + '</p>' : '') +
        (opt.buttons ? '<div class="sch-col">' + opt.buttons.map(function (b, i) { return '<button type="button" data-btn="' + i + '">' + esc(b.label) + '</button>'; }).join('') + '</div>'
          : '<div class="sch-cast">' + cast().map(function (c) {
              var k = picked.indexOf(c.id);
              return '<button type="button" data-meet="' + esc(c.id) + '"' + (k >= 0 ? ' class="on"' : '') + '><img src="' + esc(c.avatar || 'images/default_avatar.png') + '" alt=""><span>' + esc(c.name) + '</span>' +
                (opt.max === 2 && opt.ordered && k >= 0 ? '<i>' + (k === 0 ? 'A' : 'B') + '</i>' : '') + '</button>';
            }).join('') + '</div>' +
            '<div class="sch-actions"><button type="button" class="sch-home" data-alt>' + esc(opt.altLabel) + '</button>' +
            '<button type="button" class="sch-go" data-go' + (picked.length < (opt.min || 1) ? ' disabled' : '') + '>' + esc(opt.goLabel) + '</button></div>') +
        '</div>';
    }
    render();
    document.getElementById('phone').appendChild(el);
    void el.offsetWidth; el.classList.add('show');
    function close(fn) { el.classList.remove('show'); setTimeout(function () { el.remove(); fn(); }, 250); }
    el.addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-btn]'))) { var bt = opt.buttons[+b.dataset.btn]; close(function () { bt.run(); }); return; }
      if ((b = e.target.closest('[data-meet]'))) {
        var id = b.dataset.meet, k = picked.indexOf(id);
        if (k >= 0) picked.splice(k, 1);
        else { if (picked.length >= opt.max) picked.shift(); picked.push(id); }
        render(); return;
      }
      if (e.target.closest('[data-go]') && picked.length >= (opt.min || 1)) { var ids = picked.slice(); close(function () { opt.onGo(ids); }); return; }
      if (e.target.closest('[data-alt]')) { close(function () { opt.onAlt(); }); return; }
    });
  }

  // 星期日：先播 weekend.intro（劇情樣式），再選要見誰
  function weekend(done) {
    var w = C().weekend || {}, t = T();
    playIf(w.intro, function () {
      chooser({ title: t.weekendTitle, hint: t.weekendHint, max: 2, min: 1, goLabel: t.go, altLabel: t.stayHome,
        onAlt: function () {
          if (S()) S().setFlag('weekend_home');
          var hs = (w.home || []).filter(function (e) { return ok(e.if) && (e.repeat || !seen(e.scene)) && scene(e.scene); })[0];
          if (hs) window.STORY.play(hs.scene, done); else narrate(t.stayHomeText, done);
        },
        onGo: function (ids) {
          // 見一位：好感 +single；見兩位：各自好感 +pairAff、兩人關係 +pairBond
          var fx = { aff: {}, pair: {} };
          if (ids.length === 1) fx.aff[ids[0]] = w.single != null ? w.single : 6;
          else { ids.forEach(function (id) { fx.aff[id] = w.pairAff != null ? w.pairAff : 3; }); fx.pair[ids[0] + '-' + ids[1]] = w.pairBond != null ? w.pairBond : 15; }
          G().apply(fx);
          var sc = (w.scenes || []).filter(function (e) {
            var a = [].concat(e.with || []).slice().sort().join(), b = ids.slice().sort().join();
            return a === b && ok(e.if) && (e.repeat || !seen(e.scene)) && scene(e.scene);
          })[0];
          if (sc) window.STORY.play(sc.scene, done);
          else narrate((ids.length === 1 ? t.single : t.pair).replace('{a}', nameOf(ids[0])).replace('{b}', nameOf(ids[1] || '')), done);
        }
      });
    });
  }

  // 14 日：送禮
  function gift(done) {
    var g = C().gift || {}, t = T(), m = dateOf(G().day).getMonth() + 1;
    chooser({ title: t.giftTitle.replace('{m}', m), hint: t.giftHint, buttons: [
      { label: t.giftMe, run: function () {
        chooser({ title: t.giftPickOne, max: 1, min: 1, goLabel: t.giftOk, altLabel: t.back,
          onAlt: function () { gift(done); },
          onGo: function (ids) {
            var fx = { aff: {} }; fx.aff[ids[0]] = g.aff != null ? g.aff : 6; G().apply(fx);
            if (S()) S().setFlag('gift_' + G().md(G().day) + '_' + ids[0]);
            narrate(t.giftMeText.replace('{a}', nameOf(ids[0])), done);
          } });
      } },
      { label: t.giftAsk, run: function () {
        chooser({ title: t.giftPickTwo, max: 2, min: 2, ordered: true, goLabel: t.giftOk, altLabel: t.back,
          onAlt: function () { gift(done); },
          onGo: function (ids) {
            var fx = { pair: {} }; fx.pair[ids[0] + '-' + ids[1]] = g.pair != null ? g.pair : 15; G().apply(fx);
            narrate(t.giftAskText.replace('{a}', nameOf(ids[0])).replace('{b}', nameOf(ids[1])), done);
          } });
      } },
      { label: t.giftNo, run: done }
    ] }, done);
  }

  /* ---- 有事的日子的放學 ---- */
  if (window.GAME) {
    G().onPhase('afterschool', function (done) {
      if (window.STORY && window.STORY.resumed('afterschool')) { done(); return; }   // 讀檔：放學的劇情剛剛已經接著播完
      var day = G().day, steps = [];
      if (location.hash !== '#/home') location.hash = '#/home';
      // 1. 今天的日程：主線強制日程 → 照那個日程加好感；不然看月曆（平日），特殊劇情優先（不加好感）
      var forced = forcedOn(day);
      if (forced) doActivity(forced.activity);
      else if (!isWeekend(day)) {
        var act = plannedOn(day), sp = specialFor(day, act);
        if (sp) steps.push(function (next) { G().addStat('visits', act, 1); window.STORY.play(sp.scene, next); });
        else if (act) { var met = doActivity(act); steps.push(function (next) { narrate(dayLine(day, act, met), next); }); }
      }
      // 2. 節日、生日
      holidaysOn(day).forEach(function (h) { steps.push(function (next) { playIf(h.scene, next); }); });
      birthdaysOn(day).forEach(function (b) { steps.push(function (next) { playIf(b.scene, next); }); });
      // 3. 送禮日、4. 星期日
      if (isGiftDay(day)) steps.push(gift);
      if (dateOf(day).getDay() === 0 && !forced && !(C().weekend || {}).off) steps.push(weekend);
      setTimeout(function () { series(steps, done); }, steps.length ? 300 : 0);
    });
  }

  /* ---- 月曆安排 ---- */
  function needPlan(day) {
    var from = G().dayOf(C().planFrom || '09-08');
    return day >= from && !plans().months[ym(day)];
  }
  function planner(day, done) {
    var t = T(), d0 = dateOf(day), y = d0.getFullYear(), m = d0.getMonth(), p = plans(), sel = null;
    var first = new Date(y, m, 1), lead = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    var el = document.createElement('div');
    el.className = 'pl';
    function dayIdx(n) { return Math.round((new Date(y, m, n) - G().date(1)) / 864e5) + 1; }
    function md(n) { return ('0' + (m + 1)).slice(-2) + '-' + ('0' + n).slice(-2); }
    function cellHTML(n) {
      var di = dayIdx(n), wd = new Date(y, m, n).getDay(), we = wd === 0, f = forcedOn(di), past = di < day;   // 只有星期日不能放
      var a = p.days[md(n)], cls = 'pl-day' + (we ? ' we' : '') + (past ? ' past' : '') + (f ? ' forced' : '');
      var can = !we && !past && !f;
      var inner = '<b>' + n + '</b>' + (f ? '<i>' + cellOf(f.activity) + '</i>' : we ? '<i class="dim">' + esc(t.weekend) + '</i>'
        : a ? '<i class="blk" data-act="' + esc(a) + '">' + cellOf(a) + '</i>' : '');
      return '<div class="' + cls + '"' + (can ? ' data-pday="' + md(n) + '"' : '') + '>' + inner + '</div>';
    }
    function render() {
      var cells = [];
      for (var i = 0; i < lead; i++) cells.push('<div class="pl-day blank"></div>');
      for (var n = 1; n <= days; n++) cells.push(cellHTML(n));
      el.innerHTML = '<div class="pl-in"><b class="pl-title">' + esc(t.planTitle.replace('{m}', m + 1)) + '</b><p>' + esc(t.planHint) + '</p>' +
        '<div class="pl-head">' + ['一', '二', '三', '四', '五', '六', '日'].map(function (h) { return '<span>' + h + '</span>'; }).join('') + '</div>' +
        '<div class="pl-grid">' + cells.join('') + '</div>' +
        '<div class="pl-blocks">' + acts().map(function (a) {
          return '<button type="button" class="pl-blk' + (sel === a.id ? ' on' : '') + '" data-blk="' + esc(a.id) + '">' + esc(a.label) + '</button>';
        }).join('') + '</div>' +
        '<div class="pl-actions"><button type="button" class="pl-clear" data-clear>' + esc(t.clear) + '</button>' +
        '<button type="button" class="pl-ok" data-confirm>' + esc(t.confirm) + '</button></div></div>';
    }
    render();
    document.getElementById('phone').appendChild(el);
    void el.offsetWidth; el.classList.add('show');

    function setDay(key, act) { if (act) p.days[key] = act; else delete p.days[key]; render(); }
    // 拖曳：手指或滑鼠按住方塊拖到日子上
    var drag = null;
    el.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('[data-blk]'), c = e.target.closest('[data-pday] .blk');
      if (!b && !c) return;
      var act = b ? b.dataset.blk : c.dataset.act, from = c ? c.closest('[data-pday]').dataset.pday : null;
      drag = { act: act, from: from, x: e.clientX, y: e.clientY, moved: false, ghost: null };
      e.preventDefault();
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (!drag.moved && Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        drag.ghost = document.createElement('div');
        drag.ghost.className = 'pl-ghost'; drag.ghost.textContent = actOf(drag.act).label;
        document.body.appendChild(drag.ghost);
      }
      drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
      el.querySelectorAll('.pl-day.over').forEach(function (x) { x.classList.remove('over'); });
      var tgt = document.elementFromPoint(e.clientX, e.clientY), cell = tgt && tgt.closest && tgt.closest('[data-pday]');
      if (cell) cell.classList.add('over');
    });
    window.addEventListener('pointerup', function (e) {
      if (!drag) return;
      var d = drag; drag = null;
      if (!d.moved) return;   // 只是點一下：交給 click
      d.ghost.remove();
      var tgt = document.elementFromPoint(e.clientX, e.clientY), cell = tgt && tgt.closest && tgt.closest('[data-pday]');
      if (d.from) delete p.days[d.from];        // 從某一天拖出來：原本那天拿掉（拖到月曆外 = 刪掉）
      if (cell) p.days[cell.dataset.pday] = d.act;
      el.dataset.justDragged = 1; setTimeout(function () { delete el.dataset.justDragged; }, 50);
      render();
    });
    el.addEventListener('click', function (e) {
      if (el.dataset.justDragged) return;
      var b;
      if ((b = e.target.closest('[data-blk]'))) { sel = sel === b.dataset.blk ? null : b.dataset.blk; render(); return; }
      if ((b = e.target.closest('[data-pday]'))) {
        var key = b.dataset.pday;
        if (sel) setDay(key, sel); else if (p.days[key]) setDay(key, null);   // 選了方塊 → 放上去；沒選 → 點有方塊的日子拿掉
        return;
      }
      if (e.target.closest('[data-clear]')) {
        for (var n = 1; n <= days; n++) if (dayIdx(n) >= day) delete p.days[md(n)];
        render(); return;
      }
      if (e.target.closest('[data-confirm]')) {
        p.months[ym(day)] = 1; store(PKEY, p);
        if (S()) S().setFlag('planned_' + ym(day));
        el.classList.remove('show');
        setTimeout(function () { el.remove(); done(); }, 250);
      }
    });
  }
  function tutorial(done) {
    var t = T(), w = document.createElement('div');
    w.className = 'ios-alert-wrap pl-tip';
    w.innerHTML = '<div class="ios-alert"><b>' + esc(t.tutorialTitle) + '</b><p>' + esc(t.tutorialText).replace(/\n/g, '<br>') + '</p>' +
      '<div class="ios-alert-btns one"><button type="button" data-alert-yes>' + esc(t.ok) + '</button></div></div>';
    document.getElementById('phone').appendChild(w);
    w.addEventListener('click', function (e) { if (e.target.closest('[data-alert-yes]')) { w.remove(); done(); } });
  }

  /* ---- 睡覺：往後跳到下一個有事的日子（沒事的日子照月曆加好感） ----
   * cb({ from, to })：from = 跳過的第一天，to = 停下來的那天 */
  // onLine(day, text, next)：有安排日程、沒有劇情的日子，用一句話告訴玩家今天和誰做了什麼
  function sleep(cb, onLine) {
    var day = G().day + 1, from = day;
    (function loop() {
      while (day <= G().totalDays()) {
        if (needPlan(day)) {
          var first = !S().hasFlag('plan_tutorial');
          var open = function () { planner(day, loop); };
          if (first) { S().setFlag('plan_tutorial'); tutorial(open); } else open();
          return;
        }
        if (isStop(day)) break;
        if (S()) S().setFlag('day_' + day);
        var act = !isWeekend(day) && plannedOn(day);
        if (act) {   // 有安排：加好感，顯示這天的一句話，點了才到下一天
          G().setDay(day);
          var met = doActivity(act), text = dayLine(day, act, met), d0 = day;
          day++;
          if (onLine) { onLine(d0, text, loop); return; }
          continue;
        }
        day++;   // 沒安排（回家）：直接跳過
      }
      day = Math.min(day, G().totalDays());
      G().goTo(day);
      cb && cb({ from: from, to: day });
    })();
  }

  // 行事曆小工具用：某一天要顯示的事件（節日、生日、送禮日、特殊事件名稱、當天的安排）
  function eventsOn(day) {
    var t = T(), out = [];
    holidaysOn(day).forEach(function (h) { out.push({ title: h.title, color: h.color || '#ff3b30', mark: true }); });
    birthdaysOn(day).forEach(function (b) { out.push({ title: b.me ? t.myBirthday : t.birthday.replace('{name}', b.name), color: '#ff9500', mark: true }); });
    if (isGiftDay(day)) out.push({ title: t.giftDay, color: '#ff2d55', mark: true });
    (C().specials || []).forEach(function (e) { if (e.date && e.title && G().dayOf(e.date) === day && ok(e.if)) out.push({ title: e.title, color: e.color || '#ff9500', mark: true }); });
    var f = forcedOn(day), a = f ? f.activity : (!isWeekend(day) && plannedOn(day));
    if (a) out.push({ title: actOf(a).label, color: '#5856d6' });
    return out;
  }

  /* ---- 一天一天的流程 ----
   * go()：畫面變暗 → 往後跳到下一個有事的日子 →
   *   每一天都在黑底日期畫面上直接開始（不用解鎖）
   *   星期日（能用手機的日子）：劇情、跟成員出去玩都結束 → 鎖定畫面，解鎖後自由使用手機
   *   其他日子：晚上自動再往後跳 */
  var going = false;
  function fadeEl() {
    var f = document.createElement('div');
    f.className = 'day-fade';
    document.getElementById('phone').appendChild(f);
    void f.offsetWidth; f.classList.add('show');
    return f;
  }
  function dateHTML(day) { var d = dateOf(day); return '<div><b>' + (d.getMonth() + 1) + '月' + d.getDate() + '日</b><span>' + esc(G().weekday(d)) + '</span></div>'; }
  // 不能用手機的日子：蓋在主畫面上的黑底日期畫面（劇情在它上面播）
  function stage(day) {
    var el = document.getElementById('day-stage');
    if (day == null) { if (el) el.remove(); if (S()) S().setDarkStatus(false); return; }
    if (!el) { el = document.createElement('div'); el.id = 'day-stage'; el.className = 'day-stage'; document.getElementById('phone').appendChild(el); }
    el.innerHTML = dateHTML(day);
    if (S()) S().setDarkStatus(true);
  }
  function startDay() {
    var day = G().day;
    if (location.hash !== '#/home') location.hash = '#/home';
    // 喚醒結局之後（只能探索 App）：直接鎖定畫面
    if (G().ended === 'explore') { stage(null); if (S() && S().lock) S().lock(); }
    // 其他日子（包括星期日）：黑底日期畫面上先跑完今天的劇情；能用手機的日子到晚上才出現鎖定畫面（onNight）
    else {
      var lk = document.getElementById('lock');   // 頁面上原本放鎖定畫面的空位：不用鎖的日子拿掉
      if (lk) lk.remove();
      document.getElementById('phone').classList.remove('locked');
      stage(day); G().start();
    }
  }
  function go() {
    if (going) return;
    going = true;
    var f = fadeEl();
    setTimeout(function () {
      sleep(function () {
        if (!f.parentNode) f = fadeEl();   // 中間播過一句話：重新變暗
        f.innerHTML = dateHTML(G().day);
        f.classList.add('text');
        startDayAfter(f);
      }, function (day, text, next) {
        // 一天一句：黑底日期畫面上用對話框顯示
        if (f.parentNode) { f.classList.remove('show'); var old = f; setTimeout(function () { old.remove(); }, 600); }
        var lk = document.getElementById('lock'); if (lk) lk.remove();
        document.getElementById('phone').classList.remove('locked');
        stage(day);
        narrate(text, next);
      });
    }, 600);
  }
  function startDayAfter(f) {
    setTimeout(function () {
      going = false;
      startDay();
      f.classList.remove('show');
      setTimeout(function () { f.remove(); }, 700);
    }, 1500);
  }
  /* ---- 遊戲開頭：鬧鐘響起（data.js 的 game.alarm）----
   * 新遊戲（第 1 天早上、還沒響過）才會出現：
   *   往右滑「滑動來停止」→ 鎖定畫面（時間顯示鬧鐘的時間）→ 解鎖後開始第 1 天
   *   「稍後提醒」→ 畫面暗掉，過幾秒再響一次（時間 +9 分鐘） */
  function boot() {
    var fresh = G().day === 1 && G().phase === 'morning' && S();
    if (fresh && !S().hasFlag('alarm_done')) {   // 新遊戲：名字、生日、照片、是否開始 → 鬧鐘
      if (window.INTRO) window.INTRO.setup(alarm); else alarm();
    } else if (fresh && window.INTRO && !S().hasFlag('intro_done')) {   // 開場還沒結束就重新整理：回到鎖定畫面
      if (S().lock) S().lock({ time: ((D().game || {}).alarm || {}).time, onUnlock: window.INTRO.afterUnlock });
    } else startDay();
  }
  function alarm() {
    var a = (D().game || {}).alarm || {}, base = a.time || '7:00', snoozes = 0;
    var lk = document.getElementById('lock'); if (lk) lk.remove();
    var el = document.createElement('div');
    el.className = 'alarm';
    document.getElementById('phone').appendChild(el);
    document.getElementById('phone').classList.add('locked', 'alarming');
    function timeNow() { var m = /(\d+):(\d+)/.exec(base), t = +m[1] * 60 + +m[2] + snoozes * 9; return Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2); }
    function render() {
      el.innerHTML =
        '<div class="alarm-top"><svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8" fill="currentColor"/><path d="M12 9v4.2l2.6 1.6" stroke="#000" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M4.5 6.5 7.5 3.8M19.5 6.5l-3-2.7M7 20l-1.4 1.6M17 20l1.4 1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span>' + esc(a.label || '鬧鐘') + '</span></div>' +
        '<div class="alarm-time">' + esc(timeNow()) + '</div>' +
        '<button type="button" class="alarm-snooze" data-snooze>' + esc(a.snooze || '稍後提醒') + '</button>' +
        '<div class="alarm-slide" id="alarm-slide"><span class="alarm-knob" id="alarm-knob"><i></i></span><b>' + esc(a.stop || '滑動來停止') + '</b></div>';
      bindSlide();
    }
    function stop() {
      S().setFlag('alarm_done');
      el.classList.add('off');
      setTimeout(function () { el.remove(); }, 400);
      document.getElementById('phone').classList.remove('alarming');
      // 鎖定畫面的時間 = 鬧鐘的時間；解鎖後先播開場（js/intro.js），再開始第 1 天
      if (S().lock) S().lock({ time: timeNow(), onUnlock: window.INTRO ? window.INTRO.afterUnlock : null });
    }
    function bindSlide() {
      var track = el.querySelector('#alarm-slide'), knob = el.querySelector('#alarm-knob'), x0 = null, dx = 0;
      function max() { return track.clientWidth - knob.offsetWidth - 8; }
      knob.addEventListener('pointerdown', function (e) { x0 = e.clientX; dx = 0; knob.setPointerCapture(e.pointerId); knob.style.transition = 'none'; e.preventDefault(); });
      knob.addEventListener('pointermove', function (e) {
        if (x0 === null) return;
        dx = Math.max(0, Math.min(max(), e.clientX - x0));
        knob.style.transform = 'translateX(' + dx + 'px)';
        track.querySelector('b').style.opacity = 1 - dx / max();
      });
      function end() {
        if (x0 === null) return;
        x0 = null; knob.style.transition = '';
        if (dx > max() * .7) { knob.style.transform = 'translateX(' + max() + 'px)'; setTimeout(stop, 150); }   // 滑到底 → 停止
        else { knob.style.transform = ''; track.querySelector('b').style.opacity = ''; }
      }
      knob.addEventListener('pointerup', end);
      knob.addEventListener('pointercancel', end);
    }
    el.addEventListener('click', function (e) {
      if (!e.target.closest('[data-snooze]')) return;
      snoozes++;
      el.classList.add('sleeping');   // 稍後提醒：暗掉，過一下再響
      setTimeout(function () { render(); el.classList.remove('sleeping'); }, a.snoozeMs || 4000);
    });
    render();
  }

  // 晚上：不能用手機的日子 → 直接往後跳
  if (window.GAME) G().onNight(function () {
    // 能用手機的日子（星期日、最後一天、結局後）：劇情、出去玩都結束 → 鎖定畫面，解鎖後自由使用手機
    if (phoneDay(G().day)) { stage(null); if (S() && S().lock) S().lock({ onUnlock: function () {} }); return; }
    setTimeout(go, 400);
  });

  window.PLAN = {
    sleep: sleep, go: go, eventsOn: eventsOn, isStop: isStop, planned: plannedOn, phoneDay: function (d) { return phoneDay(d || G().day); },
    // 打開網頁時：新遊戲 → 先響鬧鐘；能用手機的日子 → 鎖定畫面；不能 → 直接開始這一天
    boot: boot,
    membersOf: membersOf, effectsOf: function (act) { var ids = membersOf(act); return shareEffects(ids, C().affTotal != null ? C().affTotal : 6, C().pairTotal != null ? C().pairTotal : 15); },
    openPlanner: function (done) { planner(G().day, done || function () {}); }
  };
})();
