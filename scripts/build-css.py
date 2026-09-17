# -*- coding: utf-8 -*-
"""Assemble the clone's stylesheets from the reverse-engineered rule set.

Rules are kept when they can match the generated index.html, plus a whitelist of
classes that only ever exist at runtime (Owl Carousel, open/scrolled states).
Asset URLs are rewritten to the local `assets/` tree.
"""
import re, os
from bs4 import BeautifulSoup
import soupsieve

import glob, json
# Match rules against EVERY generated page, not just the homepage.
_html = [open('index.html', encoding='utf-8').read()]
for r in json.load(open('data/pages-index.json', encoding='utf-8')):
    try:
        _html.append(open(r['path'], encoding='utf-8').read())
    except FileNotFoundError:
        pass
DOCS = [BeautifulSoup(h, 'lxml') for h in _html]
doc = DOCS[0]

# classes injected by JS at runtime — always keep rules that mention them
RUNTIME = re.compile(r'''\.owl-|\.open-mn|\.btn-scrolled|\.sub-opend|\.sub-open|\.moblie-sub
   |\.nav-block-i|\.current-menu-item|\.menu-item-has-children|\.sub-menu|\.active|\.in\b
   |\.fade|:hover|:focus|::-|:-moz|:-ms|@keyframes
   |\.pp_|\.pp-|\.select2|\.modal|\.wc-tab|\.quantity|\.zoom|\.tabs''', re.X)

def parse(text):
    res, i = [], 0
    while i < len(text):
        b = text.find('{', i)
        if b < 0: break
        sel = text[i:b].strip()
        d, j = 1, b + 1
        while j < len(text) and d:
            if text[j] == '{': d += 1
            elif text[j] == '}': d -= 1
            j += 1
        body = text[b+1:j-1]
        if sel.startswith(('@media', '@supports')): res.append(('AT', sel, parse(body)))
        elif sel.startswith('@'): res.append(('RAW', sel, body))
        else: res.append(('RULE', sel, body.strip()))
        i = j
    return res

PSEUDO = re.compile(r'::?(-[a-z]+-)?[a-zA-Z-]+(\([^)]*\))?')
def keep(sel):
    if RUNTIME.search(sel): return True
    for one in sel.split(','):
        s = PSEUDO.sub('', one.strip()).strip()
        s = re.sub(r'\s+', ' ', s)
        if not s or s in ('*', 'html', 'body'): return True
        try:
            for d in DOCS:
                if soupsieve.select_one(s, d): return True
        except Exception:
            return True
    return False

DEAD = {'images/banner.png', 'images/bgd-saleoff.png', 'images/icon_main_menu.png', 'images/readmore.png'}
def rewrite(body):
    def sub(m):
        u = m.group(2).strip()
        if u.startswith(('data:', 'http')): return m.group(0)
        if u in DEAD: return 'none'
        if u.startswith('fonts/'): return 'url(../fonts/' + u.split('/')[-1] + ')'
        return 'url(../theme/' + u + ')'
    return re.sub(r'url\((["\']?)([^)]+?)\1\)', sub, body)

def emit(rules, out, ind=''):
    for kind, sel, body in rules:
        if kind == 'RULE':
            if keep(sel):
                out.append(ind + re.sub(r',\s*', ',\n' + ind, sel) + ' {' + rewrite(body) + '}')
        elif kind == 'AT':
            inner = []
            emit(body, inner, ind + '  ')
            if inner: out.append(ind + sel + ' {\n' + '\n'.join(inner) + '\n' + ind + '}')
        else:
            out.append(ind + sel + ' {' + rewrite(body) + '}')

def build(src, dst, banner):
    """src: path, or list of (path, media) — media wraps that file in an @media block."""
    srcs = src if isinstance(src, list) else [src]
    out = []
    for one in srcs:
        path_, media = one if isinstance(one, tuple) else (one, None)
        css = re.sub(r'/\*[\s\S]*?\*/', '', open(path_, encoding='utf-8', errors='replace').read())
        if media:
            inner = []
            emit(parse(css), inner, '  ')
            if inner: out.append('@media ' + media + ' {\n' + '\n'.join(inner) + '\n}')
        else:
            emit(parse(css), out)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w', encoding='utf-8').write('/* ' + banner + ' */\n' + '\n'.join(out) + '\n')
    print(dst, os.path.getsize(dst), 'bytes')

build(['.work/woocommerce-layout.css',
       ('.work/woocommerce-smallscreen.css', 'only screen and (max-width: 768px)'),
       '.work/woocommerce.css'],
      'assets/css/woocommerce.css',
      'WooCommerce 2.6.14 shop styles — only the rules this page uses')
build('.work/bootstrap.min.css', 'assets/css/grid.css',
      'Grid & base — Bootstrap 3.3.6 subset, only the rules this page uses')
build('.work/style.css', 'assets/css/theme.css',
      'Theme styles reconstructed from the live site (thegioigianphoi.vn)')
build('.work/prettyPhoto.css', 'assets/vendor/prettyPhoto.css',
      'prettyPhoto lightbox — loaded only by single-product pages')
build('.work/select2.css', 'assets/vendor/select2.css',
      'Select2 — loaded only by the account / checkout pages')
