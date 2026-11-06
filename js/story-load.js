/* 載入 js/story/ 裡的劇情檔（清單在 data.js 最下面的 RIIIZE_STORY_FILES）
 * 每個檔案用 RIIIZE_ADD(...) 把內容併進 SITE_DATA；要在 game.js 之前載完 */
(window.RIIIZE_STORY_FILES || []).forEach(function (f) {
  document.write('<script src="js/story/' + f + '.js?t=' + Date.now() + '"><\/script>');
});
