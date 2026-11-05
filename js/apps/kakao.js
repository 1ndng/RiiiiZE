/* KakaoTalk：聊天列表（#/kakao）、聊天室（#/kakao/chat/好友id） */
(function () {
  'use strict';

  var KEY = 'riiiize-kakao';    // { msgs: { 好友id: [玩家傳的訊息＋自動回覆] }, unread: { 好友id: 數字 } }
  var openChatId = null;      // 目前開著的聊天室

  var ICON = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 4l-8 8 8 8" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    del: '<svg viewBox="0 0 32 22"><path d="M10 1.5h19a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H10L1.5 11z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/><path d="M15.5 7l7 8M22.5 7l-7 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M12 11v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="7.8" r="1.1" fill="currentColor"/></svg>',
    video: '<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="13" height="12" rx="2.5" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M15.5 10.5 21 7.5v9l-5.5-3z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M6.6 3.5c.7-.3 1.5 0 1.9.6l1.6 2.8c.4.7.2 1.5-.4 2l-1.3 1c.9 1.9 2.4 3.4 4.3 4.3l1-1.3c.5-.6 1.3-.8 2-.4l2.8 1.6c.6.4.9 1.2.6 1.9-.6 1.6-2.1 2.6-3.8 2.4C9.6 17.8 5.2 13.4 4.6 7.7c-.2-1.7.8-3.4 2-4.2z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>',
    photo: '<svg viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="15" rx="2.5" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="8.5" cy="9.5" r="1.6" fill="currentColor"/><path d="M3.5 17l5-5 4 4 3-3 5 5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/></svg>',
    pen: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/><path d="M13.5 6.5l4 4" stroke="currentColor" stroke-width="1.8"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M12 4C7 4 3 7.2 3 11.2c0 2.5 1.6 4.7 4 6l-.8 3 3.4-2.1c.8.2 1.6.3 2.4.3 5 0 9-3.2 9-7.2S17 4 12 4z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 6.5h16M4 12h16M4 17.5h16" stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M12 19V6M6.5 11.5 12 6l5.5 5.5" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function S() { return window.SOSHO; }
  function F(t) { return window.STORY ? window.STORY.fill(t) : t; }   // {name} → 玩家的名字
  function ok(c) { return !window.GAME || window.GAME.check(c); }   // 條件（if）：js/game.js 的 GAME.check
  function fx(e) { if (window.GAME) window.GAME.apply(e); }           // 效果（effects）：好感度、關係、覺醒度、旗標

  function K() { var k = S().data.kakao || { friends: [], text: {} }; syncNicks(k); return k; }
  // 好友的備註（玩家在個人檔案改的名字，只有玩家看得到）：存在 riiiize-kakao 的 nick；清空 = 回到 data.js 的 name
  var nickRaw = null, nickK = null;
  function syncNicks(k) {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) {}
    if (raw === nickRaw && k === nickK) return;
    nickRaw = raw; nickK = k;
    var nick = {};
    try { nick = (JSON.parse(raw) || {}).nick || {}; } catch (e) {}
    (k.friends || []).forEach(function (f) {
      if (!('_name' in f)) f._name = f.name;
      f.name = nick[f.id] || f._name;
    });
  }
  function TX() { return K().text || {}; }
  function esc(s) { return S().esc(s); }
  function state() {
    var st = S().load(KEY, null) || {};
    st.msgs = st.msgs || {}; st.unread = st.unread || {};
    return st;
  }
  function findFriend(id) {
    return (K().friends || []).filter(function (f) { return String(f.id) === String(id); })[0];
  }
  // 群組聊天室：members 寫好友 id；訊息的 from 寫好友 id（或 "me"）
  function groupRoom(g) {
    var members = (g.members || []).map(findFriend).filter(Boolean);
    return {
      id: g.id, group: true, members: members,
      name: g.name || members.map(function (m) { return m.name; }).join(', '),
      avatar: (members[0] || {}).avatar,
      messages: g.messages || [], replies: g.replies || [], defaultReply: g.defaultReply || [], unread: g.unread || 0,
      call: g.call, noCall: g.noCall
    };
  }
  function groups() { return (K().groups || []).map(groupRoom); }
  // 나와의 채팅（自己的聊天室）：id 是 "me"，自己傳給自己，沒有未讀、不會自動回覆
  function selfRoom() {
    var me = K().me;
    return me ? { id: 'me', name: me.name, avatar: me.avatar, messages: me.messages || [], self: true, replies: [], defaultReply: [] } : null;
  }
  function friend(id) {
    if (String(id) === 'me') return selfRoom();
    return findFriend(id) || groups().filter(function (g) { return String(g.id) === String(id); })[0];
  }
  // 聊天列表的頭像：群組用成員頭像拼起來
  function roomAvatar(f, cls) {
    if (!f.group) return '<img class="' + cls + '" src="' + esc(f.avatar) + '" alt="">';
    var ms = f.members.slice(0, 4);
    // 群組頭貼：成員的圓形大頭照疊在一起（2 人斜對角、3 人三角形、4 人田字）
    return '<span class="' + cls + ' kk-gav n' + ms.length + '">' + ms.map(function (m) {
      return '<img src="' + esc(m.avatar) + '" alt="">';
    }).join('') + '</span>';
  }
  // 最後一則訊息的時間：最後一條日期線＋那則的時間（上午／下午 h:mm）；玩家自己傳過訊息的聊天室算最新
  function lastTime(f) {
    if ((state().msgs[f.id] || []).length) return 9e15;
    var day = 0, mins = 0;
    (f.messages || []).forEach(function (m) {
      var d = m.date && /(\d{4})\s*[年년]\s*(\d+)\s*[月월]\s*(\d+)/.exec(m.date);
      if (d) { day = Date.UTC(+d[1], d[2] - 1, +d[3]); mins = 0; return; }
      var t = /(上午|下午|오전|오후)?\s*(\d{1,2}):(\d{2})/.exec(m.time || '');
      if (t) mins = ((+t[2] % 12) + (/下午|오후/.test(t[1] || '') ? 12 : 0)) * 60 + +t[3];
    });
    return day + mins * 60000;
  }
  // 遊戲裡的「今天」（js/game.js 的日期；沒有的話用 data.js 的 kakao.today）
  //   day = 第幾天（玩家傳的訊息會記住是第幾天傳的）
  function dayText(day) { return window.GAME ? window.GAME.dateText(day) : K().today; }
  function gameDay() { return window.GAME ? window.GAME.day : 0; }
  // 聊天列表右邊的時間（和 KakaoTalk 一樣）：今天 → 時間（h:mm）；昨天 →「昨天」；更早 → 日期
  function listTime(f, last) {
    var tm = /(\d{1,2}:\d{2})/.exec(last.time || ''), hm = tm ? tm[1] : '';
    var day = null;
    messagesOf(f).forEach(function (m) {
      var d = m.date && /(\d{4})\s*[年년]\s*(\d+)\s*[月월]\s*(\d+)/.exec(m.date);
      if (d) day = [+d[1], +d[2], +d[3]];
    });
    var t = /(\d{4})\D+(\d+)\D+(\d+)/.exec(dayText() || '');
    if (!day || !t) return hm;
    var diff = Math.round((Date.UTC(+t[1], t[2] - 1, +t[3]) - Date.UTC(day[0], day[1] - 1, day[2])) / 864e5);
    if (diff <= 0) return hm;
    if (diff === 1) return TX().yesterday || '昨天';
    return day[0] === +t[1] ? day[1] + '月' + day[2] + '日' : day[0] + '/' + day[1] + '/' + day[2];
  }
  // 玩家傳的訊息、即時訊息、通話紀錄：照傳的那天補上日期線
  function messagesOf(f) {
    var base = f.messages || [], extra = state().msgs[f.id] || [];
    if (!extra.length) return base;
    var lastDate = ''; base.forEach(function (m) { if (m.date) lastDate = m.date; });
    var out = base.slice();
    extra.forEach(function (m) {
      var d = dayText(m.day || undefined);   // 舊的紀錄沒有 day → 當作今天
      if (d && d !== lastDate) { out.push({ date: d }); lastDate = d; }
      out.push(m);
    });
    return out;
  }
  function unreadOf(f) {
    if (f.self) return 0;
    var st = state();
    return st.unread[f.id] != null ? st.unread[f.id] : (f.unread || 0);
  }
  function nowTime() {
    var d = (window.GAME && window.GAME.clock ? window.GAME.clock() : new Date()), h = d.getHours(), ap = TX().ampm || ['上午', '下午'];
    return ap[h < 12 ? 0 : 1] + ' ' + (h % 12 || 12) + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function renderChats() {
    // 所有私聊＋群組（還沒有訊息的也列出來）：有未讀的排最上面，再照最後一則訊息的時間（新的在前）
    var rooms = groups().concat(K().friends || [], selfRoom() || []);
    var list = rooms.slice().sort(function (a, b) {
      var ua = unreadOf(a) ? 1 : 0, ub = unreadOf(b) ? 1 : 0;
      return (ub - ua) || (lastTime(b) - lastTime(a));
    });
    S().$('#kakao-scroll').innerHTML =
      '<div class="kk-head"><h1>' + esc(TX().chatsTitle) + '</h1>' +
        '</div>' +
      list.map(function (f) {
        var msgs = messagesOf(f).filter(function (m) { return m.text || m.image || m.video || m.expired || m.call || m.link || m.recalled; }), last = msgs[msgs.length - 1] || {}, n = unreadOf(f);
        return '<a class="kk-chatrow" href="#/kakao/chat/' + encodeURIComponent(f.id) + '">' +
          roomAvatar(f, 'kk-chatrow-av') +
          '<span class="kk-chatrow-mid"><b>' + esc(f.name) + (f.group ? '<em class="kk-count">' + (f.members.length + 1) + '</em>' : '') + (f.self ? '<i class="kk-me-tag">' + esc(TX().meTag || '我') + '</i>' : '') + '</b><small>' + esc(F(last.text) || (last.recalled ? TX().recalledText || '已收回訊息' : '') || (last.link ? linkInfo(last).title : '') || ((last.video || last.expired === 'video') ? TX().videoLabel || '影片' : (last.image || last.expired) ? TX().photoLabel || '照片' : last.call ? TX().voiceCall || '語音通話' : '')) + '</small></span>' +
          '<span class="kk-chatrow-r"><small>' + esc(listTime(f, last)) + '</small>' + (n ? '<i class="kk-badge">' + n + '</i>' : '') + '</span>' +
        '</a>';
      }).join('');
    S().$('#kakao-overlay').innerHTML = '';
  }

  /* ---- 聊天室 ---- */
  // 訊息內容：文字泡泡或照片
  // 連結訊息：{ from, link: "網址", linkTitle: "標題", linkSite: "小字" }
  function linkInfo(m) {
    return { title: m.linkTitle || m.link, site: m.linkSite || '' };
  }
  function contentHTML(m, first) {
    // 對方正在輸入（三個點）
    if (m.typing) return '<div class="kk-bubble kk-typing' + (first ? ' tail' : '') + '"><i></i><i></i><i></i></div>';
    // 收回的訊息：{ from, recalled: true }（灰色泡泡「已收回訊息」）
    if (m.recalled) {
      return '<div class="kk-bubble kk-recalled' + (first ? ' tail' : '') + '">' + ICON.info + esc(TX().recalledText || '已收回訊息') + '</div>';
    }
    if (m.link) {
      var li = linkInfo(m);
      // 外部網址另開分頁，不會離開遊戲
      return '<a class="kk-bubble kk-link' + (first ? ' tail' : '') + '" href="' + esc(m.link) + '"' +
        (m.link.charAt(0) === '#' ? '' : ' target="_blank" rel="noopener"') + '>' +
        '<small>' + esc(li.site) + '</small><b>' + esc(li.title) + '</b>' +
        '<span>' + esc(m.link) + '</span></a>';
    }
    // 通話紀錄：{ from, call: "voice", duration: "1:02:33" }（沒寫 duration = 未接；cancelled: true = 已取消）
    if (m.call) {
      var t = TX(), label = t.voiceCall || '語音通話';
      // 點通話紀錄 → 再打一次（和 KakaoTalk 一樣）
      return '<button type="button" class="kk-bubble kk-call' + (first ? ' tail' : '') + '" data-kcall>' + ICON.phone +
        '<span><b>' + esc(label) + '</b><small>' + esc(m.duration || (m.cancelled ? t.cancelledCall || '已取消' : t.missedCall || '未接')) + '</small></span></button>';
    }
    // 過期的照片：{ from, expired: true }；過期的影片：{ from, expired: "video" }（灰色方塊，點了沒反應）
    if (m.expired) return m.expired === 'video'
      ? '<div class="kk-expired">' + ICON.video + '<span>' + esc(TX().expiredVideoText || '影片已過期') + '</span></div>'
      : '<div class="kk-expired">' + ICON.photo + '<span>' + esc(TX().expiredText || '照片已過期') + '</span></div>';
    // 影片訊息：{ from, video: "images/xxx.mp4" }（點開全螢幕播放）
    if (m.video) {
      var vp = String(m.video).replace(/\.\w+$/, '') + '_poster.jpg', hasP = (window.SITE_MEDIA || []).indexOf(vp) >= 0;
      return '<button class="kk-photo kk-video" data-video="' + esc(m.video) + '">' +
        '<video src="' + esc(m.video) + '"' + (hasP ? ' poster="' + esc(vp) + '"' : '') + ' muted playsinline preload="metadata"></video>' +
        '<i class="kk-play"></i></button>';
    }
    if (m.image) return '<button class="kk-photo" data-photo="' + esc(m.image) + '"><img src="' + esc(m.image) + '" alt=""></button>';
    return '<div class="kk-bubble' + (first ? ' tail' : '') + '">' + S().multiline(F(m.text)) + '</div>';
  }

  function bubblesHTML(f) {
    var msgs = messagesOf(f), out = '';
    // 對方正在輸入 → 最後面多一個「⋯」泡泡
    if (typing[f.id]) msgs = msgs.concat([{ from: f.group ? (typing[f.id] !== true ? typing[f.id] : (f.members[0] || {}).id) : 'them', typing: true }]);
    msgs.forEach(function (m, i) {
      if (m.date) { out += '<div class="kk-date"><span>' + esc(m.date) + '</span></div>'; return; }
      var prev = msgs[i - 1], next = msgs[i + 1];
      var first = !prev || prev.date || prev.from !== m.from;
      // 同一個人、同一分鐘的連續訊息，只有最後一則顯示時間
      var showTime = !next || next.date || next.from !== m.from || next.time !== m.time;
      if (m.from === 'me') {
        // 對方還沒回 → 顯示未讀數（1:1 是「1」，群組是還沒回話的人數）
        // 只有最後一天（最後一條日期線之後）的訊息會顯示；更早的都當作已讀
        var later = msgs.slice(i + 1), unread = 0;
        var isOld = later.some(function (x) { return x.date; });
        if (m.read !== true && !isOld && !f.self) {
          unread = f.group
            ? f.members.filter(function (mem) { return !later.some(function (x) { return x.from === mem.id; }); }).length
            : (later.some(function (x) { return x.from === 'them'; }) ? 0 : 1);
        }
        out += '<div class="kk-msg me' + (first ? ' first' : '') + '">' +
          '<span class="kk-meta">' + (unread ? '<i>' + unread + '</i>' : '') + (showTime ? '<small>' + esc(m.time || '') + '</small>' : '') + '</span>' +
          contentHTML(m, first) +
        '</div>';
      } else {
        var who = f.group ? (findFriend(m.from) || { name: m.from, avatar: '' }) : f;   // 群組：照 from 找是誰說的
        out += '<div class="kk-msg them' + (first ? ' first' : '') + '">' +
          (first ? '<img class="kk-av" src="' + esc(who.avatar) + '" alt=""' + (who.id ? ' data-kprof="' + esc(who.id) + '"' : '') + '>' : '<span class="kk-av"></span>') +
          '<div class="kk-them-col">' +
            (first ? '<div class="kk-name">' + esc(who.name) + '</div>' : '') +
            '<div class="kk-row">' + contentHTML(m, first) +
            (showTime ? '<small class="kk-meta">' + esc(m.time || '') + '</small>' : '') + '</div>' +
          '</div>' +
        '</div>';
      }
    });
    return out;
  }

  function paintChat() {
    var f = friend(openChatId), box = document.getElementById('kk-msgs');
    if (!f || !box) return;
    box.innerHTML = bubblesHTML(f);
    box.scrollTop = box.scrollHeight;
    // 照片載入後聊天室會變高：玩家還沒往上滑之前，一直停在最新的訊息
    var stick = true;
    box.ontouchstart = box.onwheel = box.onpointerdown = function () { stick = false; };
    box.querySelectorAll('img').forEach(function (img) {
      if (!img.complete) img.addEventListener('load', function () { if (stick) box.scrollTop = box.scrollHeight; });
    });
  }

  function renderChat(id) {
    var f = friend(id);
    if (!f) { S().replaceHash('#/kakao'); return; }
    openChatId = f.id;
    S().setFlag('chat_' + f.id);   // 打開過這個聊天室（進度旗標）
    var st = state(); st.unread[f.id] = 0; S().save(KEY, st);
    renderChats();
    S().$('#kakao-overlay').innerHTML =
      '<div class="kk-chat">' +
        '<div class="kk-chat-head">' +
          ((dc && dc.room === f.id) || (dcAfter && dcRoom === f.id) ? '<span></span>' : '<a href="#/kakao" data-kback>' + ICON.back + '</a>') +   // 每日聊天進行中：不能離開
          '<b' + (f.group || f.self ? '' : ' data-kprof="' + esc(f.id) + '"') + '>' + esc(f.name) + (f.group ? '<em class="kk-count">' + (f.members.length + 1) + '</em>' : '') + (f.self ? '<i class="kk-me-tag">' + esc(TX().meTag || '我') + '</i>' : '') + '</b>' +
          // 右上角：電話鍵（1:1 或群組通話；noCall: true = 沒有）＋群組的選單鍵（看聊天室成員）
          '<span class="kk-head-btns">' +
            (f.self || f.noCall || !window.SOSHO_KAKAO_CALL ? '' : '<button type="button" class="kk-callbtn" data-kcall aria-label="call">' + ICON.phone + '</button>') +
            (f.group ? '<button type="button" class="kk-callbtn" data-kmembers aria-label="members">' + ICON.menu + '</button>' : '') +
          '</span>' +
        '</div>' +
        '<div class="kk-msgs" id="kk-msgs"></div>' +
        '<div class="kk-choices" id="kk-choices"></div>' +
        '<form class="kk-input" id="kk-form" autocomplete="off">' +
          '<label class="kk-field"><input name="m" placeholder="' + esc(TX().inputPlaceholder) + '" autocomplete="off"></label>' +
          '<button type="submit" class="kk-send" disabled>' + ICON.send + '</button>' +
        '</form>' +
      '</div>';
    paintChat();
    var form = S().$('#kk-form');
    paintChoices();
    form.m.addEventListener('input', function () { form.querySelector('.kk-send').disabled = !form.m.value.trim(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = form.m.value.trim();
      if (!text) return;
      var chosen = picked, set = activeChoices(f);
      push(f.id, { from: 'me', text: text, time: nowTime() });
      form.m.value = '';
      form.querySelector('.kk-send').disabled = true;
      if (chosen && set && set.id === '__daychat') { dayChatChose(chosen.o); return; }
      if (chosen && set) {
        // 選項式回覆：這組選項用掉了 → 套用效果、記錄旗標、照這個選項的回覆
        var st = state(); st.usedChoices = st.usedChoices || {}; st.usedChoices[set.id] = chosen.i; S().save(KEY, st);
        fx(chosen.o.effects);
        [].concat(chosen.o.flag || []).forEach(function (fl) { S().setFlag(fl); });
        pick(null);
        paintChat(); paintChoices();
        runReply(f, chosen.o, [].concat(chosen.o.reply || []));
      } else {
        paintChat();
        scheduleReply(f, text);
      }
    });
  }

  /* ---- 選項式回覆 ----
   * data.js 好友（或群組）的 choices：[{ id, if, options: [{ text, effects, flag, reply, read, typing }] }]
   *   從上往下找第一組「還沒用過、if 成立」的選項，顯示在輸入框上面
   *   選項排成一行，太多可以左右滑；點選項 → 文字放進輸入框（不能修改；點別的選項 = 換掉），按送出才傳
   *   有選項時不能自己打字；沒有選項時照舊可以打字（關鍵字回覆） */
  var picked = null;   // { i: 選項編號, o: 選項 }
  function activeChoices(f) {
    if (dc && dc.room === f.id) return dc.ask ? { id: '__daychat', options: dc.ask.choices.filter(function (o) { return ok(o.if); }) } : null;
    var used = state().usedChoices || {};
    return (f.choices || []).filter(function (c) { return c.id && !(c.id in used) && ok(c.if); })[0] || null;
  }
  function paintChoices() {
    var f = friend(openChatId), box = document.getElementById('kk-choices'), form = document.getElementById('kk-form');
    if (!f || !box || !form) return;
    var set = activeChoices(f), t = TX();
    // 每日聊天：聊完 → 輸入框換成「繼續」；聊天中 → 不能自己打字
    if (dcAfter && dcRoom === f.id) {
      box.hidden = false; box.classList.add('kk-done-bar'); form.style.display = 'none';
      box.innerHTML = '<button type="button" class="kk-chip kk-daydone" data-kdaydone>' + esc(t.dayChatDone || '繼續') + '</button>';
      return;
    }
    form.style.display = ''; box.classList.remove('kk-done-bar');
    if (picked && (!set || set.options[picked.i] !== picked.o)) pick(null);
    box.innerHTML = set ? set.options.map(function (o, i) {
      return '<button type="button" class="kk-chip' + (picked && picked.i === i ? ' on' : '') + '" data-kchoice="' + i + '">' + esc(F(o.text)) + '</button>';
    }).join('') : '';
    box.hidden = !set;
    form.m.readOnly = !!set || !!(dc && dc.room === f.id);
    form.m.placeholder = set ? (t.choicePlaceholder || '選擇要回覆的內容') : t.inputPlaceholder;
  }
  function pick(choice) {
    var form = document.getElementById('kk-form');
    picked = choice;
    if (!form) return;
    form.m.value = choice ? F(choice.o.text) : '';
    form.querySelector('.kk-send').disabled = !choice;
    document.querySelectorAll('#kk-choices .kk-chip').forEach(function (b) { b.classList.toggle('on', !!choice && +b.dataset.kchoice === choice.i); });
  }

  function push(id, msg) {
    var st = state();
    msg.day = msg.day || gameDay();
    (st.msgs[id] = st.msgs[id] || []).push(msg);
    S().save(KEY, st);
  }

  // 關鍵字自動回覆：訊息包含任一個 keyword → 依序送出 reply
  var typing = {};   // 正在顯示「輸入中」的聊天室
  function setTyping(id, on) {
    typing[id] = on;
    if (openChatId === id) paintChat();
  }
  function scheduleReply(f, text) {
    var lower = text.toLowerCase(), lines = null, rule = null;
    (f.replies || []).some(function (r) {
      if (r.flag && !S().hasFlag(r.flag)) return false;
      if (!ok(r.if)) return false;
      var kws = r.keywords || [];
      var hit = !kws.length || kws.some(function (k) { return k && lower.indexOf(String(k).toLowerCase()) >= 0; });
      if (hit && (r.exclude || []).some(function (k) { return lower.indexOf(String(k).toLowerCase()) >= 0; })) hit = false;
      if (hit) { rule = r; lines = [].concat(r.reply || []); fx(r.effects); }
      return hit;
    });
    if (!lines) lines = [].concat(f.defaultReply || []);
    runReply(f, rule, lines);
  }
  // 回覆：rule.read = 秒讀、rule.typing = 輸入中的時間；lines = 依序傳來的訊息
  function runReply(f, rule, lines) {
    var wait = 1500;
    if (rule && rule.read) {
      // 秒讀：玩家剛傳的訊息旁的「1」消失
      setTimeout(function () {
        var st = state(), mine = (st.msgs[f.id] || []).filter(function (m) { return m.from === 'me'; });
        if (mine.length) { mine[mine.length - 1].read = true; S().save(KEY, st); }
        if (openChatId === f.id) paintChat();
      }, 400);
      wait = 900;
    }
    if (rule && rule.typing) {
      // 輸入中：照 typing 的時間輪流顯示／消失
      var t = wait;
      rule.typing.forEach(function (ms, k) {
        var on = k % 2 === 0;
        setTimeout(function () { setTyping(f.id, on); }, t);
        t += ms;
      });
      setTimeout(function () { setTyping(f.id, false); }, t);
      wait = t;
    }
    lines.forEach(function (line, i) {
      setTimeout(function () {
        // 回覆可以寫字串，或 { from: "好友id", text: "..." }（群組用來指定誰回）
        var from = f.group ? ((line && line.from) || (f.members[0] || {}).id) : 'them';
        var msg = { from: from, time: nowTime() };
        if (line && typeof line === 'object') { if (line.image) msg.image = line.image; msg.text = line.text; } else msg.text = line;
        push(f.id, msg);
        if (line && typeof line === 'object' && line.flag) S().setFlag(line.flag);   // 這句回覆傳來時記錄旗標
        if (openChatId === f.id && location.hash.indexOf('#/kakao/chat/') === 0) { paintChat(); paintChoices(); }
        else {
          var st = state(); st.unread[f.id] = unreadOf(f) + 1; S().save(KEY, st);
          if (location.hash.indexOf('#/kakao') === 0) route(current);
        }
      }, wait + i * 900);
    });
  }

  /* ---- 每日聊天（data.js 的 kakao.dayChats）：那天的主線劇情結束後，自動打開聊天室跑一段聊天 ----
   * 由 js/plan.js 在晚上呼叫；聊天進行中不能離開聊天室；聊完：
   *   不能用手機的日子 → 出現「繼續」，按了進入下一天
   *   能用手機的日子（星期日）→ 直接自由使用手機
   * 進度存在 riiiize-kakao 的 dayChat（重新整理會從中斷的地方繼續） */
  var dc = null;   // { def, room, i, ask, done, free }
  // 每段聊天的 id：寫了 id 用 id（同一天好幾段時要寫），沒寫用日期
  function dcId(def) { return def.id || def.date; }
  function dayChatKey(def) { return 'daychat_' + dcId(def); }
  function dayChatStart(def, done, free) {
    var st = state(); st.dayChat = st.dayChat || {};
    dc = { def: def, room: def.room, i: st.dayChat[dcId(def)] || 0, ask: null, done: done, free: free };
    // 用「取代」打開聊天室：不留在上一頁的紀錄裡，聊完按返回 = 回到 KakaoTalk 聊天列表（不會回到前一段強制聊天）
    S().replaceHash('#/kakao/chat/' + encodeURIComponent(def.room));
    // intro：打開聊天室後，先用劇情對話框播一段（背景 = 變暗的手機畫面），播完才開始聊天
    if (def.intro && dc.i === 0 && window.STORY) {
      setTimeout(function () { window.STORY.play(def.intro, function () { setTimeout(dayChatNext, 500); }, null, 'phone-dim'); }, 700);
    } else setTimeout(dayChatNext, 800);
  }
  function dayChatSave() { var st = state(); st.dayChat = st.dayChat || {}; st.dayChat[dcId(dc.def)] = dc.i; S().save(KEY, st); }
  function dayChatPaint() { if (openChatId === dc.room) { paintChat(); paintChoices(); } }
  function dayChatNext() {
    if (!dc) return;
    var steps = dc.def.steps || [];
    while (dc.i < steps.length) {
      var s = steps[dc.i];
      if (!ok(s.if)) { dc.i++; continue; }
      if (s.choices) { dc.ask = s; dayChatPaint(); return; }   // 等玩家選、按送出
      if (s.effects) fx(s.effects);
      if (s.flag) [].concat(s.flag).forEach(function (fl) { S().setFlag(fl); });
      if (s.text == null && !s.image) { dc.i++; dayChatSave(); if (s.wait) { setTimeout(dayChatNext, s.wait); return; } continue; }
      dayChatIncoming(s, function () { dc.i++; dayChatSave(); setTimeout(dayChatNext, 500); });
      return;
    }
    dayChatEnd();
  }
  // 對方傳來一則：先顯示「輸入中」，再出現訊息
  function dayChatIncoming(s, next) {
    var f = friend(dc.room), from = f && f.group ? (s.from || (f.members[0] || {}).id) : 'them';
    setTimeout(function () {
      if (!dc) return;
      setTyping(dc.room, f && f.group ? from : true);
      setTimeout(function () {
        if (!dc) return;
        typing[dc.room] = false;
        var msg = { from: from, time: nowTime() };
        if (s.text != null) msg.text = s.text;
        if (s.image) msg.image = s.image;
        push(dc.room, msg);
        dayChatPaint();
        next();
      }, s.typing != null ? s.typing : 900 + Math.min(1600, String(s.text || '').length * 40));
    }, s.wait || 300);
  }
  // 玩家選了一個選項、按了送出：套用效果、旗標，對方照 reply 回覆後接著往下
  function dayChatChose(o) {
    fx(o.effects);
    [].concat(o.flag || []).forEach(function (fl) { S().setFlag(fl); });
    dc.ask = null; dc.i++; dayChatSave();
    pick(null); dayChatPaint();
    var lines = [].concat(o.reply || []).map(function (l) { return typeof l === 'string' ? { text: l } : l; }), k = 0;
    (function one() {
      if (!dc) return;
      if (k >= lines.length) { setTimeout(dayChatNext, 400); return; }
      dayChatIncoming(lines[k++], one);
    })();
  }
  function dayChatEnd() {
    var d = dc;
    S().setFlag(dayChatKey(d.def));
    dc = null;
    // 星期日：聊完直接自由使用手機（返回鍵回來了）；其他日子：輸入框換成「繼續」，按了進入下一天
    if (!d.free) { dcAfter = d.done; dcRoom = d.room; }
    if (openChatId === d.room) renderChat(d.room);
    if (d.free) d.done();
  }
  var dcAfter = null;
  // 每日聊天進行中：離開聊天室 → 拉回來
  window.addEventListener('hashchange', function () {
    var want = (dc || dcAfter) && '#/kakao/chat/' + encodeURIComponent((dc || {}).room || dcRoom);
    if (want && location.hash !== want) location.hash = want;
  });
  var dcRoom = null;

  /* ---- 即時訊息（data.js 的 kakao.live）：達成某個旗標後，過幾秒對方自己傳訊息來 ----
     { id, when: "旗標", delay: 毫秒, room: "聊天室 id", from: "誰傳", text: "…", unlessReplied: true }
     unlessReplied = 玩家在那個聊天室回過話就不傳 */
  function liveTick() {
    var evs = K().live || [];
    if (!evs.length || !S()) return;
    var st = state(), now = Date.now(), changed = false;
    st.fired = st.fired || {}; st.since = st.since || {};
    evs.forEach(function (ev) {
      // when 可以寫一個旗標，或好幾個（全部達成才算）；unless = 有這個旗標就不傳
      var need = [].concat(ev.when), key = need.join('+');
      if (st.fired[ev.id] || !need.every(S().hasFlag) || !ok(ev.if)) return;
      if (!st.since[key]) { st.since[key] = now; changed = true; }
      if (now - st.since[key] < (ev.delay || 0)) return;
      st.fired[ev.id] = 1; changed = true;
      var replied = (st.msgs[ev.room] || []).some(function (m) { return m.from === 'me'; });
      if (ev.unlessReplied && replied) return;
      if (ev.unless && S().hasFlag(ev.unless)) return;
      st.sent = st.sent || {};
      if (ev.unlessSent && st.sent[ev.unlessSent]) return;   // 某則即時訊息已經傳過就不傳
      st.sent[ev.id] = 1;
      if (ev.flag) S().setFlag(ev.flag);   // 傳來時記錄旗標（例如讓下一組選項出現）
      var msg = { from: ev.from || 'them', time: nowTime() };
      ['text', 'link', 'linkTitle', 'linkSite', 'image'].forEach(function (k) { if (ev[k]) msg[k] = ev[k]; });
      msg.day = gameDay();
      (st.msgs[ev.room] = st.msgs[ev.room] || []).push(msg);
      var viewing = openChatId === ev.room && location.hash.indexOf('#/kakao/chat/') === 0;
      if (!viewing) st.unread[ev.room] = (st.unread[ev.room] != null ? st.unread[ev.room] : ((friend(ev.room) || {}).unread || 0)) + 1;
      S().save(KEY, st);
      if (viewing) paintChat();
      else {
        if (location.hash.indexOf('#/kakao') === 0 && !openChatId) route(current);
        banner(friend(ev.room), ev);
      }
      changed = false;
    });
    if (changed) S().save(KEY, st);
  }
  setInterval(liveTick, 1000);
  // 給通話（kakaocall.js）用
  window.SOSHO_KAKAO = {
    friend: function (id) { return friend(id); },
    // 每日聊天（js/plan.js）：今天有沒有、開始跑
    dayChatFor: function (md) {
      return (K().dayChats || []).filter(function (c) { return c.date === md && ok(c.if) && !S().hasFlag(dayChatKey(c)); })[0] || null;
    },
    dayChat: function (def, done, free) { dayChatStart(def, done, free); },
    dayChatting: function () { return !!(dc || dcAfter); },
    // 鎖定畫面的通知：有未讀的聊天室 → [{ id, title, text, time, count }]（最新的在前）
    // 鎖定畫面的通知：每一則未讀訊息各一張（不疊在一起）→ [{ id, title, text, time }]，新的在前
    unreadList: function () {
      var rooms = groups().concat(K().friends || []), t = TX(), out = [];
      rooms.filter(function (f) { return unreadOf(f) > 0; }).sort(function (a, b) { return lastTime(b) - lastTime(a); }).forEach(function (f) {
        var msgs = messagesOf(f).filter(function (m) { return m.from !== 'me' && !m.date && (m.text || m.image || m.video || m.call || m.link || m.expired || m.recalled); });
        msgs.slice(-unreadOf(f)).reverse().forEach(function (m) {   // 這個聊天室的未讀訊息（新的在前）
          var who = f.group ? (findFriend(m.from) || {}).name : '';
          var text = F(m.text) || (m.link ? linkInfo(m).title : m.call ? (m.duration ? t.voiceCall || '語音通話' : t.missedCall || '未接來電')
            : (m.video || m.expired === 'video') ? t.videoLabel || '影片' : (m.image || m.expired) ? t.photoLabel || '照片' : m.recalled ? t.recalledText || '已收回訊息' : '');
          out.push({ id: f.id, title: f.group ? (who ? who + ' · ' : '') + f.name : f.name, text: text, time: m.time || '' });
        });
      });
      return out;
    },
    replied: function (id) { return (state().msgs[id] || []).some(function (m) { return m.from === 'me'; }); },
    // 通話結束 → 聊天室多一則通話紀錄；對方打來沒接的算未讀
    addCall: function (id, msg) {
      var st = state();
      msg.time = nowTime(); msg.day = gameDay();
      (st.msgs[id] = st.msgs[id] || []).push(msg);
      var viewing = openChatId === id && location.hash.indexOf('#/kakao/chat/') === 0;
      if (msg.from !== 'me' && !msg.duration && !viewing) st.unread[id] = (st.unread[id] != null ? st.unread[id] : ((friend(id) || {}).unread || 0)) + 1;
      S().save(KEY, st);
      if (viewing) paintChat();
      else if (location.hash.indexOf('#/kakao') === 0) route(current);
    }
  };

  // 通知橫幅（和 iPhone 一樣從上面滑下來）：頭貼（群組用群組頭像）＋傳訊息的人＋內容；點了打開聊天室
  var bannerTimer = null;
  function banner(f, ev) {
    if (!f) return;
    if (document.getElementById('lock')) return;   // 手機鎖著：不跳橫幅，直接變成鎖定畫面上的通知
    if (window.STORY && window.STORY.playing()) return;   // 劇情進行中：不打斷（訊息照樣收到，變成未讀）
    var phone = document.getElementById('phone'), old = document.getElementById('kk-banner');
    if (!phone) return;
    if (old) old.remove();
    var who = f.group ? (findFriend(ev.from) || {}).name || f.name : f.name;
    var el = document.createElement('a');
    el.id = 'kk-banner'; el.className = 'kk-banner';
    el.href = '#/kakao/chat/' + encodeURIComponent(f.id);
    el.innerHTML = roomAvatar(f, 'kk-banner-av') +
      '<small class="kk-banner-now">' + esc(TX().now || '現在') + '</small>' +
      '<span class="kk-banner-txt"><b>' + esc(who) + '</b><span>' + esc(ev.text || (ev.link ? TX().linkNotice || '傳送了一條連結' : ev.image ? TX().photoLabel || '照片' : '')) + '</span></span>';
    phone.appendChild(el);
    void el.offsetWidth; el.classList.add('show');
    function hide() {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 400);
    }
    el.addEventListener('click', function () { clearTimeout(bannerTimer); hide(); });
    // 往上滑也能收起來
    var y0 = null;
    el.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchmove', function (e) { if (y0 !== null && e.touches[0].clientY - y0 < -15) { y0 = null; clearTimeout(bannerTimer); hide(); } }, { passive: true });
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(hide, 4500);
  }

  /* ---- 進入 KakaoTalk 前要輸入密碼（data.js 的 kakao.passcode；解開一次就記住，重新開始會清掉） ---- */
  var typed = '';
  function locked() { return !!K().passcode && !S().hasFlag('kakao_unlocked'); }
  function renderLock() {
    S().setFlag('kakao_lock_seen');   // 看過密碼畫面（解鎖提示用）
    var t = TX(), keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
    typed = '';
    S().$('#kakao-overlay').innerHTML = '';
    S().$('#kakao-scroll').innerHTML =
      '<div class="kk-lock">' +
        '<div class="kk-lock-title">' + esc(t.lockTitle || '輸入密碼') + '</div>' +
        (t.lockHint ? '<div class="kk-lock-hint">' + esc(t.lockHint) + '</div>' : '') +
        '<div class="kk-lock-dots" id="kk-lock-dots">' + String(K().passcode).split('').map(function () { return '<i></i>'; }).join('') + '</div>' +
        '<div class="kk-lock-keys">' + keys.map(function (k) {
          if (!k) return '<span></span>';
          return k === 'del'
            ? '<button type="button" class="kk-lock-del" data-kpin="del" aria-label="' + esc(t.lockDelete || '刪除') + '">' + ICON.del + '</button>'
            : '<button type="button" class="kk-lock-key" data-kpin="' + k + '">' + k + '</button>';
        }).join('') + '</div>' +
      '</div>';
  }
  function pressPin(k) {
    var code = String(K().passcode), dots = S().$('#kk-lock-dots');
    if (!dots) return;
    if (k === 'del') typed = typed.slice(0, -1);
    else if (typed.length < code.length) typed += k;
    dots.querySelectorAll('i').forEach(function (d, i) { d.classList.toggle('on', i < typed.length); });
    if (typed.length < code.length) return;
    if (typed === code) {
      S().setFlag('kakao_unlocked');
      setTimeout(function () { route(current); }, 150);
    } else {
      // 密碼錯：搖一下、清空
      setTimeout(function () {
        dots.classList.add('shake');
        setTimeout(function () {
          typed = ''; dots.classList.remove('shake');
          dots.querySelectorAll('i').forEach(function (d) { d.classList.remove('on'); });
        }, 400);
      }, 120);
    }
  }

  var current = [];
  function route(parts) {
    current = parts;
    openChatId = null; picked = null;
    if (locked()) renderLock();
    else if (parts[0] === 'chat' && parts[1]) renderChat(parts[1]);
    else renderChats();
  }

  // 群組的聊天室成員（和 KakaoTalk 一樣從右邊滑出來）：自己在最上面，點成員打開和他的聊天室
  function me() {
    var pl = S().load('riiiize-player', null) || {};
    return { name: pl.name || TX().meName || '我', avatar: pl.avatar || 'images/default_avatar.png' };
  }
  function openMembers(f) {
    var t = TX(), m = me(), d = document.createElement('div');
    d.className = 'kk-drawer';
    d.innerHTML = '<div class="kk-drawer-bg" data-kdclose></div>' +
      '<div class="kk-drawer-panel">' +
        '<div class="kk-drawer-head"><b>' + esc(t.membersTitle || '聊天室成員') + '</b><span>' + (f.members.length + 1) + '</span></div>' +
        '<div class="kk-drawer-list">' +
          '<div class="kk-mem"><img src="' + esc(m.avatar) + '" alt=""><b>' + esc(m.name) + '</b><i class="kk-me-tag">' + esc(t.meTag || '我') + '</i></div>' +
          f.members.map(function (x) {
            return '<button type="button" class="kk-mem" data-kprof="' + esc(x.id) + '"><img src="' + esc(x.avatar) + '" alt=""><b>' + esc(x.name) + '</b></button>';
          }).join('') +
        '</div>' +
      '</div>';
    S().$('#kakao-overlay').appendChild(d);
    void d.offsetWidth; d.classList.add('show');
  }
  function closeMembers() {
    var d = document.querySelector('.kk-drawer');
    if (!d) return;
    d.classList.remove('show');
    setTimeout(function () { d.remove(); }, 250);
  }
  window.addEventListener('hashchange', function () {
    var d = document.querySelector('.kk-drawer'); if (d) d.remove();
    var p = document.querySelector('.kk-prof'); if (p) p.remove();
  });

  /* ---- 好友的個人檔案（和 KakaoTalk 一樣）：大頭照、名字、1:1 聊天、語音通話；名字旁的筆可以改備註 ---- */
  function openProfile(id) {
    var f = findFriend(id);
    if (!f) return;
    var old = document.querySelector('.kk-prof'); if (old) old.remove();
    var t = TX(), p = document.createElement('div');
    p.className = 'kk-prof';
    function paint(editing) {
      p.innerHTML =
        '<div class="kk-prof-bg" style="background-image:url(&quot;' + esc(f.avatar) + '&quot;)"></div>' +
        '<button type="button" class="kk-prof-x" data-kpclose aria-label="close">' + ICON.close + '</button>' +
        '<div class="kk-prof-main">' +
          '<img src="' + esc(f.avatar) + '" alt="">' +
          (editing
            ? '<form class="kk-prof-edit" autocomplete="off"><input name="n" maxlength="20" value="' + esc(f.name) + '" placeholder="' + esc(f._name || '') + '">' +
                '<button type="submit">' + esc(t.nickDone || '完成') + '</button></form>' +
              '<small>' + esc(t.nickHint || '設定的名稱只有你看得到；清空 = 恢復原本的名字') + '</small>'
            : '<b>' + esc(f.name) + (f.noNick ? '' : '<button type="button" class="kk-prof-pen" data-kpedit aria-label="edit">' + ICON.pen + '</button>') + '</b>' +
              (f.status ? '<small>' + esc(F(f.status)) + '</small>' : '')) +
        '</div>' +
        '<div class="kk-prof-acts">' +
          '<a href="#/kakao/chat/' + encodeURIComponent(f.id) + '">' + ICON.chat + '<span>' + esc(t.profileChat || '1:1 聊天') + '</span></a>' +
          (f.noCall || !window.SOSHO_KAKAO_CALL ? '' : '<button type="button" data-kpcall>' + ICON.phone + '<span>' + esc(t.voiceCall || '語音通話') + '</span></button>') +
        '</div>';
      if (editing) {
        var form = p.querySelector('form'), inp = form.n;
        inp.focus(); inp.select();
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var st = state(), v = inp.value.trim();
          st.nick = st.nick || {};
          if (v && v !== f._name) st.nick[f.id] = v; else delete st.nick[f.id];
          S().save(KEY, st);
          K();   // 套用新的備註
          paint(false);
          refresh();
        });
      }
    }
    p.addEventListener('click', function (e) {
      if (e.target.closest('[data-kpclose]')) { p.classList.remove('show'); S().setDarkStatus(false); setTimeout(function () { p.remove(); }, 200); return; }
      if (e.target.closest('[data-kpedit]')) { paint(true); return; }
      if (e.target.closest('[data-kpcall]')) { p.remove(); window.SOSHO_KAKAO_CALL.start(f.id); return; }
    });
    paint(false);
    S().$('#kakao-overlay').appendChild(p);
    void p.offsetWidth; p.classList.add('show');
    S().setDarkStatus(true);
  }
  // 改了備註：重畫目前的畫面（聊天列表或聊天室的名字），個人檔案留著
  function refresh() {
    var p = document.querySelector('.kk-prof'), d = document.querySelector('.kk-drawer');
    if (p) p.remove(); if (d) d.remove();
    route(current);
    if (p) { S().$('#kakao-overlay').appendChild(p); S().setDarkStatus(true); }
  }

  document.addEventListener('click', function (e) {
    var app = document.getElementById('app-kakao');
    if (!app || !app.contains(e.target)) return;
    // 選項式回覆：點選項 → 放進輸入框（點別的就換掉）
    var ch = e.target.closest('[data-kchoice]');
    if (ch) {
      var set = activeChoices(friend(openChatId)), i = +ch.dataset.kchoice;
      if (set) pick({ i: i, o: set.options[i] });
      return;
    }
    // 通話：電話鍵或點通話紀錄 → 語音通話
    var kp = e.target.closest('[data-kprof]');
    if (kp && !e.target.closest('.kk-prof')) { openProfile(kp.dataset.kprof); return; }
    if (e.target.closest('[data-kdaydone]') && dcAfter) { var fn = dcAfter; dcAfter = null; dcRoom = null; fn(); return; }   // 「繼續」→ 下一天
    if (e.target.closest('[data-kmembers]') && openChatId) { openMembers(friend(openChatId)); return; }
    if (e.target.closest('[data-kdclose]')) { closeMembers(); return; }
    var kc = e.target.closest('[data-kcall]');
    if (kc && openChatId) { window.SOSHO_KAKAO_CALL.start(openChatId); return; }
    var pin = e.target.closest('[data-kpin]');
    if (pin) { pressPin(pin.dataset.kpin); return; }
    var back = e.target.closest('[data-kback]');
    if (back) {
      // 聊天室的返回：回到聊天列表
      e.preventDefault();
      S().goBack('#/kakao');
      return;
    }
    var vd = e.target.closest('[data-video]');
    if (vd) {
      // 點影片 → 全螢幕播放（有聲音），點一下關閉
      var w = document.createElement('div');
      w.className = 'kk-viewer';
      w.innerHTML = '<video src="' + esc(vd.dataset.video) + '" playsinline autoplay controls></video>';
      w.onclick = function (ev) { if (ev.target.nodeName !== 'VIDEO') { w.remove(); S().setDarkStatus(false); } };
      S().$('#kakao-overlay').appendChild(w);
      S().setDarkStatus(true);
      return;
    }
    var ph = e.target.closest('[data-photo]');
    if (ph) {
      // 點照片 → 全螢幕檢視，點一下關閉
      var v = document.createElement('div');
      v.className = 'kk-viewer';
      v.innerHTML = '<img src="' + esc(ph.dataset.photo) + '" alt="">';
      v.onclick = function () { v.remove(); S().setDarkStatus(false); };
      S().$('#kakao-overlay').appendChild(v);
      S().setDarkStatus(true);
      return;
    }
  });

  (window.SOSHO_APPS = window.SOSHO_APPS || {}).kakao = route;
})();
