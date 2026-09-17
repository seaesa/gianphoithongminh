# Site chrome fixes Specification

Pieces of the site that the clone had to *fix* rather than reproduce, because
what the live site does there depends on a server or a third-party SDK that this
clone does not load — or because the live site does not do it at all.

| # | What was broken | Where |
|---|---|---|
| 1 | The cart icon went nowhere | `.cart-header .cart-icon`, every page |
| 2 | The footer Facebook box was empty | `.fb-page-placeholder`, every page |
| 3 | The search box did nothing | `.search-form` + `/tim-kiem/` |
| 4 | Search and cart stacked three-deep on a phone | `.top-mid-right`, below 992px |
| 5 | Tin tức and Liên hệ were not reachable from the menu | `#navigation`, every page |
| 6 | Liên hệ had no way to get in touch but a phone number | `/lien-he/` |
| 7 | The favicon was the raw logo PNG | `<head>`, every page |
| 8 | Every URL ended in `index.html` | every link, `vercel.json` |

Styling for all of them is in `assets/css/site.css`, which is hand-written and so
not tree-shaken by `build-css.py`.

---

## 1. Cart icon

The live theme renders `<a class="cart-icon" href="#">` and relies on a jQuery
handler that WooCommerce installs. The clone reproduced the `#`, which meant the
icon was inert even though `/gio-hang/` is a working page here.

`render.py` now emits the page-relative link:

```html
<a class="cart-icon" href="../gio-hang/index.html" title="Xem giỏ hàng">
```

Hovering still opens the mini-cart — that is the theme's own CSS and is
untouched. The count badge still hangs off `.cart-header`, for the reason given
in `shop-features.spec.md`.

## 2. Footer Facebook card

The live footer embeds Facebook's page plugin in a 340×200 iframe. The SDK is
deliberately not loaded (see the README), and the placeholder that stood in for
it was an empty bordered rectangle with a bare link in the middle — it read as a
broken widget rather than a deliberate one.

It is now a card of the same 340×200 footprint, drawn from Font Awesome and CSS
gradients: cover strip, circular avatar, page name, "Trang Facebook chính thức",
and a **Theo dõi trang** button. The whole card is one `<a>` to
`data/contact.json`'s `facebook` URL, opening in a new tab.

The footprint matters: `overrides.css` keeps the `340×200` box that the live
page reserves, so the footer is exactly as tall as the original's whether or not
Facebook would have loaded. `.fb-card-name` is clamped to two lines so a long
page name cannot push the button out of the box. `verify-site.mjs` asserts both.

## 3. Search — `/tim-kiem/`

The live form is `<form role="search" method="get" action="/">` posting `?s=` to
WordPress. There is no server here, so the form posts to a generated results
page instead and the ranking happens in the browser.

### The index — `scripts/build-search.py`

One entry per page, built from the **page records** rather than the rendered
HTML, so it does not depend on render order:

```json
{"u":"cua-hang/gian-phoi-4-thanh/index.html",
 "t":"Giàn Phơi 4 Thanh", "k":"Sản phẩm",
 "x":"…220-character excerpt…", "i":"assets/uploads/…-400x400.jpeg",
 "p":"2,000,000 ₫", "q":"gian phoi 4 thanh gian phoi 4 thanh …"}
```

- `q` is the haystack: the accent-free title repeated twice (a cheap weight)
  followed by the first 1200 characters of the body
- `x` is what the result card shows. `plain()` drops the theme's furniture
  first — breadcrumb, entry header, post meta, the quick-order modal, tabs,
  reviews, comments, related blocks — otherwise every product excerpt would
  open with *"Trang chủ / Sản phẩm / … ĐẶT HÀNG NHANH × Close"*
- text is normalised to **NFC**: parts of the extracted content are in NFD
  (`"Ho" + ◌̀` rather than `"Hò"`), and one normal form keeps the index honest
- `/gio-hang/`, `/thanh-toan/`, `/tai-khoan/` and the search page itself are
  excluded — nothing is gained by searching your way into the cart

104 entries, ~150 KB.

### The page

`build-custom.py` renders `tim-kiem/index.html` through the shared chrome and
**inlines the index** as `<script type="application/json" id="gpSearchIndex">`.
Inline rather than fetched because a `fetch()` of a local JSON file is blocked
on `file://`, and the rest of the clone works from there. `data-prefix` on the
wrapper lets the script turn the index's root-relative paths into working links.

Results reuse the archive card (`article.item-list`) plus a kind badge and, for
products, the price. Ten at a time, with a **Xem thêm** button.

### Ranking — `assets/js/search.js`

Every term must appear somewhere (AND, not OR). Per term: **+12** at the start of
the title, **+8** elsewhere in the title, **+1** in the body. Then **+15** if the
whole phrase appears in the title, **+5** if in the body, and a small nudge for
products (**+3**) and articles (**+2**) over archive pages. Ties break on title,
collated with `localeCompare(…, 'vi')`.

### Accents

Vietnamese search has to work with or without diacritics, in both directions:
`gian phoi` finds *giàn phơi*, and *giàn phơi* finds a page written `gian phoi`.
`fold()` lowercases, decomposes to NFD, drops the combining marks and maps
`đ → d`. Both the index's `q` and the query go through it.

**Highlighting cannot reuse the folded offsets.** Folding is not
length-preserving — a decomposed `ò` is two characters that fold to one — so a
match found at folded offset *n* is not at original offset *n*. Using them
directly put the `<mark>` two characters out and produced
`<mark>: GI</mark>À<mark>N PH</mark>ƠI`. `foldMap()` folds character by
character and records which original character each folded character came from,
so the highlight lands exactly on `<mark>GIÀN</mark> <mark>PHƠI</mark>`.

### A note on hiding it in `verify-pages.mjs`

The verifiers hide the page plugin on both sides, since the live one is a
third-party iframe that could never match. The selector is
`.fb-page-placeholder, .fb-page` — **not** `.fb_iframe_widget`. Facebook's SDK
stamps that class on the *comments* box further up every product page too, and
hiding it removed 48px from the live side only, which failed all 26 product
pages until the selector was narrowed.

## 4. Header controls on one row below 992px

The theme was written for a wide header and stacks the three controls as the
viewport narrows:

| width | what the theme does |
|---|---|
| ≤991px | `.cart-header` keeps `float: right` and wraps under the search form |
| ≤767px | `.top-mid-right` goes `width: 100%; text-align: center`, search form still `float: left` |
| ≤500px | `#s` picks up `margin-bottom: 10px`, dropping the submit button onto its own line |

On a 390px phone that is three rows: field, then button, then cart. `site.css`
lays the same three controls out as a single flex row below 992px — the field
takes the free space (`flex: 1 1 auto` **plus `min-width: 0`**, without which a
flex item refuses to shrink below its content), the button and cart keep their
size. Below 400px the button's label is dropped to the magnifier alone so the
field stays usable. Nothing changes at 992px and up, where the theme already
fits all three on one line.

The mini-cart dropdown is pinned to `right: 0` with `max-width: calc(100vw - 30px)`
so it cannot hang off the edge of a phone.

**This makes the header 80px shorter than the live site's at ≤767px**, which is
the point — see the verification note below for how the comparison handles it.

## 5. Tin tức and Liên hệ in the main menu

The live menu is five product categories and nothing else; there is no way to
reach the news or the contact page from it. `data/site.json` grows an `extranav`
list, and `render.py` appends those items — with a `menu-item-extra` class — to
both `#navigation` and the off-canvas drawer, after the five the theme ships.

Current-item state rides the existing `menuState` mechanism rather than any path
matching: `build-news.py` writes `extranav: ['current-menu-item', '']` into every
news record and `apply-contact.py` writes `['', 'current-menu-item']` into the
Liên hệ record, so the right tab turns red exactly where a real WordPress menu
would light up.

### Making seven items fit

The bar was sized for five. At ≥1200px they occupy 1020px of a 1140px `<ul>`,
leaving 120px — not enough for two more, so the bar wrapped to two rows and grew
from 46px to 92px. Tightening the gaps fixes it without touching the type:

| width | theme | clone | seven items |
|---|---|---|---|
| ≥1200px | `padding: 13px 25px` | `padding: 13px 17px` | 1116px of a 1140px bar |
| 952–1199px | `padding: 10px 15px` | `padding: 10px 7px`, `font-size: 12px` | 909px of a 920px bar |
| ≤951px | — | unchanged | wraps, exactly as the live site's five do |

**952px is where the live bar itself stops wrapping**: `#navigation` reaches its
920px cap there and the five items' 920px just fit. Measured against the live
site, the clone's bar is now the same height at every width — 46px at 1200 /
1366 / 1440 / 1920, 40px at 952 / 960 / 991 / 992 / 1100 / 1199, and 80px (two
rows) at 768 / 900 / 950.

The live flip is a sub-pixel affair — at 950 its five items measure 920px in a
920px bar and wrap, at 951 they do not — so a one-pixel-wide window at 951px is
the only width where the two disagree.

---

## 6. Liên hệ request form — `/lien-he/`

The live page is an address list, a phone number and a map. There is no form:
the theme's contact template renders `#address-box` and nothing else, so the
only way to reach the shop is to pick up the phone.

The clone leads with the form, because that is what a visitor opened the page
to do. Markup is built by `scripts/apply-contact.py` (`CONTACT_FORM`), from the
same `data/contact.json` as the rest of the site.

**Layout** — `.gp-contact` is a two-column flex row:

| | |
|---|---|
| `.gp-contact__main` | `flex: 1 1 400px` — heading, lead, form, success panel |
| `.gp-contact__aside` | `flex: 1 1 260px` — the theme's own `#address-box` |

Below ~700px the columns wrap and the form is wholly above the address list; the
map stays full width under both. Field, button and confirmation styling is
**reused from `shop.css`** (`.gp-field`, `.gp-field-row`, `.gp-error`, `.gp-btn`,
`.gp-success`), so the form matches the checkout without a second set of rules.

**Fields and rules** (`assets/js/shop.js`, section 4):

| field | rule |
|---|---|
| Họ và tên | ≥ 2 characters |
| Số điện thoại | `/^0\d{9}$/` after stripping spaces and dots |
| Email | optional; standard shape only when filled |
| Bạn cần hỗ trợ về | `<select>`, five topics, always valid |
| Địa chỉ lắp đặt | optional |
| Nội dung | ≥ 10 characters |

Errors clear on `input` as soon as the value becomes valid and are (re)applied on
`blur`, so a visitor is never told off mid-word. Submitting focuses and scrolls
to the first invalid field.

**On success** the request is pushed to `gprequests.v1` (last 20 kept, every
access in try/catch), the form is hidden and `#gpContactSuccess` shows a request
code of the form `YC<yymmdd>-<4 digits>` — the same shape as the checkout's
`HP…`, from the same `orderCode(prefix)` helper. *Gửi yêu cầu khác* resets the
form and clears any error marks.

There is no backend, so nothing is sent anywhere. That is the same contract the
cart, the checkout and the quick-order modal offer, and it is listed in the
README as the change production needs.

`verify-pages.mjs` skips `/lien-he/` — the page is `cloneOnly` and has been since
its contact details stopped matching the live site.

---

## 7. Favicon — `scripts/build-favicon.py`

The live site does link an icon, but it is the logo file itself:

```html
<link rel="shortcut icon" href="…/uploads/2017/12/logo-hoa-phat-01.png">
```

That is a 255×198 PNG of a shield with "HÒA PHÁT" written across it. It is not
square, so a browser letterboxes it; at 16px the text is a smudge; and there is
no apple-touch icon or manifest at all.

What reads at 16px is the **three-triangle mark** inside the shield, so that is
what the icons carry, white on the theme blue `#0082c6`. The triangles are not
redrawn by eye — the generator measured the white pixels inside the shield
(x 85–170, y 83–127 of the logo) and expresses them as fractions of that box, so
the mark is the real one at any size. Everything is drawn at 8× and downsampled,
which is what keeps the diagonals clean.

| file | size | shape |
|---|---|---|
| `favicon.ico` | 16 / 32 / 48 | rounded square, transparent corners |
| `assets/img/favicon-16x16.png`, `-32x32.png` | 16, 32 | same |
| `assets/img/apple-touch-icon.png` | 180 | **full square** — iOS rounds it itself |
| `assets/img/icon-192.png`, `icon-512.png` | 192, 512 | full square, mark at 56% for the maskable safe zone |
| `site.webmanifest` | — | name, `theme_color: #0082c6`, both icons `any maskable` |

`render.py`'s `icons()` emits the `<link>` block with each page's own relative
prefix, so a page three directories down still points at `/favicon.ico`.

The mark is smaller at 16px than at 32px (`mark=0.82` vs `0.76` of a rounded
canvas) on purpose: at that size the rounding eats more of the canvas.

---

## 8. Extensionless URLs — `vercel.json` + `scripts/clean-urls.py`

Every page in this clone is `<dir>/index.html`, so `/lien-he/index.html` and
`/lien-he/` are the same file. `vercel.json` makes the second spelling the
canonical one:

```json
{
  "trailingSlash": true,
  "redirects": [
    { "source": "/index.html",        "destination": "/",         "permanent": true },
    { "source": "/:path+/index.html", "destination": "/:path+/",  "permanent": true }
  ]
}
```

**`trailingSlash: true` is load-bearing, not cosmetic.** Every page resolves its
stylesheets, images and links relative to its own directory (`render.py` gives
each one a `../`-counted prefix). The browser takes that base from the URL: at
`/lien-he/` it is `/lien-he/`, but at `/lien-he` it is `/`, and every relative
path on the page would resolve one level too high. Vercel's own trailing-slash
rule exempts paths containing a dot, so `/x/index.html` still reaches the
redirect below it.

**Why not `cleanUrls: true`.** It does the same job for `/x/index.html`, but its
route is `^/(?:(.+)/)?index(?:\.html)?/?$` → `/$1/`, and for the root
`/index.html` the capture is empty, so the `Location` becomes `//` — a URL with
an empty host. Two explicit redirects have no such edge.

### The links themselves

A redirect only fixes the address bar; the 8,679 internal links would each still
cost a 308. `scripts/clean-urls.py` runs after every renderer and rewrites them
in one pass:

```python
LINK_RE = re.compile(r'\b(href|action)="([^"]*?)index\.html(["#?])')
```

`href="foo/index.html"` becomes `href="foo/"`, `href="index.html"` becomes
`href="./"`, and a path containing `://` is left alone. **Nothing moves on
disk** — the files are still `<dir>/index.html`, which is what both Vercel and
`python3 -m http.server` serve for a directory request, so `serve.sh` and every
verifier keep working unchanged.

Three things generate links outside those pages and are cleaned at their source
instead:

- `scripts/build-search.py` — `url_of()` strips `index.html` from each entry's
  `u`; the home page becomes `''`, which the search page's `data-prefix` turns
  into the site root
- `assets/js/cart.js` — the mini-cart's two buttons and the toast link
- `assets/js/search.js` — the two "no results" suggestions

`check-links.mjs` resolves a directory href by looking for the `index.html`
inside it, so the integrity check still covers all 14,476 references.

The one thing this does **not** work under is `file://`, where a directory href
opens a listing. The README says so, and `serve.sh` already existed for the same
reason.

---

## Verification — `scripts/verify-site.mjs`

**195 checks**:

- the cart icon carries a real `href` from three different directory depths,
  navigates to `/gio-hang/`, and the page it reaches is the working cart
- the Facebook card links to `data/contact.json`'s URL, opens in a new tab,
  names the page, has its call to action, measures exactly 340×200, fills the
  reserved box and does not overflow it
- the header form reaches the results page from three depths, returns results
  and keeps the query in the box
- five queries with and without diacritics rank the expected page first
- an unmatched term returns nothing and shows the empty state
- the summary count, the ten-per-page slice and the **Xem thêm** button agree
- every result links somewhere that exists and has a heading
- highlighted text folds to exactly the query's terms — the offset regression
  above would fail this
- a bare `/tim-kiem/` prompts for a query instead of erroring
- the index is inlined and matches `data/search-index.json`
- the nav carries all seven items, in both the bar and the drawer, every link
  resolves, and the bar stays on **one row** at 992 / 1200 / 1440 / 1920px
- the right item is marked current on a news page, a tư-vấn page and Liên hệ,
  and no added item is marked current anywhere else
- at ten widths from 320 to 991px the field, button and cart share a row, sit in
  reading order, stay inside the viewport, leave the field wider than 60px and
  produce no horizontal overflow
- searching from the compact mobile header still reaches the results page
- the cart icon is still at least 30×28px to tap

- the request form is before the address list in the markup, its column starts
  no lower and no further right, nothing but the intro precedes it, and on a
  390px phone the form ends above the address list
- an empty submit marks name and message, focuses the first bad field and does
  not confirm; a malformed email and a 5-digit phone are each caught
- a complete request hides the form, shows a `YC……-….` code, and stores the
  same code, phone and address in `gprequests.v1`
- *Gửi yêu cầu khác* brings back an empty form with no error marks
- `/lien-he/` still prints the phone, email, address and service area from
  `data/contact.json`
- five pages at four depths link to nothing ending in `index.html`, and every
  main-menu link answers 200
- the five icon links resolve and are non-empty, `theme-color` is `#0082c6`, the
  manifest lists two icons that both resolve, and a page three levels down still
  points at `/favicon.ico`
- no JS errors anywhere in the run

`verify.mjs --all` covers the nav at all 15 widths from 320 to 1920px.

### How the 80px shorter header is compared

`verify.mjs` and `verify-pages.mjs` measure `.site-branding` — the band holding
the logo, the search form and the cart — on both sides. Below 992px its height
differs by design, so **that one number is taken out** before comparing: every
`y` below the band, and the page height, are shifted by it, and the screenshots
are aligned by it before the pixel diff. Widths, heights, computed styles and
relative positions still have to match the live site exactly. Elements inside
the band, and anything `position: fixed`, are not shifted.

The selectors whose content this clone deliberately changed are skipped outright
rather than shifted: the nav's list items (narrower gaps) at every width, and
`.site-branding`, `.top-mid-right`, `.search-form`, `#s`, `.search-submit`,
`.cart-header`, `.cart-icon` and `#masthead` below 992px.
