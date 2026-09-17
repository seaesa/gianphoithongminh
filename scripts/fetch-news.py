# -*- coding: utf-8 -*-
"""Pull the news archive from gianphoichinhhang.com into data/news.json.

That site serves its whole blog as one JSON feed (`/data/posts.json`) plus a
tree of static images, so this is a straight fetch + localise: every image URL
referenced by a post (thumbnails and inline figures) is downloaded under
assets/news/ and the content HTML is rewritten to point at the local copy.

    python3 scripts/fetch-news.py
"""
import html, json, os, re, sys, time
from urllib.parse import urljoin
from urllib.request import Request, urlopen

SRC = 'https://www.gianphoichinhhang.com/'
FEED = SRC + 'data/posts.json'
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'}

OUT_DIR = 'assets/news'

# The two post categories on the source feed, mapped onto the two post
# categories this site already has.
CATEGORIES = {
    '1': {'slug': 'tin-tuc', 'name': 'Tin tức'},
    '2': {'slug': 'tu-van-gian-phoi', 'name': 'Tư vấn giàn phơi'},
}


def get(url, binary=False):
    with urlopen(Request(url, headers=UA), timeout=60) as r:
        data = r.read()
    return data if binary else data.decode('utf-8')


def local_path(ref):
    """`images/posts/17/1/foo.webp` -> `assets/news/posts/17/1/foo.webp`."""
    rel = re.sub(r'^\.?/*', '', ref.split('?')[0])
    rel = re.sub(r'^images/', '', rel)
    rel = re.sub(r'[^A-Za-z0-9._/-]+', '-', rel)
    return f'{OUT_DIR}/{rel}'


def download(ref, seen):
    dst = local_path(ref)
    if dst in seen:
        return dst
    seen.add(dst)
    if os.path.exists(dst) and os.path.getsize(dst):
        return dst
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    url = urljoin(SRC, re.sub(r'^\./', '', ref))
    try:
        open(dst, 'wb').write(get(url, binary=True))
    except Exception as exc:                       # noqa: BLE001 - reported, not fatal
        print(f'  ! {url}: {exc}', file=sys.stderr)
        return None
    return dst


# ── content clean-up ────────────────────────────────────────────────────────

# The source content was pasted out of an editor that leaves these behind.
NOISE_ATTR = re.compile(r'\s+data-(?:start|end)="[^"]*"')
IMG_SRC = re.compile(r'(<img\b[^>]*?\bsrc=")([^"]+)(")', re.I)
EMPTY_HEAD = re.compile(r'^\s*<h2[^>]*>(?:\s|&nbsp;| )*</h2>', re.I)


def clean(content, seen):
    body = NOISE_ATTR.sub('', content)
    body = EMPTY_HEAD.sub('', body).strip()

    def img(m):
        dst = download(m.group(2), seen)
        return m.group(1) + ('@@ROOT@@/' + dst if dst else '') + m.group(3)

    body = IMG_SRC.sub(img, body)
    # the source ships bare <hr> / <img> tags; keep the markup XHTML-clean
    body = re.sub(r'<hr\s*>', '<hr/>', body)
    body = re.sub(r'(<img\b[^>]*[^/])>', r'\1/>', body)
    return body


def excerpt(text, limit=180):
    plain = re.sub(r'<[^>]+>', ' ', text)
    plain = html.unescape(plain).replace(' ', ' ')
    plain = re.sub(r'\s+', ' ', plain).strip()
    if len(plain) <= limit:
        return plain
    return plain[:limit].rsplit(' ', 1)[0] + ' […]'


def iso_date(post):
    d, m, y = post['created_at'].split('/')
    return f'{int(d):02d}/{int(m):02d}/{y}'


def main():
    raw = json.loads(get(FEED))
    raw.sort(key=lambda p: int(p['id']), reverse=True)
    print(f'{len(raw)} posts in the source feed')

    seen = set()
    posts = []
    for p in raw:
        cat = CATEGORIES.get(str(p['category']), CATEGORIES['1'])
        thumbs = {size: download(ref, seen) for size, ref in p['image'].items()}
        content = clean(p['content'], seen)
        posts.append({
            'id': int(p['id']),
            'slug': re.sub(r'\.html$', '', p['url']),
            'title': html.unescape(p['title']).strip(),
            'description': html.unescape(p['description']).strip(),
            'keywords': [k.strip() for k in p['keywords'].split(',') if k.strip()],
            'category': cat,
            'date': iso_date(p),
            'dateIso': p['created_at_iso'],
            'thumbs': thumbs,
            'excerpt': excerpt(content),
            'content': content,
        })

    os.makedirs('data', exist_ok=True)
    json.dump({'source': SRC, 'categories': CATEGORIES, 'posts': posts},
              open('data/news.json', 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print(f'{len(posts)} posts, {len(seen)} images -> data/news.json')


if __name__ == '__main__':
    main()
