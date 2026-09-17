# Behaviour bible — thegioigianphoi.vn

Every interaction found on the live homepage, with its exact trigger, before/after
state and timing. Sources: the theme's `hrm-custom.js`, Bootstrap 3.3.6 (tabs +
collapse), Owl Carousel 2, plus the CSS hover rules in `style.css`.

All of these are re-implemented in `assets/js/main.js` (vanilla) and verified
against the live site by `scripts/verify-interactions.mjs` — **37/37 match**.

---

## Interaction model per section

| Section | Model |
|---------|-------|
| Top bar | static + hover |
| Branding (search, cart) | hover (cart dropdown) |
| Main menu | hover (desktop) / click (mobile off-canvas) |
| Slider | time-driven (autoplay) |
| Feature strip | static |
| Product widgets | **click**-driven tabs (not scroll-driven) + card hover |
| Sidebar / footer | hover only |
| Back-to-top | scroll-driven visibility + click |
| Hotline ring / Zalo | time-driven CSS animation |

There is **no** scroll-triggered header, no sticky nav, no scroll-snap, no
IntersectionObserver, no reveal-on-scroll and no smooth-scroll library on this
page. The only scroll listener sets the back-to-top button's position.

---

## 1. Header nav hover

- **Trigger:** `mouseenter` on `ul#navigation > li`
- **Before:** `background-color: rgba(0,0,0,0)` (blue bar shows through), link
  `border-right: 1px solid rgba(255,255,255,0.1)`
- **After:** `background-color: rgb(220,0,0)`; link `border-color: transparent`,
  `color: #fff`
- **Transition:** `0.5s` on the `li` — pure CSS, no JS
- Last item has no right border (`ul#navigation > li:last-child > a {border:0}`)

## 2. Cart dropdown

- **Trigger:** `:hover` on `.cart-header`
- **Before:** `.cart-container-list` `height:0; transform: scale(0); overflow:hidden`,
  `transform-origin: top right`
- **After:** `height:auto; transform: scale(1); background:#fff; color:#333;
  padding:10px; z-index:999; box-shadow: 1px 1px 3px #ccc`
- **Transition:** `all ease 0.3s`
- Panel is 300px wide, anchored `top:95%; right:0`

## 3. Search button / cart icon / top-bar social

| Element | Before | After | Transition |
|---------|--------|-------|------------|
| `.search-submit` | `bg #0082c6`, `#fff` | unchanged (no hover rule) | `0.5s` declared |
| `.cart-icon` | `bg #1a7b1c` | unchanged | `0.5s` declared |
| `.top-header .social-media li a` | `opacity 1`, `bg #fff`, `color #fcb040` | `opacity 0.6` | `0.5s` |

## 4. Product card hover

- **Trigger:** `:hover` on `.product-loop-inner`
- `.product-loop-inner` border: `1px solid #eaeaea` → `3px solid #1a7b1c`
  (`transition: all ease 0.3s`) — note this shifts the card content by 2px, which
  is what the original does too
- `.thumb-outter > a img`: `scale(1)` → `scale(1.1)`, `transition: all .5s`
- `.link-to-product`: `bottom:-50px; margin-bottom:-50px; background rgba(0,0,0,.4)`
  → `bottom:0; margin-bottom:0; background rgba(4,58,5,.54)`, `transition: all .45s ease`
- The overlay's `a.link_a` carries `images/add-cart.png` as a left background icon

## 5. Product tabs (Bootstrap 3 `data-toggle="tab"`)

- **Trigger:** `click` on `.title-tab-wg .nav-tabs > li > a`
- Tab strip: `.active` moves immediately (the `<li>`s have no `.fade`)
- Panes follow Bootstrap's `activate()` sequence:
  1. outgoing pane loses `in` → fades out (`.fade {transition: opacity .15s linear}`)
  2. after **150ms**: outgoing loses `active` (`display:none`), incoming gains
     `active`, a forced reflow runs, then incoming gains `in` → fades in
- Tab `<a>` hover/active: `background: transparent` → `#fcb040`, `color: #666` → `#fff`
- `ul.nav-tabs` has `border-bottom: 3px solid #fcb040`
- **Mobile (≤767px): the whole tab strip is `display:none`** — only the heading pill shows

## 6. Home slider (Owl Carousel 2)

```
items: 1, loop: true, autoplay: true, autoplayTimeout: 9000,
autoplayHoverPause: true, smartSpeed: 450, dots: true, nav: true,
navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>']
```

- Owl wraps the slides in `.owl-stage-outer > .owl-stage > .owl-item`, adds
  `owl-loaded owl-drag` to the container and clones two slides on each side.
  With the single slide on this page that yields **5 `.owl-item`s (4 cloned)**.
- With only one real slide Owl marks `.owl-nav` and `.owl-dots` as `.disabled`,
  so neither is visible.
- `.owl-prev/.owl-next`: 40×40, `rgba(0,0,0,.3)`, centred vertically, `transition .3s ease-in-out`
- `.owl-dot`: 12×12, `#fcb040`, bottom 10px

## 7. Back-to-top (`#topcontrol`)

- **Trigger:** `window.scroll`, threshold `scrollTop > 100`
- `bottom: -100px` → `bottom: 45px`, `transition: all, 0.7s, ease-in-out`
- Hover: `background #1a7b1c` → `#e60f1e`
- Click: animates `scrollTop` to 0 over **800ms** with jQuery's `swing` easing
  (`0.5 - cos(p·π)/2`)

## 8. Mobile off-canvas menu

- **Trigger:** click `.menu-open` (the hamburger, visible only `<768px`)
- `.menu-responsive` animates `left: -250px → 0` over **200ms**
- `.menu-open` hides, `.menu-close-2` shows
- `.menu-responsive-overlay` gains `.open-mn`: `0×0` → `100%×100%`, `left:-10px → 0`
- **Closes** on: `.menu-close` (the green header strip), `.menu-close-2`, or the overlay —
  each animating `left` back to `-250px` over 200ms
- While scrolled past 100px, `.menu-close-2` also gains `.btn-scrolled`
  (`position:fixed; top:10px; right:0; background rgba(0,0,0,.3)`)
- `#site-navigation` is `display:none` below 768px — the off-canvas panel is the mobile nav

## 9. Category dropdown in the blue bar (`.product-nav`)

`.title-pr-nav` click toggles `.nav-pr-container` with a 600ms slide, and on
desktop hovering `.product-nav` slides it down. **However `.product-nav` is
`display:none` at every width** — the theme ships both a `min-width:767px` and a
`max-width:767px` rule hiding it — so this never appears. The markup, CSS and JS
are reproduced faithfully anyway.

## 10. Widget sub-menu toggles

`hrm-custom.js` injects a `<span class="sub-open">` after every
`.widget_nav_menu .menu-item-has-children > a` and toggles the sub-menu with a
600ms slide plus a `.sub-opend` class. No menu on this page has children, so
nothing renders — reproduced for parity.

## 11. Always-on animations

- `.hotline-phone-ring-circle` — `phonering-alo-circle-anim 1.2s infinite ease-in-out`
- `.hotline-phone-ring-circle-fill` — `phonering-alo-circle-fill-anim 2.3s infinite ease-in-out`
- `.hotline-phone-ring-img-circle` — `phonering-alo-circle-img-anim 1s infinite ease-in-out` (handset wiggle)

---

## Responsive behaviour

| Breakpoint | What changes |
|------------|--------------|
| `≥1200px` | `.container` 1170px |
| `≤1199px` | `ul#navigation > li > a` padding `13px 25px` → `10px 15px` |
| `≥992px` | `.col-md-20` = 20% (5-up product grid) |
| `≤991px` | `.container` goes full-width; `#primary`/`#secondary` stack (both `clear:both`); `.hidden-mobile` (upper footer) hidden; `.title-pr-nav` 12px / no letter-spacing; footer columns re-flow |
| `≥768px` | `.menu-contrl` (hamburger) hidden |
| `≤767px` | Product **tabs hidden**; top bar stacks and centres; logo + search stack full-width and centre; mobile nav list becomes `#111` blocks; product grid → 2 columns |
| `≤650px` | `#floating-phone` would show — but the element is never rendered on the live page |
| `≤500px` | search input gains `margin-bottom:10px` (button wraps below); `.nav-tabs > li` full width |

Verified at **15 widths** (320 – 1920) in `scripts/verify.mjs --all`: 0 layout
diffs, 0 behaviour diffs, identical page heights at every width.

---

# Behaviours added by the inner templates

The homepage uses the behaviours above. The other 171 pages add these; all of
them live in the same `assets/js/main.js` and are described in full in
`components/inner-templates.spec.md`.

## 12. WooCommerce product tabs (`single-product` pages)

- **Trigger:** `click` on `.wc-tabs li a, ul.tabs li a`
- On init WooCommerce hides **every** `.wc-tab` / `.panel` in the wrapper, then
  clicks the first tab — or the reviews tab when `location.hash` is `#reviews`,
  `#tab-reviews` or starts with `comment-`.
- On click: clear `.active` from every `li`, hide every panel, add `.active` to
  the clicked `li`, show the panel its `href` points at.
- Skipping this leaves both panels visible and the page ~179px too tall.

## 13. Thumbnail carousel (`.single-product-images .thumbnails`)

```
nav:true, autoplay:true, autoplayTimeout:3000, autoplayHoverPause:true,
responsive:{0:1, 500:3, 800:4, 1200:5},
navText:['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>']
```

Owl adds `owl-carousel` to the container as part of init. That class is what
`.owl-carousel .owl-item { float: left }` hangs off — without it the thumbnails
stack vertically and the gallery grows by ~199px.

## 14. Quantity stepper (`woo_quantily`)

`.quantity-plus` / `.quantity-minus` add or subtract the input's `step`, clamp to
`min`/`max` (and to 0 when there is no `min`), then dispatch `change`.

## 15. Quick-order modal (Bootstrap 3 data API)

- **Open:** click `[data-toggle="modal"]` → `.modal` gets `display:block` then
  `.in`, a `.modal-backdrop.fade.in` is appended, `body` gets `.modal-open`
- **Close:** `[data-dismiss="modal"]`, a backdrop click, or Escape
- `.btn-dathang` also copies `.us_name` / `.us_phone` / `.us_email` /
  `.us_address` into the hidden `input.ord_*` fields before submitting.

## 16. Add-to-cart button width

`hrm-custom.js` measures `.hrm_custom_price .button.btn-dathang` and applies that
width to `button.single_add_to_cart_button`, so the two buttons line up.

## 17. Gallery lightbox (prettyPhoto)

`a.zoom[data-rel^="prettyPhoto"]` opens the full-size image over the page;
click anywhere or press Escape to close.

## 18. Server-randomised blocks — not behaviours, but worth knowing

`.related-post` (post pages) and `.related.products` (product pages) return a
**different random selection on every request**. The clone holds one snapshot.
`scripts/verify-pages.mjs` hides both on each side before comparing and checks
only that the item counts match.
