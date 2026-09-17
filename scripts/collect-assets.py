# -*- coding: utf-8 -*-
"""Scan every crawled page for asset URLs and write .work/assets.json."""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from sitemap_util import asset_path

pages = json.load(open('.work/pages.json', encoding='utf-8'))
urls = set()

IMG_ATTR = re.compile(r'<(?:img|source)\b[^>]*>', re.I)
ATTR = re.compile(r'(src|data-src|data-lazy-src|poster|href)\s*=\s*"([^"]+)"', re.I)
SRCSET = re.compile(r'srcset\s*=\s*"([^"]+)"', re.I)
CSSURL = re.compile(r'url\((["\']?)([^)"\']+)\1\)')

for url, meta in pages.items():
    html = open(meta['file'], encoding='utf-8', errors='replace').read()
    for tag in IMG_ATTR.findall(html):
        for _, v in ATTR.findall(tag):
            if v and not v.startswith('data:'):
                urls.add(v)
        for ss in SRCSET.findall(tag):
            for part in ss.split(','):
                bits = part.strip().split()
                if bits:
                    urls.add(bits[0])
    # inline style backgrounds + favicons / og images
    for _, v in CSSURL.findall(html):
        if v and not v.startswith('data:'):
            urls.add(v)
    for m in re.finditer(r'<link[^>]+rel=[\'"][^\'"]*icon[^\'"]*[\'"][^>]*>', html, re.I):
        for _, v in ATTR.findall(m.group(0)):
            urls.add(v)
    for m in re.finditer(r'<meta[^>]+property=[\'"]og:image[\'"][^>]+content=[\'"]([^\'"]+)[\'"]', html, re.I):
        urls.add(m.group(1))

# theme CSS backgrounds
css = open('.work/style.css', encoding='utf-8', errors='replace').read()
css_imgs = sorted({m.group(2) for m in CSSURL.finditer(css)})

clean = sorted({u.strip() for u in urls if u and u.strip() and not u.startswith('data:')})
amap = {u: asset_path(u) for u in clean}
json.dump({'page': clean, 'css': css_imgs, 'map': amap}, open('.work/assets.json', 'w'), indent=1)

buckets = {}
for u in clean:
    buckets.setdefault(asset_path(u).split('/')[1], 0)
    buckets[asset_path(u).split('/')[1]] += 1
print(f'{len(clean)} page assets + {len(css_imgs)} css images')
print(' ', buckets)
