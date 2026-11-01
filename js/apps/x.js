/* X（前 Twitter）
 *   #/x            首頁時間軸
 *   #/x/t/貼文id    貼文內頁（回覆串、按讚、轉推、回覆）
 *   #/x/u/帳號      個人檔案
 * 玩家按的讚、轉推、回覆、發的貼文、追蹤存在瀏覽器（riiiize-x），重新開始會清掉 */
(function () {
  'use strict';

  var KEY = 'riiiize-x';
  var ICON = {
    logo: '<svg viewBox="0 0 24 24"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.3-8.3L1.9 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z" fill="currentColor"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M20 12H5M11 5l-7 7 7 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    reply: '<svg viewBox="0 0 24 24"><path d="M9 4.5h6a7 7 0 0 1 0 14h-2.5L8 21.5v-3.4A7 7 0 0 1 9 4.5z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/></svg>',
    rt: '<svg viewBox="0 0 24 24"><path d="M5 9V7.5A2.5 2.5 0 0 1 7.5 5H17M14 2l3 3-3 3M19 15v1.5a2.5 2.5 0 0 1-2.5 2.5H7M10 22l-3-3 3-3" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20.5s-8-4.9-8-11A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8 2.9c0 6.1-8 11-8 11z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/></svg>',
    heartFill: '<svg viewBox="0 0 24 24"><path d="M12 20.5s-8-4.9-8-11A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8 2.9c0 6.1-8 11-8 11z" fill="currentColor"/></svg>',
    share: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 13v6.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V13" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="currentColor"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    verified: '<svg viewBox="0 0 24 24"><path d="m12 1.8 2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3-3.2-.1L12 22.2l-2.6-1.9-3.2.1-1-3-2.6-1.9 1-3.1-1-3.1 2.6-1.9 1-3 3.2.1z" fill="#1d9bf0"/><path d="m8 12.3 2.7 2.7L16.2 9" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    compose: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
  };

  function S() { return window.SOSHO; }
  function X() { return S().data.x || { accounts: [], tweets: [] }; }
  function esc(s) { return S().esc(s); }
  var T_DEFAULT = {
    postTitle: '貼文', replyingTo: '回覆', retweets: '轉推', likes: '喜歡', retweetedBy: '{name} 已轉推',
    replyPlaceholder: '發佈你的回覆', post: '發佈', reply: '回覆', cancel: '取消', composePlaceholder: '有什麼新鮮事？',
    following: '正在跟隨', followers: '跟隨者', follow: '跟隨', followingBtn: '正在跟隨', requested: '已提出要求',
    posts: '貼文', noPosts: '還沒有貼文', justNow: '剛剛', joined: '加入時間：',
    protectedTitle: '這些貼文受到保護', protectedDesc: '只有獲准的跟隨者才能看到 @{handle} 的貼文。'
  };
  function T() {
    var t = X().text || {}, o = {};
    Object.keys(T_DEFAULT).forEach(function (k) { o[k] = t[k] != null ? t[k] : T_DEFAULT[k]; });
    return o;
  }
  function state() {
    var st = S().load(KEY, null) || {};
    ['likes', 'rts', 'replies', 'follows'].forEach(function (k) { st[k] = st[k] || {}; });
    st.posts = st.posts || [];
    return st;
  }
  function save(st) { S().save(KEY, st); }

  function acc(handle) { return (X().accounts || []).filter(function (a) { return a.handle === handle; })[0] || null; }
  function me() { return acc(X().me) || { handle: X().me || 'me', name: X().me || 'me', avatar: '' }; }
  function isMe(a) { return a && a.handle === me().handle; }
  // 追蹤：玩家按過就照玩家的，不然看 data.js 的 followed
  function follows(a) { var st = state(); return a.handle in st.follows ? st.follows[a.handle] : (a.followed ? 1 : 0); }
  // 鎖帳（受保護）而且沒追蹤：看不到貼文
  function hidden(a) { return a && a.protected && !isMe(a) && follows(a) !== 1; }

  function nowTime() {
    var d = new Date(), h = d.getHours();
    return (h < 12 ? '上午 ' : '下午 ') + (h % 12 || 12) + ':' + String(d.getMinutes()).padStart(2, '0') + ' · ' + d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
  }
  // 全部貼文：玩家發的（新的在前）＋ data.js 的
  function allTweets() {
    var mine = state().posts.slice().reverse().map(function (p) {
      return { id: p.id, by: me().handle, text: p.text, time: T().justNow, date: p.date, mine: true };
    });
    return mine.concat(X().tweets || []);
  }
  function tweet(id) { return allTweets().filter(function (t) { return String(t.id) === String(id); })[0] || null; }

  // 文字：@帳號、#標籤 變藍色；遊戲裡有的帳號可以點進去
  function rich(s) {
    return esc(s).replace(/\n/g, '<br>').replace(/(^|[^\w])([@#][\w\u0080-￿.]+)/g, function (m, pre, tag) {
      var a = tag.charAt(0) === '@' && acc(tag.slice(1));
      return pre + (a ? '<a class="x-blue" href="#/x/u/' + encodeURIComponent(a.handle) + '">' + tag + '</a>' : '<span class="x-blue">' + tag + '</span>');
    });
  }
  function nameLine(a, extra) {
    return '<b class="x-name">' + esc(a.name) + '</b>' +
      (a.verified ? '<span class="x-badge">' + ICON.verified + '</span>' : '') +
      (a.protected ? '<span class="x-lock">' + ICON.lock + '</span>' : '') +
      '<span class="x-handle">@' + esc(a.handle) + (extra || '') + '</span>';
  }
  function images(list) {
    list = list || [];
    if (!list.length) return '';
    return '<div class="x-imgs n' + Math.min(list.length, 4) + '">' + list.slice(0, 4).map(function (src) {
      return '<img src="' + esc(src) + '" alt="" data-ximg>';
    }).join('') + '</div>';
  }
  function num(n) { return n ? String(n) : ''; }
  // 讚、轉推：data.js 的數字＋玩家按的
  function counts(t) {
    // liked / retweeted: true = 一開始就是按過的（玩家帳號按過）；玩家再按就照玩家的
    var st = state();
    var liked = t.id in st.likes ? !!st.likes[t.id] : !!t.liked;
    var rted = t.id in st.rts ? !!st.rts[t.id] : !!t.retweeted;
    var likes = (+t.likes || 0) + (liked ? 1 : 0) - (t.liked ? 1 : 0);
    var rts = (+t.retweets || 0) + (rted ? 1 : 0) - (t.retweeted ? 1 : 0);
    return { liked: liked, rted: rted, likes: likes, rts: rts, replies: (t.replies || []).length + (st.replies[t.id] || []).length };
  }
  function actions(t, big) {
    var c = counts(t);
    return '<div class="x-acts' + (big ? ' big' : '') + '">' +
      '<a href="#/x/t/' + encodeURIComponent(t.id) + '" class="x-act">' + ICON.reply + (big ? '' : '<span>' + num(c.replies) + '</span>') + '</a>' +
      '<button type="button" class="x-act' + (c.rted ? ' on-rt' : '') + '" data-xrt="' + esc(t.id) + '">' + ICON.rt + (big ? '' : '<span>' + num(c.rts) + '</span>') + '</button>' +
      '<button type="button" class="x-act' + (c.liked ? ' on-like' : '') + '" data-xlike="' + esc(t.id) + '">' + (c.liked ? ICON.heartFill : ICON.heart) + (big ? '' : '<span>' + num(c.likes) + '</span>') + '</button>' +
      '<button type="button" class="x-act" data-xshare>' + ICON.share + '</button>' +
    '</div>';
  }
  function row(t) {
    var a = acc(t.by) || { handle: t.by, name: t.by };
    var rtBy = t.retweetedBy && acc(t.retweetedBy);
    return '<article class="x-tw" data-xopen="' + esc(t.id) + '">' +
      (rtBy ? '<div class="x-rtby">' + ICON.rt + esc(T().retweetedBy.replace('{name}', rtBy.name)) + '</div>' : '') +
      '<div class="x-tw-in">' +
        '<a class="x-av" href="#/x/u/' + encodeURIComponent(a.handle) + '"><img src="' + esc(a.avatar) + '" alt=""></a>' +
        '<div class="x-body">' +
          '<div class="x-head">' + nameLine(a, ' · ' + esc(t.time || '')) + '</div>' +
          (t.text ? '<div class="x-text">' + rich(t.text) + '</div>' : '') +
          images(t.images) +
          actions(t) +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function fab() { return '<button type="button" class="x-fab" data-xcompose>' + ICON.compose + '</button>'; }

  /* ---- 首頁時間軸 ---- */
  function renderHome() {
    var m = me();
    S().$('#x-overlay').innerHTML = fab();
    S().$('#x-scroll').innerHTML =
      '<div class="x-top">' +
        '<a class="x-me" href="#/x/u/' + encodeURIComponent(m.handle) + '"><img src="' + esc(m.avatar) + '" alt=""></a>' +
        '<span class="x-logo">' + ICON.logo + '</span><span></span>' +
      '</div>' +
      allTweets().filter(function (t) { return !hidden(acc(t.by)); }).map(row).join('');
  }

  /* ---- 貼文內頁 ---- */
  function renderTweet(id) {
    var t = tweet(id), tt = T();
    if (!t) { S().replaceHash('#/x'); return; }
    var a = acc(t.by) || { handle: t.by, name: t.by };
    if (hidden(a)) { S().replaceHash('#/x/u/' + encodeURIComponent(a.handle)); return; }
    var c = counts(t), st = state();
    var reps = (t.replies || []).concat((st.replies[t.id] || []).map(function (r) {
      return { by: me().handle, text: r.text, time: tt.justNow, replyTo: t.by };
    }));
    S().$('#x-overlay').innerHTML = '';
    S().$('#x-scroll').innerHTML =
      '<div class="x-bar"><a href="#/x" data-xback>' + ICON.back + '</a><b>' + esc(tt.postTitle) + '</b><span></span></div>' +
      '<div class="x-detail">' +
        '<a class="x-dhead" href="#/x/u/' + encodeURIComponent(a.handle) + '"><img src="' + esc(a.avatar) + '" alt="">' +
          '<div>' + nameLine(a) + '</div></a>' +
        (t.text ? '<div class="x-dtext">' + rich(t.text) + '</div>' : '') +
        images(t.images) +
        (t.date || t.mine ? '<div class="x-date">' + esc(t.date || '') + '</div>' : '') +
        (c.rts || c.likes ? '<div class="x-stats">' +
          (c.rts ? '<span><b>' + c.rts + '</b> ' + esc(tt.retweets) + '</span>' : '') +
          (c.likes ? '<span><b>' + c.likes + '</b> ' + esc(tt.likes) + '</span>' : '') + '</div>' : '') +
        actions(t, true) +
      '</div>' +
      '<div class="x-replies">' + reps.map(function (r, i) {
        var ra = acc(r.by) || { handle: r.by, name: r.by, avatar: r.avatar }, to = acc(r.replyTo || t.by);
        var next = reps[i + 1], thread = next && (next.replyTo === r.by);   // 下一則是回覆這一則 → 用直線連起來
        return '<div class="x-rep' + (thread ? ' thread' : '') + '">' +
          '<a class="x-av" href="' + (acc(r.by) ? '#/x/u/' + encodeURIComponent(r.by) : '#/x') + '"><img src="' + esc(ra.avatar || r.avatar || '') + '" alt=""></a>' +
          '<div class="x-body">' +
            '<div class="x-head">' + nameLine(ra, ' · ' + esc(r.time || '')) + '</div>' +
            '<div class="x-replying">' + esc(tt.replyingTo) + ' <span class="x-blue">@' + esc(to ? to.handle : (r.replyTo || t.by)) + '</span></div>' +
            '<div class="x-text">' + rich(r.text) + '</div>' +
            images(r.images) +
          '</div>' +
        '</div>';
      }).join('') + '</div>' +
      '<form class="x-replybox" id="x-replybox" autocomplete="off">' +
        '<img src="' + esc(me().avatar) + '" alt="">' +
        '<input name="r" placeholder="' + esc(tt.replyPlaceholder) + '" autocomplete="off">' +
        '<button type="submit" disabled>' + esc(tt.reply) + '</button>' +
      '</form>';
    var f = S().$('#x-replybox');
    f.r.addEventListener('input', function () { f.querySelector('button').disabled = !f.r.value.trim(); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = f.r.value.trim();
      if (!v) return;
      var st2 = state();
      (st2.replies[t.id] = st2.replies[t.id] || []).push({ text: v });
      save(st2);
      renderTweet(t.id);
      var sc = S().$('#x-scroll'); sc.scrollTop = sc.scrollHeight;
    });
  }

  /* ---- 個人檔案 ---- */
  function renderProfile(handle) {
    var a = acc(handle), tt = T();
    if (!a) { S().replaceHash('#/x'); return; }
    var f = follows(a), locked = hidden(a);
    var list = allTweets().filter(function (t) { return t.by === a.handle || t.retweetedBy === a.handle; });
    S().$('#x-overlay').innerHTML = isMe(a) ? fab() : '';
    S().$('#x-scroll').innerHTML =
      '<div class="x-banner"' + (a.banner ? ' style="background-image:url(&quot;' + esc(a.banner) + '&quot;)"' : '') + '>' +
        '<a href="#/x" data-xback class="x-banner-back">' + ICON.back + '</a></div>' +
      '<div class="x-prof">' +
        '<div class="x-prof-top"><img class="x-prof-av" src="' + esc(a.avatar) + '" alt="">' +
          (isMe(a) ? '' : '<button type="button" class="x-follow' + (f ? ' on' : '') + '" data-xfollow="' + esc(a.handle) + '">' +
            esc(f === 1 ? tt.followingBtn : f === 'req' ? tt.requested : tt.follow) + '</button>') +
        '</div>' +
        '<div class="x-prof-name">' + nameLine(a) + '</div>' +
        (a.bio ? '<div class="x-prof-bio">' + rich(a.bio) + '</div>' : '') +
        (a.joined ? '<div class="x-prof-meta">' + ICON.calendar + esc(tt.joined + a.joined) + '</div>' : '') +
        '<div class="x-prof-cnt"><span><b>' + esc(a.following != null ? a.following : 0) + '</b> ' + esc(tt.following) + '</span>' +
          '<span><b>' + esc(a.followers != null ? a.followers : 0) + '</b> ' + esc(tt.followers) + '</span></div>' +
      '</div>' +
      '<div class="x-ptabs"><span class="on">' + esc(tt.posts) + '</span></div>' +
      (locked
        ? '<div class="x-protected"><b>' + esc(tt.protectedTitle) + '</b><p>' + esc(tt.protectedDesc.replace('{handle}', a.handle)) + '</p></div>'
        : list.length ? list.map(row).join('') : '<div class="x-empty">' + esc(tt.noPosts) + '</div>');
  }

  /* ---- 發文 ---- */
  function openCompose() {
    var tt = T(), w = document.createElement('div');
    w.className = 'x-compose';
    w.innerHTML =
      '<form id="x-compose" autocomplete="off">' +
        '<div class="x-compose-top"><button type="button" data-xclose>' + esc(tt.cancel) + '</button>' +
          '<button type="submit" class="x-post" disabled>' + esc(tt.post) + '</button></div>' +
        '<div class="x-compose-body"><img src="' + esc(me().avatar) + '" alt="">' +
          '<textarea name="t" rows="6" placeholder="' + esc(tt.composePlaceholder) + '"></textarea></div>' +
      '</form>';
    S().$('#x-overlay').appendChild(w);
    void w.offsetWidth; w.classList.add('show');
    var f = w.querySelector('form');
    f.t.focus();
    f.t.addEventListener('input', function () { f.querySelector('.x-post').disabled = !f.t.value.trim(); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = f.t.value.trim();
      if (!v) return;
      var st = state();
      st.posts.push({ id: 'my' + Date.now(), text: v, date: nowTime() });
      save(st);
      S().setFlag('x_posted');
      route(current);
    });
  }

  var current = [];
  function route(parts) {
    current = parts;
    S().$('#x-scroll').scrollTop = 0;
    if (parts[0] === 't') renderTweet(parts[1]);
    else if (parts[0] === 'u') renderProfile(parts[1]);
    else renderHome();
  }

  document.addEventListener('click', function (e) {
    var app = document.getElementById('app-x');
    if (!app || !app.contains(e.target)) return;
    var el, st;
    if ((el = e.target.closest('[data-xback]'))) { e.preventDefault(); S().goBack('#/x'); return; }
    if ((el = e.target.closest('[data-xlike]'))) {
      st = state(); var t = tweet(el.dataset.xlike);
      st.likes[t.id] = counts(t).liked ? 0 : 1;
      save(st); repaint(); return;
    }
    if ((el = e.target.closest('[data-xrt]'))) {
      st = state(); var r = tweet(el.dataset.xrt);
      st.rts[r.id] = counts(r).rted ? 0 : 1;
      save(st); repaint(); return;
    }
    if (e.target.closest('[data-xshare]')) { S().toast(T_SHARE()); return; }
    if ((el = e.target.closest('[data-xfollow]'))) {
      st = state(); var a = acc(el.dataset.xfollow), f = follows(a);
      st.follows[a.handle] = f ? 0 : (a.protected ? 'req' : 1);   // 鎖帳只會變「已提出要求」
      save(st); renderProfile(a.handle); return;
    }
    if (e.target.closest('[data-xcompose]')) { openCompose(); return; }
    if (e.target.closest('[data-xclose]')) { var w = e.target.closest('.x-compose'); w.remove(); return; }
    if ((el = e.target.closest('[data-ximg]'))) {
      // 點圖片 → 全螢幕，點一下關閉
      var v = document.createElement('div');
      v.className = 'x-viewer';
      v.innerHTML = '<img src="' + esc(el.getAttribute('src')) + '" alt="">';
      v.onclick = function () { v.remove(); S().setDarkStatus(false); };
      S().$('#x-overlay').appendChild(v);
      S().setDarkStatus(true);
      return;
    }
    // 點貼文其他地方 → 進入貼文內頁
    if ((el = e.target.closest('[data-xopen]')) && !e.target.closest('a, button')) location.hash = '#/x/t/' + encodeURIComponent(el.dataset.xopen);
  });
  function T_SHARE() { return (X().text || {}).linkCopied || '已複製連結'; }
  // 按讚／轉推後重畫，保持捲動位置
  function repaint() {
    var sc = S().$('#x-scroll'), top = sc.scrollTop;
    var keep = document.getElementById('x-replybox'), typed = keep ? keep.r.value : '';
    route(current);
    sc.scrollTop = top;
    if (typed) { var k = document.getElementById('x-replybox'); k.r.value = typed; k.r.dispatchEvent(new Event('input')); }
  }

  (window.SOSHO_APPS = window.SOSHO_APPS || {}).x = route;
})();
