/* KakaoTalk 通話（語音通話／FaceTalk 視訊通話）
 *   打出去：聊天室右上角的電話鍵 → 選語音或視訊 → 對方有寫 call 劇本就會接，沒有就「對方未接聽」
 *   打進來：data.js 的 kakao.incoming（達成旗標後過幾秒對方打來，任何畫面都會跳出來）
 *   通話結束後，聊天室會多一則通話紀錄
 * 劇本格式（call / incoming 共用）：nodes 裡每一段有 lines（逐句字幕）和 choices（選項）
 *   lines：who = "them" / "me"；text = 字幕；sub = 字幕下的小字；ms = 這句停留多久
 *   choices：label；next = 接到哪一段；hangup: true = 直接掛斷；say: false = 不顯示成玩家說的話
 *   段落可寫 flag（走到這段記錄旗標）；沒有 choices 的段落講完自動掛斷（waitMs、endFlag） */
(function () {
  'use strict';

  var ICON = {
    mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
    speaker: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
    flip: '<svg viewBox="0 0 24 24"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2l1.5-2h4l1.5 2h2A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M9 12.5a3 3 0 0 1 5.4-1.8M15 13.5a3 3 0 0 1-5.4 1.8" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M14.6 9.2v1.7h-1.7M9.4 16.8v-1.7h1.7" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    call: '<svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/></svg>',
    video: '<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="13" height="12" rx="2.5" fill="currentColor"/><path d="M16.5 10.5 21.5 7.5v9l-5-3z" fill="currentColor"/></svg>'
  };
  ICON.end = ICON.call.replace('<svg viewBox="0 0 24 24">', '<svg viewBox="0 0 24 24" style="transform:rotate(135deg)">');

  function S() { return window.SOSHO; }
  function K() { return S().data.kakao || {}; }
  function TX() {
    var t = K().text || {}, d = {
      voiceTalk: 'KakaoTalk 語音通話', faceTalk: 'FaceTalk', calling: '正在撥號⋯', incoming: '來電中⋯',
      noAnswer: '對方未接聽', ended: '通話結束', mute: '靜音', speaker: '擴音', flip: '切換鏡頭', end: '結束',
      accept: '接聽', decline: '拒絕', callSheetVoice: '語音通話', callSheetVideo: '視訊通話（FaceTalk）', cancel: '取消'
    };
    Object.keys(t).forEach(function (k) { d[k] = t[k]; });
    return d;
  }
  function esc(s) { return S().esc(s); }
  function KK() { return window.SOSHO_KAKAO; }

  var call = null;   // 目前的通話 { f, type, out, ov, timer, clock, secs, script, node, line, connected, incoming }

  function fmt(n) { return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0'); }
  function el(id) { return document.getElementById(id); }

  // 通話畫面：對方頭貼放大模糊當背景（和 KakaoTalk 一樣）
  function overlay(f, type, incoming) {
    var t = TX(), ov = document.createElement('div');
    ov.className = 'kc' + (type === 'video' ? ' kc-video' : '');
    ov.id = 'kc';
    ov.innerHTML =
      '<div class="kc-bg" style="background-image:url(&quot;' + esc(f.avatar) + '&quot;)"></div>' +
      '<div class="kc-top">' + (type === 'video' ? ICON.video : ICON.call) + '<span>' + esc(type === 'video' ? t.faceTalk : t.voiceTalk) + '</span></div>' +
      '<div class="kc-who">' +
        '<img src="' + esc(f.avatar) + '" alt="">' +
        '<b>' + esc(f.name) + '</b>' +
        '<span id="kc-status"></span>' +
      '</div>' +
      '<div class="kc-caps" id="kc-caps"></div>' +
      '<div class="kc-choices" id="kc-choices"></div>' +
      (incoming
        ? '<div class="kc-btns kc-in">' +
            '<div><button type="button" class="kc-red" data-kc-decline>' + ICON.end + '</button><span>' + esc(t.decline) + '</span></div>' +
            '<div><button type="button" class="kc-green" data-kc-accept>' + (type === 'video' ? ICON.video : ICON.call) + '</button><span>' + esc(t.accept) + '</span></div>' +
          '</div>'
        : controls(type));
    document.getElementById('phone').appendChild(ov);
    void ov.offsetWidth; ov.classList.add('show');
    S().setDarkStatus(true);
    return ov;
  }
  function controls(type) {
    var t = TX();
    return '<div class="kc-btns">' +
      '<div><button type="button" class="kc-tog" data-kc-tog>' + ICON.mic + '</button><span>' + esc(t.mute) + '</span></div>' +
      (type === 'video'
        ? '<div><button type="button" class="kc-tog" data-kc-tog>' + ICON.flip + '</button><span>' + esc(t.flip) + '</span></div>'
        : '<div><button type="button" class="kc-tog" data-kc-tog>' + ICON.speaker + '</button><span>' + esc(t.speaker) + '</span></div>') +
      '<div><button type="button" class="kc-red" data-kc-end>' + ICON.end + '</button><span>' + esc(t.end) + '</span></div>' +
    '</div>';
  }
  function status(s) { var e = el('kc-status'); if (e) e.textContent = s; }

  // 這個好友目前可以接的劇本：call 可以寫一個，或寫成清單（第一個 flag 達成的那個）
  function scriptOf(f) {
    var c = f.call;
    if (!c) return null;
    var list = [].concat(c);
    return list.filter(function (x) { return !x.flag || S().hasFlag(x.flag); })[0] || null;
  }

  /* ---- 打出去 ---- */
  function start(id, type) {
    if (call) return;
    var f = KK().friend(id);
    if (!f || f.group || f.self) return;
    type = type || 'voice';
    var sc = scriptOf(f);
    call = { f: f, type: type, out: true, ov: overlay(f, type, false), secs: 0 };
    status(TX().calling);
    if (sc && (!sc.type || sc.type === type)) {
      call.timer = setTimeout(function () { connect(sc); }, sc.ringMs || 3000);
    } else {
      call.timer = setTimeout(function () {
        status(TX().noAnswer);
        call.timer = setTimeout(function () { finish(); }, 1500);
      }, (K().noAnswerMs || 8000));
    }
  }

  /* ---- 打進來 ---- */
  var IKEY = 'riiiize-kakao-calls';
  function tick() {
    if (!S() || call) return;
    if (document.getElementById('lock')) return;   // 手機還鎖著就等解鎖
    var list = K().incoming || [], st = S().load(IKEY, null) || {}, now = Date.now();
    st.fired = st.fired || {}; st.since = st.since || {};
    list.some(function (c) {
      var need = [].concat(c.when || []);
      if (st.fired[c.id] || !need.every(S().hasFlag)) return false;
      if (!st.since[c.id]) { st.since[c.id] = now; S().save(IKEY, st); }
      if (now - st.since[c.id] < (c.delay || 0)) return false;
      st.fired[c.id] = 1; S().save(IKEY, st);
      ring(c);
      return true;
    });
  }
  setInterval(tick, 1000);

  function ring(c) {
    var f = KK().friend(c.room);
    if (!f) return;
    var type = c.type || 'voice';
    call = { f: f, type: type, out: false, cfg: c, ov: overlay(f, type, true), secs: 0, incoming: true };
    status(TX().incoming);
    // 一直不接 → 當作沒接
    call.timer = setTimeout(decline, c.ringFor || 30000);
  }
  function decline() {
    if (!call || !call.incoming) return;
    var c = call.cfg;
    S().setFlag(c.declineFlag);
    KK().addCall(call.f.id, { from: 'them', call: call.type });   // 未接來電
    close();
  }
  function accept() {
    if (!call || !call.incoming) return;
    clearTimeout(call.timer);
    var c = call.cfg, b = c.branch || {};
    var startNode = b.replied || b.notReplied ? (KK().replied(c.room) ? b.replied : b.notReplied) : (c.start || 'start');
    call.incoming = false;
    call.ov.querySelector('.kc-btns').outerHTML = controls(call.type);
    connect({ start: startNode, nodes: c.nodes });
  }

  /* ---- 接通後的字幕對話 ---- */
  function connect(sc) {
    if (!call) return;
    call.connected = true;
    call.script = sc;
    call.ov.classList.add('connected');
    status(fmt(0));
    call.clock = setInterval(function () { call.secs++; status(fmt(call.secs)); }, 1000);
    goNode(sc.start || 'start');
  }
  function goNode(id) {
    if (!call) return;
    var node = ((call.script || {}).nodes || {})[id];
    if (!node) { hangUp(); return; }
    call.node = node; call.line = 0;
    if (node.flag) S().setFlag(node.flag);
    el('kc-choices').innerHTML = '';
    nextLine();
  }
  function addCap(who, text, sub) {
    var box = el('kc-caps'), d = document.createElement('div');
    d.className = 'kc-cap ' + (who === 'me' ? 'me' : 'them');
    d.innerHTML = '<div>' + esc(text) + '</div>' + (sub ? '<small>' + esc(sub) + '</small>' : '');
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
  }
  function nextLine() {
    if (!call || !call.node) return;
    clearTimeout(call.timer);
    var lines = call.node.lines || [];
    if (call.line >= lines.length) { afterLines(); return; }
    var l = lines[call.line++];
    addCap(l.who, l.text, l.sub);
    var len = String(l.text || '').length + String(l.sub || '').length * .5;
    call.timer = setTimeout(nextLine, l.ms || Math.min(4500, 1200 + len * 60));
  }
  function afterLines() {
    var node = call.node;
    if (node.choices && node.choices.length) {
      el('kc-choices').innerHTML = node.choices.map(function (c, i) {
        return '<button type="button" data-kc-choice="' + i + '">' + esc(c.label) +
          (c.sub && c.sub !== c.label ? '<small>' + esc(c.sub) + '</small>' : '') + '</button>';
      }).join('');
      var box = el('kc-caps'); box.scrollTop = box.scrollHeight;
      return;
    }
    call.timer = setTimeout(function () { if (node.endFlag) S().setFlag(node.endFlag); hangUp(); }, node.waitMs || 1600);
  }
  function choose(i) {
    if (!call || !call.node) return;
    var c = (call.node.choices || [])[i];
    if (!c) return;
    el('kc-choices').innerHTML = '';
    if (c.hangup) { hangUp(); return; }
    if (c.say !== false) addCap('me', c.say || c.label, c.sub);
    call.timer = setTimeout(function () { goNode(c.next); }, 900);
  }
  function hangUp() {
    if (!call) return;
    clearTimeout(call.timer); clearInterval(call.clock);
    status(TX().ended);
    call.timer = setTimeout(finish, 900);
  }
  // 結束：在聊天室留通話紀錄（有接通 = 通話長度；打出去沒接通 = 已取消）
  function finish() {
    if (!call) return;
    var msg = { from: call.out ? 'me' : 'them', call: call.type };
    if (call.connected) msg.duration = Math.floor(call.secs / 60) + ':' + String(call.secs % 60).padStart(2, '0');
    else if (call.out) msg.cancelled = true;
    KK().addCall(call.f.id, msg);
    close();
  }
  function close() {
    if (!call) return;
    clearTimeout(call.timer); clearInterval(call.clock);
    var ov = call.ov;
    call = null;
    ov.classList.remove('show');
    setTimeout(function () { ov.remove(); }, 250);
    S().setDarkStatus(false);
  }

  // 換頁時狀態列會被重設：通話中保持白字
  window.addEventListener('hashchange', function () { if (call) setTimeout(function () { S().setDarkStatus(true); }, 0); });

  document.addEventListener('click', function (e) {
    if (!call || !call.ov.contains(e.target)) return;
    var b;
    if (e.target.closest('[data-kc-end]')) { if (call.connected) hangUp(); else finish(); return; }
    if (e.target.closest('[data-kc-accept]')) { accept(); return; }
    if (e.target.closest('[data-kc-decline]')) { clearTimeout(call.timer); decline(); return; }
    if ((b = e.target.closest('[data-kc-choice]'))) { choose(+b.dataset.kcChoice); return; }
    if ((b = e.target.closest('[data-kc-tog]'))) { b.classList.toggle('on'); return; }
    // 點字幕跳到下一句
    if (e.target.closest('.kc-cap') && call.node && !(call.node.choices && call.line >= (call.node.lines || []).length)) nextLine();
  });

  window.SOSHO_KAKAO_CALL = { start: start, busy: function () { return !!call; } };
})();
