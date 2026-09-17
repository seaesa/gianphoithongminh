# -*- coding: utf-8 -*-
"""Build data/search-index.json — what the header search box searches.

The live site's search box posts to WordPress; there is no server here, so the
clone searches a pre-built index in the browser instead. The index is derived
from the page records rather than the rendered HTML, so it does not depend on
the render order and is identical on a clean build.

Paths are root-relative; `build-custom.py` inlines the index into
`tim-kiem/index.html` and the page prepends its own prefix, which keeps the
search working from `file://` as well as over HTTP.

    python3 scripts/build-search.py
"""
import json, re, unicodedata

from bs4 import BeautifulSoup

ROOT = '@@ROOT@@/'
EXCERPT = 220

INDEX = json.load(open('data/pages-index.json', encoding='utf-8'))
CUSTOM = json.load(open('data/custom.json', encoding='utf-8'))
PRODUCTS = {p['path']: p for p in json.load(open('data/products.json', encoding='utf-8'))}

IMG_RE = re.compile(r'<img\b[^>]*?\bsrc="([^"]+)"', re.I)

# The theme's own furniture. Left in, the excerpt of every product page would
# open with "Trang chủ / Sản phẩm / … ĐẶT HÀNG NHANH × Close [ninja_forms id=5]",
# and every post's with its own title and date — which is what the result card
# already shows.
DROP = ('script, style, .modal, .comments-area, .related-post, .hrm-social-share,'
        ' .woocommerce-breadcrumb, .entry-header, .post-meta, .entry-footer,'
        ' .woocommerce-tabs ul.tabs, .woocommerce-Reviews, form')


def plain(markup):
    soup = BeautifulSoup(markup, 'lxml')
    for el in soup.select(DROP):
        el.decompose()
    text = soup.get_text(' ').replace('\u00a0', ' ')
    # Parts of the extracted content are in NFD ("Ho" + combining grave rather
    # than "Hò"); composing everything keeps the index in one normal form.
    text = unicodedata.normalize('NFC', text)
    return re.sub(r'\s+', ' ', text).strip()


def first_image(markup):
    for src in IMG_RE.findall(markup):
        src = src.strip()
        if not src or src.startswith('data:'):
            continue
        if src.startswith(ROOT):
            return src[len(ROOT):]
    return ''


def excerpt(text):
    if len(text) <= EXCERPT:
        return text
    return text[:EXCERPT].rsplit(' ', 1)[0] + '…'


# titles all end with the same site suffix; it adds nothing to a result list
SUFFIX_RE = re.compile(r'\s*[-–]\s*(?:Giàn phơi quần áo thông minh Hòa Phát'
                       r'|Giàn Phơi Hòa Phát)\s*$')


def strip_accents(s):
    s = unicodedata.normalize('NFD', s.lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return s.replace('đ', 'd')


KIND_LABEL = {
    'page': 'Trang',
    'post': 'Tin tức',
    'post-archive': 'Chuyên mục',
    'product': 'Sản phẩm',
    'product-archive': 'Danh mục',
    'custom-cart': 'Trang',
    'custom-checkout': 'Trang',
    'custom-archive': 'Danh mục',
}

# nothing is gained by searching your way into the cart or the search page
SKIP_PATHS = {'gio-hang/index.html', 'thanh-toan/index.html',
              'tai-khoan/index.html', 'tim-kiem/index.html'}


def entry(path, title, kind, text, img, price=''):
    title = unicodedata.normalize('NFC', SUFFIX_RE.sub('', title).strip())
    return {
        'u': path,
        't': title,
        'k': KIND_LABEL.get(kind, 'Trang'),
        'x': excerpt(text),
        'i': img,
        'p': price,
        # the haystack: accent-free title (weighted by repetition) + body
        'q': strip_accents(title + ' ' + title + ' ' + text[:1200]),
    }


def price_of(path):
    p = PRODUCTS.get(path)
    if not p:
        return ''
    if p.get('new'):
        return p['new']['num'] + ' ₫'
    return ''


def main():
    out = []
    seen = set()

    for row in INDEX:
        if row['path'] in SKIP_PATHS:
            continue
        rec = json.load(open(f'data/pages/{row["slug"]}.json', encoding='utf-8'))
        text = plain(rec['main'])
        out.append(entry(row['path'], rec['title'], row['kind'],
                         text, first_image(rec['main']), price_of(row['path'])))
        seen.add(row['path'])

    for rec in CUSTOM['pages']:
        if rec['path'] in SKIP_PATHS or rec['path'] in seen:
            continue
        out.append(entry(rec['path'], rec['title'], rec['kind'],
                         rec.get('description', ''), ''))

    out.append(entry('index.html', 'Trang chủ', 'page',
                     'Giàn phơi quần áo thông minh Hòa Phát — tư vấn, lắp đặt '
                     'miễn phí tại nhà 24/24. Giàn phơi điều khiển, giàn phơi '
                     'xếp ngang, giàn phơi thông minh, lưới an toàn ban công.',
                     ''))

    out.sort(key=lambda r: r['u'])
    json.dump(out, open('data/search-index.json', 'w', encoding='utf-8'),
              ensure_ascii=False, separators=(',', ':'))
    import os
    print(f'{len(out)} entries -> data/search-index.json '
          f'({os.path.getsize("data/search-index.json") // 1024} KB)')


if __name__ == '__main__':
    main()
