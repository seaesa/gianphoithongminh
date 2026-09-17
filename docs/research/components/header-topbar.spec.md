# Top bar (`.top-header`) Specification

## Overview
- **Rendered by:** `scripts/build.py` → `header .top-header`
- **Screenshot:** `docs/design-references/orig-desktop.png` (y 0–35)
- **Interaction model:** static + hover

## Computed styles (getComputedStyle @1440px)
### `.top-header`
`padding: 5px 0` · `background: #0082c6` · `height: 35px` · `color: #fff`
### `.top-left` / `.top-right`
`float: left|right` · `width: 50%` · `.top-right { text-align: right }`
### `.social-media li a`
`display:block` · `25×25` · `margin:0 1px` · `background:#fff` · `border:1px solid #fff`
`line-height:25px` · `border-radius:100%` · `color:#fcb040` · `transition:.5s`
**Hover:** `opacity: .6`
### `.link-acc`
`float:right` · `margin-right:50px` · `line-height:25px` · **`display:none`**
(hidden by an inline `<style>` on the live page — kept in `overrides.css`)
### `.top-nav li a`
`display:block` · `padding-left:10px` · `color:#fff` · `transition:.5s`; `<b>` is `font-weight:700`

## Content (verbatim)
- Social: Facebook → `https://www.facebook.com/gianphoithongminhanhduong/`
- Hidden account link: "Đăng nhập - Đăng ký"
- Item 1: icon `fa-phone`, "Hotline:" + **0979 680 195 – 0888 900 986**
- Item 2: icon `fa-envelope-o`, **thegioigianphoi.vn@gmail.com**

## Responsive
- **≤767px:** `.top-left`/`.top-right` → `float:none; width:100%; text-align:center; margin-top:5px`;
  `.link-acc` → `float:none; margin:0; display:block; width:100%` (still `display:none` overall)
