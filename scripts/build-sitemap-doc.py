# -*- coding: utf-8 -*-
"""Regenerate docs/research/SITE_MAP.md from data/pages-index.json + custom.json.

    python3 scripts/build-sitemap-doc.py
"""
import json
from collections import Counter, defaultdict

index = json.load(open('data/pages-index.json', encoding='utf-8'))
custom = json.load(open('data/custom.json', encoding='utf-8'))['pages']

KIND_DESC = {
    'page': 'static WordPress pages, incl. cart / checkout / account',
    'post': 'blog articles (imported — see `components/news.spec.md`)',
    'post-archive': 'category + tag archives, with working pagination (imported)',
    'product': 'WooCommerce single products',
    'product-archive': 'shop, product categories and product tags, with pagination',
    'home': '`index.html`',
}
ORDER = ['page', 'post', 'post-archive', 'product', 'product-archive', 'home']

counts = Counter(r['kind'] for r in index)
counts['home'] = 1

known = {r['url'] for r in index}
extra = [p for p in custom if p['url'] not in known]

by_kind = defaultdict(list)
for r in index:
    by_kind[r['kind']].append(r)

o = ['# Site map — every page in the clone', '',
     'Crawled from the seven Yoast sitemaps plus the pagination links found while',
     'crawling. The post taxonomy was then replaced wholesale with the news feed',
     'from gianphoichinhhang.com, so the `post` and `post-archive` rows below are',
     'generated rather than cloned — see `components/news.spec.md`.', '',
     'Every page is written as `<dir>/index.html` but **served as `<dir>/`** —',
     '`vercel.json` canonicalises the URL and `scripts/clean-urls.py` strips',
     '`index.html` from the links. The paths below are the files on disk.', '',
     f'{len(index) + 1 + len(extra)} pages in total: the homepage, the {len(index)} '
     f'below, and {len(extra)} page this clone adds that the live site never had.', '',
     '| template | pages | output |', '|---|---|---|']
for k in ORDER:
    if counts.get(k):
        o.append(f'| `{k}` | {counts[k]} | {KIND_DESC[k]} |')
o += ['', '## URLs', '']

for k in ORDER:
    rows = sorted(by_kind.get(k, []), key=lambda r: r['url'])
    if not rows:
        continue
    o += [f'### {k} ({len(rows)})', '']
    for r in rows:
        path = r['url'].replace('https://thegioigianphoi.vn', '') or '/'
        mark = '  *(clone-only)*' if r.get('cloneOnly') else ''
        o.append(f'- `{path}` → `{r["path"]}`{mark}')
    o.append('')

o += ['', '---', '', '## Clone-only pages', '',
      'Pages this clone owns outright, so `scripts/verify-pages.mjs` skips them.',
      'See `components/shop-features.spec.md` and `components/news.spec.md`.', '',
      '| path | why |', '|---|---|',
      '| `gio-hang/index.html` | replaces the cloned page (live site only ever shows '
      "WooCommerce's empty-cart state) |",
      '| `thanh-toan/index.html` | same; the live URL 302-redirects to the cart |',
      '| `danh-muc/gian-phoi-xep-ngang/index.html` | the main menu links here but the '
      'live site returns **404** |',
      '| `lien-he/index.html` | rebuilt from `data/contact.json` |',
      '| `tim-kiem/index.html` | search results; the live box posts to WordPress |',
      f'| {counts.get("post", 0)} × post, {counts.get("post-archive", 0)} × post-archive '
      '| the whole news section, imported from gianphoichinhhang.com |', '']

open('docs/research/SITE_MAP.md', 'w', encoding='utf-8').write('\n'.join(o))
print(f'SITE_MAP.md: {len(index) + 1 + len(extra)} pages, {len(custom)} clone-owned')
