/* =========================================================
 * Reriize 自動測試：改完劇情或程式後跑一次，確認主要流程沒有壞掉
 *
 *   node tools/test.js            全部跑一次（約 2～3 分鐘）
 *   node tools/test.js 結局        只跑名稱裡有「結局」的項目
 *
 * 需要 Node.js 和 Playwright（第一次：npm i -D playwright && npx playwright install chromium）
 * 測試用的是 data.js 現在的內容；測試會在自己的瀏覽器裡跑，不會動到你瀏覽器裡的進度和存檔
 * ========================================================= */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.json': 'application/json' };

// ---------- 小工具 ----------
function serve() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.join(ROOT, p);
      if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, () => resolve(server));
  });
}
const MONTHS = ['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'];
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 開一個新頁面；seed = 先放進 localStorage 的進度；title: true = 要看到標題畫面
async function open(browser, base, seed, opt) {
  opt = opt || {};
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  await page.addInitScript(([seed, showTitle]) => {
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    localStorage.clear();
    Object.keys(seed || {}).forEach(k => localStorage.setItem(k, typeof seed[k] === 'string' ? seed[k] : JSON.stringify(seed[k])));
    if (!showTitle) sessionStorage.setItem('riiiizeSkipTitle', '1');
    if (!seed || !seed.riiiizeNoTrial) localStorage.setItem('riiiizeNoTrial', '1');   // 試玩版的阻擋（game.trialEnd）：測試時關掉，試玩版的測試另外開
  }, [seed, !!opt.title]);
  await page.goto(base + '/#/home');
  await sleep(1200);
  // 從星期日晚上開始的測試：先把「自由探索手機」的提醒點掉（等 2 秒的劇情間隔）
  if (opt.keepFreePhone) return page;
  // 只有星期日晚上會出現：等一下它出現，點完它
  const sunNight = await page.evaluate(() => window.GAME && GAME.phase === 'night' && GAME.date(GAME.day).getDay() === 0);
  if (!sunNight) return page;
  let seen = false;
  for (let i = 0; i < 40; i++) {
    // 提醒 = 蓋在鎖定畫面上的劇情框（.vn.over-lock）；不看文字，改了台詞也認得
    if (await page.$('.vn.over-lock')) { seen = true; await page.click('.vn', { timeout: 1000 }).catch(() => {}); await sleep(200); continue; }
    if (seen && !(await page.$('.vn'))) break;
    if (!seen && i > 15) break;
    await sleep(200);
  }
  return page;
}
// 進度的基本設定：已經過了開場
// 9/7 晚上的聊天已經聊完（從 9/7 晚上直接睡覺的測試用）
// 每天的一句話（__narrate）：點掉，回傳現在播的劇情 id
async function curScene(p) {
  return p.evaluate(() => { const s = (window.STORY && STORY.scene && STORY.scene()) || ''; if (s === '__narrate') { const v = document.getElementById('vn-box') || document.querySelector('.vn'); if (v) v.click(); } return s; });
}
const NIGHT7_FLAGS = { alarm_done: 1, intro_done: 1, 'daychat_09-07': 1, daychat_0907_helper: 1 };
function played(extra) {
  return Object.assign({
    'riiiize-player': { name: '測試', birthday: '10-14' },
    'riiiize-flags': { alarm_done: 1, intro_done: 1 },
    'riiiize-plan': { months: MONTHS.reduce((o, m) => (o[m] = 1, o), {}), days: {} }
  }, extra || {});
}
// 每日聊天：遇到選項就選第一個、送出，直到出現「繼續」
async function chatThrough(page, ms) {
  const end = Date.now() + (ms || 40000);
  while (Date.now() < end) {
    if (await page.evaluate(() => !(window.SOSHO_KAKAO && SOSHO_KAKAO.dayChatting()))) return true;   // 聊完了（自動進入下一天）
    const chip = await page.$('#kk-choices .kk-chip:not([data-kdaydone])');
    if (chip) { await chip.click().catch(() => {}); await sleep(200); await page.click('.kk-send').catch(() => {}); }
    await sleep(400);
  }
  return false;
}
// 一直點劇情對話框，直到 until() 成立（或沒有對話框了）
// choose = 遇到選項就點第一個（不寫 = 停在選項）
async function clickStory(page, until, max, choose) {
  for (let i = 0; i < (max || 60); i++) {
    if (until && await until()) return true;
    if (await page.$('[data-vn-choice]')) {
      if (!choose) return !!(until && await until());
      await page.click('[data-vn-choice]', { timeout: 2000 }).catch(() => {}); await sleep(300); continue;
    }
    const vn = await page.$('.vn');
    if (!vn) { if (!until) return true; await sleep(300); continue; }
    await page.click('.vn', { timeout: 2000 }).catch(() => {});
    await sleep(120);
  }
  return until ? await until() : true;
}
async function unlock(page, code) {
  await page.mouse.move(195, 780); await page.mouse.down(); await page.mouse.move(195, 300, { steps: 10 }); await page.mouse.up();
  await sleep(600);
  for (const c of code) { await page.click('[data-lock="' + c + '"]'); await sleep(80); }
  await sleep(1200);
}
const text = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent : null; }, sel);
const game = page => page.evaluate(() => ({ day: GAME.day, phase: GAME.phase, loop: GAME.loop() }));

// ---------- 測試項目 ----------
const TESTS = [
  ['標題畫面：五個按鈕，沒進度時「繼續」「讀檔」不能按', async (b, base) => {
    const p = await open(b, base, {}, { title: true });
    const btns = await p.$$eval('.title-scr .title-v', a => a.map(x => x.firstChild.textContent + (x.disabled ? '(不能按)' : '')));
    if (btns.join('、') !== '開始、繼續(不能按)、讀取(不能按)、語言、音效') throw new Error('按鈕：' + btns.join('、'));
    await p.click('.title-scr button[data-t="go"]'); await sleep(800);
    if (!(await p.$('.vn-name'))) throw new Error('按了開始沒有出現輸入名字');
    return p;
  }],
  ['第一次遊玩：名字 → 生日 → 照片 → 不想配對 → 開始 → 鬧鐘 → 鎖定畫面 → 開場', async (b, base) => {
    const p = await open(b, base, {});
    await p.fill('.vn-name input', '小明'); await p.click('.vn-name button[type=submit]'); await sleep(500);
    await p.click('.vn-name button[type=submit]'); await sleep(500);   // 生日（預設值）
    await p.click('.vn-name button[type=submit]'); await sleep(500);   // 照片：下一步
    // 不想配對：選元彬（和我）、元彬×燦榮（成員之間），再點一次元彬取消
    await p.click('[data-blk-me=m4]'); await p.click('[data-blk-pair="m4-m6"]'); await p.click('[data-blk-me=m4]');
    const blk = await p.evaluate(() => JSON.stringify(GAME.block()));
    if (blk !== '{"me":[],"pairs":["m4-m6"]}') throw new Error('不想配對沒有存好：' + blk);
    await p.click('.vn-name button[type=submit]'); await sleep(500);   // 不想配對：下一步
    await p.click('.vn-name button[type=submit]'); await sleep(900);   // 開始遊戲
    const knob = await p.$('#alarm-knob'); if (!knob) throw new Error('沒有鬧鐘');
    const bb = await knob.boundingBox();
    await p.mouse.move(bb.x + 10, bb.y + 10); await p.mouse.down(); await p.mouse.move(bb.x + 400, bb.y + 10, { steps: 10 }); await p.mouse.up();
    await sleep(900);
    if (!(await p.$('#lock'))) throw new Error('沒有鎖定畫面');
    const bday = await p.evaluate(() => JSON.parse(localStorage.getItem('riiiize-player')).birthday.replace('-', ''));
    await unlock(p, bday);
    if (!(await p.$('.vn'))) throw new Error('解鎖後沒有開場劇情');
    await clickStory(p, async () => p.evaluate(() => INTRO.exploring()), 200);   // 中間有停在手機畫面的 2、2、2 秒
    await p.evaluate(() => location.hash = '#/kakao'); await sleep(1500);
    const ok = await clickStory(p, async () => (await text(p, '.vn-text') || '').indexOf('校門') >= 0, 120);
    if (!ok) throw new Error('打開 KakaoTalk 後沒有進到 9/1');
    return p;
  }],
  ['開學週：9/1 劇情 → 元彬的聊天 → 繼續 → 9/2', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-plan': { months: {}, days: {} } }));
    await clickStory(p, async () => (await p.evaluate(() => location.hash)).indexOf('#/kakao/chat/') === 0, 250);   // 中間有元彬的出場動畫（9 秒）
    if (await p.evaluate(() => location.hash) !== '#/kakao/chat/f4') throw new Error('沒有跳到元彬的聊天室');
    if (!(await chatThrough(p))) throw new Error('每日聊天沒有聊完');
    await sleep(3500);   // 聊完自動進入下一天（沒有「繼續」）
    const g = await game(p); if (g.day !== 2) throw new Error('沒有進入 9/2，現在第 ' + g.day + ' 天');
    return p;
  }],
  ['每天一句話：9/8 先出「9/8（一），你去了舞室。（好感度：…）」，再播當天的劇情；平日不出卡片', async (b, base) => {
    const days = { '09-08': 'club', '09-09': 'volunteer' };
    const visits = { club: 1, volunteer: 1, home: 1 };
    const p = await open(b, base, played({ 'riiiize-plan': { months: MONTHS.reduce((o, m) => (o[m] = 1, o), {}), days }, 'riiiize-game': { day: 7, phase: 'night' }, 'riiiize-flags': NIGHT7_FLAGS, 'riiiize-stats': { visits } }));
    await p.evaluate(() => { SITE_DATA.storySpeed = 1; SITE_DATA.plan.random.chance = 0; const l = document.getElementById('lock'); if (l) l.parentNode.removeChild(l); document.getElementById('phone').classList.remove('locked'); PLAN.go(); });
    let t = '';
    for (let i = 0; i < 40 && !/9\/8（一）/.test(t); i++) { t = await p.evaluate(() => (document.querySelector('.vn') || {}).textContent || ''); await sleep(250); }
    if (!/9\/8（一），你去了舞室。（好感度：(將太郎|元彬|炤熙) \+\d/.test(t)) throw new Error('9/8 的一句話不對：' + t);
    // 點掉 → 自動往下一天（9/9 小學）
    for (let i = 0; i < 60 && !/9\/9（二）/.test(t); i++) { await curScene(p); t = await p.evaluate(() => (document.querySelector('.vn') || {}).textContent || ''); await sleep(250); }
    if (!/9\/9（二），你去了小學。/.test(t)) throw new Error('9/9 的一句話不對：' + t);
    if (await p.$('.wk')) throw new Error('平日不該出現每週卡片');
    const log = await p.evaluate(() => JSON.parse(localStorage.getItem('riiiize-weekpend') || '[]').map(x => x.act).join(','));
    if (log !== 'club,volunteer') throw new Error('這週的紀錄不對：' + log);
    return p;
  }],
  ['每週卡片：星期日晚上按睡覺 → 列出週一～週日（含星期日出遊）＋這週加了多少好感，之後到星期一', async (b, base) => {
    const wk = [
      { day: 8, act: 'club', met: ['m1', 'm4'], fx: { aff: { m1: 2, m4: 2 }, pair: { 'm1-m4': 15 } }, rnd: [] },
      { day: 9, act: 'home', met: [], fx: null, rnd: [] },
      { day: 14, act: 'sunday', met: ['m4'], fx: { aff: { m4: 10 }, pair: {} }, rnd: [] }
    ];
    const p = await open(b, base, played({ 'riiiize-game': { day: 14, phase: 'night' }, 'riiiize-flags': Object.assign({ freephone_14: 1, 'daychat_09-14': 1 }, NIGHT7_FLAGS), 'riiiize-weekpend': wk }));
    await p.evaluate(() => { SITE_DATA.plan.random.chance = 0; const l = document.getElementById('lock'); if (l) l.parentNode.removeChild(l); document.getElementById('phone').classList.remove('locked'); PLAN.go(); });
    await p.waitForSelector('.wk', { timeout: 8000 });
    const rows = await p.$$eval('.wk li', a => a.map(x => x.textContent));
    if (rows.length !== 3 || !/9\/14（日）出遊/.test(rows[2])) throw new Error('卡片的列不對：' + rows.join('｜'));
    const gain = await p.$eval('.wk-gain', e => e.textContent);
    if (!/\+12/.test(gain)) throw new Error('元彬這週應該 +12：' + gain);
    await p.click('[data-wk-go]'); await sleep(3500);
    const g = await game(p); if (g.day !== 15) throw new Error('卡片之後應該到 9/15，現在第 ' + g.day + ' 天');
    return p;
  }],
  ['9/8～9/13 沒有日程劇情：第 3 次去體育館也不停，但次數照算，固定劇情記下來之後補播', async (b, base) => {
    const days = { '09-08': 'sports' };
    const p = await open(b, base, played({ 'riiiize-plan': { months: MONTHS.reduce((o, m) => (o[m] = 1, o), {}), days }, 'riiiize-game': { day: 7, phase: 'night' }, 'riiiize-flags': NIGHT7_FLAGS, 'riiiize-stats': { visits: { sports: 2 } } }));
    await p.evaluate(() => { SITE_DATA.plan.random.chance = 1; const l = document.getElementById('lock'); if (l) l.parentNode.removeChild(l); document.getElementById('phone').classList.remove('locked'); PLAN.go(); });
    for (let i = 0; i < 40 && !(await p.$('.wk')); i++) { if (await p.evaluate(() => /^(act|rand|sp)_/.test((window.STORY && STORY.scene && STORY.scene()) || ''))) throw new Error('9/8 不該有日程劇情'); await sleep(250); }
    const v = await p.evaluate(() => [GAME.stat('visits', 'sports'), SOSHO.hasFlag('ms_pending_sports_3')].join(','));
    if (v !== '3,true') throw new Error('9/8～9/13 要算次數、記下第 3 次：' + v);
    return p;
  }],
  ['9/8～9/13 舞室照常有劇情（plan.quietOpen）：第 3 次去社團 → 播 act_club_3', async (b, base) => {
    const days = { '09-08': 'club' };
    const p = await open(b, base, played({ 'riiiize-plan': { months: MONTHS.reduce((o, m) => (o[m] = 1, o), {}), days }, 'riiiize-game': { day: 7, phase: 'night' }, 'riiiize-flags': NIGHT7_FLAGS, 'riiiize-stats': { visits: { club: 2 } } }));
    await p.evaluate(() => { SITE_DATA.plan.random.chance = 0; const l = document.getElementById('lock'); if (l) l.parentNode.removeChild(l); document.getElementById('phone').classList.remove('locked'); PLAN.go(); });
    let sc = '';
    for (let i = 0; i < 40 && sc !== 'act_club_3'; i++) { sc = await curScene(p); await sleep(250); }
    if (sc !== 'act_club_3') throw new Error('9/8 第 3 次去舞室沒有播 act_club_3：' + sc);
    return p;
  }],
  ['日程規劃：每週重複 → 照已排好的星期幾填滿這個月，已排的不動', async (b, base) => {
    const days = { '10-06': 'club', '10-07': 'council', '10-15': 'games' };
    const p = await open(b, base, played({ 'riiiize-plan': { months: MONTHS.filter(m => m !== '2025-10').reduce((o, m) => (o[m] = 1, o), {}), days }, 'riiiize-game': { day: 31, phase: 'morning' }, 'riiiize-flags': NIGHT7_FLAGS }));
    await p.evaluate(() => { PLAN.openPlanner(); });
    await p.waitForSelector('[data-repeat]', { timeout: 8000 });
    await p.click('[data-repeat]'); await sleep(300);
    const got = await p.$$eval('[data-pday]', a => a.reduce((o, x) => { const k = x.querySelector('.blk'); o[x.dataset.pday] = k ? k.dataset.act : ''; return o; }, {}));
    const want = { '10-13': 'club', '10-20': 'club', '10-27': 'club', '10-14': 'council', '10-28': 'council', '10-08': 'games', '10-22': 'games', '10-15': 'games', '10-09': '', '10-10': '', '10-11': '' };
    for (const k in want) if (got[k] !== want[k]) throw new Error(k + ' 應該是「' + want[k] + '」，現在是「' + got[k] + '」');
    return p;
  }],
  ['KakaoTalk：好感的愛心照好感填滿（元彬 225 / 告白 450 = 50%）', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 7, phase: 'night' }, 'riiiize-flags': NIGHT7_FLAGS, 'riiiize-stats': { aff: { m4: 225 } } }));
    await p.evaluate(() => { const l = document.getElementById('lock'); if (l) l.parentNode.removeChild(l); document.getElementById('phone').classList.remove('locked'); location.hash = '#/kakao/chat/f4'; });
    await p.waitForSelector('.kk-chat-head [data-kprof]', { timeout: 8000 });
    await p.click('.kk-chat-head [data-kprof]');
    await p.waitForSelector('.kk-prof .kk-heart', { timeout: 4000 });
    const h = await p.$eval('.kk-prof .kk-heart', e => e.style.getPropertyValue('--h'));
    if (h !== '50%') throw new Error('愛心應該填 50%：' + h);
    return p;
  }],
  ['劇情回想：送禮、愛情線、CP 線看過的才打開；設定首頁有總收集率', async (b, base) => {
    const flags = Object.assign({ scene_gift_m4: 1, scene_love_m4_1: 1, scene_cp_m4_m6_1: 1 }, NIGHT7_FLAGS);
    const p = await open(b, base, played({ 'riiiize-game': { day: 7, phase: 'night' }, 'riiiize-flags': flags }));
    await p.evaluate(() => { const l = document.getElementById('lock'); if (l) l.parentNode.removeChild(l); document.getElementById('phone').classList.remove('locked'); location.hash = '#/settings'; });
    await p.waitForSelector('[data-collect]', { timeout: 8000 });
    const pc = await p.$eval('[data-collect]', e => e.textContent);
    if (!/^\d+%$/.test(pc)) throw new Error('總收集率：' + pc);
    await p.evaluate(() => { location.hash = '#/settings/replay'; });
    await p.waitForSelector('[data-st-go^="#/settings/replay/"]', { timeout: 8000 });
    const cats = await p.$$eval('[data-st-go^="#/settings/replay/"]', a => a.map(x => [x.querySelector('.st-label').textContent, x.dataset.stGo]));
    const openIds = [];
    if (cats.some(x => x[0] === '友誼線')) throw new Error('友誼線已經刪掉了');
    for (const t of ['送禮', '愛情線', 'CP 線']) {
      const c = cats.find(x => x[0] === t); if (!c) throw new Error('回想少了「' + t + '」：' + cats.map(x => x[0]).join('、'));
      await p.evaluate(h => { location.hash = h; }, c[1]); await sleep(400);
      openIds.push(...await p.$$eval('[data-rp]', a => a.map(x => x.dataset.rp)));
      if (t === '愛情線') {
        const lock = await p.$$eval('.st-rp-item[disabled] b', a => a.map(x => x.textContent));
        if (!lock.some(x => /^元彬　？？？$/.test(x))) throw new Error('鎖住的愛情線要顯示是誰：' + lock.slice(0, 3).join('｜'));
      }
    }
    for (const id of ['gift_m4', 'love_m4_1', 'cp_m4_m6_1']) if (openIds.indexOf(id) < 0) throw new Error(id + ' 應該打開');
    if (openIds.indexOf('love_m4_2') >= 0) throw new Error('沒看過的 love_m4_2 不該打開');
    return p;
  }],
  ['安靜期間錯過的固定劇情：9/14 之後第一次去那裡時補播', async (b, base) => {
    const days = { '09-15': 'club' };
    const p = await open(b, base, played({ 'riiiize-plan': { months: MONTHS.reduce((o, m) => (o[m] = 1, o), {}), days }, 'riiiize-game': { day: 14, phase: 'night' },
      'riiiize-flags': Object.assign({ ms_pending_club_3: 1, 'daychat_09-14': 1 }, NIGHT7_FLAGS), 'riiiize-stats': { visits: { club: 4 } } }));
    await p.evaluate(() => { SITE_DATA.plan.random.chance = 0; const l = document.getElementById('lock'); if (l) l.parentNode.removeChild(l); document.getElementById('phone').classList.remove('locked'); PLAN.go(); });
    let sc = '';
    for (let i = 0; i < 40 && sc !== 'act_club_3'; i++) { sc = await curScene(p); await sleep(250); }
    if (sc !== 'act_club_3') throw new Error('沒有補播社團第 3 次：' + sc);
    return p;
  }],
  ['愛情線選擇：被排除的人不進愛情線、被排除的兩人沒有 CP 線；重新打開會補播', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 40, phase: 'night' } }));
    const r = await p.evaluate(() => {
      const A = (id, v) => GAME.addStat('aff', id, v - GAME.stat('aff', id)), P = (k, v) => GAME.addStat('pair', k, v - GAME.stat('pair', k));
      const q = () => { const x = PLAN.bondFor(GAME.day); return x ? (x.id || x.kind) : '-'; };
      GAME.setBlock({ me: ['m4'], pairs: ['m4-m6'] });
      const out = [];
      A('m4', 310); out.push(q());                        // 元彬好感夠曖昧，但被排除 → 沒有愛情線
      A('m4', 0); P('m4-m6', 300); out.push(q());          // 元彬×燦榮關係夠了，但被排除 → 沒有 CP 線
      out.push(GAME.blockedAny(['m6', 'm4']), GAME.blockedAny(['m4', 'm5']));
      return out.join(',');
    });
    if (r !== '-,-,true,false') throw new Error(r);
    // 重新打開 → 記 catchup（下一個有事的日子補播）
    const r2 = await p.evaluate(() => {
      const o = [];
      GAME.setBlock({ me: [], pairs: [] }); o.push(GAME.bondCatchup());
      GAME.clearBondCatchup();
      GAME.setBlock({ me: ['m1', 'm2', 'm3', 'm5', 'm6'], pairs: [] }); o.push(GAME.bondCatchup());
      return o.join(',');
    });
    if (r2 !== 'true,false') throw new Error('補播：' + r2);
    return p;
  }],
  ['開學週的強制日程也算次數（9/2 學生會 +1，重新整理不會重複算）', async (b, base) => {
    // 9/2 的主線已經看過（直接進放學的日程處理）
    const p = await open(b, base, played({ 'riiiize-game': { day: 2, phase: 'afterschool' }, 'riiiize-flags': { alarm_done: 1, intro_done: 1, scene_d0902: 1 } }));
    let v = 0;
    for (let i = 0; i < 40 && !v; i++) { v = await p.evaluate(() => GAME.stat('visits', 'council')); await sleep(250); }
    await p.reload(); await sleep(1500);
    v = await p.evaluate(() => GAME.stat('visits', 'council'));
    if (v !== 1) throw new Error('9/2 學生會應該算 1 次：' + v);
    return p;
  }],
  ['日程固定劇情：第 10 次去社團那天停下來播', async (b, base) => {
    const days = { '09-08': 'club' };
    const p = await open(b, base, played({ 'riiiize-plan': { months: MONTHS.reduce((o, m) => (o[m] = 1, o), {}), days }, 'riiiize-game': { day: 7, phase: 'night' }, 'riiiize-flags': NIGHT7_FLAGS, 'riiiize-stats': { visits: { club: 9 } } }));
    await p.evaluate(() => { SITE_DATA.plan.quietUntil = null; SITE_DATA.plan.random.chance = 0; const l = document.getElementById('lock'); if (l) l.parentNode.removeChild(l); document.getElementById('phone').classList.remove('locked'); PLAN.go(); });
    let seen = '';
    const first = await p.evaluate(() => SITE_DATA.scenes.act_club_10.filter(s => s.text)[0].text);
    for (let i = 0; i < 30 && seen.indexOf(first) < 0; i++) { await curScene(p); seen = await p.evaluate(() => (document.querySelector('.vn') || {}).textContent || ''); await sleep(300); }
    if (seen.indexOf(first) < 0) throw new Error('沒有播社團第 10 次的劇情');
    const g = await game(p); if (g.day !== 8) throw new Error('應該停在 9/8，現在第 ' + g.day + ' 天');
    return p;
  }],
  ['隨機劇情：機率 100% → 當天的一句話之後播，而且有加分', async (b, base) => {
    const days = { '09-08': 'club', '09-09': 'club' };
    const p = await open(b, base, played({ 'riiiize-plan': { months: MONTHS.reduce((o, m) => (o[m] = 1, o), {}), days }, 'riiiize-game': { day: 7, phase: 'night' }, 'riiiize-flags': NIGHT7_FLAGS, 'riiiize-stats': { visits: { club: 10 } } }));
    await p.evaluate(() => { SITE_DATA.plan.quietUntil = null; SITE_DATA.storySpeed = 1; SITE_DATA.plan.random.chance = 1; const l = document.getElementById('lock'); if (l) l.parentNode.removeChild(l); document.getElementById('phone').classList.remove('locked'); PLAN.go(); });
    await p.waitForSelector('.vn', { timeout: 8000 }); await sleep(400);
    let sc = '';
    for (let i = 0; i < 40 && !/^rand_club_/.test(sc); i++) { sc = await curScene(p); await sleep(250); }   // 先點掉當天的一句話
    if (!/^rand_club_/.test(sc || '')) throw new Error('先播的不是隨機劇情：' + sc);
    // 機率觸發的劇情：單人 = 那位好感 +5、兩人 = 那兩人關係 +5（播的時候加）
    const fx = await p.evaluate((sc) => { const code = sc.split('_').pop(), ids = code.split('').map(n => GAME.cast().filter(c => String(c.no) === n)[0].id);
      return ids.length === 1 ? GAME.stat('aff', ids[0]) : GAME.stat('pair', ids.slice().sort().join('-')); }, sc);
    if (fx < 5) throw new Error('隨機劇情沒有加 5：' + sc + ' = ' + fx);
    return p;
  }],
  ['試玩版：9/14 晚上自由用手機 → 按睡覺出現前方施工中，可以存檔、回到手機畫面', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 14, phase: 'night' }, 'riiiize-flags': { alarm_done: 1, intro_done: 1, freephone_14: 1, 'daychat_09-14': 1 }, riiiizeNoTrial: '0' }));
    await p.evaluate(() => { localStorage.removeItem('riiiizeNoTrial'); const l = document.getElementById('lock'); if (l) l.remove(); PLAN.go(); });
    await p.waitForSelector('.trial-end', { timeout: 15000 });
    if (await p.evaluate(() => !!document.querySelector('.vn'))) throw new Error('擋住之後還在播劇情');
    await p.click('[data-trial-save]'); await sleep(300);
    const msg = await text(p, '.trial-msg');
    const has = await p.evaluate(() => !!GAME.saves().slots[1]);
    if (!has || !/存檔 1/.test(msg || '')) throw new Error('存檔沒有成功：' + msg);
    await p.click('[data-trial-back]'); await sleep(300);
    const back = await p.evaluate(() => !document.querySelector('.trial-end') && GAME.day === 14 && GAME.phase === 'night');
    if (!back) throw new Error('回到手機畫面失敗');
    return p;
  }],
  ['星期日出遊：平常只有一句話「9/21（日），你和恩奭出去玩了。（好感度：恩奭 +10）」；20% 劇情關掉就不播', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 21, phase: 'morning' }, 'riiiize-flags': { alarm_done: 1, intro_done: 1, 'daychat_09-21': 1 } }));
    await p.evaluate(() => { SITE_DATA.storySpeed = 1; SITE_DATA.plan.weekend.scenes.forEach(e => { e.chance = 0; }); });
    await clickStory(p, async () => !!(await p.$('.sch')));
    await p.click('.sch-cast button >> nth=1'); await p.click('[data-go]');
    let t = '';
    for (let i = 0; i < 40 && !/\+10）$/.test(t || ''); i++) { await sleep(250); t = await p.evaluate(() => (document.querySelector('.vn') || {}).textContent || ''); }
    if (!/9\/21（日），你和恩奭出去玩了。（好感度：恩奭 \+10）/.test(t || '')) throw new Error('星期日的一句話不對：' + t + ' / ' + (await p.evaluate(() => [STORY.scene && STORY.scene(), document.querySelectorAll('.vn').length, SITE_DATA.storySpeed].join(','))));
    if (await p.evaluate(() => /^wk_/.test((STORY.scene && STORY.scene()) || ''))) throw new Error('機率關掉了不該播劇情');
    const n = await p.evaluate(() => Object.keys(SITE_DATA.scenes).filter(k => /^wk_m/.test(k)).length + '/' + Object.keys(SITE_DATA.scenes).filter(k => /^(sp_|wk_.*_sp$)/.test(k)).length);
    if (n !== '21/0') throw new Error('星期日劇情應該剩 21 段、沒有特殊劇情：' + n);
    return p;
  }],
  ['試玩版 9/14：先出每週卡片（連點繼續只算一次）→ 前方施工中 → 回到手機畫面，畫面沒有卡住', async (b, base) => {
    const wk = [{ day: 8, act: 'club', met: ['m4'], fx: { aff: { m4: 4 }, pair: {} }, rnd: [] }, { day: 14, act: 'sunday', met: ['m4'], fx: { aff: { m4: 10 }, pair: {} }, rnd: [] }];
    const p = await open(b, base, played({ 'riiiize-game': { day: 14, phase: 'night' }, 'riiiize-flags': { alarm_done: 1, intro_done: 1, freephone_14: 1, 'daychat_09-14': 1 }, 'riiiize-weekpend': wk, riiiizeNoTrial: '0' }));
    await p.evaluate(() => { localStorage.removeItem('riiiizeNoTrial'); const l = document.getElementById('lock'); if (l) l.remove(); PLAN.go(); });
    await p.waitForSelector('.wk', { timeout: 8000 });
    await p.evaluate(() => { const g = document.querySelector('[data-wk-go]'); g.click(); g.click(); g.click(); });
    await p.waitForSelector('.trial-end', { timeout: 8000 }); await sleep(800);
    await p.click('[data-trial-back]'); await sleep(1200);
    const r = await p.evaluate(() => ({ tr: document.querySelectorAll('.trial-end').length, stage: !!document.querySelector('#day-stage.show, #day-stage:not([hidden])') && getComputedStyle(document.getElementById('day-stage') || document.body).display !== 'none' && !!document.getElementById('day-stage') }));
    if (r.tr) throw new Error('回到手機畫面之後施工中又跑出來了');
    if (r.stage) throw new Error('回到手機畫面之後還蓋著黑底');
    return p;
  }],
  ['星期日：選人出門 → 22:00 鎖定畫面＋自由探索提醒 → 解鎖', async (b, base) => {
    // 9/21 晚上有炤熙的每晚聊天：這個測試只測沒有聊天的星期日 → 先當作聊過了
    const p = await open(b, base, played({ 'riiiize-game': { day: 21, phase: 'morning' }, 'riiiize-flags': { alarm_done: 1, intro_done: 1, 'daychat_09-21': 1 } }));
    await clickStory(p, async () => !!(await p.$('.sch')));
    await p.click('.sch-cast button >> nth=1'); await p.click('[data-go]'); await sleep(800);
    // 鎖定畫面先出現，「自由探索」提醒蓋在鎖定畫面上；點完提醒才解鎖
    await clickStory(p, async () => !!(await p.$('#lock')) && /自由探索/.test((await text(p, '#vn-text')) || ''), 80, true);
    if (!(await p.$('#lock'))) throw new Error('提醒出現時後面不是鎖定畫面');
    await clickStory(p, async () => !(await p.$('.vn')), 20, true); await sleep(500);
    if (await text(p, '#lc-time') !== '22:00') throw new Error('鎖定畫面時間不是 22:00');
    await unlock(p, '1014');
    if (await p.$('#lock')) throw new Error('沒有解鎖');
    return p;
  }],
  ['14 日送禮：請別人送（兩次選擇）', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 14, phase: 'morning' } }));
    await p.waitForSelector('.sch-col button', { timeout: 8000 });
    await p.click('.sch-col button >> nth=1'); await sleep(400);
    await p.click('.sch-cast button >> nth=0'); await p.click('[data-go]'); await sleep(400);
    const n = await p.$$eval('.sch-cast button', a => a.length);
    if (n !== 5) throw new Error('第二次選人應該少掉送禮的人，現在 ' + n + ' 人');
    await p.click('.sch-cast button >> nth=2'); await p.click('[data-go]'); await sleep(1200);
    const pair = await p.evaluate(() => GAME.stat('pair', 'm1-m4'));
    if (pair !== 15) throw new Error('關係值不對：' + pair);
    // 請將太郎送給元彬 → 播 gift_by_m1_m4
    await sleep(2000);
    const t = await text(p, '#vn-text');
    const exp = await p.evaluate(() => SITE_DATA.scenes.gift_by_m1_m4.filter(s => s.text)[0].text.slice(0, 6));
    if (!(t || '').includes(exp)) throw new Error('送禮劇情：' + t);
    return p;
  }],
  ['14 日送禮：送元彬 → gift_m4，好感 +8', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 14, phase: 'morning' } }));
    await p.waitForSelector('.sch-col button', { timeout: 8000 });
    await p.click('.sch-col button >> nth=0'); await sleep(400);
    await p.click('.sch-cast button >> nth=3'); await p.click('[data-go]'); await sleep(2600);
    const t1 = await text(p, '#vn-text');
    const exp1 = await p.evaluate(() => SITE_DATA.scenes.gift_m4.filter(s => s.text)[0].text.slice(0, 6));   // 不寫死台詞：改了劇情也不會壞
    if (!(t1 || '').includes(exp1)) throw new Error('送禮劇情：' + t1);
    if (await p.evaluate(() => GAME.stat('aff', 'm4')) !== 8) throw new Error('好感沒有 +8');
    return p;
  }],
  ['結局：六人都覺醒 → 喚醒 = TRUE END，點一下回到鎖定畫面', async (b, base) => {
    const p = await ending(b, base, true, 0, 'TRUE END');
    await p.click('.end-card'); await sleep(2000);
    const r = await p.evaluate(() => ({ lock: !!document.getElementById('lock'), stage: !!document.getElementById('day-stage'), ended: GAME.ended }));
    if (!r.lock || r.stage || r.ended !== 'explore') throw new Error('結局之後：' + JSON.stringify(r));
    return p;
  }],
  ['結局：六人都覺醒 → 留下 = DREAM END 1，之後回到 9/1（第 2 輪）', async (b, base) => {
    const p = await ending(b, base, true, 1, 'DREAM END 1');
    await p.click('.end-card'); await sleep(2500);
    const g = await game(p);
    if (g.loop !== 2 || g.day !== 1) throw new Error('沒有回到第 2 輪 9/1：' + JSON.stringify(g));
    const hasLoopSave = await p.evaluate(() => !!JSON.parse(localStorage.getItem('riiiizeSaves')).loop);
    if (!hasLoopSave) throw new Error('沒有「循環前的存檔」');
    return p;
  }],
  ['結局：有人沒覺醒 = DREAM END 2', async (b, base) => ending(b, base, false, 0, 'DREAM END 2')],
  ['存檔與讀檔：存在格 1，往後跳，再讀回來', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 21, phase: 'night' } }));
    await p.evaluate(() => GAME.save(1));
    await p.evaluate(() => GAME.setDay(40));
    await p.evaluate(() => GAME.load(1)); await sleep(1800);
    const g = await game(p); if (g.day !== 21) throw new Error('讀檔後不是第 21 天：' + g.day);
    if (await p.$('.title-scr')) throw new Error('讀檔後不該出現標題畫面');
    return p;
  }],
  ['劇情：快轉只跳過看過的台詞', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 21, phase: 'night' }, 'riiiize-flags': { alarm_done: 1, intro_done: 1, 'daychat_09-21': 1 } }));
    await p.evaluate(() => { const l = document.getElementById('lock'); if (l) l.parentNode.removeChild(l); document.getElementById('phone').classList.remove('locked');
      SITE_DATA.scenes.__t1 = [{ text: '第一句' }, { text: '第二句' }, { text: '第三句' }];
      window.__d = 0; STORY.play('__t1', () => { window.__d = 1; }); });
    await clickStory(p, async () => p.evaluate(() => window.__d === 1));
    await p.evaluate(() => { SITE_DATA.scenes.__t1.push({ text: '新的第四句' }); window.__d = 0; STORY.play('__t1', () => { window.__d = 1; }); });
    await sleep(300); await p.click('[data-vn-skip]'); await sleep(1200);
    const t = await text(p, '.vn-text');
    if (t !== '新的第四句') throw new Error('快轉應該停在沒看過的句子，現在是：' + t);
    return p;
  }],
  ['覺醒線索：看到 IG 貼文 1 秒 → 覺醒度 +1，劇情加覺醒度無效', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 21, phase: 'night' }, 'riiiize-flags': { alarm_done: 1, intro_done: 1, 'daychat_09-21': 1 } }));
    await p.evaluate(() => { const l = document.getElementById('lock'); if (l) l.parentNode.removeChild(l); document.getElementById('phone').classList.remove('locked');
      delete SITE_DATA.clues.m4_2;   // 這個測試只測「看到 1 秒就算」：拿掉 m4_2 的強制聊天
      SITE_DATA.instagram.searchOnlyAccounts.filter(a => a.username === 'bin032')[0].posts.push({ images: ['images/cast/m4.jpg'], caption: '線索', time: '9月20日', clue: 'm4_2' });
      GAME.apply({ awake: { m4: 5 } }); });
    if (await p.evaluate(() => GAME.stat('awake', 'm4')) !== 0) throw new Error('劇情效果不該加覺醒度');
    await p.evaluate(() => location.hash = '#/ig/u/bin032/post/2'); await sleep(1600);
    const r = await p.evaluate(() => ({ awake: GAME.stat('awake', 'm4'), flag: SOSHO.hasFlag('clue_m4_2'), vn: !!document.querySelector('.vn') }));
    if (r.awake !== 1 || !r.flag) throw new Error('沒有算到線索：' + JSON.stringify(r));
    if (!r.vn) throw new Error('找到線索後沒有播 awake_m4_2');
    await clickStory(p);
    await p.evaluate(() => location.hash = '#/ig/u/bin032'); await sleep(300);
    await p.evaluate(() => location.hash = '#/ig/u/bin032/post/2'); await sleep(1600);
    if (await p.evaluate(() => GAME.stat('awake', 'm4')) !== 1) throw new Error('同一個線索不該算兩次');
    return p;
  }],
  ['覺醒線索後續：置頂備忘錄 → 強制傳給將太郎；元彬貼文 → 強制留言', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 77, phase: 'night' } }));   // 11/16 星期日
    await p.evaluate(() => { const l = document.getElementById('lock'); if (l) l.parentNode.removeChild(l); document.getElementById('phone').classList.remove('locked'); location.hash = '#/notes/n/n_council'; });
    await p.waitForSelector('#kk-choices .kk-chip', { timeout: 8000 });
    if (await p.evaluate(() => location.hash) !== '#/kakao/chat/f1') throw new Error('沒有打開將太郎的聊天室');
    if (await p.evaluate(() => GAME.stat('awake', 'm1')) !== 0) throw new Error('還沒傳就算了線索');
    await p.click('#kk-choices .kk-chip'); await sleep(200); await p.click('.kk-send');
    for (let i = 0; i < 80 && !(await p.evaluate(() => GAME.stat('awake', 'm1'))); i++) await sleep(300);
    if (await p.evaluate(() => GAME.stat('awake', 'm1')) !== 1) throw new Error('聊完沒有算線索');
    await clickStory(p);
    await p.evaluate(() => location.hash = '#/ig/u/bin032'); await sleep(500);
    await p.evaluate(() => location.hash = '#/ig/u/bin032/post/0');
    await p.waitForSelector('#ig-sheet.forced #ig-cmt-form button:not([disabled])', { timeout: 8000 });
    await p.evaluate(() => location.hash = '#/home'); await sleep(900);
    if (await p.evaluate(() => location.hash) !== '#/ig/u/bin032/post/0') throw new Error('強制留言時可以離開');
    await p.click('#ig-sheet.forced #ig-cmt-form button');
    // 元彬回覆 → 頭痛的劇情 → 再留一次言 → 🙄
    await p.waitForSelector('.vn', { timeout: 8000 });
    if ((await p.evaluate(() => document.getElementById('ig-cmt-list').textContent)).indexOf('講過好多次') < 0) throw new Error('元彬沒有回覆留言');
    await clickStory(p, async () => !!(await p.$('#ig-sheet.forced #ig-cmt-form button:not([disabled])')));
    await p.waitForSelector('#ig-sheet.forced #ig-cmt-form button:not([disabled])', { timeout: 8000 });
    await p.click('#ig-sheet.forced #ig-cmt-form button');
    for (let i = 0; i < 30 && !(await p.evaluate(() => GAME.stat('awake', 'm4'))); i++) await sleep(300);
    const txt = await p.evaluate(() => document.getElementById('ig-cmt-list').textContent);
    if (txt.indexOf('心願') < 0 || txt.indexOf('🙄') < 0) throw new Error('第二次留言或元彬的 🙄 沒有出現');
    if (await p.evaluate(() => GAME.stat('awake', 'm4')) !== 1) throw new Error('留言後沒有算線索');
    return p;
  }],
  ['強制聊天：不能離開聊天室', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-plan': { months: {}, days: {} } }));
    await clickStory(p, async () => (await p.evaluate(() => location.hash)).indexOf('#/kakao/chat/') === 0, 250);   // 中間有元彬的出場動畫（9 秒）
    await p.evaluate(() => location.hash = '#/home'); await sleep(500);
    if (await p.evaluate(() => location.hash) !== '#/kakao/chat/f4') throw new Error('離開了聊天室');
    if (await p.$('[data-kback]')) throw new Error('不該有返回鍵');
    return p;
  }],
  ['出場動畫：開口第一句之後播影片，3 秒出現介紹台詞，播完停格，點一下才一起消失、接下一句', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 10, phase: 'night' } }));
    await p.evaluate(() => { SITE_DATA.storySpeed = 1; SITE_DATA.scenes.__intro = [{ who: 'm1', text: '嗨' }, { intro: 'm1' }, { text: '影片之後' }]; STORY.play('__intro'); });
    await sleep(2600); await p.evaluate(() => document.getElementById('vn-box').click()); await sleep(800);
    if (!(await p.$('.vn-intro video'))) throw new Error('沒有出現影片');
    const t0 = Date.now(); let capAt = null;
    while (Date.now() - t0 < 15000 && await p.$('.vn-intro') && !(await p.$('.vn-intro.over'))) {
      const r = await p.evaluate(() => { const v = document.querySelector('.vn-intro video'); return v ? { t: v.currentTime, on: document.querySelector('.vn-intro-cap').classList.contains('on') } : null; });
      if (r && r.on && capAt == null) capAt = r.t;
      await sleep(150);
    }
    if (capAt == null || capAt < 2.9 || capAt > 3.6) throw new Error('介紹台詞出現的時間：' + capAt);
    // 播完停在最後一格，點一下才消失
    if (!(await p.$('.vn-intro.over'))) throw new Error('影片播完沒有停在最後一格');
    await sleep(1500);
    if (!(await p.$('.vn-intro'))) throw new Error('沒點就自己消失了');
    await p.evaluate(() => document.querySelector('.vn-intro').click()); await sleep(700);
    if (await p.$('.vn-intro')) throw new Error('點了沒有消失');
    await sleep(300);
    const t = await text(p, '#vn-text');
    if (!/影片之後/.test(t || '')) throw new Error('影片之後的台詞：' + t);
    return p;
  }],
  ['玩家生日許願：選「和一個人更親近」→ 選元彬 → 好感 +10，台詞帶出名字', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 14, phase: 'night' },
      'riiiize-flags': { alarm_done: 1, intro_done: 1, plan_tutorial: 1, phone_unlocked: 1, freephone_14: 1, giftdone_14: 1, daychat_0907_helper: 1 } }));
    await p.evaluate(() => { const l = document.getElementById('lock'); if (l) l.remove(); SITE_DATA.storySpeed = 1; STORY.play('birthday_me'); });
    await sleep(2600);
    // 中間會切到手機主畫面：點 KakaoTalk → 元彬的訊息選「方便」→ 回到劇情
    for (let i = 0; i < 200 && !(await p.$('.sch .sch-col button')); i++) {
      await p.evaluate(() => {
        if (document.getElementById('phone').classList.contains('only-kakao')) { const k = document.querySelector('a.app-icon[href="#/kakao"]'); if (k) k.click(); return; }
        const chip = document.querySelector('#kk-choices .kk-chip'); if (chip) { chip.click(); const x = document.querySelector('.kk-send'); if (x) x.click(); return; }
        const v = document.querySelector('.vn:not(.vn-away) #vn-box'); if (v) v.click();
      });
      await sleep(120);
    }
    await p.click('.sch .sch-col button >> nth=0'); await sleep(400);
    await p.click('.sch-cast button >> nth=3'); await p.click('[data-go]'); await sleep(800);
    let t = '';
    for (let i = 0; i < 20 && !/元彬/.test(t); i++) { t = await text(p, '#vn-text') || ''; await p.evaluate(() => { const v = document.getElementById('vn-box'); if (v) v.click(); }); await sleep(150); }
    if (!/元彬/.test(t)) throw new Error('許願後的台詞：' + t);
    const aff = await p.evaluate(() => GAME.stat('aff', 'm4'));
    if (aff !== 10) throw new Error('好感：' + aff);
    return p;
  }],
  ['設定：CG 圖鑑（看過的出場動畫才打開、點了可以重看）；線索收集 10/1 之前不顯示', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 10, phase: 'night' }, riiiizeCG: { intro_m4: 1 } }));
    await p.evaluate(() => { location.hash = '#/settings'; });
    await sleep(600);
    const rows = await p.evaluate(() => [...document.querySelectorAll('#settings-scroll .st-label')].map(x => x.textContent).join(','));
    if (!/CG 圖鑑/.test(rows)) throw new Error('沒有 CG 圖鑑：' + rows);
    if (/線索收集/.test(rows)) throw new Error('9/10 不該有線索收集：' + rows);
    await p.evaluate(() => { location.hash = '#/settings/cg'; });
    await sleep(500);
    const r = await p.evaluate(() => ({ open: document.querySelectorAll('.st-cg[data-cg]').length, all: document.querySelectorAll('.st-cg').length, first: (document.querySelector('.st-cg[data-cg] b') || {}).textContent }));
    if (r.open !== 1 || r.all !== 6 || !/元彬/.test(r.first)) throw new Error(JSON.stringify(r));
    await p.evaluate(() => document.querySelector('.st-cg[data-cg]').click());   // 這天晚上會蓋著「這週的安排」，直接點
    await sleep(800);
    if (!(await p.$('.cg-view video'))) throw new Error('點了沒有播放');
    // 總覽頁的對話框開關：關掉 → 重看時播沒有框的版本、沒有台詞和提示；再打開 → 換回來
    const box = await p.evaluate(async () => {
      const w = ms => new Promise(r => setTimeout(r, ms)), shot = () => { const v = document.querySelector('.cg-view video'); return v.getAttribute('src') + ',' + !!document.querySelector('.cg-view .vn-intro-cap, .cg-view .vn-intro-tap, .cg-view button'); };
      const a = shot(); document.querySelector('.cg-view').remove();
      document.querySelector('[data-cg-boxtoggle]').click(); await w(200);
      const lab = document.querySelector('[data-cg-boxtoggle] .st-val').textContent;
      document.querySelector('.st-cg[data-cg]').click(); await w(800); const b = shot(); document.querySelector('.cg-view').remove();
      document.querySelector('[data-cg-boxtoggle]').click(); await w(200);
      document.querySelector('.st-cg[data-cg]').click(); await w(800);
      return [a, lab, b, shot()].join('|');
    });
    if (box !== 'videos/intro_m4.mp4,true|關|videos/intro_m4_clean.mp4,false|videos/intro_m4.mp4,true') throw new Error('對話框開關：' + box);
    await p.evaluate(() => document.querySelector('.cg-view').click()); await sleep(600);
    if (await p.$('.cg-view')) throw new Error('點了沒有關掉');
    await p.evaluate(() => { GAME.setDay(GAME.dayOf('10-01')); location.hash = '#/home'; });
    await sleep(300);
    await p.evaluate(() => { location.hash = '#/settings'; });
    await sleep(600);
    const rows2 = await p.evaluate(() => [...document.querySelectorAll('#settings-scroll .st-label')].map(x => x.textContent).join(','));
    if (!/線索收集/.test(rows2)) throw new Error('10/1 應該有線索收集：' + rows2);
    return p;
  }],
  ['愛情線：好感 150 心動 → 300 曖昧 → 450 告白（可選多位）→ 有戀人之後其他人沒有愛情線（友誼線已刪除）', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 40, phase: 'night' } }));
    const r = await p.evaluate(() => {
      const A = (id, v) => GAME.addStat('aff', id, v - GAME.stat('aff', id)), F = f => SOSHO.setFlag(f), q = () => { const x = PLAN.bondFor(GAME.day); return x ? (x.id || x.kind + ':' + x.ids.join('+')) : '-'; };
      const out = [];
      A('m4', 160); out.push(q()); F('scene_love_m4_1');
      A('m4', 310); out.push(q()); F('scene_love_m4_2');
      out.push(q());   // 好感 300、看過曖昧：沒有別的劇情了（友誼線已刪除）
      A('m4', 460); A('m1', 460); F('scene_love_m1_1'); F('scene_love_m1_2'); out.push(q());
      F('confess_m4'); A('m2', 310); out.push(q()); out.push(GAME.check({ lover: 'm4' }) && !GAME.check({ lover: 'm1' }));
      return out.join(',');
    });
    if (r !== 'love_m4_1,love_m4_2,-,confess:m1+m4,-,true') throw new Error(r);
    return p;
  }],
  ['後日談：玩家最多一段（戀人優先，沒有就好感最高的友誼版）＋成員之間（在一起的每一對；沒有就關係最高一對的友誼版）', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 40, phase: 'night' } }));
    const r = await p.evaluate(() => {
      const A = (id, v) => GAME.addStat('aff', id, v - GAME.stat('aff', id)), P = (k, v) => GAME.addStat('pair', k, v - GAME.stat('pair', k)), F = f => SOSHO.setFlag(f);
      const E = () => { const e = GAME.epilogues(); return [e.lover || '', e.friend || '', e.couples.join('+'), e.pairFriend || ''].join('/'); };
      const out = [];
      A('m4', 200); A('m2', 120); P('m4-m6', 400); P('m1-m3', 300);
      out.push(E());                                   // 沒有戀人 → 元彬友誼；沒有在一起的 → 關係最高、又不含元彬的一對（將太郎×成燦）
      A('m2', 460); F('confess_m2'); out.push(E());    // 恩奭是戀人（好感比元彬低也優先）→ 元彬×燦榮變成友誼版
      P('m1-m3', 700); F('couple_m1-m3'); P('m5-m6', 700); F('couple_m5-m6'); out.push(E());   // 兩對在一起 → 兩對都播、沒有友誼版
      out.push(GAME.check({ epCouple: 'm3-m1' }), GAME.check({ epLover: 'm2' }), GAME.check({ epFriend: 'm4' }));
      return out.join(',');
    });
    if (r !== '/m4//m1-m3,m2///m4-m6,m2//m1-m3+m5-m6/,true,true,false') throw new Error(r);
    return p;
  }],
  ['CP 線：關係 100 → 300 → 500 → 700 在一起；已經在一對、或是玩家戀人的人只剩第一段', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 40, phase: 'night' } }));
    const r = await p.evaluate(() => {
      const P = (k, v) => GAME.addStat('pair', k, v - GAME.stat('pair', k)), F = f => SOSHO.setFlag(f), q = () => { const x = PLAN.bondFor(GAME.day); return x ? x.id + (x.couple ? '!' : '') : '-'; };
      const out = [];
      P('m4-m6', 105); out.push(q()); F('scene_cp_m4_m6_1');
      P('m4-m6', 310); out.push(q()); F('scene_cp_m4_m6_2');
      P('m4-m6', 510); out.push(q()); F('scene_cp_m4_m6_3');
      P('m4-m6', 710); out.push(q()); F('couple_m4-m6'); F('scene_cp_m4_m6_4');
      out.push(GAME.check({ couple: 'm4-m6' }));
      P('m1-m4', 300); out.push(q()); F('scene_cp_m1_m4_1'); out.push(q());
      P('m1-m2', 300); F('scene_cp_m1_m2_1'); F('confess_m2'); out.push(q());
      return out.join(',');
    });
    if (r !== 'cp_m4_m6_1,cp_m4_m6_2,cp_m4_m6_3,cp_m4_m6_4!,true,cp_m1_m4_1,-,-') throw new Error(r);
    return p;
  }],
  ['選人畫面：連點兩次「確定」只算一次（星期日見元彬，好感 +10 不是 +20）', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 14, phase: 'morning' },
      'riiiize-flags': { alarm_done: 1, intro_done: 1, plan_tutorial: 1, giftdone_14: 1 } }));
    for (let i = 0; i < 80 && !(await p.$('.sch-cast [data-meet="m4"]')); i++) {
      await p.evaluate(() => { const v = document.getElementById('vn-box'); if (v) v.click(); }); await sleep(150);
    }
    await p.evaluate(() => SITE_DATA.plan.weekend.scenes.forEach(e => { if (e.chance != null) e.chance = 0; }));   // 20% 特殊劇情（會再 +5）關掉
    await p.click('.sch-cast [data-meet="m4"]');
    await p.evaluate(() => { const g = document.querySelector('[data-go]'); g.click(); g.click(); });
    await sleep(1500);
    const a = await p.evaluate(() => GAME.stat('aff', 'm4'));
    if (a !== 10) throw new Error('好感 ' + a);
    return p;
  }],
  ['App 內容：from 日期之前看不到', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 10, phase: 'night' } }));
    const r = await p.evaluate(() => [GAME.unlocked({ from: '09-15' }), GAME.unlocked({ from: '09-05' }), GAME.unlocked({ if: { loop: '>=2' } })]);
    if (r.join() !== 'false,true,false') throw new Error(r.join());
    return p;
  }]
];
async function ending(b, base, allAwake, pick, title) {
  const awake = { m1: allAwake ? 3 : 2, m2: 3, m3: 3, m4: 3, m5: 3, m6: 3 };   // 沒全部覺醒：將太郎只找到 2 個線索
  const p = await open(b, base, played({ 'riiiize-stats': { aff: {}, pair: {}, awake, visits: {} }, 'riiiize-game': { day: 365, phase: 'morning' } }));
  await p.evaluate(() => { SITE_DATA.storySpeed = 1; });   // 最後的選擇和結局很長：字直接出現
  for (let i = 0; i < 600 && !(await p.$('.end-card')); i++) {
    if (await p.$('[data-vn-choice]')) { await p.click('[data-vn-choice="' + pick + '"]'); await sleep(300); continue; }
    await p.click('.vn', { timeout: 2000 }).catch(() => {}); await sleep(60);
  }
  await sleep(1200);
  const t = await text(p, '.end-card b');
  if (t !== title) throw new Error('結局是「' + t + '」，應該是「' + title + '」');
  return p;
}

// ---------- 執行 ----------
(async () => {
  const filter = process.argv[2] || '';
  const server = await serve();
  const base = 'http://localhost:' + server.address().port;
  const browser = await chromium.launch();
  let pass = 0, fail = 0;
  for (const [name, fn] of TESTS) {
    if (filter && name.indexOf(filter) < 0) continue;
    const t0 = Date.now();
    let page;
    try {
      page = await fn(browser, base);
      const errs = page && page.errors.length ? '（網頁錯誤：' + page.errors.join(' / ') + '）' : '';
      if (errs) throw new Error(errs);
      pass++; console.log('  通過  ' + name + '  ' + ((Date.now() - t0) / 1000).toFixed(1) + ' 秒');
    } catch (e) {
      fail++; console.log('✗ 失敗  ' + name + '\n         ' + e.message);
    }
    if (page) await page.close().catch(() => {});
  }
  await browser.close(); server.close();
  console.log('\n' + pass + ' 項通過' + (fail ? '，' + fail + ' 項失敗' : '，全部通過'));
  process.exit(fail ? 1 : 0);
})();
