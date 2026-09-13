/**
 * 国学日课 H5 · 主逻辑（原生 JS，无构建，可直接嵌入 webview）
 * 路由： #/ 首页  #/explore 选读  #/cat/:cat 分类  #/detail/:id 详情
 *        #/search 检索  #/favorites 收藏  #/me 我的
 */
(function () {
  var D = window.GUOXUE_DATA;
  var cats = D.categories;
  var quotes = D.quotes;
  var view = document.getElementById('view');

  function catById(id) { for (var i = 0; i < cats.length; i++) if (cats[i].id === id) return cats[i]; return null; }
  function quoteById(id) { for (var i = 0; i < quotes.length; i++) if (quotes[i].id === id) return quotes[i]; return null; }
  function quotesOf(cat) { return quotes.filter(function (q) { return q.cat === cat; }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* 每日一句：按年内第几天决定，保证同一天所有人看到同一句 */
  function dailyQuote() {
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var dayOfYear = Math.floor((now - start) / 86400000);
    return quotes[dayOfYear % quotes.length];
  }
  function todayLabel() {
    var d = new Date();
    var w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 · 星期' + w;
  }

  /* ---------------- 页面渲染 ---------------- */
  function renderHome() {
    var q = dailyQuote();
    var c = catById(q.cat);
    var week = window.Store.week().map(function (x) { return '<i class="' + (x.on ? 'on' : '') + '"></i>'; }).join('');
    var checked = window.Store.checkedToday();
    return '' +
      '<div class="fade">' +
      '<div class="card hero">' +
        '<div class="seal">課</div>' +
        '<div class="date">' + todayLabel() + ' · 每日一句</div>' +
        '<div class="h-title">' + esc(q.title) + '</div>' +
        '<div class="h-orig">' + esc(q.original) + '</div>' +
        '<div class="h-src">' + esc(q.source) + '　' + esc(q.author) + '</div>' +
        '<div class="h-actions">' +
          '<button class="btn btn-ghost" data-act="detail" data-id="' + q.id + '">细读 ›</button>' +
          '<button class="btn btn-ghost" data-act="fav" data-id="' + q.id + '">' + (window.Store.isFav(q.id) ? '★ 已藏' : '☆ 收藏') + '</button>' +
        '</div>' +
      '</div>' +

      '<div class="card checkin">' +
        '<div>' +
          '<div class="ci-left">已连续打卡</div>' +
          '<div class="ci-num">' + window.Store.streak() + ' <span style="font-size:13px;color:var(--ink-soft)">天</span></div>' +
          '<div class="streak-dots">' + week + '</div>' +
        '</div>' +
        '<button class="btn ' + (checked ? '' : 'btn-primary') + '" data-act="checkin">' + (checked ? '今日已打卡' : '今日打卡') + '</button>' +
      '</div>' +

      '<div class="section-title">按主题选读</div>' +
      '<div class="cat-grid">' + cats.map(function (ct) {
        var n = quotesOf(ct.id).length;
        return '<div class="cat-item" data-act="cat" data-cat="' + ct.id + '">' +
          '<div class="cat-ico" style="background:' + ct.color + '">' + esc(ct.icon) + '</div>' +
          '<div class="cat-name">' + esc(ct.name) + '</div>' +
          '<div class="cat-count">' + n + ' 篇</div></div>';
      }).join('') + '</div>' +
      '</div>';
  }

  function renderExplore() {
    return '<div class="fade">' +
      '<div class="section-title">全部主题</div>' +
      '<div class="cat-grid">' + cats.map(function (ct) {
        var n = quotesOf(ct.id).length;
        return '<div class="cat-item" data-act="cat" data-cat="' + ct.id + '">' +
          '<div class="cat-ico" style="background:' + ct.color + '">' + esc(ct.icon) + '</div>' +
          '<div class="cat-name">' + esc(ct.name) + '</div>' +
          '<div class="cat-count">' + n + ' 篇</div></div>';
      }).join('') + '</div>' +
      '<div class="card" style="margin-top:18px;font-size:13px;color:var(--ink-soft);line-height:1.9">' +
        '本应用内容源自「长乐斋古代文献」语料（佛藏/儒藏/诗藏/道藏…共 1.5 万+ 篇）。' +
        '启蒙版已为每篇补全译文与解读；规模化时可从原始 txt 批量入库。' +
      '</div>' +
      '</div>';
  }

  function renderCat(catId) {
    var c = catById(catId); if (!c) return renderHome();
    var list = quotesOf(catId).map(function (q) {
      return '<div class="list-item" data-act="detail" data-id="' + q.id + '">' +
        '<div class="list-badge" style="background:' + c.color + '">' + esc(c.icon) + '</div>' +
        '<div class="list-main"><div class="list-title">' + esc(q.title) + '</div>' +
        '<div class="list-sub">' + esc(q.source) + '　' + esc(q.author) + '</div></div>' +
        '<div class="list-arrow">›</div></div>';
    }).join('');
    return '<div class="fade">' +
      '<div class="back" data-act="back">‹ 返回</div>' +
      '<div class="card hero" style="background:linear-gradient(160deg,' + c.color + ',' + shade(c.color) + ');color:#fff;border:none">' +
        '<div class="h-title" style="margin:0">' + esc(c.name) + '</div>' +
        '<div class="h-src" style="opacity:.85;margin-top:6px">' + esc(c.desc) + ' · 共 ' + quotesOf(catId).length + ' 篇</div>' +
      '</div>' + list + '</div>';
  }

  function renderDetail(id) {
    var q = quoteById(id); if (!q) return renderHome();
    window.Store.markRead(q.id);
    var c = catById(q.cat);
    var fav = window.Store.isFav(q.id);
    return '<div class="fade">' +
      '<div class="back" data-act="back">‹ 返回</div>' +
      '<div class="card">' +
        '<div class="detail-src">' + esc(q.source) + '　|　' + esc(q.author) + '</div>' +
        '<div class="h-title" style="color:var(--ink);font-size:20px;margin-bottom:12px">' + esc(q.title) + '</div>' +
        '<div class="detail-orig">' + esc(q.original) + '</div>' +
        '<div class="detail-block"><h4>译文</h4><p>' + esc(q.translation) + '</p></div>' +
        '<div class="detail-block"><h4>解读 · 给成年人</h4><p>' + esc(q.interpretation) + '</p></div>' +
        '<div class="tag-row">' + (q.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div>' +
        '<div class="detail-foot">' +
          '<button class="btn ' + (fav ? 'btn-primary' : '') + ' btn-block" data-act="fav" data-id="' + q.id + '">' + (fav ? '★ 已收藏' : '☆ 收藏') + '</button>' +
          '<button class="btn btn-block" data-act="share">分享</button>' +
        '</div>' +
      '</div>' +
      '<div class="card" style="font-size:12px;color:var(--ink-soft)">主题：' + esc(c.name) + '　·　ID：' + esc(q.id) + '</div>' +
      '</div>';
  }

  var searchQ = '';
  function renderSearch() {
    return '<div class="fade">' +
      '<div class="section-title">检索经典</div>' +
      '<div class="search-bar"><span class="s-ico">🔍</span>' +
        '<input id="s-input" placeholder="搜原文 / 译文 / 主题 / 作者…" value="' + esc(searchQ) + '" /></div>' +
      '<div id="s-result">' + searchResultsHtml(searchQ) + '</div>' +
      '</div>';
  }
  function searchResultsHtml(q) {
    if (!q) return '<div class="empty">输入关键词，检索 ' + quotes.length + ' 篇经典</div>';
    var kw = q.trim();
    var res = quotes.filter(function (x) {
      return (x.original + x.translation + x.title + x.source + x.author + (x.tags || []).join('')).indexOf(kw) >= 0;
    });
    if (!res.length) return '<div class="empty">未找到「' + esc(kw) + '」相关条目</div>';
    return res.map(function (x) {
      var c = catById(x.cat);
      return '<div class="list-item" data-act="detail" data-id="' + x.id + '">' +
        '<div class="list-badge" style="background:' + c.color + '">' + esc(c.icon) + '</div>' +
        '<div class="list-main"><div class="list-title">' + esc(x.title) + '</div>' +
        '<div class="list-sub">' + esc(x.source) + '　' + esc(x.author) + '</div></div>' +
        '<div class="list-arrow">›</div></div>';
    }).join('');
  }

  function renderFavorites() {
    var ids = window.Store.favList();
    if (!ids.length) return '<div class="fade"><div class="empty">还没有收藏。<br/>在「日课」或「详情」页点 ☆ 即可收藏。</div></div>';
    var html = ids.map(function (id) {
      var q = quoteById(id); if (!q) return '';
      var c = catById(q.cat);
      return '<div class="list-item" data-act="detail" data-id="' + q.id + '">' +
        '<div class="list-badge" style="background:' + c.color + '">' + esc(c.icon) + '</div>' +
        '<div class="list-main"><div class="list-title">' + esc(q.title) + '</div>' +
        '<div class="list-sub">' + esc(q.source) + '</div></div>' +
        '<div class="list-arrow">›</div></div>';
    }).join('');
    return '<div class="fade"><div class="section-title">我的收藏（' + ids.length + '）</div>' + html + '</div>';
  }

  function renderMe() {
    var week = window.Store.week().map(function (x) { return '<i class="' + (x.on ? 'on' : '') + '"></i>'; }).join('');
    return '<div class="fade">' +
      '<div class="card me-head">' +
        '<div class="me-avatar">學</div>' +
        '<div><div class="me-name">' + esc(D.appName) + '</div>' +
        '<div class="me-sub">' + esc(D.slogan) + '</div></div>' +
      '</div>' +
      '<div class="stat-row">' +
        '<div class="stat"><div class="n">' + window.Store.streak() + '</div><div class="l">连续打卡</div></div>' +
        '<div class="stat"><div class="n">' + window.Store.readCount() + '</div><div class="l">已读篇数</div></div>' +
        '<div class="stat"><div class="n">' + window.Store.favCount() + '</div><div class="l">收藏</div></div>' +
      '</div>' +
      '<div class="card" style="margin-top:14px">' +
        '<div class="ci-left" style="font-size:13px;color:var(--ink-soft);margin-bottom:6px">近 7 日打卡</div>' +
        '<div class="streak-dots">' + week + '</div>' +
        (window.Store.checkedToday() ? '' : '<button class="btn btn-primary btn-block" data-act="checkin" style="margin-top:14px">今日打卡</button>') +
      '</div>' +
      '<div class="card" style="font-size:12px;color:var(--ink-soft);line-height:1.9">' +
        '数据保存在本机（localStorage），换设备不互通。嵌入小程序 / App 时可由原生层接管存储与分享。' +
      '</div>' +
      '</div>';
  }

  /* 颜色加深一点，用于分类页渐变 */
  function shade(hex) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, (n >> 16) - 26), g = Math.max(0, ((n >> 8) & 255) - 26), b = Math.max(0, (n & 255) - 26);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /* ---------------- 路由 ---------------- */
  function route() {
    var h = location.hash || '#/';
    var html;
    if (h === '#/' || h === '' ) html = renderHome();
    else if (h === '#/explore') html = renderExplore();
    else if (h.indexOf('#/cat/') === 0) html = renderCat(h.split('/')[2]);
    else if (h.indexOf('#/detail/') === 0) html = renderDetail(h.split('/')[2]);
    else if (h === '#/search') html = renderSearch();
    else if (h === '#/favorites') html = renderFavorites();
    else if (h === '#/me') html = renderMe();
    else html = renderHome();

    view.innerHTML = html;
    setActiveTab(h);
    window.scrollTo(0, 0);

    if (h === '#/search') {
      var inp = document.getElementById('s-input');
      if (inp) { inp.focus(); inp.oninput = function () { searchQ = inp.value; document.getElementById('s-result').innerHTML = searchResultsHtml(searchQ); }; }
    }
  }

  function setActiveTab(h) {
    var map = { '#/': 0, '#/explore': 1, '#/search': 2, '#/favorites': 3, '#/me': 4 };
    var idx = map[h] !== undefined ? map[h] : -1;
    if (h.indexOf('#/cat/') === 0 || h.indexOf('#/detail/') === 0) idx = 1;
    var tabs = document.querySelectorAll('.tab');
    tabs.forEach(function (t, i) { t.classList.toggle('active', i === idx); });
  }

  /* ---------------- 事件委托 ---------------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]'); if (!el) return;
    var act = el.getAttribute('data-act');
    if (act === 'detail') { location.hash = '#/detail/' + el.getAttribute('data-id'); }
    else if (act === 'cat') { location.hash = '#/cat/' + el.getAttribute('data-cat'); }
    else if (act === 'back') { if (history.length > 1) history.back(); else location.hash = '#/'; }
    else if (act === 'checkin') { window.Store.doCheckin(); route(); }
    else if (act === 'fav') {
      var id = el.getAttribute('data-id');
      var on = window.Store.toggleFav(id);
      // 更新当前按钮文案
      if (el.classList.contains('btn-primary')) { el.classList.remove('btn-primary'); el.textContent = '☆ 收藏'; }
      else { el.classList.add('btn-primary'); el.textContent = '★ 已收藏'; }
      el.textContent = on ? '★ 已收藏' : '☆ 收藏';
      if (on) el.classList.add('btn-primary'); else el.classList.remove('btn-primary');
    }
    else if (act === 'share') {
      if (navigator.share) navigator.share({ title: D.appName, text: '今天在「国学日课」读到一句好文。' });
      else alert('分享功能在嵌入小程序 / App 时由原生层接管。');
    }
  });

  window.addEventListener('hashchange', route);
  route();
})();
