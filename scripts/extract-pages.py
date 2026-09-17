# -*- coding: utf-8 -*-
"""Turn every crawled page into a data record the renderer can build from.

The page chrome (header/sidebar/footer) is rebuilt from data/site.json, so all we
keep here is:
  * head metadata and the body class WordPress emitted,
  * the per-page menu state classes (`current-menu-item` & friends),
  * the breadcrumb trail,
  * the `main#main` content region, with every URL rewritten to the local tree
    and all scripts removed.
"""
import json, os, re, sys
from bs4 import BeautifulSoup

sys.path.insert(0, os.path.dirname(__file__))
from sitemap_util import canon, page_path, asset_path

PAGES = json.load(open('.work/pages.json', encoding='utf-8'))
AMAP = json.load(open('.work/assets.json', encoding='utf-8'))['map']
KNOWN = {canon(u) for u in PAGES}

MENUS = {
    'nav': '#navigation > li',
    'sidebar': '#nav_menu-4 ul.menu > li',
    'mobile': '.menu-responsive ul#menu-danh-muc-san-pham > li',
    'footer': '#footer-sidebar-3 ul.menu > li',
    'topmenu': '#menu-top-menu > li',
}
# classes WordPress generates per page; everything else is structural
STATE_RE = re.compile(r'^(current[-_]|page[-_]item|page_item)')

URL_ATTRS = ('src', 'data-src', 'data-lazy-src', 'poster')

ROOT = '@@ROOT@@/'   # placeholder for the site root, resolved per page at render time


def local_asset(url):
    if not url or url.startswith('data:'):
        return url
    return (AMAP.get(url) or AMAP.get(url.replace('http://', 'https://'))
            or AMAP.get(url.replace('https://', 'http://')) or asset_path(url))


def is_site(href):
    low = (href or '').lower()
    if low.startswith(('mailto:', 'tel:', '#', 'javascript:')):
        return False
    if low.startswith(('http://', 'https://', '//')):
        return 'thegioigianphoi.vn' in low
    return True


def rewrite(node):
    """In-place: local asset paths, clone-local links, no scripts.

    Paths are written with a `@@ROOT@@/` marker; the renderer swaps it for the
    page's own '../' prefix. The marker must not collide with page text, and it
    must survive multi-URL attributes such as `srcset`.
    """
    for bad in node.select('script, noscript'):
        bad.decompose()
    for el in node.find_all(True):
        for attr in URL_ATTRS:
            if el.has_attr(attr):
                el[attr] = ROOT + local_asset(el[attr])
        if el.has_attr('srcset'):
            parts = []
            for part in el['srcset'].split(','):
                bits = part.strip().split()
                if bits:
                    parts.append(' '.join([ROOT + local_asset(bits[0])] + bits[1:]))
            el['srcset'] = ', '.join(parts)
        if el.name == 'a' and el.has_attr('href'):
            h = el['href']
            if not is_site(h):
                continue
            c = canon(h)
            el['href'] = (ROOT + page_path(c)) if c in KNOWN else '#'
        if el.name == 'form':
            el['action'] = '#'
            el['method'] = 'get'
        if el.has_attr('style') and 'url(' in el['style']:
            el['style'] = re.sub(r'url\((["\']?)([^)"\']+)\1\)',
                                 lambda m: 'url(' + ROOT + local_asset(m.group(2)) + ')', el['style'])
    return node


def text(el):
    return re.sub(r'\s+', ' ', el.get_text(' ', strip=True)) if el else ''


def extract(url, meta):
    raw = open(meta['file'], encoding='utf-8', errors='replace').read().replace('</br>', '<br/>')
    soup = BeautifulSoup(raw, 'lxml')

    rec = {
        'url': canon(url),
        'path': page_path(url),
        'kind': meta['kind'],
        'bodyClass': meta['bodyClass'],
        'title': text(soup.title),
        'description': (soup.select_one('meta[name="description"]') or {}).get('content', '')
                       if soup.select_one('meta[name="description"]') else '',
    }

    # per-page menu state classes
    state = {}
    for name, sel in MENUS.items():
        rows = []
        for li in soup.select(sel):
            rows.append(' '.join(c for c in li.get('class', []) if STATE_RE.match(c)))
        state[name] = rows
    rec['menuState'] = state

    # breadcrumbs
    crumbs = []
    box = soup.select_one('#crumbs')
    if box:
        for child in box.find_all(['a', 'span'], recursive=False):
            if child.name == 'a':
                crumbs.append({'text': text(child), 'href': child.get('href', '#')})
            elif 'current' in (child.get('class') or []):
                crumbs.append({'text': text(child)})
    rec['breadcrumbs'] = crumbs

    # main content
    main = soup.select_one('main#main')
    if main is None:
        rec['main'] = ''
    else:
        rewrite(main)
        rec['main'] = main.decode_contents()

    # #primary sometimes carries an extra class (single product)
    primary = soup.select_one('#primary')
    rec['primaryClass'] = ' '.join(primary.get('class', [])) if primary else 'content-area col-md-9'

    # which optional stylesheets this page loads
    sheets = [s.get('href', '') for s in soup.select('link[rel="stylesheet"]')]
    extra = []
    if any('prettyPhoto' in s for s in sheets):
        extra.append('assets/vendor/prettyPhoto.css')
    if any('select2' in s for s in sheets):
        extra.append('assets/vendor/select2.css')
    rec['extraCss'] = extra
    return rec


def main():
    os.makedirs('data/pages', exist_ok=True)
    index = []
    for url, meta in sorted(PAGES.items()):
        if meta['kind'] == 'home':
            continue
        rec = extract(url, meta)
        slug = meta['slug']
        json.dump(rec, open(f'data/pages/{slug}.json', 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=1)
        index.append({k: rec[k] for k in ('url', 'path', 'kind', 'title')} | {'slug': slug})
    json.dump(index, open('data/pages-index.json', 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    kinds = {}
    for r in index:
        kinds[r['kind']] = kinds.get(r['kind'], 0) + 1
    print(f'extracted {len(index)} pages: {kinds}')


if __name__ == '__main__':
    main()
