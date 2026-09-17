# -*- coding: utf-8 -*-
"""Render the pages that the clone adds on top of the live site.

  /gio-hang/                        working cart      (replaces the cloned empty-cart page)
  /thanh-toan/                      working checkout  (replaces the cloned empty-cart page)
  /danh-muc/gian-phoi-xep-ngang/    category page the live site 404s on
  /tim-kiem/                        search results  (the live box posts to WordPress)

Everything else — header, breadcrumbs, sidebar, footers — comes from render.py,
so these pages sit inside the same chrome as the rest of the clone.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(__file__))
import render
from render import Ctx, e, head, offcanvas, header, breadcrumbs, sidebar, upper_footer, footer, floating

CUSTOM = json.load(open('data/custom.json', encoding='utf-8'))
PRODUCTS = {p['id']: p for p in json.load(open('data/products.json', encoding='utf-8'))}
SEARCH_INDEX = json.load(open('data/search-index.json', encoding='utf-8'))
INDEX = json.load(open('data/pages-index.json', encoding='utf-8'))
PAGES = {r['url'] for r in INDEX} | {'https://thegioigianphoi.vn/'} \
        | {p['url'] for p in CUSTOM['pages']}


def money(txt):
    return ('<span class="woocommerce-Price-amount amount">' + e(txt)
            + '&nbsp;<span class="woocommerce-Price-currencySymbol">₫</span></span>')


# ─────────────────────────────────────────────────────── cart page

def cart_main(ctx):
    return f'''
    <article class="page type-page status-publish hentry">
      <header class="entry-header"><h1 class="entry-title">Giỏ hàng</h1></header>
      <div class="entry-content">

        <div id="gpCartEmpty" class="gp-empty" hidden>
          <i class="fa fa-shopping-cart" aria-hidden="true"></i>
          <p>Chưa có sản phẩm nào trong giỏ hàng của bạn.</p>
          <a class="gp-btn" href="{ctx.prefix}cua-hang/index.html">Tiếp tục mua hàng</a>
        </div>

        <div id="gpCartFilled" hidden>
          <table class="gp-cart-table">
            <thead>
              <tr>
                <th colspan="2">Sản phẩm</th>
                <th class="col-price">Đơn giá</th>
                <th class="col-qty">Số lượng</th>
                <th class="col-total">Thành tiền</th>
                <th class="col-remove"><span class="screen-reader-text">Xoá</span></th>
              </tr>
            </thead>
            <tbody id="gpCartRows"></tbody>
          </table>

          <div class="gp-cart-actions">
            <a class="gp-btn gp-btn--ghost" href="{ctx.prefix}cua-hang/index.html">
              <i class="fa fa-angle-left" aria-hidden="true"></i> Tiếp tục mua hàng
            </a>
            <button type="button" class="gp-btn gp-btn--ghost" id="gpCartClear">
              <i class="fa fa-trash-o" aria-hidden="true"></i> Xoá toàn bộ giỏ hàng
            </button>
          </div>

          <div class="gp-cart-totals">
            <h3>Cộng giỏ hàng</h3>
            <div class="row-line"><span>Tạm tính</span><span id="gpCartSubtotal">0&nbsp;₫</span></div>
            <div class="row-line"><span>Phí vận chuyển</span><span>Miễn phí</span></div>
            <div class="row-line is-total"><span>Tổng cộng</span><span class="amount" id="gpCartTotal">0&nbsp;₫</span></div>
            <p class="note">{e(CUSTOM['shipping']['freeNote'])}</p>
            <p class="go"><a class="gp-btn gp-btn--primary gp-btn--block" href="{ctx.prefix}thanh-toan/index.html">Tiến hành thanh toán</a></p>
          </div>
        </div>

      </div>
      <footer class="entry-footer"></footer>
    </article>'''


# ─────────────────────────────────────────────────── checkout page

def qr_svg():
    """A decorative placeholder QR — this clone has no payment backend."""
    import hashlib
    seed = hashlib.md5(b'gianphoi-hoa-phat').digest()
    cells = []
    for y in range(21):
        for x in range(21):
            corner = (x < 7 and y < 7) or (x > 13 and y < 7) or (x < 7 and y > 13)
            on = corner and (x in (0, 6) or y in (0, 6) or (2 <= x <= 4 and 2 <= y <= 4)) if corner \
                else bool(seed[(x * 21 + y) % len(seed)] >> ((x + y) % 8) & 1)
            if on:
                cells.append(f'<rect x="{x*5}" y="{y*5}" width="5" height="5"/>')
    return ('<svg viewBox="0 0 105 105" role="img" aria-label="Mã QR chuyển khoản minh hoạ" fill="#0082c6">'
            '<rect width="105" height="105" fill="#fff"/>' + ''.join(cells) + '</svg>')


def checkout_main(ctx):
    import json as _json
    province_json = _json.dumps(CUSTOM['provinces'], ensure_ascii=False)
    bank = CUSTOM['bank']
    ship = CUSTOM['shipping']
    provinces = ''.join(f'<option value="{e(p["name"])}">{e(p["name"])}</option>'
                        for p in CUSTOM['provinces'])
    return f'''
    <article class="page type-page status-publish hentry">
      <header class="entry-header"><h1 class="entry-title">Thanh toán</h1></header>
      <div class="entry-content">

        <div id="gpCheckoutEmpty" class="gp-empty" hidden>
          <i class="fa fa-shopping-cart" aria-hidden="true"></i>
          <p>Giỏ hàng của bạn đang trống nên chưa thể thanh toán.</p>
          <a class="gp-btn" href="{ctx.prefix}cua-hang/index.html">Chọn sản phẩm</a>
        </div>

        <div id="gpCheckoutWrap" class="gp-checkout" hidden>
          <div class="gp-checkout__form">
            <h3 class="gp-section-title">Thông tin nhận hàng</h3>
            <form id="gpCheckoutForm" novalidate>
              <div class="gp-field">
                <label for="gpName">Họ và tên <span class="req">*</span></label>
                <input type="text" id="gpName" name="name" autocomplete="name" placeholder="Nguyễn Văn A" required>
                <span class="gp-error">Vui lòng nhập họ tên.</span>
              </div>
              <div class="gp-field-row">
                <div class="gp-field">
                  <label for="gpPhone">Số điện thoại <span class="req">*</span></label>
                  <input type="tel" id="gpPhone" name="phone" autocomplete="tel" placeholder="09xx xxx xxx" required>
                  <span class="gp-error">Số điện thoại phải có 10 chữ số.</span>
                </div>
                <div class="gp-field">
                  <label for="gpEmail">Email</label>
                  <input type="email" id="gpEmail" name="email" autocomplete="email" placeholder="email@example.com">
                  <span class="gp-error">Email chưa đúng định dạng.</span>
                </div>
              </div>
              <div class="gp-field-row">
                <div class="gp-field">
                  <label for="gpProvince">Tỉnh / Thành phố <span class="req">*</span></label>
                  <select id="gpProvince" name="province" required>
                    <option value="">-- Chọn tỉnh / thành --</option>
                    {provinces}
                  </select>
                  <span class="gp-error">Vui lòng chọn tỉnh / thành.</span>
                </div>
                <div class="gp-field">
                  <label for="gpWard">Quận / Huyện <span class="req">*</span></label>
                  <select id="gpWard" name="ward" required disabled>
                    <option value="">-- Chọn quận / huyện --</option>
                  </select>
                  <span class="gp-error">Vui lòng chọn quận / huyện.</span>
                </div>
              </div>
              <div class="gp-field">
                <label for="gpAddress">Địa chỉ cụ thể <span class="req">*</span></label>
                <input type="text" id="gpAddress" name="address" autocomplete="street-address"
                       placeholder="Số nhà, tên đường, toà nhà…" required>
                <span class="gp-error">Vui lòng nhập địa chỉ nhận hàng.</span>
              </div>
              <div class="gp-field">
                <label for="gpNote">Ghi chú (tuỳ chọn)</label>
                <textarea id="gpNote" name="note" placeholder="Thời gian nhận hàng, vị trí lắp đặt…"></textarea>
              </div>

              <div class="gp-pay">
                <h3 class="gp-section-title">Phương thức thanh toán</h3>

                <label class="gp-pay__option is-active" data-method="cod">
                  <input type="radio" name="payment" value="cod" checked>
                  <span class="gp-pay__icon"><i class="fa fa-money" aria-hidden="true"></i></span>
                  <span class="gp-pay__info">
                    <strong>Thanh toán khi nhận hàng (COD)</strong>
                    <small>{e(ship['codNote'])}</small>
                  </span>
                </label>

                <label class="gp-pay__option" data-method="bank">
                  <input type="radio" name="payment" value="bank">
                  <span class="gp-pay__icon"><i class="fa fa-university" aria-hidden="true"></i></span>
                  <span class="gp-pay__info">
                    <strong>Chuyển khoản ngân hàng</strong>
                    <small>{e(ship['bankNote'])}</small>
                  </span>
                </label>

                <div class="gp-pay__detail" id="gpBankDetail" hidden>
                  <div class="gp-bank">
                    <div class="gp-bank__qr">
                      {qr_svg()}
                      <span>Quét mã để chuyển khoản</span>
                    </div>
                    <div class="gp-bank__rows">
                      <dl>
                        <dt>Ngân hàng</dt><dd>{e(bank['name'])}</dd>
                        <dt>Số tài khoản</dt>
                        <dd>{e(bank['account'])}<button type="button" class="gp-copy"
                            data-copy="{e(bank['account'].replace(' ', ''))}">Sao chép</button></dd>
                        <dt>Chủ tài khoản</dt><dd>{e(bank['holder'])}</dd>
                        <dt>Nội dung</dt><dd class="is-note">{e(bank['note'])}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <label class="gp-confirm" id="gpConfirmWrap" hidden>
                  <input type="checkbox" id="gpConfirm">
                  <span>Tôi đã chuyển khoản theo thông tin ở trên.</span>
                </label>
                <span class="gp-error" id="gpConfirmError" style="display:none">
                  Vui lòng xác nhận đã chuyển khoản trước khi đặt hàng.
                </span>
              </div>

              <button type="submit" class="gp-btn gp-btn--primary gp-btn--block" id="gpPlaceOrder">
                ĐẶT HÀNG
              </button>
            </form>
          </div>

          <aside class="gp-checkout__aside">
            <div class="gp-summary">
              <h3>Đơn hàng của bạn</h3>
              <ul class="gp-summary__list" id="gpSummaryList"></ul>
              <div class="gp-summary__row"><span>Tạm tính</span><span id="gpSummarySubtotal">0&nbsp;₫</span></div>
              <div class="gp-summary__row"><span>Vận chuyển</span><span>Miễn phí</span></div>
              <div class="gp-summary__row is-total"><span>Tổng cộng</span><span id="gpSummaryTotal">0&nbsp;₫</span></div>
            </div>
          </aside>
        </div>

        <script type="application/json" id="gpProvinceData">__PROVINCE_JSON__</script>

        <div class="gp-success" id="gpCheckoutSuccess" hidden>
          <i class="fa fa-check-circle" aria-hidden="true"></i>
          <h3>Đặt hàng thành công!</h3>
          <p>Mã đơn hàng của bạn: <span class="gp-order-code" id="gpOrderCode"></span></p>
          <p id="gpOrderMethod"></p>
          <p>Nhân viên Giàn Phơi Hòa Phát sẽ gọi xác nhận trong thời gian sớm nhất.</p>
          <div class="gp-success-actions">
            <a class="gp-btn" href="{ctx.prefix}index.html">Về trang chủ</a>
            <a class="gp-btn gp-btn--ghost" href="{ctx.prefix}cua-hang/index.html">Tiếp tục mua hàng</a>
          </div>
        </div>

      </div>
      <footer class="entry-footer"></footer>
    </article>'''.replace('__PROVINCE_JSON__', province_json)


# ────────────────────────────────────────── xếp ngang category page

def product_card(ctx, item, first):
    """Same card markup the theme emits for a product archive."""
    if 'ref' in item:
        p = PRODUCTS[item['ref']]
        href = ctx.prefix + p['path']
        title, alt = p['title'], p['alt']
        img = ctx.prefix + p['img'].replace('-400x400', '-300x300')
        old = p['old']['num'] if p['old'] else None
        new = p['new']['num'] if p['new'] else None
        disc = p['discount']
        pid = p['id']
    else:
        base = PRODUCTS[item['base']]
        href = ctx.prefix + base['path']
        title, alt = item['title'], item['alt']
        img = ctx.prefix + item['img']
        old, new = item['old'], item['new']
        pid = item['id']
        disc = None
        if old and new:
            o = int(old.replace(',', ''))
            n = int(new.replace(',', ''))
            disc = f'{round((o - n) * 100 / o)}%'

    sale = (f'<span class="onsale"><span>{e(disc)}</span>Giảm giá!</span>') if disc else ''
    if old and new:
        price = f'<span class="price"><del>{money(old)}</del> <ins>{money(new)}</ins></span>'
    elif new:
        price = f'<span class="price">{money(new)}</span>'
    else:
        price = ''

    return f'''        <li class="post-{e(pid)} product type-product status-publish has-post-thumbnail product_cat-gian-phoi-xep-ngang{' first' if first else ''} instock sale shipping-taxable purchasable product-type-simple">
          <div class="product-loop-inner">
            <div class="thumb-outter">
              <a class="woocommerce-LoopProduct-link" href="{href}">
                {sale}
                <img width="300" height="300" src="{img}" class="attachment-shop_catalog size-shop_catalog wp-post-image" alt="{e(alt)}" title="{e(alt)}" loading="lazy">
                <div class="link-to-product">
                  <a class="link_a" href="{href}" rel="nofollow" title="{e(title)}">Xem chi tiết</a>
                </div>
              </a>
            </div>
            <div class="pr-loop-footer">
              <a href="{href}" title="{e(title)}"><h3>{e(title)}</h3></a>
              {price}
              <a href="{href}" rel="nofollow" class="button product_type_simple add_to_cart_button">Thêm vào giỏ</a>
            </div>
          </div>
        </li>'''


def archive_main(ctx):
    xn = CUSTOM['xepNgang']
    cards = '\n'.join(product_card(ctx, it, i == 0) for i, it in enumerate(xn['products']))
    return f'''
    <div id="container">
     <div id="content" role="main">
      <nav class="woocommerce-breadcrumb">
        <a href="{ctx.prefix}index.html">Trang chủ</a> / <a href="{ctx.prefix}cua-hang/index.html">Sản phẩm</a> / GIÀN PHƠI XẾP NGANG
      </nav>
      <h1 class="page-title">GIÀN PHƠI XẾP NGANG</h1>
      <div class="term-description"><p>{e(xn['intro'])}</p></div>
      <p class="woocommerce-result-count">Hiển thị tất cả {len(xn['products'])} sản phẩm</p>
      <form class="woocommerce-ordering" method="get" action="#">
        <select name="orderby" class="orderby">
          <option value="menu_order" selected="selected">Thứ tự mặc định</option>
          <option value="popularity">Thứ tự theo mức độ phổ biến</option>
          <option value="date">Thứ tự theo sản phẩm mới</option>
          <option value="price">Thứ tự theo giá: thấp đến cao</option>
          <option value="price-desc">Thứ tự theo giá: cao xuống thấp</option>
        </select>
      </form>
      <div class="woocommerce-loop">
       <ul class="products">
{cards}
       </ul>
      </div>
     </div>
    </div>'''


# ───────────────────────────────────────────────────────── search page


def search_main(ctx):
    """Results shell + the index, inlined.

    Inlined rather than fetched so the page still works from `file://`, where a
    fetch() of a local JSON file is blocked. `data-prefix` lets the script turn
    the index's root-relative paths into links that work from this page.
    """
    data = json.dumps(SEARCH_INDEX, ensure_ascii=False, separators=(',', ':'))
    data = data.replace('</', '<\\/')          # cannot end the <script> early
    return f'''
    <div id="gpSearch" data-prefix="{ctx.prefix}">
      <header class="entry-header">
        <h1 class="page-title" id="gpSearchTitle">Tìm kiếm</h1>
      </header><!-- .page-header -->
      <p class="gp-search-summary" id="gpSearchSummary">Đang tìm…</p>
      <div class="list-blog">
        <div class="post-listing archive-box gp-search-results" id="gpSearchResults"></div>
      </div>
      <div class="gp-search-more" id="gpSearchMore" hidden>
        <button type="button">Xem thêm kết quả</button>
      </div>
      <script type="application/json" id="gpSearchIndex">{data}</script>
    </div>'''


# ─────────────────────────────────────────────────────────── driver

BUILDERS = {
    'custom-cart': cart_main,
    'custom-checkout': checkout_main,
    'custom-archive': archive_main,
    'custom-search': search_main,
}


def build(rec):
    ctx = Ctx(rec['path'], PAGES)
    # the xếp-ngang page is a main-menu destination: light up that item
    if rec.get('navIndex') is not None:
        i = rec['navIndex']
        for menu in ('nav', 'sidebar', 'mobile'):
            ctx.menu[menu] = ['current-menu-item' if j == i else '' for j in range(5)]

    o = [head(ctx, rec['title'], rec['description'], rec['bodyClass'])]
    o += offcanvas(ctx)
    o.append('<div id="page" class="site">')
    o += header(ctx)
    o.append('<div id="content" class="site-content sidebar-left"><div class="container">')
    o += breadcrumbs(ctx, rec['breadcrumbs'])
    o.append('  <div class="row">')
    o.append('  <div id="primary" class="content-area col-md-9"><main id="main" class="site-main">')
    o.append(BUILDERS[rec['kind']](ctx))
    o.append('  </main></div>')
    o += sidebar(ctx)
    o.append('  </div>')
    o.append('</div></div>')
    o += upper_footer(ctx)
    o += footer(ctx)

    o += floating(ctx)
    if rec['kind'] == 'custom-search':
        # only this page needs the ranking code, so it is not in floating()
        o.insert(o.index('</body>'),
                 f'<script src="{ctx.prefix}assets/js/search.js"></script>')

    os.makedirs(os.path.dirname(rec['path']) or '.', exist_ok=True)
    open(rec['path'], 'w', encoding='utf-8').write('\n'.join(o))
    return rec['path']


def main():
    for rec in CUSTOM['pages']:
        print(' ', build(rec))
    print(f'rendered {len(CUSTOM["pages"])} custom pages')


if __name__ == '__main__':
    main()
