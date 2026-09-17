# -*- coding: utf-8 -*-
"""Shared page chrome: <head>, header, breadcrumbs, sidebar, footers, floating widgets.

Every generated page is assembled from these plus one template-specific `main`.
`menu_state` carries the per-page `current-menu-item` style classes that
WordPress adds, extracted from the live pages.
"""
import html, json, os, sys

sys.path.insert(0, os.path.dirname(__file__))
from sitemap_util import asset_path, page_path, canon

DATA = json.load(open('data/site.json', encoding='utf-8'))
CONTACT = json.load(open('data/contact.json', encoding='utf-8'))
AMAP = json.load(open('.work/assets.json', encoding='utf-8'))['map']


def e(s):
    return html.escape(s or '', quote=True)


class Ctx:
    """Everything a renderer needs to emit correct, page-relative URLs."""

    def __init__(self, out_path, pages, menu_state=None):
        self.out = out_path
        self.prefix = '../' * out_path.count('/')
        self.pages = pages
        self.menu = menu_state or {}

    def asset(self, url):
        if not url:
            return ''
        if url.startswith('data:'):
            return url
        # assets this clone added itself (news images) are already local paths
        if url.startswith('@@LOCAL@@'):
            return self.prefix + url[len('@@LOCAL@@'):]
        local = AMAP.get(url) or AMAP.get(url.replace('http://', 'https://')) \
            or AMAP.get(url.replace('https://', 'http://')) or asset_path(url)
        return self.prefix + local

    def link(self, href):
        if not href:
            return '#'
        if href.startswith(('mailto:', 'tel:', '#', 'javascript:')):
            return href
        low = href.lower()
        if low.startswith(('http://', 'https://', '//')) and 'thegioigianphoi.vn' not in low:
            return href
        c = canon(href)
        if c in self.pages:
            return self.prefix + page_path(c)
        return '#'

    def state(self, menu, i):
        """Extra <li> classes for item `i` of `menu` on this page."""
        rows = self.menu.get(menu) or []
        return (' ' + rows[i]) if i < len(rows) and rows[i] else ''


# ───────────────────────────────────────────────────────────── head

def head(ctx, title, description='', body_class='', extra_css=()):
    p = ctx.prefix
    css = ['assets/css/woocommerce.css', 'assets/css/grid.css',
           'assets/vendor/font-awesome.min.css', 'assets/css/theme.css'] \
        + list(extra_css) + ['assets/css/overrides.css', 'assets/css/shop.css',
                             'assets/css/news.css', 'assets/css/site.css']
    links = '\n'.join(f'<link rel="stylesheet" href="{p}{c}">' for c in css)
    return f'''<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(description)}">
{links}
</head>
<body class="{e(body_class)}">'''


# ───────────────────────────────────────────────────────── header

def offcanvas(ctx):
    o = ['<div class="menu-responsive-overlay"></div>',
         '<div class="menu-responsive hidden-lg">',
         '  <div class="menu-close"><i class="fa fa-bars"></i><span>Menu</span><i class="fa fa-times"></i></div>',
         '  <div class="menu-danh-muc-san-pham-container"><ul id="menu-danh-muc-san-pham" class="menu">']
    for i, it in enumerate(DATA['mainnav']):
        o.append(f'    <li class="menu-item{ctx.state("mobile", i)}"><a href="{ctx.link(it["href"])}">{e(it["text"])}</a></li>')
    o += ['  </ul></div>', '</div>']
    return o


def header(ctx, home=False):
    o = ['<header id="masthead" class="site-header clearfix">']

    # top bar
    o += ['  <div class="top-header"><div class="container"><div class="row">',
          '    <div class="alignleft top-left">', '      <div class="social-media"><ul>']
    for s in DATA['topbar']['social']:
        o.append(f'        <li class="social-fb"><a href="{ctx.link(s["href"])}" target="_blank" rel="noopener"><i class="fa {s["icon"]}"></i></a></li>')
    o += ['      </ul></div>',
          f'      <div class="link-acc"><a href="#">{e(DATA["topbar"]["account"])}</a></div>',
          '    </div>',
          '    <div class="alignright top-right"><div class="top-nav"><div class="menu-top-menu-container"><ul id="menu-top-menu" class="menu">']
    for i, it in enumerate(DATA['topbar']['items']):
        lead = '' if it['text'] == it['strong'] else e(it['text']) + ' '
        o.append(f'      <li class="menu-item{ctx.state("topmenu", i)}"><a href="{ctx.link(it["href"])}"><i class="fa {it["icon"]}"></i>{lead}<b>{e(it["strong"])}</b></a></li>')
    o += ['    </ul></div></div></div>', '  </div></div></div>']

    # branding
    # Only the homepage wraps the logo in <h1>; every other template uses <p>,
    # which is 1px shorter because it has no heading line-box.
    tag = 'h1' if home else 'p'
    title_attr = f' title="{e(DATA["logo"]["seo"])}"' if home else ''
    seo = (f'      <span class="seo-title" style="display:block!important;overflow:hidden;'
           f'font-size:1px;text-indent:-9999px;height:1px;width:1px;line-height:1;">{e(DATA["logo"]["seo"])}</span>'
           ) if home else None
    o += ['  <div class="site-branding container"><div class="row">',
          f'    <div class="logo "><{tag} class="site-title">',
          f'      <a href="{ctx.prefix}index.html" rel="home"><img class="img-responsive" src="{ctx.asset(DATA["logo"]["src"])}"{title_attr} alt="Giàn phơi Hòa Phát" width="200" height="143"></a>']
    if seo:
        o.append(seo)
    o += [f'    </{tag}></div>',
          '    <div class="top-mid-right">',
          f'      <form role="search" method="get" class="search-form" action="{ctx.prefix}tim-kiem/index.html">',
          '        <label class="screen-reader-text" for="s"></label>',
          f'        <input type="search" id="s" value="" name="s" placeholder="{e(DATA["search_placeholder"])}">',
          '        <button type="submit" class="search-submit"><i class="fa fa-search"></i> Tìm kiếm</button>',
          '      </form>',
          '      <div class="cart-header">',
          f'        <a class="cart-icon" href="{ctx.prefix}gio-hang/index.html" title="Xem giỏ hàng"><i class="fa fa-shopping-cart"></i></a>',
          '        <div class="cart-container-list"><ul class="cart_list product_list_widget">',
          f'          <li class="empty">{e(DATA["cart_empty"])}</li>',
          '        </ul></div>', '      </div>', '    </div>', '  </div></div>']

    # main menu
    o += ['  <div id="main-menu"><div class="container"><div class="row"><div class="main-menu-inner">',
          '    <div class="product-nav">',
          f'      <h3 class="title-pr-nav"><i class="fa fa-th-list"></i><span>{e(DATA["pr_nav_title"])}</span><i class="fa fa-chevron-circle-down"></i></h3>',
          '      <div class="nav-pr-container"><div class="menu-danh-muc-san-pham-container"><ul class="menu">']
    for i, it in enumerate(DATA['mainnav']):
        o.append(f'        <li class="menu-item{ctx.state("nav", i)}"><a href="{ctx.link(it["href"])}">{e(it["text"])}</a></li>')
    o += ['      </ul></div></div>', '    </div>',
          '    <div class="navbar-header has-product-nav">',
          '      <button class="menu-open menu-contrl" type="button" aria-label="Mở menu"><i class="fa fa-bars"></i></button>',
          '      <button class="menu-close-2 menu-contrl" type="button" aria-label="Đóng menu"><i class="fa fa-times"></i></button>',
          '      <nav id="site-navigation" class="site-navigation collapse navbar-collapse"><div class="menu-danh-muc-san-pham-container">',
          '        <ul id="navigation" class="nav navbar-nav navbar-left">']
    for i, it in enumerate(DATA['mainnav']):
        o.append(f'          <li class="menu-item{ctx.state("nav", i)}"><a href="{ctx.link(it["href"])}">{e(it["text"])}</a></li>')
    o += ['        </ul>', '      </div></nav>', '    </div>',
          '  </div></div></div></div>', '</header>']
    return o


# ─────────────────────────────────────────────────── breadcrumbs

def breadcrumbs(ctx, crumbs):
    if not crumbs:
        return []
    o = ['    <div class="hrm-breadcrums"><div id="crumbs">']
    last = len(crumbs) - 1
    for i, c in enumerate(crumbs):
        if i == last:
            o.append(f'      <span class="current">{e(c["text"])}</span>')
        else:
            o.append(f'      <a href="{ctx.link(c.get("href"))}">{e(c["text"])}</a>')
            o.append('      <i class="fa fa-angle-double-right"></i>')
    o.append('    </div></div>')
    return o


# ─────────────────────────────────────────────────────── sidebar

def sidebar(ctx):
    S = DATA['sidebar']
    o = ['  <aside id="secondary" class="widget-area col-md-3">',
         '    <div id="nav_menu-4" class="widget widget_nav_menu">',
         f'      <div class="widget-top"><h3 class="widget-title">{e(S["categories"]["title"])}</h3></div>',
         '      <div class="menu-danh-muc-san-pham-container"><ul class="menu">']
    for i, it in enumerate(S['categories']['items']):
        o.append(f'        <li class="menu-item{ctx.state("sidebar", i)}"><a href="{ctx.link(it["href"])}">{e(it["text"])}</a></li>')
    o += ['      </ul></div>', '    </div>']

    sv = S['service']
    o += ['    <div id="text-8" class="widget widget_text">',
          f'      <div class="widget-top"><h3 class="widget-title">{e(sv["title"])}</h3></div>',
          '      <div class="textwidget"><div class="info-service">',
          '        <div class="title-info-service"></div>',
          '        <div class="number-info-service">', '          <div class="cont-info-service">']
    for pt in sv['points']:
        o.append(f'            <p><i class="fa {pt["icon"]}"></i>{e(pt["text"])}</p>')
    o += ['          </div>',
          '          <div class="list-number-info-service"><i class="fa fa-phone"></i>',
          f'            <p>{e(sv["phone"])}</p><span>{e(sv["phone_note"])}</span>',
          '          </div>', '          <div class="sp-list">']
    for i, l in enumerate(sv['links']):
        cls = ['support-online-skype', 'support-online-fb', 'support-online'][i] if i < 3 else 'support-online'
        ic = '<i class="spyke"></i>' if l['icon'] == 'spyke' else f'<i class="fa {l["icon"]}"></i>'
        o.append(f'            <p class="{cls}"><a href="{ctx.link(l["href"])}">{ic}{e(l["text"])}</a></p>')
    o += ['          </div>', '        </div>', '      </div></div>', '    </div>']

    def amount(a):
        if not a:
            return ''
        return ('<span class="woocommerce-Price-amount amount">' + e(a['num'])
                + '&nbsp;<span class="woocommerce-Price-currencySymbol">' + e(a['sym']) + '</span></span>')

    np_ = S['new_products']
    o += ['    <div id="woocommerce_products-3" class="widget woocommerce widget_products">',
          f'      <div class="widget-top"><h3 class="widget-title">{e(np_["title"])}</h3></div>',
          '      <ul class="product_list_widget">']
    for it in np_['items']:
        o.append('        <li>')
        o.append(f'          <a href="{ctx.link(it["href"])}" title="{e(it["title"])}"><img class="attachment-shop_thumbnail wp-post-image" src="{ctx.asset(it["img"])}" alt="{e(it["title"])}" width="180" height="180" loading="lazy"><span class="product-title">{e(it["title"])}</span></a>')
        if it['old']:
            o.append('          <del>' + amount(it['old']) + '</del> <ins>' + amount(it['new']) + '</ins>')
        elif it['new']:
            o.append('          ' + amount(it['new']))
        o.append('        </li>')
    o += ['      </ul>', '    </div>']

    rp = S['recent_posts']
    o += ['    <div id="hrm-recent-posts-widget-2" class="widget hrm-recent-posts-widget">',
          f'      <div class="widget-top"><h3 class="widget-title">{e(rp["title"])}</h3></div>',
          '      <div class="list-post-ct">']
    for it in rp['items']:
        o += ['        <article class="hrm-recent-post">',
              f'          <a class="hrm-thumb" href="{ctx.link(it["href"])}" title="{e(it["title"])}"><img src="{ctx.asset(it["img"])}" alt="{e(it["alt"])}" loading="lazy"></a>',
              f'          <div class="hrm-text"><a class="hrm-title" href="{ctx.link(it["href"])}" rel="bookmark">{e(it["title"])}</a><div class="date-detail"></div></div>',
              '        </article>']
    o += ['      </div>', '    </div>', '  </aside>']
    return o


# ──────────────────────────────────────────── footers & floating

def upper_footer(ctx):
    o = ['<div class="upper-footer hidden-mobile"><div class="container"><div class="row"><div class="up-ft-ovh">']
    for b in DATA['upper_footer']:
        o += ['  <div class="col-md-4 col-xs-12 ft-icon-block"><div class="hover-border"><div class="media well hover-border-inner">',
              f'    <a href="{ctx.link(b["href"])}" title="{e(b["title"])}">',
              f'      <div class="pull-left icon-logo fa {b["icon"]}"></div>',
              f'      <div class="title-body"><h3 class="title-icon">{e(b["title"])}</h3>',
              '        <p class="des-icon">' + '<br>'.join(e(x) for x in b['desc']) + '</p>',
              '      </div>', '    </a>', '  </div></div></div>']
    o.append('</div></div></div></div>')
    return o


def footer(ctx):
    F = DATA['footer']
    o = ['<footer id="colophon" class="site-footer">',
         '  <div class="footer-support"><div class="container"><div class="row"><div class="footer-support-inner clearfix">',
         '    <div class="received-mail col-md-8"><div id="text-7" class="widget widget_text">',
         f'      <div class="widget-top"><h3 class="widget-title">{e(F["support_title"])}</h3></div>',
         '      <div class="textwidget"></div>',
         '    </div></div>',
         '    <div class="fut-col col-md-4"><div id="social_links-widget-2" class="widget social_links"><div class="hrm-social-networks boxed-icons">']
    for s in F['socials']:
        o.append(f'      <a class="{s["cls"]}" href="{ctx.link(s["href"])}" title="{e(s["title"])}" rel="nofollow" target="_blank" style="{e(s["style"])}"><i class="fa {s["icon"]}"></i></a>')
    o += ['    </div></div></div>', '  </div></div></div></div>',
          '  <div class="footer-top"><div class="container"><div class="row">',
          '    <div class="footer-widget-section-left col-md-4">',
          '      <div id="hrm-contact-widget-3" class="widget hrm-contact-widget">',
          f'        <div class="widget-top"><h3 class="widget-title">{e(F["contact_title"])}</h3></div>',
          '        <div id="address-box"><div id="address-list">']
    for it in F['contact']:
        o += [f'          <div class="info-item {it["cls"]}"><i class="fa {it["icon"]}"></i>',
              '            <div class="tit-contain">' + '<br>'.join(e(x) for x in it['lines']) + '</div>',
              '          </div>']
    o += ['        </div></div>', '      </div>',
          '      <div id="text-10" class="widget widget_text"><div class="textwidget">',
          f'        {e(F["dmca"]["text"])} <a href="{F["dmca"]["href"]}" title="DMCA.com Protection Status" class="dmca-badge" target="_blank" rel="noopener"><img src="{ctx.asset(F["dmca"]["img"])}" alt="DMCA.com Protection Status" width="100" height="50"></a>',
          '      </div></div>', '    </div>',
          '    <div class="footer-widget-section-right col-md-8">',
          '      <div id="footer-sidebar-2" class="footer-sidebar col-md-6 col-sm-6"></div>',
          '      <div id="footer-sidebar-3" class="footer-sidebar col-md-6 col-sm-6">']
    menu = next((m for m in F['menus'] if m['items']), {'title': '', 'items': []})
    o += ['        <div id="nav_menu-6" class="widget widget_nav_menu">',
          f'          <div class="widget-top"><h3 class="widget-title">{e(menu["title"])}</h3></div>',
          '          <div class="menu-ho-tro-khach-hang-container"><ul class="menu">']
    for i, it in enumerate(menu['items']):
        o.append(f'            <li class="menu-item{ctx.state("footer", i)}"><a href="{ctx.link(it["href"])}">{e(it["text"])}</a></li>')
    o += ['          </ul></div>', '        </div>', '      </div>',
          '      <div id="footer-sidebar-4" class="footer-sidebar col-md-6 col-sm-6">',
          '        <div id="text-6" class="widget widget_text"><div class="textwidget"><p>']
    seo = [l for l in F['links'] if l['text'] != 'Giàn Phơi Thông Minh']
    o.append('          ' + ' | '.join(
        f'<a href="{l["href"]}" target="_blank" rel="noopener"><b>{e(l["text"])}</b></a>' for l in seo))
    o += ['        </p>',
          # The live page embeds Facebook's page plugin here. The SDK is not
          # loaded (see README), so the clone draws the same 340x200 card itself
          # rather than leaving an empty bordered box where the iframe would be.
          '        <div class="fb-page-placeholder">',
          f'          <a class="fb-card" href="{CONTACT["facebook"]}" target="_blank" rel="noopener">',
          '            <span class="fb-card-cover"><i class="fa fa-facebook-official" aria-hidden="true"></i></span>',
          '            <span class="fb-card-avatar"><i class="fa fa-facebook" aria-hidden="true"></i></span>',
          f'            <span class="fb-card-name">{e(CONTACT["facebookName"])}</span>',
          '            <span class="fb-card-meta">Trang Facebook chính thức</span>',
          '            <span class="fb-card-cta"><i class="fa fa-thumbs-up" aria-hidden="true"></i> Theo dõi trang</span>',
          '          </a>',
          '        </div>',
          '        </div></div>',
          '        <div id="text-11" class="widget widget_text"><div class="textwidget"></div></div>',
          '      </div>', '    </div>', '  </div></div></div>',
          '  <div class="footer-bottom"><div class="container"><div class="row"><div class="site-info"></div></div></div></div>',
          '</footer>']
    return o


def floating(ctx):
    return [
        '<div id="topcontrol" class="icon-up-open" title="Lên đầu trang"><i class="fa fa-angle-up"></i></div>',
        '<div class="hotline-phone-ring-wrap"><div class="hotline-phone-ring">',
        '  <div class="hotline-phone-ring-circle"></div>',
        '  <div class="hotline-phone-ring-circle-fill"></div>',
        '  <div class="hotline-phone-ring-img-circle">',
        f'    <a href="tel:{CONTACT["phoneTel"]}" class="pps-btn-img locationus"><img src="{ctx.asset("https://thegioigianphoi.vn/wp-content/themes/hrm/images/icon-call.png")}" alt="Gọi điện thoại" width="50"></a>',
        '  </div>', '</div></div>',
        # the live anchor really does ship an empty <img src=""> before the logo
        f'<a class="zalo-float" href="{CONTACT["zalo"]}" target="_blank" rel="noopener" title="Chat Zalo"><img src=""> <img src="{ctx.asset("https://thegioigianphoi.vn/wp-content/themes/hrm/images/zzd.png")}" alt="Zalo"></a>',
        f'<script src="{ctx.prefix}assets/js/main.js"></script>',
        f'<script src="{ctx.prefix}assets/js/cart.js"></script>',
        f'<script src="{ctx.prefix}assets/js/shop.js"></script>',
        '</body>', '</html>']
