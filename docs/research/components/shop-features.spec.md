# Shop features Specification

Four things this clone adds on top of the live site. Everything else on the
site stays byte-for-byte faithful — these features were built so that the
verified pages keep verifying.

| # | Feature | Where |
|---|---------|-------|
| 1 | Cart persisted in `localStorage` | `assets/js/cart.js`, every page |
| 2 | Working cart + checkout pages | `/gio-hang/`, `/thanh-toan/` |
| 3 | The `Giàn phơi xếp ngang` category the live site 404s on | `/danh-muc/gian-phoi-xep-ngang/` |
| 4 | Redesigned quick-order modal | every single-product page |

---

## 1. Cart store (`assets/js/cart.js`)

`window.GPCart` — a small store over `localStorage`, key `gpcart.v1`.

```js
GPCart.items()                 // [{id,title,price,oldPrice,img,href,qty}]
GPCart.add(item, qty)          // merges into an existing line by id
GPCart.setQty(id, qty)         // qty <= 0 removes the line
GPCart.remove(id) / clear()
GPCart.count() / subtotal()
GPCart.on(fn)                  // called after every mutation
GPCart.fromProductPage(doc)    // scrape the current product into a cart item
GPCart.formatMoney(1500000)    // "1,500,000 ₫"  — matches WooCommerce here
```

**Storage safety.** Every read and write is wrapped in try/catch. In a private
window, or with site data blocked, the store falls back to an in-memory array so
the cart still works for that page view instead of throwing. Covered by a test
that redefines `window.localStorage` to throw.

**Entry point.** Only `button.single_add_to_cart_button` on a single-product
page adds to the cart — the product grids keep the theme's `display:none` on
their add-to-cart buttons, so the archive layouts are untouched.

**Money format.** `formatMoney` reproduces the site's own `1,500,000&nbsp;₫`
(comma thousands, non-breaking space before the symbol).

### Header mini-cart

The theme already ships `.cart-header > .cart-icon + .cart-container-list` with
an empty-cart `<li>`; `cart.js` fills it in and appends a `.mini-cart-foot` with
the total and two buttons. The hover-to-open behaviour is the theme's own CSS.

The count badge is appended to **`.cart-header`**, not `.cart-icon` — the theme
already sets `position: relative` on `.cart-header`, so the badge needs no new
positioning rule and the header's computed styles stay identical to the live
site. Anchoring it to `.cart-icon` instead costs 5 computed-style diffs for zero
visual gain.

Cross-tab: a `storage` listener re-renders the header when another tab changes
the cart.

### Toast

`GPCart.toast(message, href)` slides a confirmation up from the bottom-right for
3.6s after adding to the cart, with a "Xem giỏ hàng" link.

---

## 2. Cart page — `/gio-hang/`

Replaces the cloned page, which only ever rendered WooCommerce's empty-cart
state. Chrome (header, breadcrumbs, sidebar, footer) is the shared one.

- `#gpCartEmpty` / `#gpCartFilled` — mutually exclusive, driven by item count
- `table.gp-cart-table` — thumb, name (+ struck-through old price), unit price,
  quantity stepper, line total, remove
- Stepper: `−` / `+` buttons plus a directly editable number input, clamped to ≥1
- `#gpCartClear` asks for confirmation before emptying
- `.gp-cart-totals` — subtotal, shipping (free), total, and the checkout button
- **Mobile (≤767px):** the table collapses to cards — `thead` hidden, each row
  becomes a bordered block with the thumbnail absolutely positioned left and
  `data-label` prefixes on the price cells

## 3. Checkout page — `/thanh-toan/`

Modelled on `tretruc.com.vn/thanh-toan/`, restyled in this site's palette.

**Fields:** họ tên\*, số điện thoại\*, email, tỉnh/thành\*, quận/huyện\*, địa chỉ\*, ghi chú.
Province → ward is a cascade; the ward select stays disabled until a province is
chosen. Data is inlined as `<script type="application/json" id="gpProvinceData">`
from `data/custom.json` (12 provinces).

**Validation** runs on blur and on submit, marking `.gp-field.has-error`:

| field | rule |
|---|---|
| name | ≥ 2 characters |
| phone | `/^0\d{9}$/` after stripping spaces and dots |
| email | optional; standard shape when filled |
| province / ward | must be selected |
| address | ≥ 4 characters |

Submit focuses and scrolls to the first invalid field.

**Payment — two methods, per the brief:**

1. **COD** (default) — "Thanh toán khi nhận hàng"
2. **Chuyển khoản ngân hàng** — selecting it reveals `#gpBankDetail` with a
   placeholder QR (decorative — there is no payment backend), bank / account /
   holder / transfer-note rows, and a copy-to-clipboard button on the account
   number. It also reveals a **"Tôi đã chuyển khoản"** checkbox that must be
   ticked before the order goes through; otherwise `#gpConfirmError` shows.

The selected option gets `.is-active` (green border and tint) — set in JS rather
than relying on `:has()` alone, so it works in older browsers too.

**On success:** an order is pushed to `gporders.v1` (last 20 kept), the cart is
cleared, the form is replaced by `#gpCheckoutSuccess` with an order code of the
form `HP<yymmdd>-<4 digits>` and a line naming the payment method.

**Order summary aside** re-renders from the cart: thumbnail, name, quantity,
line total, then subtotal / shipping / total.

## 4. `Giàn phơi xếp ngang` category — `/danh-muc/gian-phoi-xep-ngang/`

The main menu links here but the live site returns **404**, so the page is
rebuilt using the same markup a WooCommerce product archive emits: breadcrumb,
`h1.page-title`, term description, result count, the ordering `<select>`, and
`.woocommerce-loop > ul.products` of the standard product cards. Card hover
behaviour therefore comes free from `theme.css`.

Eight products: the **three real** xếp-ngang products from the catalogue, plus
**five sample variants** (`demo: true` in `data/custom.json`). Each sample is a
size or finish variant of one of the three and links to that real product page;
its image is an existing xếp-ngang photo already on the site. Nothing is
fabricated beyond the variant names and prices.

The page also lights up `current-menu-item` on the main, sidebar and mobile
menus, exactly as a real category page does — so the nav tab turns red.

## 5. Quick-order modal

On the live site the modal body is the literal text `[ninja_forms id=5]` — the
plugin is gone, so no form has ever rendered. `build-pages.py` swaps that
placeholder for a real form (and adds a three-point benefits list under the
product thumbnail).

Left column (theme markup, restyled): thumbnail, title, struck-through and sale
price, benefits. Right column: họ tên\*, số điện thoại\*, địa chỉ\*, ghi chú, a
quantity stepper, a live "Tạm tính" total, the submit button, and a phone
fallback line.

Validation mirrors the checkout's name/phone/address rules. On success the form
is swapped for a confirmation with an order code; reopening the modal resets it.

### CSS specificity note

The theme paints **every** button inside `.hrm_custom_price` solid green and
full-width:

```css
.woocommerce div.product-main .hrm_custom_price button:not(.close) { … }   /* 0,4,2 */
```

That also caught the new form's stepper and submit buttons. `shop.css` matches
that specificity exactly and wins on source order — see the block at the end of
the file. Don't "simplify" those selectors; a plain `.gp-qty button` loses.

---

## Verification

`node scripts/verify-shop.mjs` — **66 checks**, covering: add to cart and
quantity handling, line merging, persistence across navigation, the header badge
and mini-cart, every cart-page control, checkout validation (empty, bad phone),
the province→ward cascade, both payment paths including the bank confirmation
gate, order codes and persistence, both empty states, the quick-order modal end
to end, the category page, and a run with `localStorage` throwing.

`scripts/verify-pages.mjs` skips `/gio-hang/` and `/thanh-toan/` — they no
longer correspond to anything on the live site. It also skips the news section
and `/lien-he/` for the same reason; see `news.spec.md`. Every other page still
verifies against the original.
