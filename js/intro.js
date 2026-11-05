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
      photoTitle: '上傳你的照片', photoHint: '用作 App 的頭貼；不選則為預設頭貼。', pick: '選擇照片', remove: '移除', next: '下一步', change: '換一張',
      startTitle: '準備好了嗎？', startHint: '開始之後，就回不去了。', back: '上一步', start: '開始遊戲'
    };
    Object.keys(t).forEach(function (k) { d[k] = t[k]; });
    return d;
  }
  var DEFAULT_AVATAR = 'images/default_avatar.png';

  /* ---- 玩家自己的帳號：名字＝輸入的名字、頭貼＝上傳的照片（沒上傳就用預設頭貼）
   *      用在 KakaoTalk、X 自己的帳號、IG 登入中的帳號 ---- */
  function applyAvatar() {
    var pl = player(), a = pl.avatar || DEFAULT_AVATAR, n = pl.name || '', d = D();
    if (d.kakao && d.kakao.me) d.kakao.me.avatar = a;
    if (d.x) (d.x.accounts || []).forEach(function (acc) { if (acc.handle === d.x.me) { acc.avatar = a; acc.name = n || acc.name || '我'; } });
    if (d.instagram) {
      var ig = d.instagram, def = ig.defaultAccount;
      var acc = def === ig.username ? ig : (ig.otherAccounts || []).filter(function (x) { return x.username === def; })[0];
      if (acc) { acc.avatar = a; if (n) acc.name = n; }
    }
  }
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
    var w = card('<b>' + esc(t.photoTitle) + '</b><p>' + esc(t.photoHint) + '</p>' +
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
      window.STORY.play('intro_wake', function () { exploring = true; S().setFlag('intro_explore'); });
    }, 500);
  }
  function endExplore() {
    exploring = false;
    // 開場最後一段：播完 → 回到主畫面、開始 9/1
    setTimeout(function () {
      window.STORY.play('intro_end', function () {
        S().setFlag('intro_done');
        if (location.hash !== '#/home') location.hash = '#/home';
        var n = nextFn; nextFn = null;
        setTimeout(function () { n && n(); }, 300);
      });
    }, 500);
  }
  // 打開 IG、相簿、KakaoTalk → 探索結束（data.js 的 intro.endApps 可以改）
  window.addEventListener('hashchange', function () {
    if (!exploring) return;
    var apps = (D().intro || {}).endApps || ['ig', 'photos', 'kakao'];
    var app = location.hash.replace(/^#\/?/, '').split('/')[0];
    if (apps.indexOf(app) >= 0) endExplore();
  });
  // 行事曆：點到成員生日那天
  function onCalendar(date) {
    if (!exploring || (window.STORY.playing && document.querySelector('.vn'))) return;
    var md = ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
    var hit = (D().cast || []).some(function (c) { var m = /(\d+)\D+(\d+)/.exec(c.birthday || ''); return m && ('0' + m[1]).slice(-2) + '-' + ('0' + m[2]).slice(-2) === md; });
    if (hit) window.STORY.play('intro_bday');
  }

  window.INTRO = {
    setup: setup, afterUnlock: afterUnlock, onCalendar: onCalendar, applyAvatar: applyAvatar,
    exploring: function () { return exploring; },
    // 鎖定畫面密碼：玩家生日（月月日日）
    passcode: function () { var b = player().birthday || ''; return b ? b.replace('-', '') : ''; }
  };
})();
