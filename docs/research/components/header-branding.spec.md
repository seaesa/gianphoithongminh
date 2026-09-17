# Branding row (`.site-branding`) Specification

## Overview
- **Interaction model:** hover (cart dropdown)
- **Screenshot:** `docs/design-references/orig-desktop.png` (y 35–157)

## Computed styles
### `.site-branding` / `.site-branding .row`
`.container` 1170px @≥1200 · row `padding: 20px 0 15px`
### `.logo`
`float:left` · `width:35%` · `min-height:80px`
`.logo > .site-title > a { zoom: 0.6 }` → the 200×143 PNG renders at **120×86**
`.seo-title` carries an inline `display:block!important; overflow:hidden; font-size:1px;`
`text-indent:-9999px; height:1px; width:1px; line-height:1` (screen-reader only)
### `.top-mid-right`
`float:left` · `width:65%` · `padding-top:13px`
### `.search-form`
`width:450px; max-width:100%; float:left`
`#s` — `display:inline-block; width:300px; max-width:80%; height:36px; padding:5px 10px;`
`background:#fff; color:#4e5256; border:1px solid #1a7b1c`
`.search-submit` — `background:#0082c6; border:1px solid #0082c6; color:#fff; font-size:12px;`
`font-weight:bold; padding:0 4px; height:36px; margin-left:-4px; margin-top:1px`
### `.cart-header`
`float:right; position:relative; padding:1px; border:1px solid #fcb040`
`.cart-icon` — `padding:5px 10px; background:#1a7b1c; color:#fff; display:block; text-align:center`

## States
### Cart dropdown — hover on `.cart-header`
- **Before:** `.cart-container-list` `position:absolute; top:95%; right:0; width:300px;`
  `height:0; overflow:hidden; transform:scale(0); transform-origin:top right`
- **After:** `height:auto; background:#fff; color:#333; padding:10px; z-index:999;`
  `transform:scale(1); box-shadow:1px 1px 3px #ccc`
- **Transition:** `all ease 0.3s`

## Content
- Logo: `assets/uploads/2017/12/logo-hoa-phat-01-1.png` (200×143)
- Search placeholder: "Nhập từ khoá tìm kiếm..."
- Empty cart text: "Chưa có sản phẩm trong giỏ hàng."

## Responsive
- **≤767px:** `.logo`, `.top-mid-right` → `float:none; width:100%; text-align:center`;
  `.top-mid-right` loses its top padding; `.logo` gains `margin-bottom:10px`; logo img centred
- **≤500px:** `#s` gains `margin-bottom:10px`, so the submit button wraps to its own line
