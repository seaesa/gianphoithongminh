# Floating widgets Specification

## Overview
- **Interaction model:** scroll-driven (`#topcontrol`) + always-on CSS animation (hotline ring)
- **Targets:** `#topcontrol`, `.hotline-phone-ring-wrap`, `.zalo-float`

## `#topcontrol`
`position:fixed; right:10px; bottom:-100px; 40×40; background:#1a7b1c; color:#fff;`
`border:1px solid #fff; line-height:38px; text-align:center; font-size:22px;`
`z-index:99; cursor:pointer; border-radius:0; transition: all, 0.7s, ease-in-out`

| trigger | before | after |
|---------|--------|-------|
| `window.scroll` past **100px** | `bottom: -100px` | `bottom: 45px` |
| hover | `background: #1a7b1c` | `background: #e60f1e` |
| click | — | animates `scrollTop` → 0 over **800ms**, jQuery `swing` easing |

The same scroll threshold also toggles `.btn-scrolled` on `.menu-close-2`.

## `.hotline-phone-ring-wrap`
`position:fixed; left:0; bottom:0; z-index:999999`; the ring itself is 110×110.

| layer | box | style | animation |
|-------|-----|-------|-----------|
| `.hotline-phone-ring-circle` | 100×100 @ `top:2px; left:1px` | `border:2px solid red; border-radius:100%; opacity:.5` | `phonering-alo-circle-anim 1.2s infinite ease-in-out` |
| `.hotline-phone-ring-circle-fill` | 75×75 @ `top/left:14px` | `background:rgba(255,0,0,.7); border-radius:100%` | `phonering-alo-circle-fill-anim 2.3s infinite ease-in-out` |
| `.hotline-phone-ring-img-circle` | 50×50 @ `top/left:27px` | `background:red; border-radius:100%; display:flex; align-items/justify-content:center` | `phonering-alo-circle-img-anim 1s infinite ease-in-out` (handset wiggle) |

Contains `a.pps-btn-img.locationus` → `tel:0979680195` with a 50×50 `icon-call.png`.

## Zalo button
The live page uses a bare `<a>` with an inline
`position:fixed; z-index:14; left:18px; bottom:110px`, holding an empty `<img src="">`
(a broken 0×0 placeholder) and `images/zzd.png` (50×50). Reproduced as `.zalo-float`
in `overrides.css`.

## `#floating-phone`
The theme ships CSS for a `≤650px` bottom bar
(`360×48`, `background:#111 url(anh-bia-mau-den-1-300x74.jpg) center / 330px no-repeat`),
but **the element is never rendered** on the live page — confirmed by querying the live
DOM. The CSS is kept in `overrides.css`; no element is emitted.
