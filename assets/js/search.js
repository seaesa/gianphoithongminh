/* ===========================================================================
   Site search.

   The live site's search box posts to WordPress. There is no server here, so
   the box posts to /tim-kiem/ instead and this ranks a pre-built index that
   build-search.py inlines into that page. The index is inline rather than
   fetched so the page also works from file://, where fetch() of a local JSON
   file is blocked.
   =========================================================================== */
(function (window, document) {
  'use strict';

  var root = document.getElementById('gpSearch');
  if (!root) return;

  var PAGE = 10;

  var index = [];
  try {
    index = JSON.parse(document.getElementById('gpSearchIndex').textContent);
  } catch (e) { index = []; }

  var prefix = root.getAttribute('data-prefix') || '';

  /* -- text ---------------------------------------------------------------- */

  var MARKS = /[\u0300-\u036f]/g;   // the combining accents Vietnamese uses

  /** Vietnamese search has to be accent-insensitive: "gian phoi" finds "giàn phơi". */
  function fold(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(MARKS, '')
      .replace(/\u0111/g, 'd');
  }

  /**
   * Folds `text` and records, for every character of the result, which
   * character of the original it came from.
   *
   * Folding is not length-preserving — a decomposed "ò" is two characters
   * that fold to one — so highlighting cannot reuse the folded offsets
   * directly. Walking character by character gives an exact map back.
   */
  function foldMap(text) {
    var folded = '', map = [];
    for (var i = 0; i < text.length; i++) {
      var piece = fold(text.charAt(i));
      for (var j = 0; j < piece.length; j++) map.push(i);
      folded += piece;
    }
    map.push(text.length);            // one past the end, for exclusive bounds
    return { folded: folded, map: map };
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** Wraps every matched term, mapping the folded offsets back to the original. */
  function highlight(text, terms) {
    var fm = foldMap(text);
    var folded = fm.folded, map = fm.map;
    var hits = [];
    terms.forEach(function (t) {
      var from = 0, at;
      while ((at = folded.indexOf(t, from)) !== -1) {
        hits.push([map[at], map[at + t.length]]);
        from = at + t.length;
      }
    });
    if (!hits.length) return escapeHtml(text);

    hits.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [hits[0]];
    for (var i = 1; i < hits.length; i++) {
      var last = merged[merged.length - 1];
      if (hits[i][0] <= last[1]) last[1] = Math.max(last[1], hits[i][1]);
      else merged.push(hits[i]);
    }

    var out = '', cursor = 0;
    merged.forEach(function (h) {
      out += escapeHtml(text.slice(cursor, h[0]));
      out += '<mark>' + escapeHtml(text.slice(h[0], h[1])) + '</mark>';
      cursor = h[1];
    });
    return out + escapeHtml(text.slice(cursor));
  }

  /* -- ranking ------------------------------------------------------------- */

  function search(query) {
    var terms = fold(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];

    var results = [];
    for (var i = 0; i < index.length; i++) {
      var row = index[i];
      var title = fold(row.t);
      var score = 0, all = true;

      for (var j = 0; j < terms.length; j++) {
        var t = terms[j];
        var inTitle = title.indexOf(t);
        var inBody = row.q.indexOf(t);
        if (inTitle === -1 && inBody === -1) { all = false; break; }
        // a hit in the title counts for much more than one in the body, and a
        // hit at the very start of the title more still
        if (inTitle === 0) score += 12;
        else if (inTitle > 0) score += 8;
        if (inBody !== -1) score += 1;
      }
      if (!all) continue;

      // the whole phrase, in order, is the strongest signal there is
      var phrase = terms.join(' ');
      if (title.indexOf(phrase) !== -1) score += 15;
      else if (row.q.indexOf(phrase) !== -1) score += 5;
      // products and articles are more useful answers than archive pages
      if (row.k === 'Sản phẩm') score += 3;
      else if (row.k === 'Tin tức') score += 2;

      results.push({ row: row, score: score });
    }

    results.sort(function (a, b) {
      return b.score - a.score || a.row.t.localeCompare(b.row.t, 'vi');
    });
    return results.map(function (r) { return r.row; });
  }

  /* -- rendering ----------------------------------------------------------- */

  function card(row, terms) {
    var href = prefix + row.u;
    var img = row.i
      ? '<div class="post-thumbnail"><a href="' + href + '"><img src="' + prefix + escapeHtml(row.i)
        + '" alt="' + escapeHtml(row.t) + '" loading="lazy"></a></div><!-- post-thumbnail /-->'
      : '';
    return '<article class="item-list">'
      + img
      + '<div class="entry">'
      + '<span class="gp-search-kind" data-kind="' + escapeHtml(row.k) + '">' + escapeHtml(row.k) + '</span>'
      + '<h2 class="post-box-title"><a href="' + href + '">' + highlight(row.t, terms) + '</a></h2>'
      + (row.p ? '<span class="gp-search-price">' + escapeHtml(row.p) + '</span>' : '')
      + '<p>' + highlight(row.x, terms) + '</p>'
      + '<a class="more-link" href="' + href + '">Xem chi tiết »</a>'
      + '</div><div class="clear"></div></article>';
  }

  var summary = document.getElementById('gpSearchSummary');
  var list = document.getElementById('gpSearchResults');
  var more = document.getElementById('gpSearchMore');
  var title = document.getElementById('gpSearchTitle');

  function empty(query) {
    list.innerHTML = '<div class="gp-search-empty">'
      + '<i class="fa fa-search" aria-hidden="true"></i>'
      + '<h3>Không tìm thấy kết quả nào cho “' + escapeHtml(query) + '”</h3>'
      + '<p>Bạn có thể thử:</p>'
      + '<ul>'
      + '<li>Kiểm tra lại chính tả của từ khoá</li>'
      + '<li>Dùng từ khoá ngắn và chung hơn, ví dụ “giàn phơi”</li>'
      + '<li>Bỏ dấu tiếng Việt — tìm kiếm vẫn hoạt động</li>'
      + '<li><a href="' + prefix + 'cua-hang/index.html">Xem toàn bộ sản phẩm</a></li>'
      + '<li><a href="' + prefix + 'category/tin-tuc/index.html">Xem tin tức mới nhất</a></li>'
      + '</ul></div>';
  }

  function run(query) {
    var terms = fold(query).split(/\s+/).filter(Boolean);
    var hits = search(query);
    var shown = 0;

    if (title) title.textContent = query ? 'Kết quả tìm kiếm cho: “' + query + '”' : 'Tìm kiếm';
    document.title = (query ? 'Tìm kiếm: ' + query : 'Tìm kiếm')
      + ' - Giàn phơi quần áo thông minh Hòa Phát';

    if (!query) {
      summary.innerHTML = 'Nhập từ khoá vào ô tìm kiếm phía trên để bắt đầu.';
      list.innerHTML = '';
      more.hidden = true;
      return;
    }

    summary.innerHTML = 'Tìm thấy <strong>' + hits.length + '</strong> kết quả cho '
      + '<strong>“' + escapeHtml(query) + '”</strong>';

    if (!hits.length) {
      empty(query);
      more.hidden = true;
      return;
    }

    list.innerHTML = '';

    function append() {
      var slice = hits.slice(shown, shown + PAGE);
      list.insertAdjacentHTML('beforeend',
        slice.map(function (r) { return card(r, terms); }).join(''));
      shown += slice.length;
      more.hidden = shown >= hits.length;
      if (!more.hidden) {
        more.querySelector('button').textContent =
          'Xem thêm ' + Math.min(PAGE, hits.length - shown) + ' kết quả';
      }
    }

    more.querySelector('button').onclick = append;
    append();
  }

  /* -- go ------------------------------------------------------------------ */

  function queryFromUrl() {
    var m = /[?&]s=([^&]*)/.exec(window.location.search);
    if (!m) return '';
    try { return decodeURIComponent(m[1].replace(/\+/g, ' ')).trim(); }
    catch (e) { return ''; }
  }

  var q = queryFromUrl();

  // keep the header box showing what was searched for
  var box = document.getElementById('s');
  if (box) box.value = q;

  run(q);
})(window, document);
