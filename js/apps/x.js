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
    compose: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  };

  function S() { return window.SOSHO; }
  function X() { return S().data.x || { accounts: [], tweets: [] }; }
  function esc(s) { return S().esc(s); }
  var T_DEFAULT = {
    postTitle: '貼文', replyingTo: '回覆', retweets: '轉推', likes: '喜歡', retweetedBy: '{name} 已轉推',
    replyPlaceholder: '發佈你的回覆', post: '發佈', reply: '回覆', cancel: '取消', composePlaceholder: '有什麼新鮮事？',
    following: '正在跟隨', followers: '跟隨者', follow: '跟隨', followingBtn: '正在跟隨', requested: '已提出要求',
    editProfile: '編輯個人資料', save: '儲存', nameLabel: '名稱', bioLabel: '簡介',
    protectLabel: '保護你的貼文', protectNote: '只有你的跟隨者才能看到你的貼文。', noFollowing: '還沒有跟隨任何人', noFollowers: '還沒有跟隨者',
    posts: '貼文', repliesTab: '回覆', retweetsTab: '轉推', likesTab: '喜歡', noPosts: '還沒有貼文', noReplies: '還沒有回覆', noRetweets: '還沒有轉推', noLikes: '還沒有喜歡的貼文', justNow: '剛剛',
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

  // 帳號資料；自己的帳號套用「編輯個人資料」改過的名稱、簡介、公開／不公開
  function acc(handle) {
    var a = (X().accounts || []).filter(function (x) { return x.handle === handle; })[0] || null;
    var p = state().profile;
    if (a && p && handle === X().me) {
      a = Object.assign({}, a);
      if (p.name != null) a.name = p.name;
      if (p.bio != null) a.bio = p.bio;
      if (p.protected != null) a.protected = p.protected;
    }
    return a;
  }
  function me() { return acc(X().me) || { handle: X().me || 'me', name: X().me || 'me', avatar: '' }; }
  function isMe(a) { return a && a.handle === me().handle; }
  // 追蹤：玩家按過就照玩家的，不然看 data.js 的 followed
  function follows(a) { var st = state(); return a.handle in st.follows ? st.follows[a.handle] : (a.followed ? 1 : 0); }
  // 鎖帳（受保護）而且沒追蹤：看不到貼文
  function hidden(a) { return a && a.protected && !isMe(a) && follows(a) !== 1; }

  function nowTime() {
    var d = new Date(), h = d.getHours(), g = window.GAME ? window.GAME.date() : d;   // 日期 = 遊戲裡的今天
    return (h < 12 ? '上午 ' : '下午 ') + (h % 12 || 12) + ':' + String(d.getMinutes()).padStart(2, '0') + ' · ' + g.getFullYear() + '/' + (g.getMonth() + 1) + '/' + g.getDate();
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
  // noLinks = 放在別的連結裡面時（名單的簡介），只變藍色、不做成連結
  function rich(s, noLinks) {
    return esc(s).replace(/\n/g, '<br>').replace(/(^|[^\w])([@#][\w\u0080-\uffff.]+)/g, function (m, pre, tag) {
      var a = !noLinks && tag.charAt(0) === '@' && acc(tag.slice(1));
      return pre + (a ? '<a class="x-blue" href="#/x/u/' + encodeURIComponent(a.handle) + '">' + tag + '</a>' : '<span class="x-blue">' + tag + '</span>');
    });
  }
  function nameLine(a, extra) {
    return '<b class="x-name">' + esc(a.name) + '</b>' +
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
  // rtAcc = 在個人檔案的「轉推」分頁：上面顯示「這個帳號 已轉推」
  function row(t, rtAcc) {
    var a = acc(t.by) || { handle: t.by, name: t.by };
    var rtBy = rtAcc || (t.retweetedBy && acc(t.retweetedBy));
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
      allTweets().filter(function (t) { return !hidden(acc(t.by)); }).map(function (t) { return row(t); }).join('');
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
    var lists = profileLists(a);
    // 返回鍵放在最上層：封面往上滑、停在狀態列後面時也按得到
    S().$('#x-overlay').innerHTML = '<a href="#/x" data-xback class="x-banner-back">' + ICON.back + '</a>' + (isMe(a) ? fab() : '');
    S().$('#x-scroll').innerHTML =
      '<div class="x-banner"' + (a.banner ? ' style="background-image:url(&quot;' + esc(a.banner) + '&quot;)"' : '') + '></div>' +
      '<div class="x-prof">' +
        '<div class="x-prof-top"><img class="x-prof-av" src="' + esc(a.avatar) + '" alt="">' +
          (isMe(a) ? '<a class="x-follow on" href="#/x/edit">' + esc(tt.editProfile) + '</a>' : followBtn(a)) +
        '</div>' +
        '<div class="x-prof-name">' + nameLine(a) + '</div>' +
        (a.bio ? '<div class="x-prof-bio">' + rich(a.bio) + '</div>' : '') +
        // 正在跟隨／跟隨者：點進去看名單（鎖帳又沒跟隨就點不進去）
        '<div class="x-prof-cnt">' + ['following', 'followers'].map(function (k) {
          var inner = '<b>' + esc(countOf(a, k)) + '</b> ' + esc(tt[k]);
          return locked ? '<span>' + inner + '</span>' : '<a href="#/x/u/' + encodeURIComponent(a.handle) + '/' + k + '">' + inner + '</a>';
        }).join('') + '</div>' +
      '</div>' +
      // 貼文／回覆／轉推／喜歡 四個分頁
      '<div class="x-ptabs">' + [['posts', tt.posts], ['replies', tt.repliesTab], ['rts', tt.retweetsTab], ['likes', tt.likesTab]].map(function (x) {
        return '<button type="button" data-xtab="' + x[0] + '"' + (profTab === x[0] ? ' class="on"' : '') + '>' + esc(x[1]) + '</button>';
      }).join('') + '</div>' +
      (locked
        ? '<div class="x-protected"><b>' + esc(tt.protectedTitle) + '</b><p>' + esc(tt.protectedDesc.replace('{handle}', a.handle)) + '</p></div>'
        : ['posts', 'replies', 'rts', 'likes'].map(function (k) {
            var l = lists[k], empty = { posts: tt.noPosts, replies: tt.noReplies, rts: tt.noRetweets, likes: tt.noLikes }[k];
            return '<div data-xpane="' + k + '"' + (profTab === k ? '' : ' hidden') + '>' +
              (l.length ? l.map(function (t) { return k === 'replies' ? replyRow(t) : row(t, k === 'rts' ? a : null); }).join('') : '<div class="x-empty">' + esc(empty) + '</div>') +
            '</div>';
          }).join(''));
  }
  var profTab = 'posts', profHandle = null;
  // 個人檔案的四個分頁：
  //   貼文 = 這個帳號發的
  //   回覆 = 這個帳號在任何貼文底下的回覆（data.js 的 replies by 是這個帳號；自己的帳號再加上玩家留的回覆）
  //   轉推 = 自己：玩家按過轉推的；別人：data.js 帳號的 retweets（貼文 id）＋ 貼文寫 retweetedBy 是這個帳號的
  //   喜歡 = 自己：玩家按過喜歡的；別人：data.js 帳號的 likes（貼文 id）
  function profileLists(a) {
    var all = allTweets().filter(function (t) { return !hidden(acc(t.by)); });
    function byIds(ids) { return all.filter(function (t) { return (ids || []).indexOf(t.id) >= 0; }); }
    return {
      posts: all.filter(function (t) { return t.by === a.handle; }),
      replies: repliesOf(a, all),
      rts: isMe(a) ? all.filter(function (t) { return counts(t).rted; })
        : all.filter(function (t) { return t.retweetedBy === a.handle || (a.retweets || []).indexOf(t.id) >= 0; }),
      likes: isMe(a) ? all.filter(function (t) { return counts(t).liked; }) : byIds(a.likes)
    };
  }

  // 某帳號的回覆：[{ t: 被回覆的貼文, r: 回覆 }]（玩家剛留的排最前面）
  function repliesOf(a, all) {
    var st = state(), mine = [], data = [];
    all.forEach(function (t) {
      if (isMe(a)) (st.replies[t.id] || []).forEach(function (r) {
        mine.push({ t: t, r: { by: a.handle, text: r.text, time: T().justNow, replyTo: t.by } });
      });
      (t.replies || []).forEach(function (r) { if (r.by === a.handle) data.push({ t: t, r: r }); });
    });
    return mine.reverse().concat(data);
  }
  // 回覆分頁的一列：點了打開被回覆的那則貼文
  function replyRow(x) {
    var r = x.r, a = acc(r.by) || { handle: r.by, name: r.by }, to = r.replyTo || x.t.by;
    return '<article class="x-tw" data-xopen="' + esc(x.t.id) + '">' +
      '<div class="x-tw-in">' +
        '<a class="x-av" href="#/x/u/' + encodeURIComponent(a.handle) + '"><img src="' + esc(a.avatar) + '" alt=""></a>' +
        '<div class="x-body">' +
          '<div class="x-head">' + nameLine(a, ' · ' + esc(r.time || '')) + '</div>' +
          '<div class="x-replying">' + esc(T().replyingTo) + ' <span class="x-blue">@' + esc(to) + '</span></div>' +
          '<div class="x-text">' + rich(r.text) + '</div>' +
          images(r.images) +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function followBtn(a) {
    var f = follows(a), tt = T();
    return '<button type="button" class="x-follow' + (f ? ' on' : '') + '" data-xfollow="' + esc(a.handle) + '">' +
      esc(f === 1 ? tt.followingBtn : f === 'req' ? tt.requested : tt.follow) + '</button>';
  }

  /* ---- 正在跟隨／跟隨者名單（和 IG 一樣）----
   * data.js 帳號的 followingList / followersList：寫 handle = 遊戲裡的帳號（可以點進去）；
   *   寫 { handle, name, avatar, bio } = 路人（點不進去）
   * 另外會自動加上：自己的「正在跟隨」= 玩家跟隨中的帳號；別人的「跟隨者」= 玩家跟隨了他 → 自己的帳號
   * 數字：data.js 有寫 following / followers 就顯示那個數字，沒寫就是名單的人數 */
  function listOf(a, kind) {
    var out = [], seen = {};
    function add(x) { if (x && !seen[x.handle]) { seen[x.handle] = 1; out.push(x); } }
    (a[kind + 'List'] || []).forEach(function (x) {
      if (typeof x === 'string') add(acc(x) || { handle: x, name: x, filler: true });
      else if (x) add({ handle: x.handle, name: x.name || x.handle, avatar: x.avatar, bio: x.bio, filler: true });
    });
    if (kind === 'following' && isMe(a)) (X().accounts || []).forEach(function (x) { if (!isMe(x) && follows(x) === 1) add(acc(x.handle)); });
    if (kind === 'followers' && !isMe(a) && follows(a) === 1) add(me());
    if (kind === 'following' && isMe(a)) out = out.filter(function (x) { return x.filler || follows(x) === 1; });   // 玩家取消跟隨 → 從名單拿掉
    return out;
  }
  function countOf(a, kind) { return a[kind] != null ? a[kind] : listOf(a, kind).length; }

  function renderFollows(handle, kind) {
    var a = acc(handle), tt = T();
    if (!a) { S().replaceHash('#/x'); return; }
    if (hidden(a)) { S().replaceHash('#/x/u/' + encodeURIComponent(a.handle)); return; }
    var base = '#/x/u/' + encodeURIComponent(a.handle) + '/';
    S().$('#x-overlay').innerHTML = '';
    S().$('#x-scroll').innerHTML =
      '<div class="x-bar"><a href="#/x/u/' + encodeURIComponent(a.handle) + '" data-xback>' + ICON.back + '</a>' +
        '<div class="x-bar-t"><b>' + esc(a.name) + '</b><small>@' + esc(a.handle) + '</small></div><span></span></div>' +
      '<div class="x-ptabs x-ftabs">' + ['followers', 'following'].map(function (k) {
        return '<a data-xftab href="' + base + k + '"' + (k === kind ? ' class="on"' : '') + '>' + esc(tt[k]) + '</a>';
      }).join('') + '</div>' +
      (listOf(a, kind).map(function (x) {
        var inner = '<img src="' + esc(x.avatar || 'images/default_avatar.png') + '" alt="">' +
          '<div class="x-frow-t"><div class="x-head">' + nameLine(x) + '</div>' + (x.bio ? '<div class="x-frow-bio">' + rich(x.bio, true) + '</div>' : '') + '</div>';
        return '<div class="x-frow">' +
          (x.filler ? '<div class="x-frow-main">' + inner + '</div>' : '<a class="x-frow-main" href="#/x/u/' + encodeURIComponent(x.handle) + '">' + inner + '</a>') +
          (x.filler || isMe(x) ? '' : followBtn(x)) +
        '</div>';
      }).join('') || '<div class="x-empty">' + esc(kind === 'following' ? tt.noFollowing : tt.noFollowers) + '</div>');
  }

  /* ---- 編輯個人資料：名稱、簡介、保護你的貼文（不公開帳號） ---- */
  function renderEdit() {
    var m = me(), tt = T();
    S().$('#x-overlay').innerHTML = '';
    S().$('#x-scroll').innerHTML =
      '<form class="x-edit" id="x-edit" autocomplete="off">' +
        '<div class="x-bar x-edit-bar"><a href="#/x/u/' + encodeURIComponent(m.handle) + '" data-xback class="x-edit-cancel">' + esc(tt.cancel) + '</a>' +
          '<b>' + esc(tt.editProfile) + '</b><button type="submit" class="x-edit-save">' + esc(tt.save) + '</button></div>' +
        '<div class="x-banner x-edit-banner"' + (m.banner ? ' style="background-image:url(&quot;' + esc(m.banner) + '&quot;)"' : '') + '></div>' +
        '<div class="x-prof"><div class="x-prof-top"><img class="x-prof-av" src="' + esc(m.avatar) + '" alt=""></div></div>' +
        '<label class="x-field"><span>' + esc(tt.nameLabel) + '</span><input name="nm" maxlength="50" value="' + esc(m.name) + '"></label>' +
        '<label class="x-field"><span>' + esc(tt.bioLabel) + '</span><textarea name="bio" rows="3" maxlength="160">' + esc(m.bio || '') + '</textarea></label>' +
        '<button type="button" class="x-field x-switch-row" data-xprivacy><span><b>' + esc(tt.protectLabel) + '</b>' +
          '<small id="x-privacy-note"' + (m.protected ? '' : ' hidden') + '>' + esc(tt.protectNote) + '</small></span>' +
          '<i class="x-switch' + (m.protected ? ' on' : '') + '" id="x-privacy"></i></button>' +
      '</form>';
    S().$('#x-edit').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target, st = state(), was = !!me().protected, now = S().$('#x-privacy').classList.contains('on');
      st.profile = { name: f.nm.value.trim() || me().handle, bio: f.bio.value.trim(), protected: now };
      save(st);
      if (was !== now) S().setFlag((now ? 'x_private_' : 'x_public_') + me().handle);   // 改成不公開／公開（進度旗標）
      S().goBack('#/x/u/' + encodeURIComponent(me().handle));
    });
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

  // 個人檔案往下捲 → 頭貼移到封面後面
  document.addEventListener('scroll', function (e) {
    if (e.target.id === 'x-scroll') e.target.classList.toggle('x-scrolled', e.target.scrollTop > 40);
  }, true);

  var current = [];
  function route(parts) {
    current = parts;
    if (parts[0] === 'u' && parts[1] !== profHandle) { profHandle = parts[1]; profTab = 'posts'; }
    S().$('#x-scroll').scrollTop = 0;
    if (parts[0] === 't') renderTweet(parts[1]);
    else if (parts[0] === 'edit') renderEdit();
    else if (parts[0] === 'u' && (parts[2] === 'following' || parts[2] === 'followers')) renderFollows(parts[1], parts[2]);
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
      save(st); repaint(); return;
    }
    if ((el = e.target.closest('[data-xftab]'))) {   // 名單頁切換分頁：取代目前這頁
      e.preventDefault(); S().replaceHash(el.getAttribute('href')); return;
    }
    if (e.target.closest('[data-xprivacy]')) {
      var sw = S().$('#x-privacy'); sw.classList.toggle('on');
      S().$('#x-privacy-note').hidden = !sw.classList.contains('on');
      return;
    }
    if ((el = e.target.closest('[data-xtab]'))) {
      profTab = el.dataset.xtab;
      app.querySelectorAll('[data-xtab]').forEach(function (b) { b.classList.toggle('on', b === el); });
      app.querySelectorAll('[data-xpane]').forEach(function (p) { p.hidden = p.dataset.xpane !== profTab; });
      return;
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
