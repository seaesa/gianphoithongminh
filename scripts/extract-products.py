# -*- coding: utf-8 -*-
"""Build data/products.json — one record per product, from the crawled product pages.

Used by the hand-built "Giàn phơi xếp ngang" category page and as the lookup table
for the cart when a product is added from somewhere other than its own page.
"""
import json, os, re, sys
from bs4 import BeautifulSoup

sys.path.insert(0, os.path.dirname(__file__))
from sitemap_util import canon, page_path, asset_path

PAGES = json.load(open('.work/pages.json', encoding='utf-8'))
AMAP = json.load(open('.work/assets.json', encoding='utf-8'))['map']


def local(url):
    if not url:
        return None
    return (AMAP.get(url) or AMAP.get(url.replace('http://', 'https://'))
            or AMAP.get(url.replace('https://', 'http://')) or asset_path(url))


def money(node):
    if node is None:
        return None
    sym = node.select_one('.woocommerce-Price-currencySymbol')
    s = sym.get_text(strip=True) if sym else '₫'
    num = node.get_text('', strip=False).replace(s, '').replace('\xa0', '').strip()
    return {'num': num, 'sym': s, 'value': int(re.sub(r'[^\d]', '', num) or 0)}


def main():
    out = []
    for url, meta in sorted(PAGES.items()):
        if meta['kind'] != 'product':
            continue
        raw = open(meta['file'], encoding='utf-8', errors='replace').read().replace('</br>', '<br/>')
        s = BeautifulSoup(raw, 'lxml')
        root = s.select_one('div[id^="product-"]')
        if root is None:
            continue
        price = s.select_one('.summary .price-block p.price')
        img = s.select_one('.images.single-product-images img')
        sale = s.select_one('.counter-sale-off span')
        cats = [{'text': a.get_text(strip=True), 'href': canon(a.get('href', ''))}
                for a in s.select('.product_meta .posted_in a')]
        out.append({
            'id': root.get('id', '').replace('product-', ''),
            'slug': meta['slug'],
            'url': canon(url),
            'path': page_path(url),
            'title': s.select_one('h1.product_title').get_text(strip=True) if s.select_one('h1.product_title') else '',
            'img': local(img.get('src')) if img else None,
            'alt': img.get('alt', '') if img else '',
            'old': money(price.select_one('del .amount')) if price and price.select_one('del .amount') else None,
            'new': money(price.select_one('ins .amount')) if price and price.select_one('ins .amount')
                   else (money(price.select_one('.amount')) if price and price.select_one('.amount') else None),
            'discount': sale.get_text(strip=True) if sale else None,
            'stock': (s.select_one('.extra-meta.pr_tinh_trang span').get_text(strip=True)
                      if s.select_one('.extra-meta.pr_tinh_trang span') else None),
            'cats': cats,
        })
    os.makedirs('data', exist_ok=True)
    json.dump(out, open('data/products.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{len(out)} products -> data/products.json')
    for p in out[:3]:
        print(' ', p['id'], p['title'], p['new'], p['discount'])


if __name__ == '__main__':
    main()
