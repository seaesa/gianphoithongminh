/* ===========================================================================
   thegioigianphoi.vn — behaviour layer
   Vanilla re-implementation of the original jQuery stack:
     hrm-custom.js + Bootstrap 3 tabs/collapse + Owl Carousel 2
   Timings, easings and state-class names mirror the originals exactly.
   =========================================================================== */
(function () {
  'use strict';

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* -- jQuery's default "swing" easing, so scroll/slide feel identical ----- */
  function swing(p) { return 0.5 - Math.cos(p * Math.PI) / 2; }

  function animate(duration, step, done) {
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      step(swing(p), p);
      if (p < 1) requestAnimationFrame(frame);
      else if (done) done();
    }
    requestAnimationFrame(frame);
  }

  /* jQuery .slideDown() / .slideUp() / .toggle(duration) ------------------- */
  function slide(el, show, duration, done) {
    if (el._slideAnim) el._slideAnim = null;
    var target;
    if (show) {
      el.style.display = 'block';
      el.style.overflow = 'hidden';
      el.style.height = 'auto';
      target = el.offsetHeight;
      el.style.height = '0px';
    } else {
      el.style.overflow = 'hidden';
      target = el.offsetHeight;
    }
    animate(duration, function (t) {
      el.style.height = (show ? target * t : target * (1 - t)) + 'px';
    }, function () {
      el.style.height = '';
      el.style.overflow = '';
      if (!show) el.style.display = 'none';
      if (done) done();
    });
  }

  function slideToggle(el, duration) {
    var hidden = getComputedStyle(el).display === 'none';
    slide(el, hidden, duration);
  }

  /* =======================================================================
     1. Responsive off-canvas menu
     ======================================================================= */
  var menuPanel   = $('.menu-responsive');
  var menuOverlay = $('.menu-responsive-overlay');
  var btnOpen     = $('.menu-open');
  var btnClose2   = $('.menu-close-2');

  function slideMenu(to, after) {
    var from = parseFloat(getComputedStyle(menuPanel).left) || 0;
    animate(200, function (t) {
      menuPanel.style.left = (from + (to - from) * t) + 'px';
    }, after);
  }

  function openMenu() {
    slideMenu(0);
    if (btnOpen) btnOpen.style.display = 'none';
    if (btnClose2) btnClose2.style.display = 'block';
    menuOverlay.classList.add('open-mn');
  }

  function closeMenu() {
    slideMenu(-250);
    if (btnClose2) btnClose2.style.display = 'none';
    if (btnOpen) btnOpen.style.display = '';
    menuOverlay.classList.remove('open-mn');
  }

  if (btnOpen) btnOpen.addEventListener('click', openMenu);
  $$('.menu-close, .menu-close-2').forEach(function (el) {
    el.addEventListener('click', closeMenu);
  });
  if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);

  /* =======================================================================
     2. Scroll state — back-to-top button + floating close button
     ======================================================================= */
  var topControl = $('#topcontrol');

  function onScroll() {
    var scrolled = (window.pageYOffset || document.documentElement.scrollTop) > 100;
    if (topControl) topControl.style.bottom = scrolled ? '45px' : '-100px';
    if (btnClose2) btnClose2.classList.toggle('btn-scrolled', scrolled);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (topControl) {
    topControl.addEventListener('click', function (ev) {
      ev.preventDefault();
      var from = window.pageYOffset || document.documentElement.scrollTop;
      animate(800, function (t) { window.scrollTo(0, from * (1 - t)); });
    });
  }

  /* =======================================================================
     3. Home slider — Owl Carousel 2 compatible markup & options
        items:1, loop, autoplay 9000ms, hover pause, smartSpeed 450, nav+dots
     ======================================================================= */
  function owlCarousel(root, opt) {
    var items = $$(':scope > .item', root);
    if (!items.length) return;

    var count = items.length;
    var loop  = !!opt.loop;
    var at    = function (i) { return items[((i % count) + count) % count]; };

    var stageOuter = document.createElement('div');
    stageOuter.className = 'owl-stage-outer';
    var stage = document.createElement('div');
    stage.className = 'owl-stage';
    stageOuter.appendChild(stage);

    // Owl clones two slides on each side when looping.
    var order = [];
    if (loop) {
      order.push({ node: at(count - 2), clone: true });
      order.push({ node: at(count - 1), clone: true });
    }
    items.forEach(function (n) { order.push({ node: n, clone: false }); });
    if (loop) {
      order.push({ node: at(0), clone: true });
      order.push({ node: at(1), clone: true });
    }

    var cells = order.map(function (o) {
      var cell = document.createElement('div');
      cell.className = 'owl-item' + (o.clone ? ' cloned' : '');
      cell.appendChild(o.clone ? o.node.cloneNode(true) : o.node);
      stage.appendChild(cell);
      return cell;
    });

    root.innerHTML = '';
    root.appendChild(stageOuter);
    // Owl tags the container itself — `.owl-carousel .owl-item { float: left }`
    // only applies once `owl-carousel` is present.
    root.classList.add('owl-carousel', 'owl-loaded', 'owl-drag');

    // nav
    var nav = document.createElement('div');
    nav.className = 'owl-nav';
    var prev = document.createElement('div');
    prev.className = 'owl-prev';
    prev.innerHTML = opt.navText[0];
    var next = document.createElement('div');
    next.className = 'owl-next';
    next.innerHTML = opt.navText[1];
    nav.appendChild(prev);
    nav.appendChild(next);
    root.appendChild(nav);

    // dots
    var dots = document.createElement('div');
    dots.className = 'owl-dots';
    for (var i = 0; i < count; i++) {
      var dot = document.createElement('div');
      dot.className = 'owl-dot' + (i === 0 ? ' active' : '');
      dot.appendChild(document.createElement('span'));
      dots.appendChild(dot);
    }
    root.appendChild(dots);

    /* Owl's `responsive` map: the largest breakpoint at or below the viewport wins. */
    function perView() {
      if (!opt.responsive) return opt.items || 1;
      var best = opt.items || 1;
      Object.keys(opt.responsive)
        .map(Number).sort(function (a, b) { return a - b; })
        .forEach(function (bp) { if (window.innerWidth >= bp) best = opt.responsive[bp]; });
      return Math.max(1, best);
    }

    var offset = loop ? 2 : 0;
    var index = offset;
    var width = 0;      // width of one cell
    var view = perView();

    function syncDisabled() {
      nav.classList.toggle('disabled', !opt.nav || count <= view);
      dots.classList.toggle('disabled', !opt.dots || count <= view);
    }

    function measure() {
      view = perView();
      width = root.clientWidth / view;
      cells.forEach(function (c) { c.style.width = width + 'px'; });
      stage.style.width = (width * cells.length) + 'px';
      syncDisabled();
      var maxIndex = loop ? Infinity : Math.max(0, count - view);
      if (index > maxIndex) index = maxIndex;
      place(false);
    }

    function place(animated) {
      stage.style.transition = animated ? 'all ' + opt.smartSpeed + 'ms ease' : 'all 0s ease';
      stage.style.transform = 'translate3d(' + (-width * index) + 'px, 0px, 0px)';
      cells.forEach(function (c, i) {
        c.classList.toggle('active', i >= index && i < index + view);
      });
      var real = ((index - offset) % count + count) % count;
      $$('.owl-dot', dots).forEach(function (d, i) { d.classList.toggle('active', i === real); });
    }

    function go(step) {
      if (!loop) {
        var maxIndex = Math.max(0, count - view);
        index += step;
        if (index < 0) index = maxIndex;
        if (index > maxIndex) index = 0;
        place(true);
        return;
      }
      index += step;
      place(true);
      setTimeout(function () {
        if (index >= count + offset) { index = offset; place(false); }
        else if (index < offset) { index = count + offset - 1; place(false); }
      }, opt.smartSpeed);
    }

    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    $$('.owl-dot', dots).forEach(function (d, i) {
      d.addEventListener('click', function () { index = offset + i; place(true); });
    });

    var timer = null;
    function play() {
      if (!opt.autoplay || count <= view) return;
      stop();
      timer = setInterval(function () { go(1); }, opt.autoplayTimeout);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    if (opt.autoplayHoverPause) {
      root.addEventListener('mouseenter', stop);
      root.addEventListener('mouseleave', play);
    }

    measure();
    window.addEventListener('resize', measure);
    play();
  }

  $$('.home-slider').forEach(function (el) {
    owlCarousel(el, {
      items: 1,
      loop: true,
      autoplay: true,
      autoplayTimeout: 9000,
      autoplayHoverPause: true,
      smartSpeed: 450,
      dots: true,
      nav: true,
      navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>']
    });
  });

  /* =======================================================================
     4. Product tabs — Bootstrap 3 `data-toggle="tab"`
        Bootstrap's activate(): the outgoing pane drops `in` right away (so it
        fades out), and only after the 150ms transition does it drop `active`
        while the incoming pane gains `active` → reflow → `in`.
     ======================================================================= */
  var TAB_TRANSITION = 150;

  $$('[data-toggle="tab"]').forEach(function (link) {
    link.addEventListener('click', function (ev) {
      ev.preventDefault();
      var pane = document.getElementById(link.getAttribute('href').slice(1));
      if (!pane) return;

      var li = link.closest('li');
      if (li.classList.contains('active')) return;

      // Tab strip switches immediately (no .fade on the <li>s).
      $$(':scope > li', li.parentNode).forEach(function (n) { n.classList.remove('active'); });
      li.classList.add('active');
      link.setAttribute('aria-expanded', 'true');

      var container = pane.parentNode;
      var current = $$(':scope > .tab-pane.active', container)[0];
      var fade = pane.classList.contains('fade') || (current && current.classList.contains('fade'));

      function swap() {
        if (current) current.classList.remove('active');
        pane.classList.add('active');
        if (fade) {
          void pane.offsetWidth;   // force reflow so the opacity transition runs
          pane.classList.add('in');
        } else {
          pane.classList.remove('fade');
        }
      }

      if (current && fade) {
        current.classList.remove('in');
        setTimeout(swap, TAB_TRANSITION);
      } else {
        swap();
      }
    });
  });

  /* =======================================================================
     5. Product-category dropdown in the blue bar
     ======================================================================= */
  var prNavTitle = $('.title-pr-nav');
  var prNavBox   = $('.nav-pr-container');
  if (prNavTitle && prNavBox) {
    prNavTitle.addEventListener('click', function () { slideToggle(prNavBox, 600); });
  }

  /* =======================================================================
     6. Sidebar / widget sub-menu toggles
     ======================================================================= */
  $$('.widget-area .widget_nav_menu .menu-item-has-children > a, #primary .widget_nav_menu .menu-item-has-children > a')
    .forEach(function (a) {
      var span = document.createElement('span');
      span.className = 'sub-open';
      a.parentNode.insertBefore(span, a.nextSibling);
      span.addEventListener('click', function () {
        var sub = span.closest('li').querySelector(':scope > .sub-menu');
        if (sub) slideToggle(sub, 600);
        span.classList.toggle('sub-opend');
      });
    });

  /* =======================================================================
     7. Breakpoint-dependent wiring (mirrors the original's resize handler)
     ======================================================================= */
  var mobileArrowsOn = null;

  function applyBreakpoint() {
    var w = window.innerWidth;

    if (prNavBox) prNavBox.classList.toggle('nav-block-i', w >= 768);

    var wantArrows = w < 768;
    if (wantArrows !== mobileArrowsOn) {
      mobileArrowsOn = wantArrows;
      if (wantArrows) {
        $$('.nav-pr-container .menu-item-has-children > a').forEach(function (a) {
          var el = document.createElement('span');
          el.className = 'moblie-sub';
          el.innerHTML = '<i class="fa fa-angle-down" aria-hidden="true"></i>';
          a.parentNode.insertBefore(el, a.nextSibling);
          el.addEventListener('click', function () {
            var sub = el.closest('.menu-item-has-children').querySelector('.sub-menu');
            if (sub) sub.style.display = getComputedStyle(sub).display === 'none' ? 'block' : 'none';
          });
        });
      } else {
        $$('.nav-pr-container .moblie-sub').forEach(function (el) { el.remove(); });
      }
    }
  }

  applyBreakpoint();
  window.addEventListener('resize', applyBreakpoint);

  /* Hovering the category box opens it on desktop (original binds on resize). */
  var productNav = $('.product-nav');
  if (productNav && prNavBox) {
    productNav.addEventListener('mouseenter', function () {
      if (window.innerWidth >= 768) slide(prNavBox, true, 400);
    });
    productNav.addEventListener('mouseleave', function () {
      if (window.innerWidth >= 768) slide(prNavBox, false, 400);
    });
  }

  /* =======================================================================
     8. Single-product page
     ======================================================================= */

  /* -- 8a. Gallery thumbnails carousel (options from hrm-custom.js) -------- */
  $$('.single-product-images .thumbnails').forEach(function (el) {
    owlCarousel(el, {
      loop: false,
      autoplay: true,
      autoplayTimeout: 3000,
      autoplayHoverPause: true,
      smartSpeed: 250,
      dots: false,
      nav: true,
      responsive: { 0: 1, 500: 3, 800: 4, 1200: 5 },
      navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>']
    });
  });

  /* -- 8b. WooCommerce product tabs --------------------------------------- */
  $$('.woocommerce-tabs, .wc-tabs-wrapper').forEach(function (wrap) {
    var panels = $$('.wc-tab, .panel', wrap).filter(function (p) { return !p.parentNode.closest('.panel'); });
    var tabs = $$('.wc-tabs li a, ul.tabs li a', wrap);
    if (!tabs.length) return;

    function show(link) {
      $$('.wc-tabs li, ul.tabs li', wrap).forEach(function (li) { li.classList.remove('active'); });
      panels.forEach(function (p) { p.style.display = 'none'; });
      link.closest('li').classList.add('active');
      var target = wrap.querySelector(link.getAttribute('href'));
      if (target) target.style.display = '';
    }

    tabs.forEach(function (a) {
      a.addEventListener('click', function (ev) { ev.preventDefault(); show(a); });
    });

    // WooCommerce opens #reviews when the URL points at it, else the first tab.
    var hash = (location.hash || '').toLowerCase();
    var reviews = tabs.filter(function (a) { return /reviews/.test(a.getAttribute('href') || ''); })[0];
    show((reviews && (hash.indexOf('comment-') >= 0 || hash === '#reviews' || hash === '#tab-reviews'))
      ? reviews : tabs[0]);
  });

  /* -- 8c. Quantity stepper (woo_quantily in hrm-custom.js) ---------------- */
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.quantity .quantity-plus, .quantity .quantity-minus');
    if (!btn) return;
    var input = btn.closest('.quantity').querySelector('input.qty');
    if (!input) return;
    var step = parseInt(input.getAttribute('step'), 10) || 1;
    var min = parseInt(input.getAttribute('min'), 10);
    var max = parseInt(input.getAttribute('max'), 10);
    var val = parseInt(input.value, 10) || 0;
    val += btn.classList.contains('quantity-plus') ? step : -step;
    if (max && val > max) val = max;
    if (min && val < min) val = min;
    if (!min && val < 0) val = 0;
    input.value = val;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* -- 8d. "Đặt hàng nhanh" modal (Bootstrap 3 data API) ------------------- */
  var backdrop = null;

  function closeModal(modal) {
    modal.classList.remove('in');
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    if (backdrop) { backdrop.remove(); backdrop = null; }
  }

  function openModal(modal) {
    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade in';
    document.body.appendChild(backdrop);
    document.body.classList.add('modal-open');
    modal.style.display = 'block';
    void modal.offsetWidth;
    modal.classList.add('in');
    backdrop.addEventListener('click', function () { closeModal(modal); });
  }

  document.addEventListener('click', function (ev) {
    var open = ev.target.closest('[data-toggle="modal"]');
    if (open) {
      ev.preventDefault();
      var sel = open.getAttribute('data-target') || open.getAttribute('href');
      var modal = sel && document.querySelector(sel);
      if (modal) openModal(modal);
      return;
    }
    var close = ev.target.closest('[data-dismiss="modal"]');
    if (close) {
      ev.preventDefault();
      var m = close.closest('.modal');
      if (m) closeModal(m);
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    var open = $('.modal.in');
    if (open) closeModal(open);
  });

  /* -- 8e. Match the add-to-cart button to the order button --------------- */
  var orderBtn = $('.hrm_custom_price .button.btn-dathang');
  var cartBtn = $('button.single_add_to_cart_button');
  if (orderBtn && cartBtn) cartBtn.style.width = orderBtn.offsetWidth + 'px';

  /* Original copies the quick-order fields across before submitting. */
  $$('.btn-dathang').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pairs = [['.us_name', 'input.ord_name'], ['.us_phone', 'input.ord_phone'],
                   ['.us_email', 'input.ord_email'], ['.us_address', 'input.ord_dc']];
      pairs.forEach(function (p) {
        var from = $(p[0]), to = $(p[1]);
        if (from && to) to.value = from.value;
      });
    });
  });

  /* -- 8f. prettyPhoto lightbox for the product gallery -------------------- */
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[data-rel^="prettyPhoto"], a.zoom');
    if (!a || !a.getAttribute('href')) return;
    if (!/\.(jpe?g|png|gif|webp)$/i.test(a.getAttribute('href'))) return;
    ev.preventDefault();

    var box = document.createElement('div');
    box.className = 'pp_pic_holder pp_clone';
    box.innerHTML = '<div class="pp_clone_inner"><img src="' + a.getAttribute('href') + '" alt="">'
      + '<button type="button" class="pp_clone_close" aria-label="Đóng">&times;</button></div>';
    document.body.appendChild(box);
    var kill = function () { box.remove(); document.removeEventListener('keydown', esc); };
    var esc = function (e) { if (e.key === 'Escape') kill(); };
    box.addEventListener('click', kill);
    document.addEventListener('keydown', esc);
  });
})();
