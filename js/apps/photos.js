/* 相簿（iPhone 內建「照片」風格）
 *   #/photos                 圖庫（年／月／所有照片）
 *   #/photos/albums          相簿列表
 *   #/photos/album/相簿id     某個相簿（fav = 喜好項目、videos = 影片、hidden = 已隱藏、deleted = 最近刪除、all = 最近項目）
 *   #/photos/view/相簿id/編號 看照片（左右滑動換張）
 * 玩家按的「收藏」「刪除」存在瀏覽器（riiiize-photos），重新開始會清掉 */
(function () {
  'use strict';

  var KEY = 'riiiize-photos';
  var ICON = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 4l-8 8 8 8" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20.5s-8-4.9-8-11A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8 2.9c0 6.1-8 11-8 11z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>',
    heartFill: '<svg viewBox="0 0 24 24"><path d="M12 20.5s-8-4.9-8-11A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8 2.9c0 6.1-8 11-8 11z" fill="currentColor"/></svg>',
    share: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10.5H6.5A1.5 1.5 0 0 0 5 12v7.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5H16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M12 11v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="7.8" r="1.1" fill="currentColor"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 6.5h16M9.5 6.5V4.5h5v2M6.5 6.5l1 13.5h9l1-13.5M10 10v7M14 10v7" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2.5" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
    video: '<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="13" height="12" rx="2.5" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M15.5 10.5 21 7.5v9l-5.5-3z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M4 20 20 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    chevron: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    // 下方分頁列
    tabLibrary: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="15" height="14" rx="2.5" fill="currentColor"/><path d="M6.5 3.5h11A3 3 0 0 1 20.5 6.5v10" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
    tabAlbums: '<svg viewBox="0 0 24 24"><rect x="3" y="8" width="14" height="13" rx="2.5" fill="currentColor"/><path d="M6.5 5h11A2.5 2.5 0 0 1 20 7.5V17" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
    del: '<svg viewBox="0 0 32 22"><path d="M10 1.5h19a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H10L1.5 11z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/><path d="M15.5 7l7 8M22.5 7l-7 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
  };

  function S() { return window.SOSHO; }
  function P() { return S().data.photos || { photos: [], albums: [] }; }
  function esc(s) { return S().esc(s); }
  var T_DEFAULT = {
    libraryTitle: '圖庫', albumsTitle: '相簿',
    years: '年', months: '月', allPhotos: '所有照片', edit: '編輯',
    myAlbums: '我的相簿', mediaTypes: '媒體類型', utilities: '其他',
    recents: '最近項目', favorites: '喜好項目', videos: '影片', hidden: '已隱藏', deleted: '最近刪除',
    photosUnit: '張照片', videosUnit: '部影片', empty: '沒有照片或影片',
    deleteConfirm: '刪除照片', deleteNote: '此照片將從所有裝置中刪除，並會保留在「最近刪除」中 30 天。',
    deleteForever: '永久刪除', recover: '復原', cancel: '取消',
    daysLeft: '{n} 天', deletedNote: '照片和影片會在刪除前顯示剩餘天數。之後將永久刪除。',
    hiddenLocked: '「已隱藏」相簿已鎖定', hiddenHint: '輸入密碼來檢視', passcodeTitle: '輸入密碼',
    infoTitle: '資訊', noPlace: '加入位置⋯', caption: '加入說明'
  };
  function T() {
    var t = P().text || {}, out = {};
    Object.keys(T_DEFAULT).forEach(function (k) { out[k] = t[k] != null ? t[k] : T_DEFAULT[k]; });
    return out;
  }

  /* ---- 狀態：fav（收藏，玩家按過的蓋過 data.js）、deleted（最近刪除）、gone（永久刪除）、hiddenOpen（已解鎖「已隱藏」） ---- */
  function state() {
    var st = S().load(KEY, null) || {};
    st.fav = st.fav || {}; st.deleted = st.deleted || {}; st.gone = st.gone || {};
    return st;
  }
  function save(st) { S().save(KEY, st); }

  function list() { return P().photos || []; }
  function isVideo(p) { return /\.(mp4|mov|webm)$/i.test(p.image || ''); }
  function poster(src) {
    var p = String(src || '').replace(/\.\w+$/, '') + '_poster.jpg';
    return (window.SITE_MEDIA || []).indexOf(p) >= 0 ? p : '';
  }
  function isFav(i) { var st = state(); return i in st.fav ? !!st.fav[i] : !!list()[i].favorite; }
  // data.js 寫 deleted: true = 一開始就在「最近刪除」（剩幾天照 deletedDays，不寫 = 12 天）
  function isDeleted(i) { var st = state(); return (i in st.deleted ? !!st.deleted[i] : !!list()[i].deleted) && !st.gone[i]; }
  function isGone(i) { return !!state().gone[i]; }
  // 一般看得到的照片：沒刪除、沒隱藏
  // 照片什麼時候出現：from: "09-15"（那天起）或 if（條件）；js/game.js 的 GAME.unlocked
  function unlocked(i) { return !window.GAME || window.GAME.unlocked(list()[i]); }
  function visible(i) { return unlocked(i) && !isDeleted(i) && !isGone(i) && !list()[i].hidden; }

  // 日期「2026年1月1日」→ [年, 月, 日]
  function ymd(p) {
    var m = /(\d{4})\s*年\s*(\d+)\s*月\s*(\d+)/.exec(p.date || '');
    return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
  }

  // 相簿 id → { title, items: [照片編號] }
  function albumOf(id) {
    var t = T(), all = list().map(function (_, i) { return i; });
    if (id === 'all') return { title: t.recents, items: all.filter(visible) };
    if (id === 'fav') return { title: t.favorites, items: all.filter(function (i) { return visible(i) && isFav(i); }) };
    if (id === 'videos') return { title: t.videos, items: all.filter(function (i) { return visible(i) && isVideo(list()[i]); }) };
    if (id === 'hidden') return { title: t.hidden, items: all.filter(function (i) { return unlocked(i) && list()[i].hidden && !isDeleted(i) && !isGone(i); }) };
    if (id === 'deleted') return { title: t.deleted, items: all.filter(function (i) { return unlocked(i) && isDeleted(i); }) };
    var a = (P().albums || []).filter(function (x) { return String(x.id) === String(id); })[0];
    if (!a) return null;
    return { title: a.name, items: (a.photos || []).filter(function (i) { return list()[i] && visible(i); }) };
  }

  function thumb(i, ctx, extra) {
    var p = list()[i], v = isVideo(p);
    return '<a class="pt-cell" href="#/photos/view/' + ctx + '/' + i + '">' +
      (v ? '<video src="' + esc(p.image) + '"' + (poster(p.image) ? ' poster="' + esc(poster(p.image)) + '"' : '') + ' muted playsinline preload="metadata"></video>'
         : '<img src="' + esc(p.image) + '" alt="" loading="lazy">') +
      (v ? '<span class="pt-dur">' + esc(p.duration || '') + '</span>' : '') +
      (isFav(i) && ctx !== 'deleted' ? '<span class="pt-fav">' + ICON.heartFill + '</span>' : '') +
      (extra || '') +
    '</a>';
  }
  function countLine(items) {
    var t = T(), v = items.filter(function (i) { return isVideo(list()[i]); }).length, ph = items.length - v;
    if (!items.length) return t.empty;
    return [ph ? ph + ' ' + t.photosUnit : '', v ? v + ' ' + t.videosUnit : ''].filter(Boolean).join('、');
  }
  function dateText(p) { var d = ymd(p); return d[0] ? d[0] + '年' + d[1] + '月' + d[2] + '日' : ''; }

  function tabbar(on) {
    var t = T();
    return '<nav class="pt-tabs">' +
      '<a href="#/photos"' + (on === 'lib' ? ' class="on"' : '') + '>' + ICON.tabLibrary + '<span>' + esc(t.libraryTitle) + '</span></a>' +
      '<a href="#/photos/albums"' + (on === 'albums' ? ' class="on"' : '') + '>' + ICON.tabAlbums + '<span>' + esc(t.albumsTitle) + '</span></a>' +
    '</nav>';
  }

  /* ---- 圖庫 ---- */
  var libMode = 'all';      // years / months / all
  var jumpTo = null;        // 從年／月點進來時要捲到的位置（"2026" 或 "2026-1"）
  function renderLibrary() {
    var t = T(), items = albumOf('all').items, body = '';
    if (libMode === 'all') {
      body = items.length
        ? '<div class="pt-grid">' + items.map(function (i) {
            var d = ymd(list()[i]);
            return thumb(i, 'all').replace('<a ', '<a data-ym="' + d[0] + '-' + d[1] + '" data-y="' + d[0] + '" ');
          }).join('') + '</div>' +
          '<div class="pt-count">' + esc(countLine(items)) + '</div>'
        : '<div class="pt-empty">' + esc(t.empty) + '</div>';
    } else {
      // 年／月：每組一張大卡片（用那組最後一張當封面）
      var groups = [], idx = {};
      items.forEach(function (i) {
        var d = ymd(list()[i]), k = libMode === 'years' ? String(d[0]) : d[0] + '-' + d[1];
        if (!(k in idx)) { idx[k] = groups.length; groups.push({ k: k, d: d, items: [] }); }
        groups[idx[k]].items.push(i);
      });
      body = '<div class="pt-cards">' + groups.map(function (g) {
        var cover = list()[g.items[g.items.length - 1]];
        var src = isVideo(cover) ? poster(cover.image) : cover.image;
        return '<button type="button" class="pt-card" data-jump="' + g.k + '">' +
          '<img src="' + esc(src) + '" alt="">' +
          '<span class="pt-card-t"><b>' + (libMode === 'years' ? g.d[0] + '年' : g.d[1] + '月') + '</b>' +
            (libMode === 'months' ? '<small>' + g.d[0] + '年</small>' : '') + '</span>' +
        '</button>';
      }).join('') + '</div>';
    }
    var first = items.length ? dateText(list()[items[0]]) : '', last = items.length ? dateText(list()[items[items.length - 1]]) : '';
    S().$('#photos-overlay').innerHTML = '';
    S().$('#photos-scroll').innerHTML =
      '<div class="pt-libhead">' +
        '<div><h1>' + esc(t.libraryTitle) + '</h1><small>' + esc(first === last ? first : first + ' – ' + last) + '</small></div>' +
      '</div>' + body +
      '<div class="pt-seg">' + ['years', 'months', 'all'].map(function (m) {
        return '<button type="button" data-mode="' + m + '"' + (m === libMode ? ' class="on"' : '') + '>' + esc(t[m === 'all' ? 'allPhotos' : m]) + '</button>';
      }).join('') + '</div>' +
      tabbar('lib');
    var sc = S().$('#photos-scroll');
    if (libMode === 'all') {
      var target = jumpTo && sc.querySelector(jumpTo.indexOf('-') > 0 ? '[data-ym="' + jumpTo + '"]' : '[data-y="' + jumpTo + '"]');
      // 和 iPhone 一樣：一打開就在最新的照片（最下面）
      requestAnimationFrame(function () { sc.scrollTop = target ? target.offsetTop - 100 : sc.scrollHeight; });
    } else {
      // 從「年」點進「月」：捲到那一年的第一個月
      var card = jumpTo && sc.querySelector('[data-jump^="' + jumpTo + '-"]');
      requestAnimationFrame(function () { sc.scrollTop = card ? card.offsetTop - 100 : sc.scrollHeight; });
    }
    jumpTo = null;
  }

  /* ---- 相簿列表 ---- */
  function renderAlbums() {
    var t = T();
    var mine = [{ id: 'all' }, { id: 'fav' }].concat((P().albums || []).map(function (a) { return { id: a.id }; }));
    function card(id) {
      var a = albumOf(id), c = a.items[a.items.length - 1], cp = c != null ? list()[c] : null;
      var src = cp ? (isVideo(cp) ? poster(cp.image) : cp.image) : '';
      return '<a class="pt-acard" href="#/photos/album/' + encodeURIComponent(id) + '">' +
        '<span class="pt-acover">' + (src ? '<img src="' + esc(src) + '" alt="">' : '') + '</span>' +
        '<b>' + esc(a.title) + '</b><small>' + a.items.length + '</small></a>';
    }
    function row(id, icon, locked) {
      var a = albumOf(id);
      return '<a class="pt-row" href="#/photos/album/' + id + '">' +
        '<span class="pt-row-ico">' + icon + '</span><span class="pt-row-l">' + esc(a.title) + '</span>' +
        '<span class="pt-row-r">' + (locked ? ICON.lock : a.items.length) + ICON.chevron + '</span></a>';
    }
    S().$('#photos-overlay').innerHTML = '';
    S().$('#photos-scroll').innerHTML =
      '<div class="pt-libhead"><div><h1>' + esc(t.albumsTitle) + '</h1></div></div>' +
      '<div class="pt-sec-t">' + esc(t.myAlbums) + '</div>' +
      '<div class="pt-acards">' + mine.map(function (x) { return card(x.id); }).join('') + '</div>' +
      '<div class="pt-sec-t">' + esc(t.mediaTypes) + '</div>' +
      '<div class="pt-rows">' + row('videos', ICON.video) + '</div>' +
      '<div class="pt-sec-t">' + esc(t.utilities) + '</div>' +
      '<div class="pt-rows">' + row('hidden', ICON.eye, !!P().hiddenPasscode) + row('deleted', ICON.trash, false) + '</div>' +
      tabbar('albums');
  }

  /* ---- 單一相簿 ---- */
  var hiddenOpen = false;   // 這次打開 App 期間解鎖過「已隱藏」（離開相簿 App 就重新上鎖）
  function renderAlbum(id) {
    var t = T(), a = albumOf(id);
    if (!a) { S().replaceHash('#/photos/albums'); return; }
    if (id === 'hidden' && P().hiddenPasscode && !hiddenOpen) { renderHiddenLock(); return; }
    var del = id === 'deleted', st = state(), now = Date.now();
    S().$('#photos-overlay').innerHTML = '';
    S().$('#photos-scroll').innerHTML =
      '<div class="pt-nav"><a href="#/photos/albums" data-pback>' + ICON.back + '<span>' + esc(t.albumsTitle) + '</span></a></div>' +
      '<div class="pt-libhead pt-libhead-s"><div><h1>' + esc(a.title) + '</h1><small>' + esc(countLine(a.items)) + '</small></div></div>' +
      (del ? '<div class="pt-note">' + esc(t.deletedNote) + '</div>' : '') +
      (a.items.length
        ? '<div class="pt-grid">' + a.items.map(function (i) {
            var left = del ? (st.deleted[i] ? Math.max(1, 30 - Math.floor((now - st.deleted[i]) / 864e5)) : (list()[i].deletedDays || 12)) : 0;
            return thumb(i, encodeURIComponent(id), del ? '<span class="pt-days">' + esc(t.daysLeft.replace('{n}', left)) + '</span>' : '');
          }).join('') + '</div>'
        : '<div class="pt-empty">' + esc(t.empty) + '</div>');
  }

  // 「已隱藏」的密碼畫面（data.js 的 photos.hiddenPasscode；留空 = 不鎖）
  var typed = '';
  function renderHiddenLock() {
    var t = T(), keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
    typed = '';
    S().$('#photos-scroll').innerHTML =
      '<div class="pt-nav"><a href="#/photos/albums" data-pback>' + ICON.back + '<span>' + esc(t.albumsTitle) + '</span></a></div>' +
      '<div class="kk-lock pt-lock">' +
        '<div class="pt-lock-ico">' + ICON.lock + '</div>' +
        '<div class="kk-lock-title">' + esc(t.hiddenLocked) + '</div>' +
        '<div class="kk-lock-hint">' + esc(t.hiddenHint) + '</div>' +
        '<div class="kk-lock-dots" id="pt-lock-dots">' + String(P().hiddenPasscode).split('').map(function () { return '<i></i>'; }).join('') + '</div>' +
        '<div class="kk-lock-keys">' + keys.map(function (k) {
          if (!k) return '<span></span>';
          return k === 'del'
            ? '<button type="button" class="kk-lock-del" data-ppin="del">' + ICON.del + '</button>'
            : '<button type="button" class="kk-lock-key" data-ppin="' + k + '">' + k + '</button>';
        }).join('') + '</div>' +
      '</div>';
  }
  function pressPin(k) {
    var code = String(P().hiddenPasscode), dots = S().$('#pt-lock-dots');
    if (!dots) return;
    if (k === 'del') typed = typed.slice(0, -1); else if (typed.length < code.length) typed += k;
    dots.querySelectorAll('i').forEach(function (d, i) { d.classList.toggle('on', i < typed.length); });
    if (typed.length < code.length) return;
    if (typed === code && !P().hiddenAlwaysWrong) {   // hiddenAlwaysWrong：目前不管輸入什麼都算錯（之後再開放）
      hiddenOpen = true;
      S().setFlag('photos_hidden_unlocked');
      setTimeout(function () { renderAlbum('hidden'); }, 150);
    } else {
      setTimeout(function () {
        dots.classList.add('shake');
        setTimeout(function () { typed = ''; dots.classList.remove('shake'); dots.querySelectorAll('i').forEach(function (d) { d.classList.remove('on'); }); }, 400);
      }, 120);
    }
  }

  /* ---- 存圖：手機（支援分享檔案）→ 跳出分享選單（可以「儲存影像」）；其他 → 直接下載 ---- */
  function savePhoto() {
    if (!view) return;
    var p = list()[view.items[view.pos]];
    if (!p || !p.image) return;
    var name = p.image.split('/').pop().split('?')[0];
    function download() { var a = document.createElement('a'); a.href = p.image; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
    if (!window.fetch || !navigator.canShare || !window.File) { download(); return; }
    fetch(p.image).then(function (r) { return r.blob(); }).then(function (b) {
      var f = new File([b], name, { type: b.type || 'image/jpeg' });
      if (navigator.canShare({ files: [f] })) navigator.share({ files: [f] }).catch(function () {});
      else download();
    }).catch(download);
  }

  /* ---- 看照片 ---- */
  var view = null;   // { ctx, items, pos }
  function renderViewer(ctx, idx) {
    var t = T(), a = albumOf(ctx);
    if (!a) { S().replaceHash('#/photos'); return; }
    if (ctx === 'hidden' && P().hiddenPasscode && !hiddenOpen) { S().replaceHash('#/photos/album/hidden'); return; }
    var pos = a.items.indexOf(idx);
    if (pos < 0) { S().replaceHash(ctx === 'all' ? '#/photos' : '#/photos/album/' + encodeURIComponent(ctx)); return; }
    // 背後保留原本的頁面
    if (ctx === 'all') renderLibrary(); else renderAlbum(ctx);
    view = { ctx: ctx, items: a.items, pos: pos };
    var del = ctx === 'deleted';
    S().$('#photos-overlay').innerHTML =
      '<div class="pt-viewer" id="pt-viewer">' +
        '<div class="pt-vtop">' +
          '<a href="#/photos" data-pback>' + ICON.back + '</a>' +
          '<div class="pt-vtitle"><b id="pt-vdate"></b><small id="pt-vtime"></small></div>' +
          '<span class="pt-vedit"></span>' +   // 編輯鍵拿掉（留空位讓日期置中）
        '</div>' +
        '<div class="pt-strip" id="pt-strip">' + a.items.map(function (i) {
          var p = list()[i];
          return '<div class="pt-slide">' + (isVideo(p)
            ? '<video src="' + esc(p.image) + '"' + (poster(p.image) ? ' poster="' + esc(poster(p.image)) + '"' : '') + ' playsinline controls preload="metadata"></video>'
            : '<img src="' + esc(p.image) + '" alt="">') + '</div>';
        }).join('') + '</div>' +
        '<div class="pt-vbar">' + (del
          ? '<button type="button" class="pt-red" data-forever>' + esc(t.deleteForever) + '</button>' +
            '<button type="button" class="pt-blue" data-recover>' + esc(t.recover) + '</button>'
          : '<button type="button" data-save>' + ICON.share + '</button>' +   // 分享鍵 = 存圖
            '<button type="button" data-fav id="pt-favbtn"></button>' +
            '<button type="button" data-info>' + ICON.info + '</button>' +
            '<button type="button" data-delete>' + ICON.trash + '</button>') +
        '</div>' +
      '</div>';
    var strip = S().$('#pt-strip');
    strip.scrollLeft = pos * strip.clientWidth;
    paintViewer();
    var timer;
    strip.addEventListener('scroll', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var p = Math.round(strip.scrollLeft / strip.clientWidth);
        if (p !== view.pos) {
          view.pos = p; paintViewer();
          strip.querySelectorAll('video').forEach(function (v) { v.pause(); });
          // 網址跟著換（取代目前這一頁，不會多一筆「上一頁」）
          quietHash('#/photos/view/' + encodeURIComponent(view.ctx) + '/' + view.items[p]);
        }
      }, 80);
    });
  }
  function paintViewer() {
    if (!view) return;
    var p = list()[view.items[view.pos]];
    if (p.clue) if (window.STORY && window.STORY.clue) window.STORY.clue(p.clue);   // 覺醒線索（clue）
    // say：第一次點開這張照片 → 你的一句話（劇情對話框、看得到手機畫面；和開場點行事曆上的生日一樣）
    if (p.say && window.STORY && S() && !S().hasFlag('photo_say_' + p.image) && !window.STORY.playing()) {
      S().setFlag('photo_say_' + p.image);
      window.SITE_DATA.scenes.__photo_say = [{ bg: 'phone-dim' }, { who: 'me', text: p.say }];
      window.STORY.play('__photo_say', null, null, 'phone-dim', { noGap: true });
    }
    S().$('#pt-vdate').textContent = dateText(p);
    S().$('#pt-vtime').textContent = p.time || '';
    var fb = S().$('#pt-favbtn');
    if (fb) { var on = isFav(view.items[view.pos]); fb.innerHTML = on ? ICON.heartFill : ICON.heart; fb.classList.toggle('on', on); }
  }
  function sheet(html) {
    var w = document.createElement('div');
    w.className = 'pt-sheet-wrap';
    w.innerHTML = '<div class="pt-sheet-bg" data-sheet-close></div><div class="pt-sheet">' + html + '</div>';
    S().$('#pt-viewer').appendChild(w);
    void w.offsetWidth; w.classList.add('show');
  }
  function closeSheet() { var w = document.querySelector('.pt-sheet-wrap'); if (w) w.remove(); }
  // 刪除／復原後：留在檢視畫面看下一張；這個相簿沒照片了就回到相簿
  function afterChange() {
    var a = albumOf(view.ctx), next = a.items[Math.min(view.pos, a.items.length - 1)];
    if (next == null) { S().replaceHash(view.ctx === 'all' ? '#/photos' : '#/photos/album/' + encodeURIComponent(view.ctx)); return; }
    route(['view', view.ctx, String(next)]);
    quietHash('#/photos/view/' + encodeURIComponent(view.ctx) + '/' + next);
  }

  // 換網址但不重畫畫面（檢視照片時滑動換張、刪除後換下一張）
  var skipRoute = false;
  function quietHash(h) {
    if (location.hash === h) return;
    skipRoute = true;
    S().replaceHash(h);
  }
  function route(parts) {
    if (skipRoute) { skipRoute = false; return; }
    view = null;
    S().setDarkStatus(false);
    S().$('#photos-scroll').scrollTop = 0;
    if (parts[0] === 'albums') renderAlbums();
    else if (parts[0] === 'album') renderAlbum(parts[1]);
    else if (parts[0] === 'view') renderViewer(parts[1], +parts[2]);
    else renderLibrary();
  }
  // 離開相簿 App →「已隱藏」重新上鎖
  window.addEventListener('hashchange', function () { if (location.hash.indexOf('#/photos') !== 0) hiddenOpen = false; });

  document.addEventListener('click', function (e) {
    var app = document.getElementById('app-photos');
    if (!app || !app.contains(e.target)) return;
    var el;
    if ((el = e.target.closest('[data-pback]'))) { e.preventDefault(); S().goBack(el.getAttribute('href')); return; }
    if ((el = e.target.closest('[data-mode]'))) { libMode = el.dataset.mode; renderLibrary(); return; }
    if ((el = e.target.closest('[data-jump]'))) { jumpTo = el.dataset.jump; libMode = libMode === 'years' ? 'months' : 'all'; renderLibrary(); return; }
    if ((el = e.target.closest('[data-ppin]'))) { pressPin(el.dataset.ppin); return; }
    if (e.target.closest('[data-sheet-close]')) { closeSheet(); return; }
    if (view) {
      var i = view.items[view.pos], st = state(), t = T();
      if (e.target.closest('[data-fav]')) { st.fav[i] = isFav(i) ? 0 : 1; save(st); paintViewer(); return; }
      if (e.target.closest('[data-info]')) {
        var p = list()[i];
        sheet('<div class="pt-info">' +
          '<div class="pt-info-cap">' + (p.caption ? esc(p.caption) : '<span>' + esc(t.caption) + '</span>') + '</div>' +
          '<div class="pt-info-row"><b>' + esc(dateText(p)) + '</b><span>' + esc(p.time || '') + '</span></div>' +
          (p.device ? '<div class="pt-info-row"><span>' + esc(p.device) + '</span></div>' : '') +
          '<div class="pt-info-row pt-info-place">' + (p.place ? esc(p.place) : '<span class="pt-blue">' + esc(t.noPlace) + '</span>') + '</div>' +
        '</div>');
        return;
      }
      if (e.target.closest('[data-delete]')) {
        sheet('<div class="pt-act"><p>' + esc(t.deleteNote) + '</p>' +
          '<button type="button" class="pt-red" data-confirm-delete>' + esc(t.deleteConfirm) + '</button></div>' +
          '<button type="button" class="pt-act-cancel" data-sheet-close>' + esc(t.cancel) + '</button>');
        return;
      }
      if (e.target.closest('[data-confirm-delete]')) { st.deleted[i] = Date.now(); save(st); closeSheet(); afterChange(); return; }
      if (e.target.closest('[data-recover]')) { if (list()[i].deleted) st.deleted[i] = 0; else delete st.deleted[i]; save(st); afterChange(); return; }
      if (e.target.closest('[data-forever]')) {
        sheet('<div class="pt-act"><p>' + esc(t.deleteNote.split('，')[0]) + '</p>' +
          '<button type="button" class="pt-red" data-confirm-forever>' + esc(t.deleteForever) + '</button></div>' +
          '<button type="button" class="pt-act-cancel" data-sheet-close>' + esc(t.cancel) + '</button>');
        return;
      }
      if (e.target.closest('[data-confirm-forever]')) { st.gone[i] = 1; save(st); closeSheet(); afterChange(); return; }
      // 點照片：隱藏／顯示上下工具列（黑底全螢幕）
      if (e.target.closest('.pt-slide') && !e.target.closest('video')) {
        var v = S().$('#pt-viewer');
        v.classList.toggle('bare');
        S().setDarkStatus(v.classList.contains('bare'));
        return;
      }
    }
    if (e.target.closest('[data-na]')) S().toast();
    if (e.target.closest('[data-save]')) savePhoto();
  });

  (window.SOSHO_APPS = window.SOSHO_APPS || {}).photos = route;
})();
