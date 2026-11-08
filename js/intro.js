/* =========================================================
 * 第一次遊玩的開場
 *   1. 輸入名字 → 輸入生日 → 上傳照片（當 App 裡的頭貼；不選就用預設頭貼）→ 是否開始遊戲？
 *   2. 鬧鐘響起 → 滑掉 → 鎖定畫面（密碼 = 玩家生日，例如 10/14 → 1014）
 *   3. 解鎖後：主畫面上直接播 scenes.intro_wake（這時什麼都不能點）
 *   4. 自由探索手機：
 *        點行事曆上成員生日那天 → scenes.intro_bday
 *        打開 IG、相簿、KakaoTalk → scenes.intro_end → 開始 9/1 的主線劇情
 *   開場的劇情、文字都在 data.js（scenes.intro_*、intro）
 * ========================================================= */
(function () {
  'use strict';

  var PKEY = 'riiiize-player';
  function D() { return window.SITE_DATA || {}; }
  function S() { return window.SOSHO; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function player() { return load(PKEY, {}) || {}; }
  function T() {
    var t = (D().intro || {}).text || {}, d = {
      photoTitle: '上傳你的照片', photoHint: 'IG以及X的頭貼之後可以更改；\nkakao talk的頭貼無法更改。', pick: '選擇照片', remove: '移除', next: '下一步', change: '換一張',
      startTitle: '準備好遊玩了嗎？', startHint: '確定好資料後，即可進入遊戲。', back: '上一步', start: '開始遊戲'
    };
    Object.keys(t).forEach(function (k) { d[k] = t[k]; });
    return d;
  }
  var DEFAULT_AVATAR = 'images/default_avatar.png';

  /* ---- 玩家自己的帳號：名字＝輸入的名字、頭貼＝上傳的照片（沒上傳就用預設頭貼）
   *      用在 KakaoTalk、X 自己的帳號、IG 登入中的帳號 ---- */
  // IG、X 可以各自換頭貼（編輯個人檔案）：pl.igAvatar / pl.xAvatar，沒換就用一開始上傳的 pl.avatar
  function applyAvatar() {
    var pl = player(), a = pl.avatar || DEFAULT_AVATAR, n = pl.name || '', d = D();
    if (d.kakao && d.kakao.me) d.kakao.me.avatar = a;
    if (d.x) (d.x.accounts || []).forEach(function (acc) { if (acc.handle === d.x.me) { acc.avatar = pl.xAvatar || a; acc.name = n || acc.name || '我'; } });
    var acc = igMe();
    if (acc) { acc.avatar = pl.igAvatar || a; if (n) acc.name = n; }
  }
  function igMe() {
    var ig = D().instagram; if (!ig) return null;
    var def = ig.defaultAccount;
    return def === ig.username ? ig : (ig.otherAccounts || []).filter(function (x) { return x.username === def; })[0] || null;
  }

  /* ---- 玩家的 IG／X 帳號 id 可以改（編輯個人檔案）：pl.igId / pl.xId
   *      載入時把 data.js 裡原本的 id（briiii1ze._）全部換掉：帳號、追蹤名單、@提到 ---- */
  var BASE_ID = { ig: (D().instagram || {}).defaultAccount, x: (D().x || {}).me };
  function swapIn(o, from, to) {
    if (!o || typeof o !== 'object') return o;
    Object.keys(o).forEach(function (k) {
      var v = o[k];
      if (typeof v === 'string') { if (v === from) o[k] = to; else if (v.indexOf('@' + from) >= 0) o[k] = v.split('@' + from).join('@' + to); }
      else if (v && typeof v === 'object') swapIn(v, from, to);
      if (k === from) { o[to] = o[k]; delete o[k]; }
    });
    return o;
  }
  function applyIds() {
    var pl = player(), d = D();
    if (pl.igId && BASE_ID.ig && pl.igId !== BASE_ID.ig) Object.keys(d).forEach(function (k) { if (k !== 'x' && d[k] && typeof d[k] === 'object') swapIn(d[k], BASE_ID.ig, pl.igId); });
    if (pl.xId && BASE_ID.x && pl.xId !== BASE_ID.x && d.x) swapIn(d.x, BASE_ID.x, pl.xId);
  }
  function myId(app) { var pl = player(); return (app === 'ig' ? pl.igId : pl.xId) || BASE_ID[app]; }
  // 改 id：檢查格式和有沒有跟別人重複 → 把存起來的狀態（追蹤、留言、個人檔案…）裡的舊 id 換成新的 → 重新整理
  // 回傳錯誤訊息（空字串 = 成功）
  function setId(app, v) {
    v = String(v || '').trim().replace(/^@/, '');
    var old = myId(app);
    if (v === old) return '';
    if (!/^[A-Za-z0-9._]{1,30}$/.test(v)) return 'format';
    var d = D(), taken = app === 'ig'
      ? [d.instagram.username].concat((d.instagram.otherAccounts || []).map(function (a) { return a.username; }))
      : (d.x.accounts || []).map(function (a) { return a.handle; });
    if (taken.indexOf(v) >= 0) return 'taken';
    var keys = app === 'ig' ? ['riiiize-ig-accounts-v2', 'riiiize-ig-state'] : ['riiiize-x', 'riiiize-flags'];
    keys.forEach(function (k) {
      var raw = localStorage.getItem(k); if (!raw) return;
      raw = raw.split('"' + old + '"').join('"' + v + '"').split('@' + old).join('@' + v);
      if (app === 'x') raw = raw.split('x_private_' + old + '"').join('x_private_' + v + '"').split('x_public_' + old + '"').join('x_public_' + v + '"');
      try { localStorage.setItem(k, raw); } catch (e) {}
    });
    var pl = player(); pl[app === 'ig' ? 'igId' : 'xId'] = v; store(PKEY, pl);
    try { sessionStorage.setItem('riiiizeSkipTitle', '1'); } catch (e) {}
    location.reload();
    return '';
  }
  function setAppAvatar(app, url) {
    var pl = player(), k = app === 'ig' ? 'igAvatar' : 'xAvatar';
    if (url) pl[k] = url; else delete pl[k];
    store(PKEY, pl); applyAvatar();
  }
  applyIds();
  applyAvatar();

  // 縮成 256×256 的正方形（從中間裁），存成 JPEG（存在瀏覽器裡）
  function toAvatar(file, cb) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var n = 256, c = document.createElement('canvas'), s = Math.min(img.width, img.height);
        c.width = c.height = n;
        c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, n, n);
        cb(c.toDataURL('image/jpeg', .85));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }

  function card(html) {
    var w = document.createElement('div');
    w.className = 'vn-name';
    w.innerHTML = '<form autocomplete="off">' + html + '</form>';
    document.getElementById('phone').appendChild(w);
    return w;
  }
  function askPhoto(done) {
    var t = T(), chosen = player().avatar || '';
    var w = card('<b>' + esc(t.photoTitle) + '</b><p>' + esc(t.photoHint).replace(/\n/g, '<br>') + '</p>' +
      '<label class="ob-photo"><img id="ob-av" src="' + esc(chosen || DEFAULT_AVATAR) + '" alt=""><input type="file" accept="image/*" id="ob-file" hidden>' +
      '<span id="ob-pick">' + esc(chosen ? t.change : t.pick) + '</span></label>' +
      // 選了照片之後：「移除」回到預設頭貼
      '<button type="button" class="ob-remove" data-ob-remove' + (chosen ? '' : ' hidden') + '>' + esc(t.remove) + '</button>' +
      '<button type="submit">' + esc(t.next) + '</button>');
    w.querySelector('#ob-file').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      toAvatar(f, function (url) { chosen = url; paint(); });
    });
    function paint() {
      w.querySelector('#ob-av').src = chosen || DEFAULT_AVATAR;
      w.querySelector('#ob-pick').textContent = chosen ? t.change : t.pick;
      w.querySelector('[data-ob-remove]').hidden = !chosen;
    }
    w.querySelector('[data-ob-remove]').addEventListener('click', function () {
      chosen = ''; w.querySelector('#ob-file').value = ''; paint();
    });
    function finish(keep) {
      var pl = player();
      if (keep && chosen) pl.avatar = chosen; else delete pl.avatar;
      store(PKEY, pl); applyAvatar();
      w.remove(); done();
    }
    w.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); finish(true); });
  }
  function askStart(back, go) {
    var t = T(), pl = player(), b = /(\d+)-(\d+)/.exec(pl.birthday || '');
    var w = card('<b>' + esc(t.startTitle) + '</b>' +
      '<div class="ob-sum"><img src="' + esc(pl.avatar || DEFAULT_AVATAR) + '" alt=""><span><strong>' + esc(pl.name || '') + '</strong>' +
      (b ? '<small>' + (+b[1]) + '月' + (+b[2]) + '日</small>' : '') + '</span></div>' +
      '<p>' + esc(t.startHint) + '</p>' +
      '<div class="ob-btns"><button type="button" data-ob-back>' + esc(t.back) + '</button><button type="submit">' + esc(t.start) + '</button></div>');
    w.querySelector('[data-ob-back]').addEventListener('click', function () { w.remove(); back(); });
    w.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); w.remove(); go(); });
  }
  // 1. 名字 → 生日 → 照片 → 是否開始
  function setup(done) {
    function photoThenStart() { askPhoto(function () { askStart(photoThenStart, done); }); }
    var pl = player();
    // 時間循環的第二輪以後：名字、生日、頭貼都還在 → 直接響鬧鐘
    if (pl.name && pl.birthday && window.GAME && window.GAME.loop() > 1) { done(); return; }
    if (pl.name && pl.birthday) photoThenStart();
    else window.STORY.askName(photoThenStart);
  }

  /* ---- 解鎖之後的開場 ---- */
  var exploring = false, nextFn = null;
  function afterUnlock(next) {
    if (S().hasFlag('intro_done')) { next(); return; }
    nextFn = next;
    if (location.hash !== '#/home') location.hash = '#/home';
    setTimeout(function () {
      window.STORY.play('intro_wake', function () { exploring = true; S().setFlag('intro_explore'); watchSee(); });
    }, 500);
  }
  function endExplore() {
    exploring = false;
    // 開場最後一段：先停 2 秒（data.js 的 intro.endWait；這段時間點什麼都沒反應）→ 播完 → 變黑、顯示 9/1 → 開始 9/1
    var block = document.createElement('div');
    block.className = 'ob-block';
    document.getElementById('phone').appendChild(block);
    setTimeout(function () {
      block.remove();
      window.STORY.play('intro_end', function () {
        S().setFlag('intro_done');
        var n = nextFn; nextFn = null;
        // 畫面漸漸變黑 → 9/1 的日期 → 漸漸進入 9/1 主線（js/plan.js）
        if (window.PLAN && window.PLAN.enterDay) { window.PLAN.enterDay(); return; }
        if (location.hash !== '#/home') location.hash = '#/home';
        setTimeout(function () { n && n(); }, 300);
      });
    }, (D().intro || {}).endWait != null ? D().intro.endWait : 2000);
  }
  /* 探索中「看到成員的照片」超過 1 秒（data.js 的 intro.seeMs）→ 想起來，探索結束
   *   KakaoTalk：一打開就是（好友列表上有成員的大頭照）
   *   IG：點進成員的主頁或成員的貼文（只打開 IG 看到自己的主頁不算）
   *   X：點進成員的主頁
   *   相簿：相簿裡有寫 cast 的照片（例如 { image: "…", cast: "m4" }）才算 */
  var seeTimer = null;
  function memberIG(name) {
    var ig = D().instagram || {}, all = [ig].concat(ig.otherAccounts || [], ig.searchOnlyAccounts || []);
    return all.some(function (a) { return a.username === name && a.cast; });
  }
  function memberX(handle) { return ((D().x || {}).accounts || []).some(function (a) { return a.handle === handle && a.cast; }); }
  function seesMember() {
    var parts = location.hash.replace(/^#\/?/, '').split('/').map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } });
    if (parts[0] === 'kakao') return true;
    if (parts[0] === 'ig' && parts[1] === 'u') return memberIG(parts[2]);
    if (parts[0] === 'x' && parts[1] === 'u') return memberX(parts[2]);
    if (parts[0] === 'photos') return ((D().photos || {}).photos || []).some(function (ph) { return ph.cast && (!window.GAME || window.GAME.unlocked(ph)); });
    return false;
  }
  function watchSee() {
    clearTimeout(seeTimer);
    if (!exploring || !seesMember()) return;
    seeTimer = setTimeout(function () { if (exploring && seesMember()) endExplore(); }, (D().intro || {}).seeMs || 1000);
  }
  window.addEventListener('hashchange', watchSee);
  // 行事曆：點到成員生日那天
  function onCalendar(date) {
    if (!exploring || (window.STORY.playing && document.querySelector('.vn'))) return;
    var md = ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
    var hit = (D().cast || []).filter(function (c) { var m = /(\d+)\D+(\d+)/.exec(c.birthday || ''); return m && ('0' + m[1]).slice(-2) + '-' + ('0' + m[2]).slice(-2) === md; })[0];
    // 只跳出一次（點別的成員也不會再跳）；{member} = 點到的成員的名字
    var steps = (D().scenes || {}).intro_bday;
    if (!hit || !steps || S().hasFlag('intro_bday_seen')) return;
    S().setFlag('intro_bday_seen');
    D().scenes.__intro_bday = steps.map(function (st) {
      var o = {}; Object.keys(st).forEach(function (k) { o[k] = st[k]; });
      if (typeof o.text === 'string') o.text = o.text.replace(/\{member\}/g, hit.short || hit.name);
      return o;
    });
    window.STORY.play('__intro_bday');
  }

  window.INTRO = {
    setup: setup, afterUnlock: afterUnlock, onCalendar: onCalendar, applyAvatar: applyAvatar,
    toAvatar: toAvatar, setId: setId, myId: myId, setAppAvatar: setAppAvatar,
    exploring: function () { return exploring; },
    // 鎖定畫面密碼：玩家生日（月月日日）
    passcode: function () { var b = player().birthday || ''; return b ? b.replace('-', '') : ''; }
  };
})();
