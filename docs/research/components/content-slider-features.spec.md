# Slider + feature strip Specification

## Overview
- **Interaction model:** time-driven (autoplay) / static
- **Target:** `.home-slider-block`, `.opt-content-top`

## Slider — Owl Carousel 2
Options (from `hrm-custom.js`):
`items:1, loop:true, autoplay:true, autoplayTimeout:9000, autoplayHoverPause:true,`
`smartSpeed:450, dots:true, nav:true,`
`navText:['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>']`

Generated DOM: `.home-slider.owl-carousel.owl-theme.owl-loaded.owl-drag`
→ `.owl-stage-outer > .owl-stage > .owl-item` (2 clones + 1 real + 2 clones = **5**)
→ `.owl-nav.disabled` and `.owl-dots.disabled` (only one real slide)

Styles: `.owl-stage-outer { overflow:hidden }`, `.owl-item img { display:block; margin:0 auto; width:100% }`
**`height: auto`** — a late inline `<style>` overrides the earlier `height:250px`.
`.owl-nav .owl-prev/.owl-next`: `40×40; background:rgba(0,0,0,.3); color:#fff; line-height:40px;`
`position:absolute; top:50%; margin-top:-20px; z-index:10; transition:.3s ease-in-out`
`.owl-dots`: `position:absolute; bottom:10px; width:100%; text-align:center`
`.owl-dot`: `12×12; background:#fcb040; margin:0 2px; display:inline-block`

Slide: `banner4_zps1870ab77.jpg` (alt "Test")

## Feature strip (`.opt-content-top`)
`float:left; width:100%; margin:20px 0; border:1px solid #1a7b1c; padding:12px`
Each `.list-opt-content-top` is `col-xs-12 col-md-4`:
- `p`: `float:left; width:44px; text-align:center; padding:7px 0; border-radius:50%; border:4px solid transparent`
- `p i`: `font-size:20px; color:#fff`
- `.text-list-opt`: `float:left; width:75%; padding-left:10px; margin-top:5px`
- `h6`: `font-size:12px; font-weight:bold; margin:0; color:#1a7b1c`
- `span`: `font-size:11px; color:#1a7b1c`

Items (verbatim):
- `free_ship_textarea` / `fa-usd` — **Khảo sát tại nhà miễn phí** / Đơn hàng tại Hà Nội, TPHCM
- `thutien_textarea` / `fa-calculator` — **THANH TOÁN** / Lắp đặt xong mới thanh toán
- `doitrahang_textarea` / `fa-gift` — **KHUYẾN MẠI HẤP DẪN** / Giảm 10%, tặng bảo hành vàng

## Responsive
- **≤991px:** the three columns stack (`col-md-4` only applies ≥992px)
