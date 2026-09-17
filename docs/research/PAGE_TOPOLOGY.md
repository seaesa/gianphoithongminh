# thegioigianphoi.vn — Page Topology (homepage)

> This file maps the **homepage**. For the other 171 pages see
> `SITE_MAP.md` (what exists) and `components/inner-templates.spec.md`
> (how each of the five inner templates is built).

Platform: WordPress 4.7.29 + WooCommerce 2.6.14, theme `hrm`, Bootstrap 3.3.6 grid,
Font Awesome 4.7, Owl Carousel 2. No custom fonts — body font is the Bootstrap 3
system stack `"Helvetica Neue", Helvetica, Arial, sans-serif`, 14px / 20px, `#333`.

Container widths (Bootstrap 3): 750 / 970 / 1170 at ≥768 / ≥992 / ≥1200.

## Order of sections (DOM order)

| # | Section | Selector | Notes |
|---|---------|----------|-------|
| 0 | Off-canvas mobile menu + overlay | `.menu-responsive`, `.menu-responsive-overlay` | fixed, `left:-250px` until opened |
| 1 | Top bar | `header .top-header` | bg `#0082c6`, 35px tall |
| 2 | Branding | `.site-branding` | logo (`zoom:.6`), search form, cart |
| 3 | Main menu | `#main-menu` | bg `#0082c6`, 46px; `.product-nav` mobile-only |
| 4 | Content | `#content.sidebar-left` | `.row`: `#primary.col-md-9` (float right) + `#secondary.col-md-3` |
| 4a | Slider | `.home-slider-block` | Owl carousel, 1 slide → nav/dots get `.disabled` |
| 4b | Feature strip | `.opt-content-top` | 3 × `.list-opt-content-top`, green 1px border |
| 4c | Product widget ×4 | `.widget.hrm_tab_product` | see below |
| 4d | Static promo block | `#text-2 .block-static-inner` | banner + `.content` + `.trending` badge |
| 4e | Home news (empty) | `.home-news` | renders empty, kept for spacing |
| 4f | Sidebar | `#secondary` | 4 widgets, see below |
| 5 | Upper footer | `.upper-footer.hidden-mobile` | 3 × `.ft-icon-block` |
| 6 | Footer | `footer#colophon` | `.footer-support` → `.footer-top` → `.footer-bottom` |
| 7 | Floating | `#topcontrol`, `.hotline-phone-ring-wrap`, Zalo link | fixed overlays |

## Product widgets (`.widget.hrm_tab_product`)

| id | Heading (`.title-tab-wg > span`) | Tabs | Products per pane | Grid |
|----|------|------|-------------------|------|
| `hrm_tab_products-4` | GIÀN PHƠI HÒA PHÁT | 1 | 15 | `columns-5` (`col-md-20` = 20%) |
| `hrm_tab_products-2` | GIÀN PHƠI THÔNG DỤNG | 3 (3rd label empty — faithful) | 8 / 6 / 8 | `columns-4` (`col-sm-3`) |
| `hrm_tab_products-3` | GIÀN PHƠI BÁN CHẠY 2019 | 3 | 8 / 2 / 1 | `columns-4` |
| `hrm_tab_products-5` | SẢN PHẨM LƯỚI AN TOÀN, BẠT TỰ CUỐN | 1 | 4 | `columns-4` |

## Sidebar widgets (`#secondary`)

1. `#nav_menu-4` — "Danh mục sản phẩm", 5 category links
2. `#text-8` — "GIÀN PHƠI HÒA PHÁT": 3 trust points, phone `0888.900.986`, 3 contact links
3. `#woocommerce_products-3` — "Sản phẩm mới", 5 items with thumb + del/ins price
4. `#hrm-recent-posts-widget-2` — "Tin tức mới", 10 posts with thumb + title

## Footer

- `.footer-support` (bg `#0082c6`): newsletter title (col-md-8) + 4 social icon circles (col-md-4)
- `.footer-top`: contact widget (col-md-4) + DMCA badge; right side col-md-8 with
  `#footer-sidebar-2` (**`display:none`** via inline override), `#footer-sidebar-3`
  ("Hỗ Trợ Khách Hàng", 9 links), `#footer-sidebar-4` (SEO link row + FB page embed)
- `.footer-bottom`: `.site-info` — empty on this page

## Layering / z-index

`.menu-responsive` 199999 · `.menu-close-2.btn-scrolled` 199999 · `.menu-responsive-overlay` 199998
· `.hotline-phone-ring-wrap` 999999 · `.cart-container-list:hover` 999 · `.nav-pr-container` 100
· `#topcontrol` 99 · `#floating-phone` 99 (mobile ≤650px only)
