# -*- coding: utf-8 -*-
"""Extract structured content from the original homepage into data/site.json"""
import json, re, os
from bs4 import BeautifulSoup

src = open('.work/home.html', encoding='utf-8', errors='replace').read()
src = src.replace('</br>', '<br/>')
soup = BeautifulSoup(src, 'lxml')
for br in soup.find_all('br'): br.replace_with('\n')
T = lambda e: re.sub(r'\s+', ' ', e.get_text(' ', strip=True)) if e else ''

def img(e):
    if not e: return None
    s = e.get('src') or ''
    return s

data = {}

# ---- top bar
th = soup.select_one('.top-header')
data['topbar'] = {
    'social': [{'icon': a.i['class'][-1], 'href': a.get('href','#')} for a in th.select('.social-media li a')],
    'account': T(th.select_one('.link-acc a')),
    'items': [{'icon': (a.i['class'][-1] if a.i else ''), 'text': T(a.contents[1]) if len(a.contents)>1 else '', 'strong': T(a.b), 'href': a.get('href','#')} for a in th.select('.top-nav li a')],
}

# ---- branding
data['logo'] = {'src': img(soup.select_one('.logo img')), 'seo': T(soup.select_one('.seo-title'))}
data['search_placeholder'] = soup.select_one('#s').get('placeholder','')
data['cart_empty'] = T(soup.select_one('.cart-container-list .empty'))

# ---- main nav
data['mainnav'] = [{'text': T(li.a), 'href': li.a.get('href','#')} for li in soup.select('#navigation > li')]
data['pr_nav_title'] = T(soup.select_one('.title-pr-nav span'))

# ---- slider
data['slides'] = [{'src': img(d.find('img')), 'alt': (d.find('img').get('alt','') if d.find('img') else '')} for d in soup.select('.home-slider .item')]

# ---- opt content top
data['features'] = []
for d in soup.select('.opt-content-top .list-opt-content-top'):
    data['features'].append({
        'cls': [c for c in d['class'] if c.endswith('_textarea')][0],
        'icon': d.find('i')['class'][-1],
        'title': T(d.find('h6')),
        'sub': T(d.find('span')),
    })

def parse_product(li):
    p = {}
    sale = li.select_one('.onsale')
    p['discount'] = T(sale.span) if sale and sale.span else None
    p['sale_label'] = (sale.get_text(' ', strip=True).replace(p['discount'] or '', '').strip() if sale else None)
    im = li.select_one('.thumb-outter img')
    p['img'] = img(im); p['alt'] = im.get('alt','') if im else ''
    a = li.select_one('.woocommerce-LoopProduct-link')
    p['href'] = a.get('href','#') if a else '#'
    p['title'] = T(li.select_one('.pr-loop-footer h3'))
    price = li.select_one('.pr-loop-footer .price')
    def amt(node):
        if node is None: return None
        sym = node.select_one('.woocommerce-Price-currencySymbol')
        symtxt = T(sym) if sym else ''
        num = node.get_text('', strip=False).replace(symtxt, '').replace('\xa0', '').strip()
        return {'num': num, 'sym': symtxt}
    p['old'] = amt(price.select_one('del .amount')) if price and price.select_one('del .amount') else None
    p['new'] = amt(price.select_one('ins .amount')) if price and price.select_one('ins .amount') else (amt(price.select_one('.amount')) if price and price.select_one('.amount') else None)
    btn = li.select_one('.pr-loop-footer ~ a, a.button')
    btns = [x for x in li.select('a.button')]
    p['btn'] = T(btns[-1]) if btns else None
    p['btn_type'] = ('add' if btns and 'add_to_cart_button' in (btns[-1].get('class') or []) else 'read')
    p['hover'] = T(li.select_one('.link-to-product .link_a'))
    return p

# ---- product tab widgets
data['product_widgets'] = []
for w in soup.select('.widget.hrm_tab_product'):
    tabs = []
    for i, li in enumerate(w.select('.title-tab-wg ul.nav-tabs > li')):
        tabs.append({'label': T(li.a), 'active': 'active' in (li.get('class') or [])})
    panes = []
    for pane in w.select('.tab-pane'):
        prods = [parse_product(li) for li in pane.select('li.product')]
        panes.append({'id': pane.get('id'), 'active': 'active' in (pane.get('class') or []), 'products': prods,
                      'cols': next((c for c in (pane.select_one('.item-product')['class'] if pane.select_one('.item-product') else []) if c.startswith('columns-')), 'columns-4')})
    data['product_widgets'].append({
        'id': w.get('id'),
        'heading': T(w.select_one('.title-tab-wg > span')),
        'tabs': tabs,
        'panes': panes,
    })

# ---- static block (text-2)
b = soup.select_one('#text-2 .textwidget')
data['static_block_html'] = str(b) if b else ''
t9 = soup.select_one('#text-9 .textwidget')
data['home_news_html'] = str(t9) if t9 else ''

# ---- sidebar
side = []
for w in soup.select('#secondary > .widget'):
    side.append({'id': w.get('id'), 'cls': w.get('class'), 'title': T(w.select_one('.widget-title')), 'html': str(w)})
data['sidebar_raw'] = side

# ---- upper footer
data['upper_footer'] = []
for d in soup.select('.upper-footer .ft-icon-block'):
    icon = d.select_one('.icon-logo')
    data['upper_footer'].append({
        'icon': icon['class'][-1] if icon else '',
        'title': T(d.select_one('.title-icon')),
        'desc': [re.sub(r'\s+',' ',x.strip()) for x in d.select_one('.des-icon').get_text('\n').split('\n') if x.strip()] if d.select_one('.des-icon') else [],
        'href': d.select_one('a').get('href','#') if d.select_one('a') else '#',
    })

# ---- footer
f = soup.select_one('footer#colophon')
data['footer'] = {
    'support_title': T(f.select_one('.received-mail .widget-title')),
    'support_html': str(f.select_one('.received-mail .textwidget')),
    'socials': [{'cls': ' '.join(a['class']), 'icon': a.i['class'][-1], 'href': a.get('href','#'),
                 'style': a.get('style',''), 'title': a.get('title','')} for a in f.select('.hrm-social-networks a')],
    'contact_title': T(f.select_one('.hrm-contact-widget .widget-title')),
    'contact_html': str(f.select_one('#address-box')) if f.select_one('#address-box') else '',
    'dmca_html': str(f.select_one('#text-10 .textwidget')) if f.select_one('#text-10') else '',
    'menus': [],
    'bottom': T(f.select_one('.site-info')),
}
for fs in f.select('.footer-widget-section-right .footer-sidebar'):
    for w in fs.select('.widget'):
        data['footer']['menus'].append({'id': w.get('id'), 'title': T(w.select_one('.widget-title')),
            'items': [{'text': T(li.a), 'href': li.a.get('href','#')} for li in w.select('ul.menu > li')],
            'html': str(w.select_one('.textwidget')) if w.select_one('.textwidget') else ''})

os.makedirs('data', exist_ok=True)
json.dump(data, open('data/site.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)
print('widgets:', [(w['heading'], [t['label'] for t in w['tabs']], [len(p['products']) for p in w['panes']]) for w in data['product_widgets']])
print('sidebar:', [(s['id'], s['title']) for s in side])
print('footer menus:', [(m['title'], len(m['items'])) for m in data['footer']['menus']])
print('features:', data['features'])
print('mainnav:', data['mainnav'])
print('slides:', data['slides'])

# ============ second pass: structured sidebar + footer ============
side2 = {}
w = soup.select_one('#nav_menu-4')
side2['categories'] = {'title': T(w.select_one('.widget-title')),
                       'items': [{'text': T(li.a), 'href': li.a.get('href','#')} for li in w.select('ul.menu > li')]}
w = soup.select_one('#text-8')
side2['service'] = {
  'title': T(w.select_one('.widget-title')),
  'points': [{'icon': p.i['class'][-1], 'text': T(p).strip()} for p in w.select('.cont-info-service p')],
  'phone': T(w.select_one('.list-number-info-service p')),
  'phone_note': T(w.select_one('.list-number-info-service span')),
  'links': [{'icon': (a.i['class'][-1] if a.i and a.i.get('class') else 'spyke'), 'text': T(a), 'href': a.get('href','#')} for a in w.select('.sp-list a')],
}
w = soup.select_one('#woocommerce_products-3')
def _amt(node):
    if node is None: return None
    sym = node.select_one('.woocommerce-Price-currencySymbol')
    symtxt = T(sym) if sym else ''
    return {'num': node.get_text('', strip=False).replace(symtxt, '').replace('\xa0', '').strip(), 'sym': symtxt}
side2['new_products'] = {'title': T(w.select_one('.widget-title')), 'items': []}
for li in w.select('ul.product_list_widget > li'):
    a = li.a
    side2['new_products']['items'].append({
        'href': a.get('href','#'), 'title': T(li.select_one('.product-title')),
        'img': a.img.get('src') if a.img else None,
        'old': _amt(li.select_one('del .amount')),
        'new': _amt(li.select_one('ins .amount')) or (_amt(li.select_one('.amount')) if not li.select_one('del') else None),
    })
w = soup.select_one('#hrm-recent-posts-widget-2')
side2['recent_posts'] = {'title': T(w.select_one('.widget-title')), 'items': [
    {'href': a.get('href','#'), 'img': a.img.get('src') if a.img else None,
     'title': T(art.select_one('.hrm-title')), 'alt': (a.img.get('alt','') if a.img else '')}
    for art in w.select('article.hrm-recent-post') for a in [art.select_one('a.hrm-thumb')]]}
data['sidebar'] = side2

# footer contact structured
fc = soup.select_one('#address-list')
items = []
for it in fc.select('.info-item'):
    lines = [re.sub(r'\s+',' ',x.strip()) for x in it.get_text('\n').split('\n') if x.strip()]
    tc = it.select_one('.tit-contain')
    lines = [re.sub(r'\s+', ' ', x).strip() for x in tc.get_text('\n').split('\n')]
    lines = [l for l in lines if l]
    items.append({'icon': it.i['class'][-1], 'cls': [c for c in it['class'] if c != 'info-item'][0], 'lines': lines})
data['footer']['contact'] = items
sup = soup.select_one('.received-mail .textwidget')
data['footer']['support_text'] = T(sup)
data['footer']['links_html'] = str(soup.select_one('#text-6 .textwidget')) if soup.select_one('#text-6') else ''
data['footer']['links'] = [{'text': T(a), 'href': a.get('href','#')} for a in soup.select('#text-6 .textwidget a')]
data['footer']['dmca'] = {'text': T(soup.select_one('#text-10 .textwidget')),
                          'img': soup.select_one('#text-10 img').get('src') if soup.select_one('#text-10 img') else None,
                          'href': soup.select_one('#text-10 a').get('href','#') if soup.select_one('#text-10 a') else '#'}
# floating widgets
zal = soup.select_one('.hotline-phone-ring-wrap')
data['floating'] = {'ring_html': str(zal) if zal else '', 'tail_html': ''}
json.dump(data, open('data/site.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)
print('sidebar cats', len(side2['categories']['items']), 'new', len(side2['new_products']['items']), 'posts', len(side2['recent_posts']['items']))
print('footer contact', [(i['cls'], i['lines']) for i in items])
print('support', data['footer']['support_text'][:120])
print('links', [l['text'] for l in data['footer']['links']])
print('bottom', repr(data['footer']['bottom']))
print('dmca', data['footer']['dmca'])
print('upper', data['upper_footer'])
