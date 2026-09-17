# Main menu (`#main-menu`) Specification

## Overview
- **Interaction model:** hover (desktop) / click → off-canvas (mobile)
- **Screenshot:** `docs/design-references/orig-desktop.png` (y 157–203)

## Computed styles
### `#main-menu`
`background: #0082c6` · height 46px
### `.main-menu-inner`
`display:block; width:100%; position:relative` + clearfix
### `.navbar-header.has-product-nav`
`float:left` · **`width:100%`** (an inline `<style>` overrides the theme's 76%)
### `ul#navigation > li`
`float:left; position:relative; cursor:pointer; transition:.5s`
### `ul#navigation > li > a`
`color:#fff; padding:13px 25px; display:inline-block; font-weight:600; font-size:13px;`
`text-transform:capitalize; border-right:1px solid rgba(255,255,255,.1)`
`:last-child > a { border:0 }`
### `.product-nav` (mobile category bar)
`float:left; width:24%; padding-right:10px` — but **`display:none` at every width**
(the theme ships both `@media (min-width:767px)` and `@media (max-width:767px)` rules hiding it)
`.title-pr-nav`: `height/line-height 46px; background:#fb9b0e; color:#fff; font-weight:bold;`
`text-transform:uppercase; letter-spacing:1px; padding:0 15px; cursor:pointer`
`.nav-pr-container`: `position:absolute; top:100%; left:0; width:calc(100% - 10px);`
`min-width:250px; background:#fbfbfb; z-index:100; display:none`

## States
### Nav item hover — **`ul#navigation > li:hover`**
- `background-color: transparent → rgb(220,0,0)` · `transition: .5s`
- Child `a`: `border-color → transparent`, `color` stays `#fff`

### Off-canvas menu — **click `.menu-open`** (`<768px` only)
- `.menu-responsive`: `left: -250px → 0` over **200ms** (jQuery `swing` easing)
  `position:fixed; width:250px; height:100%; background:rgba(0,0,0,.9);`
  `border-right:3px solid #1a7b1c; z-index:199999; overflow-y:auto`
- `.menu-open` hides, `.menu-close-2` shows
- `.menu-responsive-overlay` gains `.open-mn`: `0×0 → 100%×100%`, `left:-10px → 0`, `z-index:199998`
- Closes from `.menu-close`, `.menu-close-2` or the overlay (same 200ms animation back to -250px)
- Scrolled past 100px, `.menu-close-2` gains `.btn-scrolled`:
  `position:fixed; top:10px; right:0; background:rgba(0,0,0,.3)`
- `.menu-close` strip: `padding:10px; background:#19751b; color:#fff; font-size:13px; uppercase; bold`
- `.menu-responsive ul li a`: `color:rgba(255,255,255,.9); font-size:14px; font-weight:600; padding:10px`
  **hover/current:** `color:#19751b; background:#fff`

## Content (verbatim, 5 items)
GIÀN PHƠI HÒA PHÁT · GIÀN PHƠI ĐIỀU KHIỂN · GIÀN PHƠI XẾP NGANG · GIÀN PHƠI THÔNG MINH · GIÀN PHƠI THÔNG DỤNG

## Responsive
- **≤1199px:** link padding `13px 25px → 10px 15px`
- **≥768px:** `.menu-contrl` (both hamburger buttons) `display:none`
- **≤767px:** `#site-navigation` collapsed (`display:none`); nav list items become full-width `#111` blocks
