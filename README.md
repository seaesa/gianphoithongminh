# thegioigianphoi.vn — static clone

A pixel-perfect HTML / CSS / JS rebuild of the **whole** thegioigianphoi.vn site —
**108 pages**, no WordPress, no PHP, no build step at runtime.

Two things in it are deliberately *not* thegioigianphoi.vn: the news section
carries the 23 articles from **gianphoichinhhang.com**, and every contact detail
on the site is that business's. See
`docs/research/components/news.spec.md`.

The original is WordPress 4.7 + WooCommerce 2.6 on the `hrm` theme (Bootstrap 3.3.6,
Font Awesome 4.7, Owl Carousel 2, jQuery). Everything here was reverse-engineered
from the live pages: the chrome is generated from extracted data, the stylesheets
are rebuilt from the rules the pages actually use, and the whole jQuery behaviour
layer is re-implemented in vanilla JS.

```bash
./scripts/serve.sh          # http://127.0.0.1:8777/
```

Pages link to directories (`/lien-he/`, not `/lien-he/index.html`), so they need
a server — `serve.sh`, or any static host — rather than being opened from
`file://`. `vercel.json` makes Vercel serve and canonicalise the same URLs.

## Added on top of the clone

Features the live site either lacks or ships broken. Details in
`docs/research/components/shop-features.spec.md`,
`docs/research/components/news.spec.md` and
`docs/research/components/site-fixes.spec.md`.

| Feature | Where | Notes |
|---|---|---|
| **Cart in `localStorage`** | every page | `window.GPCart`; added from a product page's "Thêm vào giỏ". Header badge + mini-cart. Falls back to memory when storage is blocked. |
| **Cart page** | `/gio-hang/` | quantity stepper, per-line remove, clear all, totals. Replaces the cloned empty-cart page. |
| **Checkout** | `/thanh-toan/` | address form with province→ward cascade and validation; **COD** and **bank transfer** (QR, account details, "đã chuyển khoản" gate). Order code + `gporders.v1` history. |
| **`Giàn phơi xếp ngang` category** | `/danh-muc/gian-phoi-xep-ngang/` | the live menu links here but the site 404s; rebuilt with 3 real products + 5 sample variants. |
| **Quick-order modal** | product pages | the live modal renders the raw `[ninja_forms id=5]` shortcode; replaced with a working form. |
| **News section** | `/category/tin-tuc/`, `/category/tu-van-gian-phoi/`, 23 posts, 20 tags | content imported from `gianphoichinhhang.com`, images and all. |
| **Archive pagination** | every post archive | the cloned `.hrm-pagenavi` had every `href="#"`; now real `page/<n>/` pages, 6 posts each. |
| **Contact details** | every page + `/lien-he/` | one source of truth in `data/contact.json`; `/lien-he/` rebuilt with hours, service area, Zalo and a map. |
| **Working search** | header box + `/tim-kiem/` | the live box posts to WordPress; here it ranks a 104-page index in the browser, accent-insensitively. |
| **Cart icon** | every page | the theme ships `href="#"` and a WooCommerce handler; now a real link to `/gio-hang/`. |
| **Footer Facebook card** | every page | the real one is an SDK iframe that is never loaded; the clone draws the same 340×200 card itself. |
| **Tin tức + Liên hệ in the menu** | every page | the live menu is five product categories with no way to reach either page; gaps tightened so all seven stay on one row. |
| **One-row mobile header** | ≤991px | the theme stacks the search field, its button and the cart three-deep on a phone; they are one flex row now. |
| **Liên hệ request form** | `/lien-he/` | the live page is an address list and nothing else; the clone leads with a validated request form (code + `gprequests.v1`). |
| **Favicon set** | every page | the original points `shortcut icon` at the raw logo PNG; `build-favicon.py` draws a real 16/32/48 `.ico`, apple-touch and maskable icons, plus a web manifest. |
| **Extensionless URLs** | every link | `index.html` is stripped from all 8,679 internal links and `vercel.json` canonicalises the rest. |

The product grids keep the theme's hidden add-to-cart buttons, so every archive
layout still matches the original exactly.

## What's in it

| template | pages | example |
|---|---|---|
| home | 1 | `/` |
| static page | 18 | `/gioi-thieu/`, `/gio-hang/`, `/tai-khoan/` |
| blog post | 23 | `/top-5-thuong-hieu-gian-phoi-thong-minh-uy-tin-nhat-viet-nam/` |
| post archive | 24 | `/category/tin-tuc/` (+ `page/2/`), `/tag/…/` |
| single product | 26 | `/cua-hang/gian-phoi-4-thanh/` |
| product archive | 14 | `/cua-hang/`, `/danh-muc/…/`, `/tu-khoa/…/` |
| added shop pages | 3 | `/gio-hang/`, `/thanh-toan/`, `/danh-muc/gian-phoi-xep-ngang/` |

Full list in `docs/research/SITE_MAP.md`.

## Verified against the live site

Every check below compares the clone with the live page **in the same browser,
driving the same actions**.

| Check | Result |
|-------|--------|
| Homepage layout — box + 39 computed properties over 108 selectors | **0 diffs** at all 15 widths |
| Homepage full-page height | **identical** at all 15 widths |
| Homepage interactions (hover / click / scroll / responsive) | **37 / 37 match** |
| Single-product interactions (tabs, carousel, stepper, modal, lightbox) | **15 / 15 match** |
| All 56 comparable pages — height, chrome geometry, `main` children, image integrity | **56 / 56 clean**, worst pixel diff **0.52 %** |
| Cart / checkout / quick-order / new category (end to end) | **66 / 66 checks pass** |
| Imported news — 47 pages load clean, pagination walks, feed coverage, phone layout | **310 / 310 checks pass** |
| Cart icon, Facebook card, search, menu, mobile header, contact form, URLs, favicon | **195 / 195 checks pass** |
| Link + asset integrity across the generated site | **14,476 refs, 7 missing** (all dead on the live site too) |

**52 pages are deliberately not comparable** with the live site and are skipped:
the 47 news pages and `/lien-he/` (content this clone owns — see
`docs/research/components/news.spec.md`) and `/gio-hang/`, `/thanh-toan/`,
`/danh-muc/gian-phoi-xep-ngang/`, `/tim-kiem/` (covered by `verify-shop.mjs`
and `verify-site.mjs`).

Because the contact details and the news feed differ on purpose, the blocks that
print them — the top bar, the footer contact widget, the sidebar's *Tin tức mới*
list, the floating call / Zalo buttons and the footer's Facebook box — are hidden
on **both** sides before measuring, the same way `.related-post` already was.
Everything around them still has to match to the pixel.

Two more deliberate changes are handled by measurement rather than hiding. The
main menu's list items are narrower (seven items in a bar built for five), so
those selectors are skipped — but `#main-menu` and `#navigation` are not, and the
bar's height still matches the live one at every width. Below 992px the header is
**80px shorter** because the search field, its button and the cart share a row;
that single number is measured on `.site-branding` and taken out of every `y`
below it, out of the page height and out of the screenshot alignment, so
everything else is still compared exactly. Details in
`docs/research/components/site-fixes.spec.md`.

Widths tested on the homepage: 320, 375, 390, 480, 500, 650, 767, 768, 991, 992,
1199, 1200, 1366, 1440, 1920. One page per template is additionally verified at
desktop / tablet / mobile.

```bash
node scripts/verify.mjs --all                    # homepage, 15 widths
node scripts/verify-interactions.mjs             # homepage behaviours
node scripts/verify-interactions-product.mjs     # product-page behaviours
node scripts/verify-pages.mjs                    # the 56 comparable pages, desktop
node scripts/verify-pages.mjs --responsive       # one per template × 3 viewports
node scripts/verify-pages.mjs --kind product     # one template
node scripts/verify-shop.mjs                     # cart, checkout, quick order
node scripts/verify-news.mjs                     # imported posts, archives, pagination
node scripts/verify-site.mjs                     # cart icon, Facebook card, search, menu, mobile header, contact form, URLs, favicon
node scripts/check-links.mjs                     # local hrefs/srcs resolve
```

## Layout

```
index.html                 homepage
<slug>/index.html          the other 107 pages, mirroring the live URL paths
vercel.json                trailing slashes + index.html → directory redirects
favicon.ico                16/32/48, drawn from the Hòa Phát mark
site.webmanifest           name, theme colour and the two maskable icons
data/
  site.json                chrome content: menus, widgets, footer, homepage grids
                           (incl. `extranav`: the two items added to the menu)
  products.json            one record per product, for the added pages
  custom.json              the added pages, bank details, provinces, sample products
  contact.json             every phone/email/address/social link, one source
  news.json                the 23 imported posts, with local image paths
  search-index.json        one entry per page, inlined into /tim-kiem/
  pages-index.json         url → output path → template, for all 105 pages
  pages/<slug>.json        per-page record: title, body class, menu state,
                           breadcrumbs, and the `main#main` region
assets/
  css/woocommerce.css      WooCommerce 2.6.14 subset (loads first, as on the original)
  css/grid.css             Bootstrap 3.3.6 subset
  css/theme.css            the `hrm` theme styles
  css/overrides.css        what the live pages ship as inline <style> blocks
  css/shop.css             cart, checkout and quick-order UI (added, not cloned)
  css/news.css             article body + archive card styling (added, not cloned)
  css/site.css             Facebook card, search results, menu, mobile header,
                           the Liên hệ form
  img/                     favicon PNGs, apple-touch and maskable icons
  vendor/                  Font Awesome, prettyPhoto, Select2 (subsets)
  fonts/ uploads/ theme/   564 assets downloaded from the live site (46 MB)
  news/                    138 images for the imported posts (7.8 MB)
  js/main.js               behaviour layer (see docs/research/BEHAVIORS.md)
  js/cart.js               localStorage cart + header mini-cart
  js/shop.js               cart page, checkout, quick-order modal, contact form
  js/search.js             ranks the search index (loaded only by /tim-kiem/)
docs/
  research/PAGE_TOPOLOGY.md      homepage section map and z-index layers
  research/SITE_MAP.md           every URL and where it lands
  research/BEHAVIORS.md          every interaction, with triggers and timings
  research/components/*.spec.md  per-component specs (DOM, computed styles, states)
  design-references/             side-by-side screenshots + pixel diffs
scripts/                   crawl → extract → assets → render → css → verify
.work/                     fetched reference sources (input only, never shipped)
```

## Rebuilding

```bash
./scripts/fetch-source.sh   # refresh the theme/plugin CSS + JS references
./scripts/build.sh          # crawl, extract, download assets, render, build CSS
```

The pipeline, in order:

1. **`crawl.mjs`** — seeds from the seven Yoast sitemaps, follows pagination links,
   saves every page to `.work/pages/` and classifies it by body class.
2. **`extract.py`** — parses the homepage into `data/site.json` (products, prices,
   menus, widgets, footer, inline styles).
3. **`collect-assets.py` + `download-assets.mjs`** — finds every `src`, `srcset`,
   `url()` and favicon across every crawled page and downloads them to `assets/`.
   **`build-favicon.py`** then draws the icon set: the live site ships no favicon
   at all, so the three-triangle Hòa Phát mark (measured off the logo, not
   redrawn by eye) is rendered onto the theme blue at every size a browser,
   iOS or Android asks for, plus `site.webmanifest`.
4. **`extract-pages.py`** — per page: title, body class, breadcrumbs, the four
   menus' state classes, and the `main#main` region with URLs rewritten to a
   `@@ROOT@@/` marker and scripts stripped.
5. **`build-news.py`** — rebuilds the whole post taxonomy from `data/news.json`:
   23 post pages, 4 paginated category archives, 20 tag archives; deletes the
   records and directories of posts that are no longer in the feed, and repoints
   the sidebar's *Tin tức mới* widget. (`fetch-news.py` refreshes `news.json`
   itself and is run on demand, not by `build.sh` — it downloads ~8 MB of images.)
6. **`apply-contact.py`** — pushes `data/contact.json` into `site.json`,
   `custom.json` and the 33 page records whose extracted content quotes the old
   shop's phone numbers, mailboxes or branch addresses, and rebuilds `/lien-he/`.
7. **`build-search.py`** — one index entry per page (title, kind, excerpt,
   thumbnail, price and an accent-free haystack), built from the page records so
   it does not depend on render order.
8. **`build.py` / `build-pages.py`** — render every page from `render.py`'s shared
   chrome plus that page's `main`, resolving `@@ROOT@@/` to each page's own
   relative prefix.
9. **`build-custom.py`** — renders the cart, checkout, `xếp ngang` and search
   pages using the same shared chrome. It must run *after* `build-pages.py`, which
   would otherwise re-render the cloned `/gio-hang/` over the working one.
   `build-sitemap-doc.py` then regenerates `docs/research/SITE_MAP.md`.
10. **`clean-urls.py`** — one pass over the generated pages that turns every
    `…/index.html` link into the directory it names, so no generator has to know
    how the site is served and no click costs a redirect. Nothing moves on disk.
11. **`build-css.py`** — keeps only the rules that can match the generated DOM
    across **all** pages, plus runtime-only classes (`.owl-*`, `.modal`, `.pp_*`,
    `.select2`, `.wc-tab`, hover/focus states), rewrites asset URLs, and drops the
    four background images that 404 on the original. Bootstrap shrinks 116 KB →
    35 KB, WooCommerce 75 KB → 22 KB. `overrides.css`, `shop.css`, `news.css`
    and `site.css` are hand-written and pass through untouched.
12. **`check-links.mjs`** — every local `href` and `src` in the generated site
    has to resolve on disk (a directory href resolving to its `index.html`).

## Deploying

The site is plain static files, so any host works. `vercel.json` configures the
one thing that is not automatic — how URLs are spelled:

```json
{
  "trailingSlash": true,
  "redirects": [
    { "source": "/index.html",        "destination": "/" },
    { "source": "/:path+/index.html", "destination": "/:path+/" }
  ]
}
```

`trailingSlash` is not cosmetic: every page resolves its stylesheets, images and
links **relative to its own directory**, so the browser's base URL has to stay
`/lien-he/`. With `trailingSlash: false` the base would become `/` and every
relative path on the page would break.

The redirects are written out rather than using Vercel's `cleanUrls`, which
would do the same job for `/x/index.html` but rewrites the root `/index.html` to
`//` — a URL with an empty host.

## Notes on fidelity

Quirks of the original that are reproduced deliberately rather than "fixed":

- The homepage wraps its logo in `<h1 class="site-title">`; **every other template
  uses `<p>`**, which is 1px shorter. Getting this wrong shifts whole inner pages.
- `.product-nav` (the orange *Danh mục sản phẩm* bar) is hidden at **every** width —
  the theme ships both a `min-width:767px` and a `max-width:767px` rule hiding it.
- `.link-acc` ("Đăng nhập - Đăng ký") is `display:none`.
- The add-to-cart button is `display:none` in product grids.
- `hrm_tab_products-2`'s third tab has an empty label.
- Below 767px the homepage product tab strip disappears entirely.
- `#footer-sidebar-2` is empty and `display:none`.
- `/thanh-toan/` serves the same page-id-55 markup as `/gio-hang/`.
- `.widget-top` is `inline-block`, so the whitespace before its sibling is a real
  20px line box — the generator preserves it.
- `#floating-phone` has CSS but is never rendered, so no element is emitted.
- The Zalo anchor really does ship an empty `<img src="">`.

Deliberate departures:

- The Facebook SDK, Google Analytics and the DMCA script are not loaded. The FB
  page plugin is a 340×200 placeholder and `.fb-comments` reserves its 20px line
  box, so neither changes the layout.
- The news section is **not** a clone. `/category/tin-tuc/`,
  `/category/tu-van-gian-phoi/`, all 23 posts and all 20 tag archives carry
  articles imported from `gianphoichinhhang.com`, and the archives page properly
  (the cloned ones had every `href="#"`). The original's 81 posts and 32 tag
  archives are gone.
- Every contact detail — hotline, email, address, Facebook, Zalo, company name —
  belongs to that same business, not to thegioigianphoi.vn. `/lien-he/` is
  rebuilt around it rather than patched, and leads with a request form the live
  page does not have.
- The live site's favicon is the **raw 255×198 logo PNG** on a `rel="shortcut
  icon"` — not square, not an `.ico`, and with no apple-touch or maskable icon,
  so "HÒA PHÁT" is an unreadable smudge in a tab. The clone draws a proper set
  from the same logo's three-triangle mark instead. It lives in `<head>`, not in
  any layout, so nothing measured changes.
- The account page and the cloned WooCommerce forms are presentation only. The
  cart, checkout, contact form and search **do** work, but entirely in the
  browser: there is no backend, so orders land in `localStorage` (`gporders.v1`)
  and contact requests in `gprequests.v1`, the QR code is decorative, and search
  ranks a pre-built index inlined into `/tim-kiem/`. **Nothing reaches the shop
  owner** — wiring these three to a real endpoint is the one change production
  needs, alongside the placeholder bank account in `data/custom.json`.
- The cart icon, the footer's Facebook box and the search form are *fixed*, not
  cloned — on the live site they depend on a WooCommerce handler, Facebook's SDK
  and a WordPress query respectively. See
  `docs/research/components/site-fixes.spec.md`.

Unavoidable differences:

- `.related-post` (post pages) and `.related.products` (product pages) are
  **re-randomised by the live server on every request**. The clone holds one
  snapshot; the verifier hides both sides and compares item counts instead.
- Ten images are dead on the live site — seven hotlinked from
  `gianphoi.hunghaweb.com` (the domain no longer resolves) and three WooCommerce
  thumbnail sizes that 404 on the origin. They are broken in the clone too, but
  a 404 and a blocked mixed-content request do not paint identically.
