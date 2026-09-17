/* ===========================================================================
   Shopping cart — localStorage backed.

   The clone has no backend, so the cart lives entirely in the visitor's browser.
   Everything that touches storage is wrapped in try/catch: private windows and
   blocked site data must degrade to an in-memory cart, never throw.
   =========================================================================== */
(function (window, document) {
  'use strict';

  var KEY = 'gpcart.v1';
  var listeners = [];
  var memory = null;          // fallback when localStorage is unavailable

  /* -- storage ------------------------------------------------------------ */

  function read() {
    if (memory) return memory;
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(valid) : [];
    } catch (e) {
      return memory || [];
    }
  }

  function write(items) {
    memory = items;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(items));
      memory = null;          // storage works; stop shadowing it
    } catch (e) { /* keep the in-memory copy for this page view */ }
    listeners.forEach(function (fn) { try { fn(items); } catch (err) {} });
    return items;
  }

  function valid(it) {
    return it && typeof it.id === 'string' && it.id && typeof it.qty === 'number' && it.qty > 0;
  }

  /* -- money -------------------------------------------------------------- */

  /** WooCommerce on this site renders "1,500,000 ₫" — match it exactly. */
  function formatMoney(value) {
    var n = Math.max(0, Math.round(Number(value) || 0));
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₫';
  }

  function parseMoney(text) {
    return parseInt(String(text || '').replace(/[^\d]/g, ''), 10) || 0;
  }

  /* -- public API --------------------------------------------------------- */

  var Cart = {
    items: read,

    add: function (item, qty) {
      qty = Math.max(1, parseInt(qty, 10) || 1);
      var items = read();
      var found = items.filter(function (i) { return i.id === item.id; })[0];
      if (found) {
        found.qty += qty;
      } else {
        items.push({
          id: String(item.id),
          title: item.title || '',
          price: Number(item.price) || 0,
          oldPrice: Number(item.oldPrice) || 0,
          img: item.img || '',
          href: item.href || '#',
          qty: qty
        });
      }
      return write(items);
    },

    setQty: function (id, qty) {
      qty = parseInt(qty, 10) || 0;
      var items = read();
      if (qty <= 0) return Cart.remove(id);
      items.forEach(function (i) { if (i.id === id) i.qty = qty; });
      return write(items);
    },

    remove: function (id) {
      return write(read().filter(function (i) { return i.id !== id; }));
    },

    clear: function () { return write([]); },

    count: function () {
      return read().reduce(function (n, i) { return n + i.qty; }, 0);
    },

    subtotal: function () {
      return read().reduce(function (n, i) { return n + i.price * i.qty; }, 0);
    },

    formatMoney: formatMoney,
    parseMoney: parseMoney,

    on: function (fn) { listeners.push(fn); return fn; },

    /** Reads the product on a single-product page into a cart item. */
    fromProductPage: function (doc) {
      doc = doc || document;
      var root = doc.querySelector('div[id^="product-"]');
      var title = doc.querySelector('h1.product_title');
      if (!root || !title) return null;
      var idInput = doc.querySelector('input[name="add-to-cart"]');
      var price = doc.querySelector('.summary .price-block p.price');
      var ins = price && price.querySelector('ins .amount');
      var del = price && price.querySelector('del .amount');
      var any = price && price.querySelector('.amount');
      var img = doc.querySelector('.images.single-product-images img');
      return {
        id: (idInput && idInput.value) || root.id.replace('product-', ''),
        title: title.textContent.trim(),
        price: parseMoney((ins || any || {}).textContent),
        oldPrice: parseMoney((del || {}).textContent),
        img: img ? (img.getAttribute('src') || '') : '',
        href: location.pathname
      };
    }
  };

  window.GPCart = Cart;

  /* =======================================================================
     Header mini-cart — the markup the theme already ships, filled in.
     ======================================================================= */

  function rootPrefix() {
    // every page links its stylesheet with the same relative prefix
    var link = document.querySelector('link[href$="assets/css/theme.css"]');
    return link ? link.getAttribute('href').replace('assets/css/theme.css', '') : '';
  }

  function renderMiniCart() {
    var list = document.querySelector('.cart-header .cart_list');
    if (!list) return;
    var items = Cart.items();
    var prefix = rootPrefix();

    if (!items.length) {
      list.innerHTML = '<li class="empty">Chưa có sản phẩm trong giỏ hàng.</li>';
    } else {
      list.innerHTML = items.map(function (i) {
        return '<li class="mini-cart-item">'
          + '<a href="' + (i.href || '#') + '">'
          + (i.img ? '<img src="' + i.img + '" alt="">' : '')
          + '<span class="mini-cart-title">' + escapeHtml(i.title) + '</span></a>'
          + '<span class="quantity">' + i.qty + ' × <span class="woocommerce-Price-amount amount">'
          + formatMoney(i.price) + '</span></span>'
          + '<button type="button" class="mini-cart-remove" data-id="' + escapeHtml(i.id)
          + '" aria-label="Xoá sản phẩm">×</button>'
          + '</li>';
      }).join('');
    }

    var box = document.querySelector('.cart-container-list');
    if (box) {
      var foot = box.querySelector('.mini-cart-foot');
      if (items.length) {
        if (!foot) {
          foot = document.createElement('div');
          foot.className = 'mini-cart-foot';
          box.appendChild(foot);
        }
        foot.innerHTML = '<p class="total">Tổng cộng: <span class="woocommerce-Price-amount amount">'
          + formatMoney(Cart.subtotal()) + '</span></p>'
          + '<p class="buttons">'
          + '<a class="button" href="' + prefix + 'gio-hang/index.html">Xem giỏ hàng</a>'
          + '<a class="button checkout" href="' + prefix + 'thanh-toan/index.html">Thanh toán</a>'
          + '</p>';
      } else if (foot) {
        foot.remove();
      }
    }

    // The badge hangs off `.cart-header`, which the theme already positions
    // relative — that way nothing about the header's own CSS has to change.
    var icon = document.querySelector('.cart-header');
    if (icon) {
      var badge = icon.querySelector('.cart-count');
      var n = Cart.count();
      if (n > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'cart-count';
          icon.appendChild(badge);
        }
        badge.textContent = n > 99 ? '99+' : String(n);
      } else if (badge) {
        badge.remove();
      }
    }
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  Cart.escapeHtml = escapeHtml;
  Cart.rootPrefix = rootPrefix;

  document.addEventListener('click', function (ev) {
    var rm = ev.target.closest('.mini-cart-remove');
    if (!rm) return;
    ev.preventDefault();
    Cart.remove(rm.getAttribute('data-id'));
  });

  /* =======================================================================
     Toast — brief confirmation after adding to the cart
     ======================================================================= */

  var toastTimer = null;

  Cart.toast = function (message, href) {
    var el = document.querySelector('.gp-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'gp-toast';
      document.body.appendChild(el);
    }
    el.innerHTML = '<i class="fa fa-check-circle"></i><span>' + escapeHtml(message) + '</span>'
      + (href ? '<a href="' + href + '">Xem giỏ hàng</a>' : '');
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 3600);
  };

  /* =======================================================================
     Add to cart from a single-product page
     ======================================================================= */

  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('button.single_add_to_cart_button');
    if (!btn) return;
    ev.preventDefault();

    var item = Cart.fromProductPage();
    if (!item) return;
    var qtyInput = document.querySelector('.quantity input.qty');
    var qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;

    Cart.add(item, qty);
    Cart.toast('Đã thêm “' + item.title + '” vào giỏ hàng.', rootPrefix() + 'gio-hang/index.html');
  });

  /* Keep the header in sync, including across tabs. */
  Cart.on(renderMiniCart);
  window.addEventListener('storage', function (e) { if (e.key === KEY) renderMiniCart(); });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderMiniCart);
  } else {
    renderMiniCart();
  }
})(window, document);
