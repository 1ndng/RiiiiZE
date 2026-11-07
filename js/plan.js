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
      giftTitle: '{m}月14日', giftHint: '要送禮物嗎？', giftMe: '要', giftAsk: '請別人送', giftNo: '不要',
      giftPickOne: '要送給誰？', giftPickGiver: '請誰送禮物？', giftPickTo: '要送給誰？', giftOk: '確定', back: '返回', next: '下一步', giftFrom: '送禮的人：{a}',
      giftMeText: '你把禮物送給了{a}。', giftAskText: '你請{a}送禮物給{b}。', birthday: '{name}生日', myBirthday: '我的生日', giftDay: '送禮日',
      skipped: '{from} ～ {to}',
      dayLine: '{date}\n放學後去了{act}，遇到了{who}。',
      weekTitle: '這週的放學後', weekGo: '繼續', weekNobody: '沒遇到人', home: '回家', weekMet: '這幾天見到了{who}。', weekAff: '好感', weekPair: '關係', weekNoGain: '這幾天沒有遇到人。'
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
  /* ---- 日程劇情 ----
   * 固定：第幾次去某個日程（plan.activities 的 milestones；回家 = plan.homeMilestones）→ scenes.act_日程_次數，那天停下來播
   * 隨機：plan.random（遇到那個人／那兩個人時 chance 機率觸發，可重複）→ scenes.rand_日程_編號 */
  function bgOf(act) { return act === 'home' ? C().homeBg : actOf(act).bg; }
  function milestoneOf(act, n) {
    var list = act === 'home' ? (C().homeMilestones || []) : (actOf(act).milestones || []), id = 'act_' + act + '_' + n;
    return list.indexOf(n) >= 0 && scene(id) ? id : null;
  }
  function idsOf(key) {   // "14" → ["m1", "m4"]（cast 的 no）
    return String(key).split('').map(function (d) { var c = cast().filter(function (x) { return String(x.no) === d; })[0]; return c ? c.id : null; });
  }
  function randomFor(act, met) {
    var r = C().random || {}, chance = r.chance != null ? r.chance : 0.3;
    var list = (r[act] || []).filter(function (k) {
      return scene('rand_' + act + '_' + k) && (k === 'me' || idsOf(k).every(function (id) { return id && met.indexOf(id) >= 0; }));
    });
    // 每一項各自擲一次，符合的都播（照名單順序）
    return list.filter(function () { return Math.random() < chance; }).map(function (k) { return 'rand_' + act + '_' + k; });
  }
  // 回家（平日沒安排）：開學週（planFrom 之前）不算
  function homeDay(day) { return !isWeekend(day) && !forcedOn(day) && !plannedOn(day) && day >= G().dayOf(C().planFrom || '09-08'); }

  /* ---- 友誼線、愛情線（data.js 的 plan.bond；劇情在 js/story/bond.js）----
   *   好感到 friend → fr_成員（友誼線，可以好幾條）
   *   好感到 love1 → love_成員_1（心動）；到 love2 → love_成員_2（曖昧）；到 confess → 告白（讓玩家從到門檻的人裡選一位）
   *   一輪只能有一位戀人：告白之後，其他人的愛情線就停在原地；友誼線照常
   *   一天最多一段；from～until 之間才會觸發（開學週、最後一週不會） */
  function B() { return C().bond || null; }
  function aff(id) { return G().stat('aff', id); }
  function hasLover() { return cast().some(function (c) { return S() && S().hasFlag('confess_' + c.id); }); }
  function bondFor(day) {
    var b = B();
    if (!b || !S()) return null;
    if (day < G().dayOf(b.from || '09-08') || day > G().dayOf(b.until || '08-23')) return null;
    var byAff = cast().map(function (c) { return c.id; }).sort(function (x, y) { return aff(y) - aff(x); });
    var lover = hasLover();
    if (!lover) {
      var can = byAff.filter(function (id) { return aff(id) >= b.confess && seen('love_' + id + '_2'); });
      if (can.length && !S().hasFlag('confess_wait_' + ym(day))) return { kind: 'confess', ids: can };
      var l2 = byAff.filter(function (id) { return aff(id) >= b.love2 && seen('love_' + id + '_1') && !seen('love_' + id + '_2') && scene('love_' + id + '_2'); })[0];
      if (l2) return { kind: 'scene', id: 'love_' + l2 + '_2' };
      var l1 = byAff.filter(function (id) { return aff(id) >= b.love1 && !seen('love_' + id + '_1') && scene('love_' + id + '_1'); })[0];
      if (l1) return { kind: 'scene', id: 'love_' + l1 + '_1' };
    }
    var fr = byAff.filter(function (id) { return aff(id) >= b.friend && !seen('fr_' + id) && scene('fr_' + id); })[0];
    if (fr) return { kind: 'scene', id: 'fr_' + fr };
    return null;
  }
  // 告白：先播 confess_intro，再選一位（或「還不是時候」= 這個月不再問）
  function confess(ids, done) {
    var t = T();
    playIf('confess_intro', function () {
      chooser({ title: t.confessTitle || '你想告白的人是——', hint: t.confessHint || '一輪只能選一位', max: 1, min: 1,
        exclude: cast().map(function (c) { return c.id; }).filter(function (id) { return ids.indexOf(id) < 0; }),
        goLabel: t.confessGo || '告白', altLabel: t.confessWait || '還不是時候',
        onAlt: function () { S().setFlag('confess_wait_' + ym(G().day)); playIf('confess_wait', done); },
        onGo: function (pick) { S().setFlag('confess_' + pick[0]); playIf('confess_' + pick[0], done); } });
    });
  }

  // 有事的日子 = 要停下來（可以使用手機）
  function isStop(day) {
    if (storyOn(day).length || holidaysOn(day).length || birthdaysOn(day).length || isGiftDay(day)) return true;
    if (bondFor(day)) return true;   // 友誼線、愛情線的劇情
    if (dateOf(day).getDay() === 0) return true;   // 星期日：夜間自由使用手機
    if (day >= G().totalDays()) return true;
    if (!isWeekend(day) && !forcedOn(day)) {   // 這次去剛好是第幾次的固定劇情
      var a = plannedOn(day) || (homeDay(day) ? 'home' : null);
      if (a && milestoneOf(a, G().stat('visits', a) + 1)) return true;
    }
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
  // bg = 這句話的背景（日程、回家…）；沒給就用 plan.narrateBg → storyBg
  function narrate(text, done, bg) {
    D().scenes = D().scenes || {};
    D().scenes.__narrate = [{ bg: bg || C().narrateBg || D().storyBg || (D().home || {}).wallpaper || '' }, { text: text }];
    window.STORY.play('__narrate', done);
  }
  function playIf(id, done, bg) { if (id && scene(id)) window.STORY.play(id, done, null, bg); else done(); }
  function series(fns, done) { var i = 0; (function next() { if (i >= fns.length) { done(); return; } fns[i++](next); })(); }

  /* ---- 選人的畫面（星期日、送禮）---- */
  function chooser(opt, done) {
    var t = T(), el = document.createElement('div'), picked = [];
    el.className = 'sch';
    function render() {
      el.innerHTML = '<div class="sch-in"><small>' + esc(G().dateText(null, true)) + '</small><b>' + esc(opt.title) + '</b>' +
        (opt.hint ? '<p>' + esc(opt.hint) + '</p>' : '') +
        (opt.buttons ? '<div class="sch-col">' + opt.buttons.map(function (b, i) { return '<button type="button" data-btn="' + i + '">' + esc(b.label) + '</button>'; }).join('') + '</div>'
          : '<div class="sch-cast">' + cast().filter(function (c) { return (opt.exclude || []).indexOf(c.id) < 0; }).map(function (c) {
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
    playIf(w.intro, function () {   // 星期日早上：背景 = plan.homeBg
      chooser({ title: t.weekendTitle, hint: t.weekendHint, max: 2, min: 1, goLabel: t.go, altLabel: t.stayHome,
        onAlt: function () {
          if (S()) S().setFlag('weekend_home');
          var hs = (w.home || []).filter(function (e) { return ok(e.if) && (e.repeat || !seen(e.scene)) && scene(e.scene); })[0];
          // 待在家：背景 = plan.homeBg
          if (hs) window.STORY.play(hs.scene, done, null, C().homeBg); else narrate(t.stayHomeText, done, C().homeBg);
        },
        onGo: function (ids) {
          // 見一位：好感 +single；見兩位：各自好感 +pairAff、兩人關係 +pairBond
          var fx = { aff: {}, pair: {} };
          if (ids.length === 1) fx.aff[ids[0]] = w.single != null ? w.single : 6;
          else { ids.forEach(function (id) { fx.aff[id] = w.pairAff != null ? w.pairAff : 3; }); fx.pair[ids[0] + '-' + ids[1]] = w.pairBond != null ? w.pairBond : 15; }
          G().apply(fx);
          // 同一個人／同一組：寫了 chance 的是特殊劇情（照機率觸發），沒寫的是固定劇情
          var cands = (w.scenes || []).filter(function (e) {
            var a = [].concat(e.with || []).slice().sort().join(), b = ids.slice().sort().join();
            return a === b && ok(e.if) && (e.repeat || !seen(e.scene)) && scene(e.scene);
          });
          var sc = cands.filter(function (e) { return e.chance != null && Math.random() < e.chance; })[0] ||
            cands.filter(function (e) { return e.chance == null; })[0];
          // 出去玩：背景 = weekend.bg
          if (sc) window.STORY.play(sc.scene, done, null, w.bg);
          else narrate((ids.length === 1 ? t.single : t.pair).replace('{a}', nameOf(ids[0])).replace('{b}', nameOf(ids[1] || '')), done, w.bg);
        }
      });
    }, C().homeBg);
  }

  /* 送禮的劇情（js/story/gift.js）：names = 依序找的劇情 id，第一個有寫的就播；都沒寫 → fallback（一句旁白）
   *   劇情裡 who: "{b}" = 收禮的人、文字裡 {a} = 送禮的人、{b} = 收禮的人的名字 */
  function giftScene(names, a, b, fallback, done) {
    var id = names.filter(function (n) { return n && scene(n); })[0];
    if (!id) { fallback(); return; }
    var short = function (x) { var c = cast().filter(function (y) { return y.id === x; })[0]; return c ? (c.short || c.name) : x; };
    D().scenes.__gift = scene(id).map(function (st) {
      var o = {}; Object.keys(st).forEach(function (k) { o[k] = st[k]; });
      if (o.who === '{b}') o.who = b; else if (o.who === '{a}') o.who = a;
      if (typeof o.text === 'string') o.text = o.text.replace(/\{a\}/g, a ? short(a) : '').replace(/\{b\}/g, b ? short(b) : '');
      return o;
    });
    window.STORY.play('__gift', done, null, C().giftBg || C().narrateBg || D().storyBg);
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
            var again = S() && Object.keys((function () { try { return JSON.parse(localStorage.getItem('riiiize-flags')) || {}; } catch (e) { return {}; } })()).some(function (k) { return /^gift_\d\d-\d\d_/.test(k) && k.slice(-ids[0].length - 1) === '_' + ids[0]; });
            if (S()) S().setFlag('gift_' + G().md(G().day) + '_' + ids[0]);
            giftScene(['gift_' + ids[0] + '_' + m, again && 'gift_' + ids[0] + '_again', 'gift_' + ids[0]], null, ids[0],
              function () { narrate(t.giftMeText.replace('{a}', nameOf(ids[0])), done); }, done);
          } });
      } },
      // 請別人送：先選送禮的人，再選收禮的人（不能選同一個人）
      { label: t.giftAsk, run: function askGiver() {
        chooser({ title: t.giftPickGiver, max: 1, min: 1, goLabel: t.next || '下一步', altLabel: t.back,
          onAlt: function () { gift(done); },
          onGo: function (a) {
            chooser({ title: t.giftPickTo, hint: t.giftFrom.replace('{a}', nameOf(a[0])), max: 1, min: 1, exclude: a, goLabel: t.giftOk, altLabel: t.back,
              onAlt: askGiver,
              onGo: function (b) {
                var fx = { pair: {} }; fx.pair[a[0] + '-' + b[0]] = g.pair != null ? g.pair : 15; G().apply(fx);
                giftScene(['gift_by_' + a[0] + '_' + m, 'gift_by_' + a[0]], a[0], b[0],
                  function () { narrate(t.giftAskText.replace('{a}', nameOf(a[0])).replace('{b}', nameOf(b[0])), done); }, done);
              } });
          } });
      } },
      { label: t.giftNo, run: done }
    ] }, done);
  }

  /* 玩家生日許願（劇情步驟 { wish: { aff: 6, pair: 15 } }，js/story.js 呼叫）：
   *   和一個人更親近 → 那位好感 +aff；讓兩個人感情更好 → 那一對關係 +pair
   *   done({ kind: 'aff' | 'pair', ids }）；noFx = 回想，不加數值 */
  function wish(opt, done, noFx) {
    var t = T(), aff = opt.aff != null ? opt.aff : 6, pair = opt.pair != null ? opt.pair : 15;
    chooser({ title: t.wishTitle || '許一個願望', hint: t.wishHint || '蠟燭還亮著。', buttons: [
      { label: t.wishAff || '希望和一個人更親近', run: function () {
        chooser({ title: t.wishPickOne || '和誰？', max: 1, min: 1, goLabel: t.giftOk, altLabel: t.back,
          onAlt: function () { wish(opt, done, noFx); },
          onGo: function (ids) {
            if (!noFx) { var fx = { aff: {} }; fx.aff[ids[0]] = aff; G().apply(fx); if (S()) S().setFlag('wish_aff_' + ids[0]); }
            done({ kind: 'aff', ids: ids });
          } });
      } },
      { label: t.wishPair || '希望兩個人感情更好', run: function () {
        chooser({ title: t.wishPickTwo || '哪兩個人？', hint: t.wishPickTwoHint || '選兩位', max: 2, min: 2, goLabel: t.giftOk, altLabel: t.back,
          onAlt: function () { wish(opt, done, noFx); },
          onGo: function (ids) {
            var key = ids.slice().sort().join('-');
            if (!noFx) { var fx = { pair: {} }; fx.pair[key] = pair; G().apply(fx); if (S()) S().setFlag('wish_pair_' + key); }
            done({ kind: 'pair', ids: ids });
          } });
      } }
    ] }, function () {});
  }

  /* ---- 有事的日子的放學 ---- */
  if (window.GAME) {
    // 14 日：送禮最先（在早上的主線劇情之前；星期日也一樣）
    G().onPhase('morning', function (done) {
      var day = G().day, key = 'giftdone_' + day;
      if (!isGiftDay(day) || (S() && S().hasFlag(key))) { done(); return; }
      if (location.hash !== '#/home') location.hash = '#/home';
      setTimeout(function () { gift(function () { if (S()) S().setFlag(key); done(); }); }, 300);
    }, true);
    /* 放學的順序（星期一～六）：主線（含開學週強制日程，劇情在 js/story.js 先播）→ 節日 → 生日 → 日程 → 隨機劇情
     * 星期日：節日 → 生日 → 出去玩（14 日的送禮在早上最先） */
    G().onPhase('afterschool', function (done) {
      if (window.STORY && window.STORY.resumed('afterschool')) { done(); return; }   // 讀檔：放學的劇情剛剛已經接著播完
      var day = G().day, steps = [], sunday = dateOf(day).getDay() === 0;
      if (location.hash !== '#/home') location.hash = '#/home';
      var forced = forcedOn(day);
      var playOn = function (id, act) { steps.push(function (next) { window.STORY.play(id, next, null, bgOf(act)); }); };
      var playAll = function (ids, act) { ids.forEach(function (id) { playOn(id, act); }); };
      // 1. 開學週的強制日程：不加好感、不算次數
      if (forced && S()) S().setFlag('act_' + forced.activity);
      // 2. 節日、生日
      holidaysOn(day).forEach(function (h) { steps.push(function (next) { playIf(h.scene, next); }); });
      birthdaysOn(day).forEach(function (b) { steps.push(function (next) { playIf(b.scene, next); }); });
      // 3. 日程：特殊劇情 → 第幾次的固定劇情（沒有特殊、也沒有固定 = 一句話）；4. 隨機劇情（符合的都播）
      //    背景 = 那個日程的 bg；特殊劇情那天不加好感
      if (!forced && !isWeekend(day)) {
        var act = plannedOn(day), sp = specialFor(day, act);
        if (act) {
          var met;
          if (sp) {
            steps.push(function (next) { window.STORY.play(sp.scene, next, null, sp.bg || actOf(act).bg); });
            G().addStat('visits', act, 1); met = membersOf(act);
          } else met = doActivity(act);
          var ms = milestoneOf(act, G().stat('visits', act));
          if (ms) playOn(ms, act); else if (!sp) steps.push(function (next) { narrate(dayLine(day, act, met), next, actOf(act).bg); });
          playAll(randomFor(act, met), act);
        } else if (homeDay(day)) {
          G().addStat('visits', 'home', 1);
          var hm = milestoneOf('home', G().stat('visits', 'home')); if (hm) playOn(hm, 'home');
          playAll(randomFor('home', []), 'home');
        }
      }
      // 星期日：出去玩（送禮已經在早上最先做了）
      if (sunday && !forced && !(C().weekend || {}).off) steps.push(weekend);
      // 友誼線、愛情線：一天最多一段，在當天其他劇情之後（判斷放到那時候，才會算進今天加的好感）
      steps.push(function (next) {
        var bd = bondFor(G().day);
        if (!bd) { next(); return; }
        if (bd.kind === 'confess') confess(bd.ids, next); else playIf(bd.id, next);
      });
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
  // 跳過去的日子（有安排日程、沒有劇情）先收集起來，停下來之前用「這週的放學後」一次顯示（onWeek）
  //   之後想在每週回顧裡加隨機事件、小劇情，就在 go() 的 onWeek 這裡加
  function sleep(cb, onWeek) {
    var day = G().day + 1, from = day, week = [];
    function flush(next) { if (!week.length || !onWeek) { next(); return; } var w = week; week = []; onWeek(w, next); }
    (function loop() {
      while (day <= G().totalDays()) {
        if (needPlan(day)) {
          var first = !S().hasFlag('plan_tutorial');
          var open = function () { planner(day, loop); };
          flush(function () { if (first) { S().setFlag('plan_tutorial'); tutorial(open); } else open(); });
          return;
        }
        if (isStop(day)) break;
        if (S()) S().setFlag('day_' + day);
        var act = !isWeekend(day) && plannedOn(day);
        if (act) {   // 有安排：加好感，記進這週的回顧（可能觸發隨機劇情）
          G().setDay(day);
          var met = doActivity(act);
          week.push({ day: day, act: act, met: met, rnd: randomFor(act, met) });   // rnd = 這天的隨機劇情（可能好幾個）
        } else if (homeDay(day)) {   // 沒安排 = 回家
          G().setDay(day);
          G().addStat('visits', 'home', 1);
          week.push({ day: day, act: 'home', met: [], rnd: randomFor('home', []) });
        }
        day++;
      }
      day = Math.min(day, G().totalDays());
      flush(function () {
        G().goTo(day);
        cb && cb({ from: from, to: day });
      });
    })();
  }

  // 行事曆小工具用：某一天要顯示的事件（節日、生日、送禮日、特殊事件名稱、當天的安排）
  function eventsOn(day) {
    var t = T(), out = [];
    holidaysOn(day).forEach(function (h) { out.push({ title: h.title, color: h.color || '#ff3b30', mark: true }); });
    birthdaysOn(day).forEach(function (b) { out.push({ title: b.me ? t.myBirthday : t.birthday.replace('{name}', b.name), color: '#ff9500', mark: true }); });
    // 送禮日（14 日）不標在行事曆上
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
  // 黑底日期畫面：日期、星期；plan.dayLabels 有寫的日子多一行（例如 9/1「開學日」）
  function dateHTML(day) {
    var d = dateOf(day), key = ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2), label = (C().dayLabels || {})[key];
    return '<div><b>' + (d.getMonth() + 1) + '月' + d.getDate() + '日</b><span>' + esc(G().weekday(d)) + '</span>' + (label ? '<em class="day-label">' + esc(label) + '</em>' : '') + '</div>';
  }
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
    // 手機上的時間：9/1（第 1 天）開場後從 data.js 的 intro.dayTime 開始走；其他日子用現實時間
    if (G().phase !== 'night') G().setClock(day === 1 ? ((D().intro || {}).dayTime || null) : null);
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
  var chaining = false;
  function go() {
    if (going) return;
    // 每日聊天還沒聊完（包括兩段之間的空檔）：不能睡覺
    if (chaining || (window.SOSHO_KAKAO && window.SOSHO_KAKAO.dayChatting && window.SOSHO_KAKAO.dayChatting())) return;
    // 8/31 晚上睡覺 = 一年結束 → 時間循環，回到 9/1（例如讀了「循環前的存檔」之後）
    if (G().day >= G().totalDays() && !G().ended) { going = true; G().newLoop(); return; }
    going = true;
    var f = fadeEl();
    setTimeout(function () {
      sleep(function () {
        if (!f.parentNode) f = fadeEl();   // 中間播過一句話：重新變暗
        f.innerHTML = dateHTML(G().day);
        f.classList.add('text');
        startDayAfter(f);
      }, function (week, next) {
        // 這週的放學後：黑底日期畫面上一次列出這幾天去了哪裡、遇到誰
        if (f.parentNode) { f.classList.remove('show'); var old = f; setTimeout(function () { old.remove(); }, 600); }
        var lk = document.getElementById('lock'); if (lk) lk.remove();
        document.getElementById('phone').classList.remove('locked');
        stage(week[week.length - 1].day);
        weekCard(week, next);
      });
    }, 600);
  }
  // 「這週的放學後」卡片：每天一行（日期、日程、遇到誰的大頭照），點「繼續」往下
  function weekCard(week, next) {
    var t = T(), el = document.createElement('div'), d0 = dateOf(week[0].day), d1 = dateOf(week[week.length - 1].day);
    var md = function (d) { return (d.getMonth() + 1) + '月' + d.getDate() + '日'; };
    el.className = 'wk';
    el.innerHTML = '<div class="wk-in">' +
      '<small>' + esc(week.length > 1 ? md(d0) + '～' + md(d1) : md(d0)) + '</small>' +
      '<b>' + esc(t.weekTitle) + '</b>' +
      '<ul>' + week.map(function (w) {
        var d = dateOf(w.day), a = w.act === 'home' ? { label: t.home } : actOf(w.act);
        return '<li><span class="wk-d">' + (d.getMonth() + 1) + '/' + d.getDate() + '（' + esc(G().weekday(d).replace('星期', '')) + '）</span>' +
          '<span class="wk-a">' + esc(a.label) + '</span>' +
          '<span class="wk-m">' + (w.met.length ? w.met.map(function (id) {
            var c = cast().filter(function (x) { return x.id === id; })[0] || {};
            return '<i title="' + esc(c.name || id) + '"><img src="' + esc(c.avatar || 'images/default_avatar.png') + '" alt=""></i>';
          }).join('') : (w.act === 'home' ? '' : '<em>' + esc(t.weekNobody) + '</em>')) + '</span></li>';
      }).join('') + '</ul>' +
      gainsHTML(week) +
      '<button type="button" data-wk-go>' + esc(t.weekGo) + '</button>' +
    '</div>';
    document.getElementById('phone').appendChild(el);
    document.getElementById('phone').classList.add('story-full');   // 不顯示上面的狀態列
    void el.offsetWidth; el.classList.add('show');
    el.querySelector('[data-wk-go]').addEventListener('click', function () {
      document.getElementById('phone').classList.remove('story-full');
      el.classList.remove('show');
      // 這幾天觸發的隨機劇情：依序播完再往下
      var evs = [];
      week.forEach(function (w) { w.rnd.forEach(function (id) { evs.push(function (n) { window.STORY.play(id, n, null, bgOf(w.act)); }); }); });
      setTimeout(function () { el.remove(); series(evs, next); }, 250);
    });
  }
  // 這幾天每個人、每一對加了多少（照 doActivity 的算法：每次的總量平分給遇到的人）
  function gainsHTML(week) {
    var t = T(), aff = {}, pair = {};
    week.forEach(function (w) {
      if (!w.met.length) return;
      var fx = shareEffects(w.met, C().affTotal != null ? C().affTotal : 6, C().pairTotal != null ? C().pairTotal : 15);
      Object.keys(fx.aff).forEach(function (k) { aff[k] = (aff[k] || 0) + fx.aff[k]; });
      Object.keys(fx.pair).forEach(function (k) { pair[k] = (pair[k] || 0) + fx.pair[k]; });
    });
    var num = function (x) { return '+' + (Math.round(x * 10) / 10); };
    // 用成員的 emoji 表示（cast 的 emoji；沒寫就用名字）
    var short = function (id) { var c = cast().filter(function (x) { return x.id === id; })[0] || {}; return c.emoji || c.short || c.name || id; };
    var order = cast().map(function (c) { return c.id; });
    var a = order.filter(function (id) { return aff[id]; }).map(function (id) { return '<span>' + esc(short(id)) + ' <b>' + num(aff[id]) + '</b></span>'; });
    var pr = Object.keys(pair).sort(function (x, y) { return pair[y] - pair[x]; }).map(function (k) {
      var ab = k.split('-'); return '<span>' + esc(short(ab[0])) + esc(short(ab[1])) + ' <b>' + num(pair[k]) + '</b></span>';
    });
    if (!a.length) return '<p>' + esc(t.weekNoGain) + '</p>';
    return '<div class="wk-gain"><i>' + esc(t.weekAff) + '</i>' + a.join('') + '</div>' +
      (pr.length ? '<div class="wk-gain"><i>' + esc(t.weekPair) + '</i>' + pr.join('') + '</div>' : '');
  }
  function uniq(week) {
    var all = [].concat.apply([], week.map(function (w) { return w.met; }));
    return cast().map(function (c) { return c.id; }).filter(function (id) { return all.indexOf(id) >= 0; });
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
      if (S().stopBuzz) S().stopBuzz();
      S().setFlag('alarm_done');
      G().setClock(timeNow());   // 手機上的時間從鬧鐘的時間開始走
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
      if (S().stopBuzz) S().stopBuzz();
      el.classList.add('sleeping');   // 稍後提醒：暗掉，過一下再響
      setTimeout(function () { render(); el.classList.remove('sleeping'); if (S().buzzRepeat) S().buzzRepeat([500, 300, 500], 1600); }, a.snoozeMs || 4000);
    });
    render();
    if (S().buzzRepeat) S().buzzRepeat([500, 300, 500], 1600);   // 鬧鐘：一直震到停止
  }

  // 晚上：不能用手機的日子 → 直接往後跳
  if (window.GAME) G().onNight(function () {
    // 今天有每日聊天（data.js 的 kakao.dayChats）：主線劇情結束 → 打開手機、自動進入聊天室
    var K = window.SOSHO_KAKAO, chat = K && K.dayChatFor(G().md(G().day));
    if (chat) {
      var free = phoneDay(G().day);
      G().setClock((D().game || {}).nightTime || '22:00');
      stage(null);
      var lk = document.getElementById('lock'); if (lk) lk.remove();
      document.getElementById('phone').classList.remove('locked');
      // 同一天可以有好幾段（照 data.js 的順序）；最後一段聊完：能用手機的日子 → 直接自由使用手機（不用再解鎖）；其他日子 → 進入下一天
      var md = G().md(G().day);
      chaining = true;   // 一段接一段聊完之前不能睡覺（兩段之間的空檔也不行）
      (function run(c) {
        var last = (D().kakao.dayChats || []).filter(function (x) { return x.date === md; }).slice(-1)[0] === c;
        K.dayChat(c, function () {
          var next = K.dayChatFor(md);
          if (next) setTimeout(function () { run(next); }, 400);
          else { chaining = false; if (!free) setTimeout(go, 300); }
        }, free || !last);
      })(chat);
      return;
    }
    // 能用手機的日子（星期日、最後一天、結局後）：劇情、出去玩都結束 → 鎖定畫面，解鎖後自由使用手機
    if (phoneDay(G().day)) {
      G().setClock((D().game || {}).nightTime || '22:00');   // 手機上的時間從晚上 22:00 開始（data.js 的 game.nightTime）
      stage(null);
      // 星期日：開放自由探索手機前，先跳劇情框提醒（scenes.free_phone）
      var lockNow = function () { if (S() && S().lock) S().lock({ onUnlock: function () {} }); };
      var fpKey = 'freephone_' + G().day;   // 一天只提醒一次（重新整理不會再跳）
      if (dateOf(G().day).getDay() === 0 && scene('free_phone') && window.STORY && !(S() && S().hasFlag(fpKey))) {
        if (S()) S().setFlag(fpKey);
        window.STORY.play('free_phone', lockNow, null, 'phone-dim');
      }
      else lockNow();
      return;
    }
    setTimeout(go, 400);
  });

  window.PLAN = {
    sleep: sleep, go: go, wish: wish, bondFor: bondFor, eventsOn: eventsOn, isStop: isStop, planned: plannedOn, phoneDay: function (d) { return phoneDay(d || G().day); },
    // 打開網頁時：新遊戲 → 先響鬧鐘；能用手機的日子 → 鎖定畫面；不能 → 直接開始這一天
    boot: boot,
    membersOf: membersOf, effectsOf: function (act) { var ids = membersOf(act); return shareEffects(ids, C().affTotal != null ? C().affTotal : 6, C().pairTotal != null ? C().pairTotal : 15); },
    // 開場結束 → 畫面變黑、顯示今天的日期 → 開始這一天（js/intro.js）
    enterDay: function () {
      if (going) return;
      going = true;
      var f = fadeEl();
      setTimeout(function () { f.innerHTML = dateHTML(G().day); f.classList.add('text'); startDayAfter(f); }, 700);
    },
    openPlanner: function (done) { planner(G().day, done || function () {}); }
  };
})();
