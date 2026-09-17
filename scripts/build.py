# -*- coding: utf-8 -*-
"""Render the homepage (index.html) from data/site.json."""
import json, os, sys

sys.path.insert(0, os.path.dirname(__file__))
import render
from render import Ctx, e, head, offcanvas, header, sidebar, upper_footer, footer, floating

D = render.DATA


def amount(a):
    if not a:
        return ''
    return ('<span class="woocommerce-Price-amount amount">' + e(a['num'])
            + '&nbsp;<span class="woocommerce-Price-currencySymbol">' + e(a['sym']) + '</span></span>')


def price_html(p):
    if p.get('old'):
        return '<span class="price"><del>' + amount(p['old']) + '</del> <ins>' + amount(p['new']) + '</ins></span>'
    if p.get('new'):
        return '<span class="price">' + amount(p['new']) + '</span>'
    return ''   # products without a price render no .price element at all


def home_main(ctx):
    o = []
    w = o.append

    # slider
    w('    <div class="home-slider-block home-silder-inmain">')
    w('      <div class="home-slider owl-carousel owl-theme">')
    for s in D['slides']:
        w(f'        <div class="item"><img src="{ctx.asset(s["src"])}" alt="{e(s["alt"])}"></div>')
    w('      </div>')
    w('    </div>')

    # feature strip
    w('    <div class="opt-content-top">')
    for f in D['features']:
        w(f'      <div class="list-opt-content-top {f["cls"]} col-xs-12 col-md-4">')
        w(f'        <p><i class="fa {f["icon"]}"></i></p>')
        w(f'        <div class="text-list-opt"><h6>{e(f["title"])}</h6><span>{e(f["sub"])}</span></div>')
        w('      </div>')
    w('    </div>')

    # product tab widgets
    w('    <article id="post-43" class="post-43 page type-page status-publish has-post-thumbnail hentry"><div class="entry-content">')
    for wg in D['product_widgets']:
        w(f'      <div id="{wg["id"]}" class="widget hrm_tab_product">')
        w('        <div class="tab-product-wgh tab_product_select clearfix woocommerce">')
        w('          <div class="tab-content has_title">')
        w('            <div class="title-tab-wg">')
        w(f'              <span>{e(wg["heading"])}</span>')
        w('              <ul class="nav nav-tabs" role="tablist">')
        for i, t in enumerate(wg['tabs']):
            pane = wg['panes'][i]['id'] if i < len(wg['panes']) else ''
            cls = ' class="active"' if t['active'] else ''
            w(f'                <li{cls} role="presentation"><a href="#{pane}" data-toggle="tab" role="tab">{e(t["label"])}</a></li>')
        w('              </ul>')
        w('            </div>')
        for pane in wg['panes']:
            act = ' active' if pane['active'] else ''
            w(f'            <div id="{pane["id"]}" class="tab-pane fade in{act}">')
            w('              <div class="product-tab clearfix">')
            w('                <div class="title-section"></div>')
            w('                <div class="list-product-outer products">')
            w('                  <div class="list-product-content"><div class="list-product"><div class="row">')
            colcls = 'col-md-20 col-sm-6 col-xs-12' if pane['cols'] == 'columns-5' else 'col-sm-3 col-xs-12'
            for p in pane['products']:
                w(f'                    <div class="item-product {colcls} {pane["cols"]}">')
                w('                      <li class="product type-product status-publish has-post-thumbnail instock sale purchasable product-type-simple">')
                w('                        <div class="product-loop-inner">')
                w('                          <div class="thumb-outter">')
                w(f'                            <a href="{ctx.link(p["href"])}" class="woocommerce-LoopProduct-link">')
                if p['discount']:
                    w(f'                              <span class="onsale"><span>{e(p["discount"])}</span>{e(p["sale_label"])}</span>')
                w(f'                              <img width="300" height="300" src="{ctx.asset(p["img"])}" class="attachment-shop_catalog size-shop_catalog wp-post-image" alt="{e(p["alt"])}" title="{e(p["alt"])}" loading="lazy">')
                w('                            </a>')
                w('                            <div class="link-to-product">')
                w(f'                              <a class="link_a" rel="nofollow" href="{ctx.link(p["href"])}" title="{e(p["title"])}">{e(p["hover"])}</a>')
                w('                            </div>')
                w('                          </div>')
                w('                          <div class="pr-loop-footer">')
                w(f'                            <a href="{ctx.link(p["href"])}" title="{e(p["title"])}"><h3>{e(p["title"])}</h3></a>')
                ph = price_html(p)
                if ph:
                    w('                            ' + ph)
                btncls = 'button product_type_simple add_to_cart_button' if p['btn_type'] == 'add' else 'button product_type_simple'
                if p['btn']:
                    w(f'                            <a href="{ctx.link(p["href"])}" rel="nofollow" class="{btncls}">{e(p["btn"])}</a>')
                w('                          </div>')
                w('                        </div>')
                w('                      </li>')
                w('                    </div>')
            w('                  </div></div></div>')
            w('                </div>')
            w('              </div>')
            w('            </div>')
        w('          </div>')
        w('        </div>')
        w('      </div>')

    # static promo block
    w('      <div id="text-2" class="widget widget_text"><div class="textwidget">')
    w('        <div class="block-static-inner">')
    w('          <div class="img"></div>')
    w('          <div class="content hidden-xs"><h3>Giàn Phơi Thông Minh</h3><h2>Hòa Phát</h2><p>sự lựa chọn sáng suốt cho mọi căn hộ</p></div>')
    w('          <div class="trending"><div class="trending-inner"><h3>model 2017</h3><h2>Hòa Phát</h2><p>độc quyền</p></div></div>')
    w('        </div>')
    w('      </div></div>')
    w('    </div></article>')
    w('    <div class="home-news"><div id="text-9" class="widget widget_text"><div class="textwidget"></div></div></div>')
    return o


def main():
    pages = {'https://thegioigianphoi.vn/'}
    for src, key in (('data/pages-index.json', None), ('data/custom.json', 'pages')):
        try:
            data = json.load(open(src, encoding='utf-8'))
            pages |= {r['url'] for r in (data[key] if key else data)}
        except FileNotFoundError:
            pass

    ctx = Ctx('index.html', pages)
    o = [head(ctx, 'Giàn Phơi Quần Áo Thông Minh Hòa Phát',
              'Giàn phơi quần áo thông minh Hòa Phát - Tư vấn, lắp đặt miễn phí tại nhà 24/24.',
              'home page-template page-template-template-home page-template-template-home-php page page-id-43')]
    o += offcanvas(ctx)
    o.append('<div id="page" class="site">')
    o += header(ctx, home=True)
    o.append('<div id="content" class="site-content sidebar-left"><div class="container"><div class="row">')
    o.append('  <div id="primary" class="content-area col-md-9"><main id="main" class="site-main">')
    o += home_main(ctx)
    o.append('  </main></div>')
    o += sidebar(ctx)
    o.append('</div></div></div>')
    o += upper_footer(ctx)
    o += footer(ctx)
    o += floating(ctx)

    open('index.html', 'w', encoding='utf-8').write('\n'.join(o))
    print('index.html', os.path.getsize('index.html'), 'bytes')


if __name__ == '__main__':
    main()
