# News section & contact details Specification

Two changes that deliberately break the clone's equality with the live site:

| # | Change | Source |
|---|--------|--------|
| 1 | Every page under the post taxonomy now carries another site's articles | `gianphoichinhhang.com/data/posts.json` |
| 2 | Every phone number, mailbox, address and social link is a different business's | `gianphoichinhhang.com` |

Everything else still verifies against `thegioigianphoi.vn` exactly as before.

---

## 1. Where the posts come from

`gianphoichinhhang.com` serves its whole blog as one JSON feed at
`/data/posts.json` — 23 posts, each with `title`, `description`, `keywords`,
`category`, `created_at`, a four-size `image` map and the full `content` HTML.
Its own `blog.html` renders the first 12 server-side and pages the rest from that
same feed, so the feed is the complete record.

`scripts/fetch-news.py` pulls it and localises it into `data/news.json`:

- every thumbnail and every inline `<figure>` image is downloaded under
  `assets/news/posts/<id>/…` (**138 images, 7.8 MB**) and the content HTML is
  rewritten to `@@ROOT@@/assets/news/…`
- `data-start` / `data-end` editor leftovers are stripped, bare `<hr>` and
  `<img>` are closed, and a leading empty `<h2>&nbsp;</h2>` is dropped
- an `excerpt` is derived for the archive cards (180 chars, `[…]` suffix)

It is **not** part of `build.sh` — it only needs re-running to pick up new posts.

### Category mapping

The feed's two numeric categories map onto the two post categories this site
already had, so no taxonomy had to be invented:

| feed | this site | posts |
|---|---|---|
| `1` | `category/tin-tuc/` — Tin tức | 12 |
| `2` | `category/tu-van-gian-phoi/` — Tư vấn giàn phơi | 11 |

## 2. What gets generated — `scripts/build-news.py`

It owns every page under the post taxonomy and writes the same
`data/pages/<slug>.json` records that `build-pages.py` renders, so the news pages
go through identical chrome (header, breadcrumbs, sidebar, footers).

**23 post pages** at `<slug>/index.html`, using the theme's single-post template:
`article.post-<id>`, `h1.entry-title`, `p.post-meta` with date and category, the
720×480 thumbnail as a hero, the article body, `.tags-links`, the social-share
strip, the comment form and a related-posts list (5 peers from the same category,
picked by rotation so the build is reproducible).

**4 category-archive pages** — `tin-tuc` and `tu-van-gian-phoi`, **6 posts per
page**, which is what the theme's own archive template paged at.

**20 tag archives** at `tag/<slug>/`, one per keyword shared by at least two
posts. Vietnamese keywords are slugified by stripping diacritics and mapping
`đ → d`. Tags used by a single post are dropped rather than generating 193
near-empty archives.

Records and generated directories for posts and post-archives that are no longer
in `data/news.json` are deleted, and `data/pages-index.json` is rewritten. The
sidebar's *Tin tức mới* widget is repointed at the 10 newest posts via
`data/site.json`, so every page on the site links into the new feed.

### Pagination — the bit the live site never had

The cloned archive shipped the theme's `.hrm-pagenavi` markup with every `href`
set to `#`. `pagenavi()` now emits the real thing:

```html
<div class="hrm-pagenavi"><ul class="page-numbers">
  <li><a class="prev page-numbers" href="…/page/1/index.html">←</a></li>
  <li><a class="page-numbers" href="…">1</a></li>
  <li><span class="page-numbers current">2</span></li>
  <li><span class="page-numbers dots">…</span></li>
  <li><a class="page-numbers" href="…/page/9/index.html">9</a></li>
  <li><a class="next page-numbers" href="…">→</a></li>
</ul></div>
```

Page 1 lives at `category/<cat>/index.html` and page *n* at
`category/<cat>/page/<n>/index.html` — WordPress' own URL shape, so the links
work as static files. The window is first + last + current ± 1 with `…` for the
gaps; `←` / `→` appear only when there is somewhere to go. Styling is the
theme's; the only addition is centring the strip below 600px.

## 3. Styling — `assets/css/news.css`

The theme only ever saw WordPress' `<p>` / `<img>` output, so it has no rules for
`<figure>`, `<figcaption>`, `<hr>`, `<table>` or in-article headings. `news.css`
adds them, scoped to `.single-post .entry-content` so nothing else can be
affected, and stacks the archive card below 600px — the theme pins
`.post-thumbnail img` at `width: 300px`, which on a 320px phone leaves a
twenty-pixel text column.

It is hand-written, so `build-css.py` does not tree-shake it; it is loaded from
`render.py`'s `head()` alongside `overrides.css` and `shop.css`.

---

## 4. Contact details — `data/contact.json`

One file holds every contact fact, and `scripts/apply-contact.py` pushes it
everywhere. `render.py` and `build-pages.py` read it directly.

| | old (thegioigianphoi.vn) | new (gianphoichinhhang.com) |
|---|---|---|
| hotline | 4 numbers across 2 cities | `0902 725 760` |
| email | `thegioigianphoi.vn@gmail.com`, `hoaphatstar.net@gmail.com` | `daihoaphat999@gmail.com` |
| address | 4 branches (2 HN, 2 HCM) | Đường 48, khu phố 6, Hiệp Bình Chánh, TP Hồ Chí Minh |
| Facebook | 2 pages | `facebook.com/noithatthongminhdaihoaphat` |
| Zalo | `zalo.me/0979680195` | `zalo.me/0902725760` |
| company | CÔNG TY TNHH XÂY LẮP VÀ THƯƠNG MẠI ÁNH DƯƠNG | CÔNG TY TNHH NỘI THẤT THÔNG MINH ĐẠI HOA PHÁT |
| website | `hoaphatstar.net` | `gianphoichinhhang.com` |

`apply-contact.py` rewrites:

- **`data/site.json`** — top-bar hotline + email, top-bar and footer Facebook
  icons, the sidebar service widget's phone / Facebook / email, and the footer
  contact widget's three info-items. It also normalises the extractor's raw
  `*_html` captures, which nothing renders but which would otherwise contradict
  the structured data sitting next to them.
- **`data/pages/*.json`** — the numbers, mailboxes, branch addresses, Facebook
  links and company name baked into extracted page content (33 records).
- **`data/custom.json`** — the bank transfer holder and the free-shipping note.
- **`lien-he/`** — rebuilt outright: address, hotline, email, opening hours,
  service area, Facebook, Zalo and a Google Maps embed of the real address.

It is idempotent and safe to re-run after `extract-pages.py`.

### Why the branch addresses become four lines

The old product descriptions listed four branches as four sibling `<p>` / `<li>`
elements. Collapsing them to a single address line made every product page
~100px shorter than the live original, which `verify-pages.mjs` measures. So the
replacement emits **the same number of lines the original had**, filled from an
ordered list of real facts — address, service area, opening hours, Zalo/hotline —
truncated to the number of elements matched.

### Split mailboxes

Two pages print the address across inline tags
(`<strong>thegioigianphoi.vn</strong><strong>@gmail.com</strong>`). A plain
string replace misses those, so `SPLIT_EMAIL_RE` handles them before the ordinary
one runs.

---

## 5. Verification

`scripts/verify-pages.mjs` cannot compare a page whose content this clone owns,
so news records are flagged `cloneOnly: true` in `data/pages-index.json`
(`build-news.py` sets it; `apply-contact.py` adds `lien-he`). **50 pages are
skipped: 23 posts, 24 post-archives, 3 pages.**

The remaining 55 still verify against the live site, with four blocks hidden on
**both** sides because their text is deliberately different:

```
.top-bar                      hotline + email
#hrm-contact-widget-3         footer contact widget
#hrm-recent-posts-widget-2    sidebar "Tin tức mới"
.hotline-phone-ring-wrap,
.zalo-float                   floating call / Zalo buttons
```

That is the same technique already used for `.related-post` and
`.related.products`, which the live site randomises per request.

`scripts/verify-news.mjs` checks them on their own terms instead — **310
checks**:

- all 47 pages load with no 4xx response, no JS error, no undecoded HTML entity,
  no broken image and no unresolved `href="#"` outside the theme's own share
  strip, author byline and comment-cancel link
- one post page per category, walked from page 1 to page 2 by clicking the real
  `.next` arrow: the current marker moves, the arrows appear and disappear
  correctly, the two pages share no post, and together they list exactly the
  posts in that category
- a post links to its category, shows its hero image and 1–5 related peers
- the sidebar's *Tin tức mới* widget lists 10 items, newest first
- no horizontal overflow at 320px on a post or an archive

`node scripts/check-links.mjs` covers the static side: every thumbnail, inline
image, pagination link, tag link and breadcrumb has to resolve on disk.
