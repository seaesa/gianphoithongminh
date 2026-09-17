/* ===========================================================================
   Cart page, checkout page and the quick-order modal.
   Depends on cart.js (window.GPCart). Every page-specific block is guarded, so
   this file is safe to load anywhere.
   =========================================================================== */
(function (window, document) {
  'use strict';

  var Cart = window.GPCart;
  if (!Cart) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fmt = Cart.formatMoney;
  var esc = Cart.escapeHtml;

  var ORDER_KEY = 'gporders.v1';

  function saveOrder(order) {
    try {
      var all = JSON.parse(window.localStorage.getItem(ORDER_KEY) || '[]');
      all.unshift(order);
      window.localStorage.setItem(ORDER_KEY, JSON.stringify(all.slice(0, 20)));
    } catch (e) { /* storage unavailable — the order still shows on screen */ }
  }

  function orderCode(prefix) {
    var d = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return (prefix || 'HP') + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate())
      + '-' + String(Math.floor(Math.random() * 9000) + 1000);
  }

  /* =======================================================================
     1. Cart page
     ======================================================================= */

  var cartRows = $('#gpCartRows');

  function renderCart() {
    if (!cartRows) return;
    var items = Cart.items();
    var empty = $('#gpCartEmpty');
    var filled = $('#gpCartFilled');

    if (empty) empty.hidden = items.length > 0;
    if (filled) filled.hidden = items.length === 0;
    if (!items.length) { cartRows.innerHTML = ''; return; }

    cartRows.innerHTML = items.map(function (i) {
      var line = i.price * i.qty;
      return '<tr data-id="' + esc(i.id) + '">'
        + '<td class="col-thumb">' + (i.img ? '<img src="' + esc(i.img) + '" alt="">' : '') + '</td>'
        + '<td class="col-name"><a class="gp-cart-name" href="' + esc(i.href || '#') + '">' + esc(i.title) + '</a>'
        + (i.oldPrice > i.price ? '<span class="gp-cart-old">' + fmt(i.oldPrice) + '</span>' : '') + '</td>'
        + '<td class="col-price" data-label="Đơn giá"><span class="amount">' + fmt(i.price) + '</span></td>'
        + '<td class="col-qty"><span class="gp-qty">'
        + '<button type="button" data-step="-1" aria-label="Giảm">−</button>'
        + '<input type="number" min="1" value="' + i.qty + '" aria-label="Số lượng">'
        + '<button type="button" data-step="1" aria-label="Tăng">+</button></span></td>'
        + '<td class="col-total" data-label="Thành tiền"><span class="amount">' + fmt(line) + '</span></td>'
        + '<td class="col-remove"><button type="button" class="gp-cart-remove" aria-label="Xoá sản phẩm">'
        + '<i class="fa fa-times" aria-hidden="true"></i></button></td>'
        + '</tr>';
    }).join('');

    var sub = Cart.subtotal();
    if ($('#gpCartSubtotal')) $('#gpCartSubtotal').innerHTML = fmt(sub);
    if ($('#gpCartTotal')) $('#gpCartTotal').innerHTML = fmt(sub);
  }

  if (cartRows) {
    cartRows.addEventListener('click', function (ev) {
      var row = ev.target.closest('tr[data-id]');
      if (!row) return;
      var id = row.getAttribute('data-id');

      if (ev.target.closest('.gp-cart-remove')) { Cart.remove(id); return; }

      var step = ev.target.closest('[data-step]');
      if (step) {
        var input = row.querySelector('.gp-qty input');
        var next = (parseInt(input.value, 10) || 1) + Number(step.getAttribute('data-step'));
        Cart.setQty(id, Math.max(1, next));
      }
    });

    cartRows.addEventListener('change', function (ev) {
      var input = ev.target.closest('.gp-qty input');
      if (!input) return;
      var row = input.closest('tr[data-id]');
      Cart.setQty(row.getAttribute('data-id'), Math.max(1, parseInt(input.value, 10) || 1));
    });

    if ($('#gpCartClear')) {
      $('#gpCartClear').addEventListener('click', function () {
        if (window.confirm('Xoá toàn bộ sản phẩm trong giỏ hàng?')) Cart.clear();
      });
    }

    Cart.on(renderCart);
    renderCart();
  }

  /* =======================================================================
     2. Checkout page
     ======================================================================= */

  var checkoutForm = $('#gpCheckoutForm');

  if (checkoutForm) {
    var PROVINCES = [];
    try {
      PROVINCES = JSON.parse($('#gpProvinceData') ? $('#gpProvinceData').textContent : '[]');
    } catch (e) { PROVINCES = []; }

    /* -- order summary --------------------------------------------------- */
    function renderSummary() {
      var items = Cart.items();
      var wrap = $('#gpCheckoutWrap');
      var empty = $('#gpCheckoutEmpty');
      var success = $('#gpCheckoutSuccess');
      if (success && !success.hidden) return;      // already ordered

      if (empty) empty.hidden = items.length > 0;
      if (wrap) wrap.hidden = items.length === 0;
      if (!items.length) return;

      $('#gpSummaryList').innerHTML = items.map(function (i) {
        return '<li>'
          + (i.img ? '<img src="' + esc(i.img) + '" alt="">' : '')
          + '<span class="gp-summary__name">' + esc(i.title) + '<small>SL: ' + i.qty + '</small></span>'
          + '<span class="gp-summary__price">' + fmt(i.price * i.qty) + '</span>'
          + '</li>';
      }).join('');

      var sub = Cart.subtotal();
      $('#gpSummarySubtotal').innerHTML = fmt(sub);
      $('#gpSummaryTotal').innerHTML = fmt(sub);
    }
    Cart.on(renderSummary);
    renderSummary();

    /* -- province → ward ------------------------------------------------- */
    var provinceSel = $('#gpProvince');
    var wardSel = $('#gpWard');

    if (provinceSel && wardSel) {
      provinceSel.addEventListener('change', function () {
        var found = PROVINCES.filter(function (p) { return p.name === provinceSel.value; })[0];
        wardSel.innerHTML = '<option value="">-- Chọn quận / huyện --</option>'
          + (found ? found.wards.map(function (w) {
            return '<option value="' + esc(w) + '">' + esc(w) + '</option>';
          }).join('') : '');
        wardSel.disabled = !found;
        clearError(wardSel);
      });
    }

    /* -- payment method -------------------------------------------------- */
    var bankDetail = $('#gpBankDetail');
    var confirmWrap = $('#gpConfirmWrap');
    var confirmBox = $('#gpConfirm');
    var confirmError = $('#gpConfirmError');

    function syncPayment() {
      var method = (checkoutForm.querySelector('input[name="payment"]:checked') || {}).value || 'cod';
      $$('.gp-pay__option').forEach(function (opt) {
        opt.classList.toggle('is-active', opt.getAttribute('data-method') === method);
      });
      if (bankDetail) bankDetail.hidden = method !== 'bank';
      if (confirmWrap) confirmWrap.hidden = method !== 'bank';
      if (method !== 'bank' && confirmError) confirmError.style.display = 'none';
    }

    $$('input[name="payment"]', checkoutForm).forEach(function (r) {
      r.addEventListener('change', syncPayment);
    });
    syncPayment();

    document.addEventListener('click', function (ev) {
      var copy = ev.target.closest('.gp-copy');
      if (!copy) return;
      ev.preventDefault();
      var text = copy.getAttribute('data-copy') || '';
      var done = function () {
        var old = copy.textContent;
        copy.textContent = 'Đã chép';
        setTimeout(function () { copy.textContent = old; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        done();
      }
    });

    /* -- validation ------------------------------------------------------ */
    function setError(el, on) { el.closest('.gp-field').classList.toggle('has-error', !!on); }
    function clearError(el) { setError(el, false); }

    var RULES = {
      gpName: function (v) { return v.trim().length >= 2; },
      gpPhone: function (v) { return /^0\d{9}$/.test(v.replace(/[\s.]/g, '')); },
      gpEmail: function (v) { return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
      gpProvince: function (v) { return !!v; },
      gpWard: function (v) { return !!v; },
      gpAddress: function (v) { return v.trim().length >= 4; }
    };

    Object.keys(RULES).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur', function () { setError(el, !RULES[id](el.value)); });
      el.addEventListener('input', function () { if (RULES[id](el.value)) clearError(el); });
    });

    checkoutForm.addEventListener('submit', function (ev) {
      ev.preventDefault();

      var firstBad = null;
      Object.keys(RULES).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var ok = RULES[id](el.value);
        setError(el, !ok);
        if (!ok && !firstBad) firstBad = el;
      });

      var method = (checkoutForm.querySelector('input[name="payment"]:checked') || {}).value || 'cod';
      if (method === 'bank' && confirmBox && !confirmBox.checked) {
        if (confirmError) confirmError.style.display = 'block';
        if (!firstBad) firstBad = confirmBox;
      }

      if (firstBad) {
        firstBad.focus();
        firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }

      var items = Cart.items();
      if (!items.length) return;

      var code = orderCode();
      saveOrder({
        code: code,
        at: new Date().toISOString(),
        method: method,
        total: Cart.subtotal(),
        customer: {
          name: $('#gpName').value.trim(),
          phone: $('#gpPhone').value.trim(),
          email: $('#gpEmail').value.trim(),
          province: $('#gpProvince').value,
          ward: $('#gpWard').value,
          address: $('#gpAddress').value.trim(),
          note: $('#gpNote').value.trim()
        },
        items: items
      });

      $('#gpOrderCode').textContent = code;
      $('#gpOrderMethod').textContent = method === 'bank'
        ? 'Hình thức: chuyển khoản ngân hàng — chúng tôi sẽ đối soát và xác nhận sau khi nhận được khoản chuyển.'
        : 'Hình thức: thanh toán khi nhận hàng (COD).';

      Cart.clear();
      $('#gpCheckoutWrap').hidden = true;
      if ($('#gpCheckoutEmpty')) $('#gpCheckoutEmpty').hidden = true;
      $('#gpCheckoutSuccess').hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* =======================================================================
     3. Quick-order modal (product pages)
     The theme's modal body is a dead `[ninja_forms id=5]` shortcode; the
     renderer swaps in this form and the logic lives here.
     ======================================================================= */

  var quickForm = $('#gpQuickForm');

  if (quickForm) {
    var product = Cart.fromProductPage();
    var qtyInput = $('#gpQuickQty');
    var totalOut = $('#gpQuickTotal');

    function syncQuickTotal() {
      if (!product || !totalOut) return;
      var q = Math.max(1, parseInt(qtyInput.value, 10) || 1);
      totalOut.innerHTML = fmt(product.price * q);
    }

    $$('[data-quick-step]', quickForm).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = (parseInt(qtyInput.value, 10) || 1) + Number(btn.getAttribute('data-quick-step'));
        qtyInput.value = Math.max(1, next);
        syncQuickTotal();
      });
    });
    if (qtyInput) qtyInput.addEventListener('change', syncQuickTotal);
    syncQuickTotal();

    var QUICK_RULES = {
      gpQuickName: function (v) { return v.trim().length >= 2; },
      gpQuickPhone: function (v) { return /^0\d{9}$/.test(v.replace(/[\s.]/g, '')); },
      gpQuickAddress: function (v) { return v.trim().length >= 4; }
    };

    Object.keys(QUICK_RULES).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function () {
        if (QUICK_RULES[id](el.value)) el.closest('.gp-field').classList.remove('has-error');
      });
    });

    quickForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var firstBad = null;
      Object.keys(QUICK_RULES).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var ok = QUICK_RULES[id](el.value);
        el.closest('.gp-field').classList.toggle('has-error', !ok);
        if (!ok && !firstBad) firstBad = el;
      });
      if (firstBad) { firstBad.focus(); return; }
      if (!product) return;

      var qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
      var code = orderCode();
      saveOrder({
        code: code,
        at: new Date().toISOString(),
        method: 'quick',
        total: product.price * qty,
        customer: {
          name: $('#gpQuickName').value.trim(),
          phone: $('#gpQuickPhone').value.trim(),
          address: $('#gpQuickAddress').value.trim(),
          note: $('#gpQuickNote') ? $('#gpQuickNote').value.trim() : ''
        },
        items: [Object.assign({}, product, { qty: qty })]
      });

      quickForm.hidden = true;
      var ok = $('#gpQuickSuccess');
      ok.querySelector('.gp-order-code').textContent = code;
      ok.hidden = false;
    });

    /* Reopening the modal resets it back to the form. */
    document.addEventListener('click', function (ev) {
      if (!ev.target.closest('[data-toggle="modal"]')) return;
      var ok = $('#gpQuickSuccess');
      if (ok && !ok.hidden) { ok.hidden = true; quickForm.hidden = false; quickForm.reset(); syncQuickTotal(); }
    });
  }

  /* =======================================================================
     4. Contact page (/lien-he/)

     There is no backend, so the request is validated, kept in localStorage and
     confirmed on screen with a request code — the same contract the checkout
     and the quick-order modal offer.
     ======================================================================= */

  var contactForm = $('#gpContactForm');

  if (contactForm) {
    var REQUEST_KEY = 'gprequests.v1';

    var CONTACT_RULES = {
      gpContactName: function (v) { return v.trim().length >= 2; },
      gpContactPhone: function (v) { return /^0\d{9}$/.test(v.replace(/[\s.]/g, '')); },
      /* optional — only a filled-in address has to look like an email */
      gpContactEmail: function (v) { return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      gpContactMessage: function (v) { return v.trim().length >= 10; }
    };

    var contactSuccess = $('#gpContactSuccess');

    function contactField(id) {
      var el = document.getElementById(id);
      return el && el.closest('.gp-field') ? el : null;
    }

    Object.keys(CONTACT_RULES).forEach(function (id) {
      var el = contactField(id);
      if (!el) return;
      /* clear as soon as it is valid, but only complain once the field is left */
      el.addEventListener('input', function () {
        if (CONTACT_RULES[id](el.value)) el.closest('.gp-field').classList.remove('has-error');
      });
      el.addEventListener('blur', function () {
        el.closest('.gp-field').classList.toggle('has-error', !CONTACT_RULES[id](el.value));
      });
    });

    function saveRequest(req) {
      try {
        var all = JSON.parse(window.localStorage.getItem(REQUEST_KEY) || '[]');
        all.unshift(req);
        window.localStorage.setItem(REQUEST_KEY, JSON.stringify(all.slice(0, 20)));
      } catch (e) { /* storage unavailable — the request still shows on screen */ }
    }

    contactForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var firstBad = null;
      Object.keys(CONTACT_RULES).forEach(function (id) {
        var el = contactField(id);
        if (!el) return;
        var ok = CONTACT_RULES[id](el.value);
        el.closest('.gp-field').classList.toggle('has-error', !ok);
        if (!ok && !firstBad) firstBad = el;
      });
      if (firstBad) {
        firstBad.focus();
        if (firstBad.scrollIntoView) firstBad.scrollIntoView({ block: 'center' });
        return;
      }

      var value = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      var code = orderCode('YC');
      saveRequest({
        code: code,
        at: new Date().toISOString(),
        name: value('gpContactName'),
        phone: value('gpContactPhone'),
        email: value('gpContactEmail'),
        topic: value('gpContactTopic'),
        address: value('gpContactAddress'),
        message: value('gpContactMessage')
      });

      contactForm.hidden = true;
      if (contactSuccess) {
        var out = $('#gpContactCode', contactSuccess);
        if (out) out.textContent = code;
        contactSuccess.hidden = false;
        if (contactSuccess.scrollIntoView) contactSuccess.scrollIntoView({ block: 'center' });
      }
    });

    var again = $('#gpContactAgain');
    if (again) {
      again.addEventListener('click', function () {
        if (contactSuccess) contactSuccess.hidden = true;
        contactForm.reset();
        $$('.gp-field.has-error', contactForm).forEach(function (f) { f.classList.remove('has-error'); });
        contactForm.hidden = false;
        var first = document.getElementById('gpContactName');
        if (first) first.focus();
      });
    }
  }
})(window, document);
