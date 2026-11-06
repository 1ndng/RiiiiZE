/* =========================================================
 * RiiiiZE 自動測試：改完劇情或程式後跑一次，確認主要流程沒有壞掉
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
    const t = await page.evaluate(() => (document.querySelector('.vn') || {}).textContent || '');
    if (/自由探索手機|按「睡覺」/.test(t)) { seen = true; await page.click('.vn', { timeout: 1000 }).catch(() => {}); await sleep(200); continue; }
    if (seen && !(await page.$('.vn'))) break;
    if (!seen && i > 15) break;
    await sleep(200);
  }
  return page;
}
// 進度的基本設定：已經過了開場
// 9/7 晚上的聊天已經聊完（從 9/7 晚上直接睡覺的測試用）
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
    if (await page.$('[data-kdaydone]')) return true;
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
  ['第一次遊玩：名字 → 生日 → 照片 → 開始 → 鬧鐘 → 鎖定畫面 → 開場', async (b, base) => {
    const p = await open(b, base, {});
    await p.fill('.vn-name input', '小明'); await p.click('.vn-name button[type=submit]'); await sleep(500);
    await p.click('.vn-name button[type=submit]'); await sleep(500);   // 生日（預設值）
    await p.click('.vn-name button[type=submit]'); await sleep(500);   // 照片：下一步
    await p.click('.vn-name button[type=submit]'); await sleep(900);   // 開始遊戲
    const knob = await p.$('#alarm-knob'); if (!knob) throw new Error('沒有鬧鐘');
    const bb = await knob.boundingBox();
    await p.mouse.move(bb.x + 10, bb.y + 10); await p.mouse.down(); await p.mouse.move(bb.x + 400, bb.y + 10, { steps: 10 }); await p.mouse.up();
    await sleep(900);
    if (!(await p.$('#lock'))) throw new Error('沒有鎖定畫面');
    const bday = await p.evaluate(() => JSON.parse(localStorage.getItem('riiiize-player')).birthday.replace('-', ''));
    await unlock(p, bday);
    if (!(await p.$('.vn'))) throw new Error('解鎖後沒有開場劇情');
    await clickStory(p, async () => p.evaluate(() => INTRO.exploring()));
    await p.evaluate(() => location.hash = '#/kakao'); await sleep(1500);
    const ok = await clickStory(p, async () => (await text(p, '.vn-text') || '').indexOf('7:58') >= 0, 80);
    if (!ok) throw new Error('打開 KakaoTalk 後沒有進到 9/1');
    return p;
  }],
  ['開學週：9/1 劇情 → 元彬的聊天 → 繼續 → 9/2', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-plan': { months: {}, days: {} } }));
    await clickStory(p, async () => (await p.evaluate(() => location.hash)).indexOf('#/kakao/chat/') === 0, 80);
    if (await p.evaluate(() => location.hash) !== '#/kakao/chat/f4') throw new Error('沒有跳到元彬的聊天室');
    if (!(await chatThrough(p))) throw new Error('每日聊天沒有聊完');
    await p.click('[data-kdaydone]'); await sleep(3500);
    const g = await game(p); if (g.day !== 2) throw new Error('沒有進入 9/2，現在第 ' + g.day + ' 天');
    return p;
  }],
  ['每週回顧：安排好的日子一次顯示', async (b, base) => {
    const days = { '09-08': 'club', '09-09': 'volunteer', '09-10': 'sports', '09-11': 'council', '09-12': 'games' };
    // 每個日程都已經去過 1 次（第 2 次不是固定劇情），回家也去過 1 次；隨機劇情關掉
    const visits = { club: 1, volunteer: 1, sports: 1, council: 1, games: 1, home: 1 };
    const p = await open(b, base, played({ 'riiiize-plan': { months: MONTHS.reduce((o, m) => (o[m] = 1, o), {}), days }, 'riiiize-game': { day: 7, phase: 'night' }, 'riiiize-flags': NIGHT7_FLAGS, 'riiiize-stats': { visits } }));
    await p.evaluate(() => { SITE_DATA.plan.random.chance = 0; const l = document.getElementById('lock'); if (l) l.parentNode.removeChild(l); document.getElementById('phone').classList.remove('locked'); PLAN.go(); });
    await p.waitForSelector('.wk', { timeout: 8000 });
    const rows = await p.$$eval('.wk li', a => a.length);
    if (rows !== 5) throw new Error('應該 5 天，顯示了 ' + rows + ' 天');
    const aff = await p.evaluate(() => GAME.cast().reduce((s, c) => s + GAME.stat('aff', c.id), 0));
    if (aff < 29) throw new Error('好感度總和不對：' + aff);
    await p.click('[data-wk-go]'); await sleep(3000);
    const g = await game(p); if (g.day !== 13) throw new Error('應該停在 9/13（成燦生日），現在第 ' + g.day + ' 天');
    return p;
  }],
  ['日程固定劇情：第 5 次去社團那天停下來播', async (b, base) => {
    const days = { '09-08': 'club' };
    const p = await open(b, base, played({ 'riiiize-plan': { months: MONTHS.reduce((o, m) => (o[m] = 1, o), {}), days }, 'riiiize-game': { day: 7, phase: 'night' }, 'riiiize-flags': NIGHT7_FLAGS, 'riiiize-stats': { visits: { club: 4 } } }));
    await p.evaluate(() => { SITE_DATA.plan.random.chance = 0; const l = document.getElementById('lock'); if (l) l.parentNode.removeChild(l); document.getElementById('phone').classList.remove('locked'); PLAN.go(); });
    let seen = '';
    const first = await p.evaluate(() => SITE_DATA.scenes.act_club_5[0].text);
    for (let i = 0; i < 30 && seen.indexOf(first) < 0; i++) { seen = await p.evaluate(() => (document.querySelector('.vn') || {}).textContent || ''); await sleep(300); }
    if (seen.indexOf(first) < 0) throw new Error('沒有播社團第 5 次的劇情');
    const g = await game(p); if (g.day !== 8) throw new Error('應該停在 9/8，現在第 ' + g.day + ' 天');
    return p;
  }],
  ['隨機劇情：機率 100% 時按繼續後播；每週回顧顯示加了多少好感', async (b, base) => {
    const days = { '09-08': 'club', '09-09': 'club', '09-10': 'club', '09-11': 'club', '09-12': 'club' };
    const p = await open(b, base, played({ 'riiiize-plan': { months: MONTHS.reduce((o, m) => (o[m] = 1, o), {}), days }, 'riiiize-game': { day: 7, phase: 'night' }, 'riiiize-flags': NIGHT7_FLAGS, 'riiiize-stats': { visits: { club: 10 } } }));
    await p.evaluate(() => { SITE_DATA.plan.random.chance = 1; const l = document.getElementById('lock'); if (l) l.parentNode.removeChild(l); document.getElementById('phone').classList.remove('locked'); PLAN.go(); });
    await p.waitForSelector('.wk', { timeout: 8000 });
    // 卡片不標「有事發生」，改成顯示每個人、每一對加了多少
    if (await p.$('.wk-ev')) throw new Error('卡片不應該再標「有事發生」');
    const gain = await p.$eval('.wk-gain', e => e.textContent).catch(() => '');
    if (!/\+\d/.test(gain)) throw new Error('卡片沒有顯示加了多少好感：' + gain);
    await p.click('[data-wk-go]'); await sleep(800);
    const t = await p.evaluate(() => (document.querySelector('.vn') || {}).textContent || '');
    const firsts = await p.evaluate(() => Object.keys(SITE_DATA.scenes).filter(k => k.indexOf('rand_club_') === 0).map(k => SITE_DATA.scenes[k][0].text));
    if (!firsts.some(f => t.indexOf(f.slice(0, 8)) >= 0)) throw new Error('按繼續後沒有播隨機劇情：' + t.slice(0, 40));
    return p;
  }],
  ['星期日：選人出門 → 22:00 鎖定畫面 → 解鎖', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 21, phase: 'morning' } }));
    await clickStory(p, async () => !!(await p.$('.sch')));
    await p.click('.sch-cast button >> nth=1'); await p.click('[data-go]'); await sleep(800);
    await clickStory(p, async () => !!(await p.$('#lock')), 80, true);
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
    const p = await open(b, base, played({ 'riiiize-game': { day: 21, phase: 'night' } }));
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
    const p = await open(b, base, played({ 'riiiize-game': { day: 21, phase: 'night' } }));
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
    await clickStory(p, async () => (await p.evaluate(() => location.hash)).indexOf('#/kakao/chat/') === 0, 80);
    await p.evaluate(() => location.hash = '#/home'); await sleep(500);
    if (await p.evaluate(() => location.hash) !== '#/kakao/chat/f4') throw new Error('離開了聊天室');
    if (await p.$('[data-kback]')) throw new Error('不該有返回鍵');
    return p;
  }],
  ['出場動畫：開口第一句之後播影片，3 秒出現介紹台詞，播完一起消失再接下一句', async (b, base) => {
    const p = await open(b, base, played({ 'riiiize-game': { day: 10, phase: 'night' } }));
    await p.evaluate(() => { SITE_DATA.storySpeed = 1; SITE_DATA.scenes.__intro = [{ who: 'm1', text: '嗨' }, { intro: 'm1' }, { text: '影片之後' }]; STORY.play('__intro'); });
    await sleep(2600); await p.evaluate(() => document.getElementById('vn-box').click()); await sleep(800);
    if (!(await p.$('.vn-intro video'))) throw new Error('沒有出現影片');
    const t0 = Date.now(); let capAt = null;
    while (Date.now() - t0 < 15000 && await p.$('.vn-intro')) {
      const r = await p.evaluate(() => { const v = document.querySelector('.vn-intro video'); return v ? { t: v.currentTime, on: document.querySelector('.vn-intro-cap').classList.contains('on') } : null; });
      if (r && r.on && capAt == null) capAt = r.t;
      await sleep(150);
    }
    if (capAt == null || capAt < 2.9 || capAt > 3.6) throw new Error('介紹台詞出現的時間：' + capAt);
    if (await p.$('.vn-intro')) throw new Error('影片播完沒有消失');
    await sleep(300);
    const t = await text(p, '#vn-text');
    if (!/影片之後/.test(t || '')) throw new Error('影片之後的台詞：' + t);
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
