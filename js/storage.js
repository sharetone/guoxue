/**
 * 本地存储：收藏 / 打卡 / 阅读记录
 * 用 localStorage，便于嵌入 webview（无需后端）即可运行。
 */
(function () {
  var KEY = 'guoxue_v1';
  var state = JSON.parse(localStorage.getItem(KEY) || '{}');
  if (!state.favorites) state.favorites = [];   // 收藏的条目 id
  if (!state.checkin) state.checkin = {};        // { '2026-09-13': true }
  if (!state.read) state.read = {};              // 已读条目 id -> 1

  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

  window.Store = {
    isFav: function (id) { return state.favorites.indexOf(id) >= 0; },
    toggleFav: function (id) {
      var i = state.favorites.indexOf(id);
      if (i >= 0) state.favorites.splice(i, 1); else state.favorites.push(id);
      save(); return this.isFav(id);
    },
    favList: function () { return state.favorites.slice(); },

    todayKey: function () {
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },
    checkedToday: function () { return !!state.checkin[this.todayKey()]; },
    doCheckin: function () {
      var k = this.todayKey();
      if (state.checkin[k]) return this.streak();
      state.checkin[k] = true; save(); return this.streak();
    },
    /** 连续打卡天数（截至今天） */
    streak: function () {
      var n = 0, d = new Date();
      while (true) {
        var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        if (state.checkin[k]) { n++; d.setDate(d.getDate() - 1); } else break;
      }
      return n;
    },
    /** 最近 7 天打卡情况 */
    week: function () {
      var arr = [], d = new Date();
      d.setDate(d.getDate() - 6);
      for (var i = 0; i < 7; i++) {
        var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        arr.push({ key: k, on: !!state.checkin[k] });
        d.setDate(d.getDate() + 1);
      }
      return arr;
    },
    markRead: function (id) { state.read[id] = 1; save(); },
    readCount: function () { return Object.keys(state.read).length; },
    favCount: function () { return state.favorites.length; }
  };
})();
