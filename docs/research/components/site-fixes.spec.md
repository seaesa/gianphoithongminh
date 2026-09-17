# Site chrome fixes Specification

Three pieces of the header and footer that the clone had to *fix* rather than
reproduce, because what the live site does there depends on a server or a
third-party SDK that this clone does not load.

| # | What was broken | Where |
|---|---|---|
| 1 | The cart icon went nowhere | `.cart-header .cart-icon`, every page |
| 2 | The footer Facebook box was empty | `.fb-page-placeholder`, every page |
| 3 | The search box did nothing | `.search-form` + `/tim-kiem/` |

Styling for all three is in `assets/css/site.css`, which is hand-written and so
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

---

## Verification — `scripts/verify-site.mjs`

**46 checks**:

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
- no JS errors anywhere in the run
