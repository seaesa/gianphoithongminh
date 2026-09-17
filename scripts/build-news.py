# -*- coding: utf-8 -*-
"""Rebuild the whole news section from data/news.json.

The live site's own posts were replaced wholesale (see docs/research/components/
news.spec.md), so this script owns every page under the post taxonomy:

  * one page per post                       <slug>/index.html
  * two category archives, paginated        category/<cat>/index.html
                                            category/<cat>/page/<n>/index.html
  * one archive per shared tag              tag/<tag>/index.html

It writes the same `data/pages/<slug>.json` records `build-pages.py` renders, so
the news pages go through exactly the same chrome as everything else. Records for
posts and post-archives that are no longer in data/news.json are dropped, and
their generated directories deleted.

    python3 scripts/build-news.py     # then: python3 scripts/build-pages.py
"""
import html, json, os, re, shutil, sys, unicodedata

sys.path.insert(0, os.path.dirname(__file__))
from sitemap_util import canon, page_path

ORIGIN = 'https://thegioigianphoi.vn'
ROOT = '@@ROOT@@/'
PER_PAGE = 6          # what the theme's own archive template paged at
MIN_TAG_POSTS = 2     # a tag needs at least this many posts to get an archive
RELATED = 5

NEWS = json.load(open('data/news.json', encoding='utf-8'))
POSTS = NEWS['posts']

MENU_STATE = {'nav': [''] * 5, 'sidebar': [''] * 5, 'mobile': [''] * 5,
              'footer': [''] * 9, 'topmenu': [''] * 2}

CATEGORY_INTRO = {
    'tin-tuc': 'Tin tức và dịch vụ mới nhất về giàn phơi thông minh, lưới cáp '
               'ban công và cửa lưới chống muỗi tại TP.HCM và Bình Dương.',
    'tu-van-gian-phoi': 'Kinh nghiệm chọn mua, sử dụng và bảo dưỡng giàn phơi '
                        'thông minh — tư vấn từ đội ngũ kỹ thuật của chúng tôi.',
}

SITE_NAME = 'Giàn phơi quần áo thông minh Hòa Phát'


def e(s):
    return html.escape(s or '', quote=True)


def slugify(text):
    s = unicodedata.normalize('NFD', text.lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = s.replace('đ', 'd').replace('đ', 'd')
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')


# ── shared fragments ────────────────────────────────────────────────────────

SOCIAL_SHARE = '''<div class="hrm-social-share">
<h3><span class="share-text" style="color:#1a7b1c">Chia sẻ bài viết!</span></h3>
<ul class="hrm-share">
<li>
<a class="facebook" href="#" target="_blank">
<i class="fa fa-facebook"></i>
<span>Facebook</span>
</a>
</li>
<li>
<a class="google" href="#" target="_blank">
<i class="fa fa-google-plus"></i>
<span>Google Plus</span>
</a>
</li>
<li>
<a class="twitter" href="#" target="_blank">
<i class="fa fa-twitter"></i>
<span>Twitter</span>
</a>
</li>
<li>
<a class="linkedin" href="#" target="_blank">
<i class="fa fa-linkedin"></i>
<span>LinkedIn</span>
</a>
</li>
<li class="pinterest">
<div class="share-pin-origin">
<a data-pin-config="beside" data-pin-do="buttonPin" href="#"><img src="''' \
    + ROOT + '''assets/external/assets.pinterest.com-images-pidgets-pinit_fg_en_rect_gray_20.png"/></a>
</div>
<i class="fa fa-pinterest-p"></i>
<span class="share-pin-alt pinterest">Pinterest</span>
</li>
</ul>
</div>'''


def comments(slug, post_id):
    return f'''<div class="comments-area" id="comments">
<div class="comment-respond" id="respond">
<h3 class="comment-reply-title" id="reply-title">Trả lời <small><a href="{ROOT}{slug}/index.html" id="cancel-comment-reply-link" rel="nofollow" style="display:none;">Hủy</a></small></h3> <form action="#" class="comment-form" id="commentform" method="get" novalidate="">
<p class="comment-notes"><span id="email-notes">Thư điện tử của bạn sẽ không được hiển thị công khai.</span> Các trường bắt buộc được đánh dấu <span class="required">*</span></p><p class="comment-form-comment"><label for="comment">Bình luận</label> <textarea aria-required="true" cols="45" id="comment" maxlength="65525" name="comment" required="required" rows="8"></textarea></p><p class="comment-form-author"><label for="author">Tên <span class="required">*</span></label> <input aria-required="true" id="author" maxlength="245" name="author" required="required" size="30" type="text" value=""/></p>
<p class="comment-form-email"><label for="email">Thư điện tử <span class="required">*</span></label> <input aria-describedby="email-notes" aria-required="true" id="email" maxlength="100" name="email" required="required" size="30" type="email" value=""/></p>
<p class="comment-form-url"><label for="url">Trang web</label> <input id="url" maxlength="200" name="url" size="30" type="url" value=""/></p>
<p class="form-submit"><input class="submit" id="submit" name="submit" type="submit" value="Phản hồi"/> <input id="comment_post_ID" name="comment_post_ID" type="hidden" value="{post_id}"/>
<input id="comment_parent" name="comment_parent" type="hidden" value="0"/>
</p> </form>
</div><!-- #respond -->
</div><!-- #comments -->'''


def related_block(post, by_cat):
    peers = by_cat[post['category']['slug']]
    i = peers.index(post)
    picks = [peers[(i + k) % len(peers)] for k in range(1, len(peers))][:RELATED]
    if not picks:
        return ''
    o = ['<div class="related-post">', '<div class="related-title">',
         '<h3>Các bài viết liên quan</h3>', '</div>',
         '<div class="show-related">', '<ul class="related">']
    for p in picks:
        o += ['<li>', '<span class="bullet"></span>',
              f'<h3><a href="{ROOT}{p["slug"]}/index.html">{e(p["title"])}</a></h3>',
              f'<span class="date">( {p["date"]} )</span>', '</li>']
    o += ['</ul>', '</div>', '</div><!-- .related-post -->']
    return '\n'.join(o)


# ── post pages ──────────────────────────────────────────────────────────────

def post_record(post, by_cat, tag_slugs):
    cat = post['category']
    tags = [(t, tag_slugs[t]) for t in post['keywords'] if t in tag_slugs]
    classes = ' '.join(['post-%d' % post['id'], 'post', 'type-post', 'status-publish',
                        'format-standard', 'has-post-thumbnail', 'hentry',
                        'category-' + cat['slug']]
                       + ['tag-' + s for _, s in tags])

    tag_links = ', '.join(
        f'<a href="{ROOT}tag/{s}/index.html" rel="tag">{e(t)}</a>' for t, s in tags)
    footer = (f'<span class="tags-links"><div class="post_tags_intro">Tags:</div> {tag_links}</span> '
              if tag_links else '')

    hero = post['thumbs'].get('720x480')
    hero_html = (f'<p class="post-hero"><img alt="{e(post["title"])}" class="aligncenter" '
                 f'height="480" src="{ROOT}{hero}" width="720"/></p>\n') if hero else ''

    main = f'''
<article class="{classes}" id="post-{post['id']}">
<header class="entry-header">
<h1 class="entry-title">{e(post['title'])}</h1> </header><!-- .entry-header -->
<p class="post-meta">
<span class="post-date">
<i class="fa fa-calendar"></i>{post['date']}\t\t\t\t</span>
<span class="post-cats"><i class="fa fa-folder-o"></i><a href="{ROOT}category/{cat['slug']}/index.html" rel="category tag">{e(cat['name'])}</a></span>
</p>
<div class="entry-content">
{hero_html}{post['content']}
</div><!-- .entry-content -->
<footer class="entry-footer">
{footer}</footer><!-- .entry-footer -->
{SOCIAL_SHARE}
</article><!-- #post-## -->
{comments(post['slug'], post['id'])}
{related_block(post, by_cat)}'''

    return {
        'url': f'{ORIGIN}/{post["slug"]}/',
        'path': f'{post["slug"]}/index.html',
        'kind': 'post',
        'bodyClass': f'post-template-default single single-post postid-{post["id"]} single-format-standard',
        'title': f'{post["title"]} - {SITE_NAME}',
        'description': post['description'],
        'menuState': MENU_STATE,
        'breadcrumbs': [
            {'text': 'Trang chủ', 'href': ORIGIN},
            {'text': cat['name'], 'href': f'{ORIGIN}/category/{cat["slug"]}/'},
            {'text': post['title']},
        ],
        'main': main,
        'primaryClass': 'content-area col-md-9',
        'extraCss': [],
    }


# ── archives ────────────────────────────────────────────────────────────────

def item_card(post):
    thumb = post['thumbs'].get('480x320')
    href = f'{ROOT}{post["slug"]}/index.html'
    cat = post['category']
    return f'''<article class="item-list">
<div class="post-thumbnail">
<a href="{href}">
<img alt="{e(post['title'])}" class="attachment-blog-thumbnail size-blog-thumbnail wp-post-image" height="320" src="{ROOT}{thumb}" width="480"/> </a>
</div><!-- post-thumbnail /-->
<div class="entry">
<h2 class="post-box-title">
<a href="{href}">{e(post['title'])}</a>
</h2>
<p class="post-meta">
<span class="post-meta-author"><i class="fa fa-user"></i><a href="#" title="">admin </a></span>
<span class="post-date">
<i class="fa fa-calendar"></i>{post['date']}\t\t\t</span>
<span class="post-cats"><i class="fa fa-folder-o"></i><a href="{ROOT}category/{cat['slug']}/index.html" rel="category tag">{e(cat['name'])}</a></span>
</p>
<p>{e(post['excerpt'])}</p>
<a class="more-link" href="{href}">Xem tiếp »</a>
</div>
<div class="clear"></div>
</article><!-- .item-list -->'''


def page_href(base_path, n):
    """`category/tin-tuc` + 2 -> the @@ROOT@@ link for that archive page."""
    return ROOT + (f'{base_path}/index.html' if n == 1 else f'{base_path}/page/{n}/index.html')


def pagenavi(base_path, current, total):
    """The theme's own page-numbers markup: ←  1 2 3 … last  →"""
    if total < 2:
        return ''
    # WordPress shows the first, the last, and a window around the current page
    window = {1, total, current}
    window |= {current - 1, current + 1}
    nums = sorted(n for n in window if 1 <= n <= total)

    o = ['<div class="hrm-pagenavi"><ul class="page-numbers">']
    if current > 1:
        o.append(f'<li><a class="prev page-numbers" href="{page_href(base_path, current - 1)}">←</a></li>')
    prev = 0
    for n in nums:
        if prev and n - prev > 1:
            o.append('<li><span class="page-numbers dots">…</span></li>')
        if n == current:
            o.append(f'<li><span class="page-numbers current">{n}</span></li>')
        else:
            o.append(f'<li><a class="page-numbers" href="{page_href(base_path, n)}">{n}</a></li>')
        prev = n
    if current < total:
        o.append(f'<li><a class="next page-numbers" href="{page_href(base_path, current + 1)}">→</a></li>')
    o += ['</ul>', '</div>']
    return '\n'.join(o)


def archive_records(kind_path, title, intro, posts, body_class, breadcrumb_text,
                    page_title_suffix):
    """One record per page of an archive listing `posts`."""
    total = max(1, -(-len(posts) // PER_PAGE))
    out = []
    for n in range(1, total + 1):
        chunk = posts[(n - 1) * PER_PAGE: n * PER_PAGE]
        rel = kind_path if n == 1 else f'{kind_path}/page/{n}'
        head = [f'\n<header class="entry-header">\n<h1 class="page-title">{e(title)}</h1>']
        if intro:
            head.append(f'<div class="taxonomy-description"><p>{e(intro)}</p>\n</div>')
        head.append(' </header><!-- .page-header -->')
        main = ('\n'.join(head) + '\n<div class="list-blog">\n<div class="post-listing archive-box">\n'
                + '\n'.join(item_card(p) for p in chunk)
                + '\n</div>\n</div>' + pagenavi(kind_path, n, total))

        page_no = '' if n == 1 else f' - Trang {n}'
        out.append({
            'url': f'{ORIGIN}/{rel}/',
            'path': f'{rel}/index.html',
            'kind': 'post-archive',
            'bodyClass': body_class + ('' if n == 1 else ' paged paged-%d' % n),
            'title': f'{title}{page_title_suffix}{page_no} - {SITE_NAME}',
            'description': intro,
            'menuState': MENU_STATE,
            'breadcrumbs': [
                {'text': 'Trang chủ', 'href': ORIGIN},
                {'text': breadcrumb_text + page_no},
            ],
            'main': main,
            'primaryClass': 'content-area col-md-9',
            'extraCss': [],
        })
    return out


# ── main ────────────────────────────────────────────────────────────────────

def main():
    posts = sorted(POSTS, key=lambda p: -p['id'])

    by_cat = {}
    for p in posts:
        by_cat.setdefault(p['category']['slug'], []).append(p)

    # tags worth an archive of their own
    counts = {}
    for p in posts:
        for k in p['keywords']:
            counts[k] = counts.get(k, 0) + 1
    tag_slugs, by_slug = {}, {}
    for k, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])):
        if n < MIN_TAG_POSTS:
            continue
        s = slugify(k)
        if s and s not in by_slug:
            tag_slugs[k] = s
            by_slug[s] = k

    records = [post_record(p, by_cat, tag_slugs) for p in posts]

    for slug, items in sorted(by_cat.items()):
        cat = items[0]['category']
        records += archive_records(
            f'category/{slug}', cat['name'], CATEGORY_INTRO.get(slug, ''), items,
            f'archive category category-{slug}  hfeed', cat['name'], '')

    for name, slug in sorted(tag_slugs.items(), key=lambda kv: kv[1]):
        items = [p for p in posts if name in p['keywords']]
        records += archive_records(
            f'tag/{slug}', name, '', items,
            f'archive tag tag-{slug} hfeed', name, ' Archives')

    # ── swap the news section in for the old one ────────────────────────────
    index = json.load(open('data/pages-index.json', encoding='utf-8'))
    keep = [r for r in index if r['kind'] not in ('post', 'post-archive')]
    stale = [r for r in index if r['kind'] in ('post', 'post-archive')]

    fresh_paths = {r['path'] for r in records}
    removed = 0
    for r in stale:
        os.path.exists(f'data/pages/{r["slug"]}.json') and os.remove(f'data/pages/{r["slug"]}.json')
        d = os.path.dirname(r['path'])
        if d and r['path'] not in fresh_paths and os.path.isdir(d):
            shutil.rmtree(d)
            removed += 1

    for rec in records:
        rec['slug'] = re.sub(r'[^A-Za-z0-9._-]+', '-', rec['path'][:-len('/index.html')])
        json.dump(rec, open(f'data/pages/{rec["slug"]}.json', 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=1)

    # `cloneOnly` tells scripts/verify-pages.mjs there is nothing live to
    # compare against — these posts replaced the original site's news section.
    index = keep + [{'url': r['url'], 'path': r['path'], 'kind': r['kind'],
                     'title': r['title'], 'slug': r['slug'], 'cloneOnly': True}
                    for r in records]
    index.sort(key=lambda r: r['path'])
    json.dump(index, open('data/pages-index.json', 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

    # ── the sidebar's "Tin tức mới" widget follows the new feed ─────────────
    site = json.load(open('data/site.json', encoding='utf-8'))
    site['sidebar']['recent_posts']['items'] = [{
        'href': f'{ORIGIN}/{p["slug"]}/',
        'img': '@@LOCAL@@' + p['thumbs']['300x200'],
        'title': p['title'],
        'alt': p['title'],
    } for p in posts[:10]]
    json.dump(site, open('data/site.json', 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

    print(f'{len(posts)} posts, {len(by_cat)} categories, {len(tag_slugs)} tags '
          f'-> {len(records)} records ({removed} old directories removed)')


if __name__ == '__main__':
    main()
