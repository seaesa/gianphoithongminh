# Sidebar (`#secondary`) Specification

## Overview
- `aside#secondary.widget-area.col-md-3` — 292.5px wide at 1440px, rendered on the
  **left** because `#content` carries `.sidebar-left` and `#primary` is `float:right`
- **Interaction model:** hover only
- **Screenshot:** `docs/design-references/orig-desktop.png` (left column)

## Widgets, in order
1. **`#nav_menu-4` — "Danh mục sản phẩm"** — 5 category links
   `ul.menu > li > a` hover: colour/background shift defined in `theme.css`
2. **`#text-8` — "GIÀN PHƠI HÒA PHÁT"**
   - `.cont-info-service p` × 3: `fa-thumbs-o-up` "Có tem bảo hành chất lượng",
     `fa-refresh` "Sản phẩm chính hãng", `fa-heart` "Dịch vụ khách hàng tốt nhất"
   - `.list-number-info-service`: `fa-phone` + **0888.900.986** + "( Đặt hàng qua điện thoại )"
   - `.sp-list` × 3: `.support-online-skype` "Đặt hàng:", `.support-online-fb`
     "Qua Facebook", `.support-online` "Gửi Email"
3. **`#woocommerce_products-3` — "Sản phẩm mới"** — 5 products, 180×180 thumbs,
   `del`/`ins` pricing with `.woocommerce-Price-currencySymbol` (₫), `&nbsp;` before the symbol
4. **`#hrm-recent-posts-widget-2` — "Tin tức mới"** — 10 `article.hrm-recent-post`,
   each `a.hrm-thumb > img` + `.hrm-text > a.hrm-title` + empty `.date-detail`

## Structure note that affects layout
Every widget is `.widget > .widget-top > h3.widget-title` followed by its body.
`.widget-top` is **`display:inline-block`**, so whitespace between it and the next block
element creates a 20px anonymous line box. The generator keeps them on separate source
lines to reproduce that spacing — collapsing them shortens the widget by 20px.

## Responsive
- **≤991px:** `#secondary` and `#primary` both get `clear:both` and stack full width;
  `.sidebar-left .content-area { float:none }`; `#primary` gains `margin-bottom:20px`
