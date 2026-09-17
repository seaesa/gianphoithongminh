# Product tab widget (`.widget.hrm_tab_product`) Specification

## Overview
- **Interaction model:** **click-driven tabs** (Bootstrap 3 `data-toggle="tab"`).
  Determined by scrolling the section first — nothing changes on scroll, so this is
  *not* scroll-driven and needs no IntersectionObserver.
- **Screenshot:** `docs/design-references/orig-desktop.png` (y 620–3280)

| id | heading | tabs | products per pane | grid |
|----|---------|------|-------------------|------|
| `hrm_tab_products-4` | GIÀN PHƠI HÒA PHÁT | 1 | 15 | `columns-5` (`col-md-20` = 20%) |
| `hrm_tab_products-2` | GIÀN PHƠI THÔNG DỤNG | 3 (3rd label is empty on the live site — reproduced) | 8 / 6 / 8 | `columns-4` (`col-sm-3`) |
| `hrm_tab_products-3` | GIÀN PHƠI BÁN CHẠY 2019 | 3 | 8 / 2 / 1 | `columns-4` |
| `hrm_tab_products-5` | SẢN PHẨM LƯỚI AN TOÀN, BẠT TỰ CUỐN | 1 | 4 | `columns-4` |

## DOM
```
.widget.hrm_tab_product
  .tab-product-wgh.tab_product_select.clearfix.woocommerce
    .tab-content.has_title
      .title-tab-wg               > span (heading pill) + ul.nav.nav-tabs
      .tab-pane.fade.in[.active]  > .product-tab.clearfix
        .title-section
        .list-product-outer.products > .list-product-content > .list-product > .row
          .item-product.<grid> > li.product > .product-loop-inner
            .thumb-outter    > a.woocommerce-LoopProduct-link (span.onsale + img)
                             + .link-to-product > a.link_a
            .pr-loop-footer  > a>h3 + span.price(del/ins) + a.button.add_to_cart_button
```
`.pr-loop-footer` is a **sibling** of `.thumb-outter`, not a child — getting this wrong
inflates the card by ~95px and insets the footer by 2px.

Products with no price emit **no** `.price` element at all (an empty one adds 41px).

## Computed styles
### `.title-tab-wg`
`font-size:13px; text-transform:uppercase; font-weight:bold; margin:0 0 5px; position:relative`
`:before` — full-width `border-top:1px solid #1a7b1c` at `top:18px`
`span` — `background:#0082c6; color:#fff; padding:9px 9px 8px; display:inline-block`
`span:after` — arrow: `border-left:15px solid #0082c6; border-top/bottom:18px solid transparent; right:-15px; top:0`
### `ul.nav.nav-tabs`
`margin:0; border-bottom:3px solid #fcb040`
`.has_title ul.nav-tabs` — `float:right; background:#fff; text-align:right; border:0; padding:0`
`li > a` — `padding:10px 25px; font-weight:600; border-radius:0; background:url(images/linav.png) no-repeat right center`
`.has_title li a` — `padding:7px 10px 4px; color:#666; text-transform:capitalize; background:transparent`
`li:last-child a` — no separator image / no border
**active + hover** — `background:#fcb040; color:#fff; border:0; margin:0`
### `.product-loop-inner`
`margin:0 10px 1px; border:1px solid #eaeaea; overflow:hidden; transition:all ease .3s`
### `.thumb-outter`
`padding:2px 2px 0; position:relative; overflow:hidden`
`> a img` — `width:100%; display:block; margin:0 auto; transform:scale(1);`
`transition:all .5s; transform-style:preserve-3d`
### `span.onsale`
`position:absolute; top:0; right:0; left:auto; background:#009688; color:#fff; padding:2px;`
`z-index:3; font-family:'Roboto Condensed',sans-serif; font-weight:300; font-size:8px;`
`line-height:1.3; text-transform:uppercase; border-radius:0`
`span` — `font-size:13px; display:block; margin-top:5px; font-weight:bold; color:#fff`
`:before` — notch: `top:99%; left:0; border-top:10px solid #009688;`
`border-left/right:23px solid transparent`
### `.link-to-product`
`position:absolute; left:0; right:0; bottom:-50px; margin-bottom:-50px; width:100%;`
`background:rgba(0,0,0,.4); color:#fff; text-align:center; line-height:50px; transition:all .45s ease`
`a.link_a` — `background:url(images/add-cart.png) no-repeat left center; padding-left:40px;`
`height/line-height:32px; color:#fff; display:inline-block; vertical-align:middle; border:0`
### `.pr-loop-footer`
`padding:10px; background:#fafafa` · `h3` `font-size:17px / line-height:23.8px` · `.price` `font-size:20px`
`a.button.add_to_cart_button` — `background:#e60f1e; color:#fff; padding:8.652px 14px;`
`font-weight:700; line-height:14px; position:relative` — but **`display:none`** in this grid
(matches the live site; the button only shows on shop/archive pages)

## States
### Card hover (`.product-loop-inner:hover`)
| property | before | after |
|----------|--------|-------|
| border | `1px solid #eaeaea` | `3px solid #1a7b1c` |
| `.thumb-outter > a img` transform | `scale(1)` | `scale(1.1)` |
| `.link-to-product` bottom / margin-bottom | `-50px` / `-50px` | `0` / `0` |
| `.link-to-product` background | `rgba(0,0,0,.4)` | `rgba(4,58,5,.54)` |

Transitions: card `all ease .3s` · image `all .5s` · overlay `all .45s ease`.

### Tab switch (click) — Bootstrap 3 `activate()`
1. The `<li>` strip switches `.active` immediately (no `.fade` on list items).
2. The outgoing pane drops `in` → opacity fades to 0 over `.15s linear`.
3. After **150ms**: outgoing drops `active` (`display:none`); incoming gains `active`,
   a forced reflow runs, then incoming gains `in` → fades in.

## Responsive
- **≥992px:** `.col-md-20 { width: 20% }` → the 5-up grid for `hrm_tab_products-4`
- **≤767px:** `.has_title ul.nav.nav-tabs { display: none }` — the **whole tab strip
  disappears**, leaving only the heading pill; `.list-product-content .item-product
  { width: 50% }` → 2-up grid, with the `columns-3/4/5` nth-child clear rules re-mapped to `2n`
- **≤500px:** `.nav-tabs > li { float: none; width: 100%; clear: both }`
