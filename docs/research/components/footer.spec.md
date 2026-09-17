# Upper footer + footer Specification

## Overview
- **Interaction model:** hover only
- **Targets:** `.upper-footer.hidden-mobile`, `footer#colophon`
- **Screenshot:** `docs/design-references/orig-desktop.png` (y 3520–4145)

## Upper footer — 3 × `.ft-icon-block` (`col-md-4 col-xs-12`)
Structure: `.hover-border > .media.well.hover-border-inner > a >
(.pull-left.icon-logo.fa.<icon> + .title-body > h3.title-icon + p.des-icon)`

- `fa-truck` — **TƯ VẤN - Lắp đặt**: "+ Tư vấn, lắp đặt miễn phí tại nhà 24/24 không ngại xa"
- `fa-money` — **Thanh toán linh động**: "+ Khách hàng nhiệm thu xong mới thanh toán" /
  "+ Thanh toán trực tiếp tại nhà khách hàng"
- `fa-refresh` — **Bảo hành - Bảo trì**: "+ Bảo hành tại nhà lên đến 2 năm" /
  "+ Bảo trì định kỳ theo tháng miễn phí"

## `.footer-support` (background `#0082c6`)
- `.received-mail.col-md-8` → `#text-7`, title "Đăng ký nhận thông tin miễn phí từ
  Website của chúng tôi". `.widget-title` uses `images/newsletter.png` as a left
  background with `padding-left:55px`, `font-size:13px`, `line-height:28px`,
  `text-align:center`, `margin-right:10px`. `.textwidget` is empty but must stay on its
  own source line (see the `.widget-top` whitespace note in `sidebar.spec.md`).
- `.fut-col.col-md-4` → `#social_links-widget-2 > .hrm-social-networks.boxed-icons`,
  4 anchors each carrying an **inline style**
  `border-radius:50%; padding:0; font-size:16px; color:#fff; background-color:<brand>; border-color:<brand>`:

  | class | title | colour |
  |-------|-------|--------|
  | `.hrm-facebook` | Facebook | `#3b5998` |
  | `.hrm-google-plus` | Google-plus | `#dd4b39` |
  | `.hrm-skype` | Skype | `#00aff0` |
  | `.hrm-youtube` | Youtube | `#bb0000` |

  `.social_links .hrm-social-network-icon` sizes them `35×35`, `line-height:35px`,
  `display:inline-block`, `text-align:center`, `margin:0 3px 10px 0`
  **Hover:** `background:#fcb040 !important`

## `.footer-top`
### `.footer-widget-section-left.col-md-4`
`#hrm-contact-widget-3` — title "GIÀN PHƠI HÒA PHÁT", then `#address-box > #address-list`
with three `.info-item`s (`i.fa` + `.tit-contain`, lines joined by `<br>`):

- `fa-home` — HỆ THỐNG CỬA HÀNG GIÀN PHƠI HÒA PHÁT / + CƠ SỞ 1 HN: Ngõ 68A - Đỗ Đức Dục - Từ Liêm /
  + CƠ SỞ 2 HN: 146 Mễ Trì Thượng - Từ Liêm / + CƠ SỞ 1 HCM: 20 - Đường 2 - Trường Thọ - Thủ Đức /
  + CƠ SỞ 2 TPHCM: 458/26 - Huỳnh Tấn Phát - HCM
- `fa-phone` — HOTLINE TƯ VẤN MIỄN PHÍ / + CƠ SỞ HN: 0926 46 36 36 - 0979 680 195 /
  + CƠ SỞ HCM: 0888 900 986 - 0978 241 689
- `fa-envelope` — thegioigianphoi.vn@gmail.com

Then `#text-10` — "Bản quyền được bảo vệ bởi" + the DMCA badge (100×50).

### `.footer-widget-section-right.col-md-8`
- `#footer-sidebar-2` — **`display:none`** via the page's inline override (kept, empty)
- `#footer-sidebar-3` — `#nav_menu-6` "Hỗ Trợ Khách Hàng", 9 links:
  Hướng dẫn mua hàng · Hướng dẫn thanh toán · Câu hỏi thường gặp · Phàn nàn, khiếu nại ·
  Chính sách trả hàng · Chính sách hậu mãi · Hợp tác với chúng tôi · Trang chủ · Chính sách hậu mãi
- `#footer-sidebar-4` — `#text-6`: a pipe-separated SEO link row (Dây cáp cầu thang |
  Cáp tăng đơ cầu thang | cáp inox cầu thang | Lưới cầu thang | Luoi cau thang |
  Luoi an toan cau thang), then a **340×200** Facebook page embed; then an empty `#text-11`.
  The SDK is not loaded, so the clone draws its own card in that same 340×200 box —
  see `site-fixes.spec.md`.

Contact lines (address, hotline, email) come from `data/contact.json` and are
**not** the live site's — see `news.spec.md`.

## `.footer-bottom`
`.site-info` — empty on this page (kept so the trailing spacing matches).

## Responsive
- **≤991px:** `.hidden-mobile` (the entire upper footer) `display:none !important`;
  `.fut-col`, `.footer-support .widget` → `text-align:center`;
  `.footer-sidebar:nth-child(2n)` → `float:left; clear:right`, `:nth-child(2n+1)` → `clear:left`;
  `.footer-widget-section-right` loses its top padding, its widgets gain `margin-bottom:30px`;
  `.site-footer .site-info` → `text-align:center`
