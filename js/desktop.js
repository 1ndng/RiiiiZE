/* 電腦（滑鼠）操作：只在用滑鼠時作用，手機的觸控完全不受影響
 *   左右捲動的區塊（KakaoTalk 的選項、IG 精選與輪播、相簿……）：
 *     ・按住滑鼠左右拖曳就能捲動（拖曳之後放開不會誤點到選項）
 *     ・滑鼠滾輪上下滾 = 左右捲動
 *   判斷方式：元素的 overflow-x 是 auto / scroll，而且內容比框寬 */
(function () {
  'use strict';

  function scrollerAt(el) {
    for (; el && el !== document.body; el = el.parentElement) {
      if (el.scrollWidth <= el.clientWidth + 1) continue;
      var ox = getComputedStyle(el).overflowX;
      if (ox === 'auto' || ox === 'scroll') return el;
    }
    return null;
  }

  // ---- 拖曳捲動（只有滑鼠） ----
  var drag = null, eatClick = false;
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    var sc = scrollerAt(e.target);
    if (!sc) return;
    drag = { sc: sc, x: e.clientX, left: sc.scrollLeft, moved: false, snap: sc.style.scrollSnapType };
  }, true);
  document.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerType !== 'mouse') return;
    var dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 5) return;
    if (!drag.moved) {
      drag.moved = true;
      drag.sc.style.scrollSnapType = 'none';   // 拖曳時先關掉吸附，放開再吸回去
      drag.sc.classList.add('dt-dragging');
    }
    drag.sc.scrollLeft = drag.left - dx;
    e.preventDefault();
  }, true);
  function end() {
    if (!drag) return;
    if (drag.moved) {
      eatClick = true; setTimeout(function () { eatClick = false; }, 0);
      drag.sc.style.scrollSnapType = drag.snap;
      drag.sc.classList.remove('dt-dragging');
    }
    drag = null;
  }
  document.addEventListener('pointerup', end, true);
  document.addEventListener('pointercancel', end, true);
  // 拖曳完放開：吃掉這一次點擊（不會選到放開位置的選項）
  document.addEventListener('click', function (e) {
    if (eatClick) { e.preventDefault(); e.stopPropagation(); eatClick = false; }
  }, true);
  // 拖曳時不要拖出圖片、選到文字
  document.addEventListener('dragstart', function (e) { if (scrollerAt(e.target)) e.preventDefault(); }, true);

  // ---- 滾輪：上下滾 → 左右捲動（只處理只能左右捲的區塊） ----
  document.addEventListener('wheel', function (e) {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;   // 觸控板本來就能左右滑
    var sc = scrollerAt(e.target);
    if (!sc || sc.scrollHeight > sc.clientHeight + 1) return;
    var max = sc.scrollWidth - sc.clientWidth;
    if ((e.deltaY < 0 && sc.scrollLeft <= 0) || (e.deltaY > 0 && sc.scrollLeft >= max - 1)) return;   // 到底了：交給外層上下捲
    sc.scrollLeft += e.deltaY;
    e.preventDefault();
  }, { passive: false, capture: true });
})();
