/* =========================================================
 * 語言：繁體（預設）／简体
 * 选简体时，用 opencc（js/vendor/opencc-t2cn.js）把畫面上的字即時轉成簡體；
 * 設定存在瀏覽器（riiiizeLang，不會被「重新開始」清掉）。
 * ========================================================= */
(function () {
  'use strict';
  var KEY = 'riiiizeLang', lang = 'tw';
  try { lang = localStorage.getItem(KEY) || 'tw'; } catch (e) {}
  var conv = null;
  if (lang === 'cn' && window.OpenCC) conv = window.OpenCC.Converter({ from: 'tw', to: 'cn' });

  window.SOSHO_LANG = {
    lang: lang,
    // 切換：存起來後重新整理頁面
    toggle: function () {
      try { localStorage.setItem(KEY, lang === 'cn' ? 'tw' : 'cn'); } catch (e) {}
      location.reload();
    }
  };
  if (!conv) return;

  document.documentElement.lang = 'zh-CN';
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1 };
  function convText(node) {
    var p = node.parentNode;
    if (!p || SKIP[p.nodeName] || (p.closest && p.closest('[data-noconv]'))) return;
    var v = node.nodeValue, c = conv(v);
    if (c !== v) node.nodeValue = c;
  }
  function convAttrs(el) {
    ['placeholder', 'title', 'aria-label'].forEach(function (a) {
      var v = el.getAttribute && el.getAttribute(a);
      if (v) { var c = conv(v); if (c !== v) el.setAttribute(a, c); }
    });
  }
  function walk(root) {
    if (root.nodeType === 3) { convText(root); return; }
    if (root.nodeType !== 1 || SKIP[root.nodeName]) { if (root.nodeType === 1) convAttrs(root); return; }
    convAttrs(root);
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    var n;
    while ((n = tw.nextNode())) { if (n.nodeType === 3) convText(n); else convAttrs(n); }
  }
  // 跳出的確認視窗／提示也轉
  var _confirm = window.confirm, _alert = window.alert;
  window.confirm = function (m) { return _confirm.call(window, conv(String(m))); };
  window.alert = function (m) { return _alert.call(window, conv(String(m))); };

  function start() {
    document.title = conv(document.title);
    walk(document.body);
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        if (m.type === 'characterData') convText(m.target);
        else if (m.type === 'attributes') convAttrs(m.target);
        else m.addedNodes.forEach(walk);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
