# -*- coding: utf-8 -*-
"""Render every non-home page from data/pages/*.json."""
import json, os, re, sys

sys.path.insert(0, os.path.dirname(__file__))
import render
from render import Ctx, head, offcanvas, header, breadcrumbs, sidebar, upper_footer, footer, floating

INDEX = json.load(open('data/pages-index.json', encoding='utf-8'))
PAGES = {r['url'] for r in INDEX} | {'https://thegioigianphoi.vn/'}
try:   # pages this clone adds on top of the live site
    PAGES |= {p['url'] for p in json.load(open('data/custom.json', encoding='utf-8'))['pages']}
except FileNotFoundError:
    pass

MARKER = '@@ROOT@@/'
CONTACT = json.load(open('data/contact.json', encoding='utf-8'))

# The live product pages render the quick-order modal's body as a raw
# `[ninja_forms id=5]` shortcode — the plugin is gone, so no form ever appears.
# This is the replacement UI; the logic lives in assets/js/shop.js.
NINJA_SHORTCODE = '[ninja_forms id=5]'

QUICK_ORDER_FORM = """\
<form id="gpQuickForm" class="gp-quick-form" novalidate>
  <div class="gp-field">
    <label for="gpQuickName">Họ và tên <span class="req">*</span></label>
    <input type="text" id="gpQuickName" name="name" autocomplete="name" placeholder="Nguyễn Văn A" required>
    <span class="gp-error">Vui lòng nhập họ tên.</span>
  </div>
  <div class="gp-field">
    <label for="gpQuickPhone">Số điện thoại <span class="req">*</span></label>
    <input type="tel" id="gpQuickPhone" name="phone" autocomplete="tel" placeholder="09xx xxx xxx" required>
    <span class="gp-error">Số điện thoại phải có 10 chữ số.</span>
  </div>
  <div class="gp-field">
    <label for="gpQuickAddress">Địa chỉ nhận hàng <span class="req">*</span></label>
    <input type="text" id="gpQuickAddress" name="address" autocomplete="street-address" placeholder="Số nhà, tên đường, quận/huyện, tỉnh/thành" required>
    <span class="gp-error">Vui lòng nhập địa chỉ nhận hàng.</span>
  </div>
  <div class="gp-field">
    <label for="gpQuickNote">Ghi chú (tuỳ chọn)</label>
    <textarea id="gpQuickNote" name="note" rows="2" placeholder="Thời gian thuận tiện để kỹ thuật viên liên hệ…"></textarea>
  </div>
  <div class="gp-quick-qty">
    <span>Số lượng</span>
    <span class="gp-qty">
      <button type="button" data-quick-step="-1" aria-label="Giảm">−</button>
      <input type="number" id="gpQuickQty" min="1" value="1" aria-label="Số lượng">
      <button type="button" data-quick-step="1" aria-label="Tăng">+</button>
    </span>
  </div>
  <div class="gp-quick-total"><span>Tạm tính</span><span id="gpQuickTotal">0&nbsp;₫</span></div>
  <button type="submit" class="gp-btn gp-btn--primary gp-btn--block">
    <i class="fa fa-paper-plane-o" aria-hidden="true"></i> ĐẶT HÀNG NGAY
  </button>
  <p class="gp-quick-note">Hoặc gọi <a href="tel:{phone_tel}">{phone}</a> để được tư vấn trực tiếp.</p>
</form>
<div class="gp-quick-success" id="gpQuickSuccess" hidden>
  <i class="fa fa-check-circle" aria-hidden="true"></i>
  <h4>Đã nhận đơn đặt hàng!</h4>
  <p>Mã đơn: <span class="gp-order-code"></span></p>
  <p>Chúng tôi sẽ gọi xác nhận trong thời gian sớm nhất.</p>
</div>""".format(phone_tel=CONTACT['phoneTel'], phone=CONTACT['phoneDots'])

QUICK_ORDER_BENEFITS = """\
<ul class="gp-quick-benefits">
  <li><i class="fa fa-check" aria-hidden="true"></i> Khảo sát và lắp đặt miễn phí tại nhà</li>
  <li><i class="fa fa-check" aria-hidden="true"></i> Nghiệm thu xong mới thanh toán</li>
  <li><i class="fa fa-check" aria-hidden="true"></i> Bảo hành tại nhà lên đến 2 năm</li>
</ul>"""


def build(rec):
    ctx = Ctx(rec['path'], PAGES, rec['menuState'])
    # the extractor wrote '@@ROOT@@/…'; swap in this page's own relative prefix
    main_html = rec['main'].replace(MARKER, ctx.prefix)
    if NINJA_SHORTCODE in main_html:
        main_html = main_html.replace(NINJA_SHORTCODE, QUICK_ORDER_FORM)
        main_html = main_html.replace('<!-- end .product-detail-order -->',
                                      QUICK_ORDER_BENEFITS + '<!-- end .product-detail-order -->')

    o = [head(ctx, rec['title'], rec['description'], rec['bodyClass'], rec['extraCss'])]
    o += offcanvas(ctx)
    o.append('<div id="page" class="site">')
    o += header(ctx)
    o.append('<div id="content" class="site-content sidebar-left"><div class="container">')
    o += breadcrumbs(ctx, rec['breadcrumbs'])
    o.append('  <div class="row">')
    o.append(f'  <div id="primary" class="{rec["primaryClass"]}"><main id="main" class="site-main">')
    o.append(main_html)
    o.append('  </main></div>')
    o += sidebar(ctx)
    o.append('  </div>')
    o.append('</div></div>')
    o += upper_footer(ctx)
    o += footer(ctx)
    o += floating(ctx)

    out = rec['path']
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    open(out, 'w', encoding='utf-8').write('\n'.join(o))
    return out


def main():
    n = 0
    for r in INDEX:
        rec = json.load(open(f'data/pages/{r["slug"]}.json', encoding='utf-8'))
        build(rec)
        n += 1
    print(f'rendered {n} pages')


if __name__ == '__main__':
    main()
