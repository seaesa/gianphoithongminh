# Inner page templates Specification

Covers the five non-home templates. All of them share the same chrome, so only
`main#main` changes between them.

## Shared shell (every page except the homepage)

```
body.<wordpress body classes>
  .menu-responsive-overlay + .menu-responsive        ← identical everywhere
  #page.site
    header#masthead                                  ← identical, except menu state classes
    #content.site-content.sidebar-left
      .container
        .hrm-breadcrums > #crumbs                    ← NOT present on the homepage
        .row
          #primary.content-area.col-md-9             ← + .product-main on single products
            main#main.site-main                      ← the only part that varies
          aside#secondary.widget-area.col-md-3       ← identical everywhere
  .upper-footer + footer#colophon + floating widgets ← identical everywhere
```

### Logo markup differs by template — worth 1px

The homepage wraps the logo in `<h1 class="site-title">`; **every other template
uses `<p class="site-title">`**. The `<p>` has no heading line-box, so
`.site-branding` is 120.8px instead of 121.8px and the whole page sits 1px higher.
Only the homepage also carries the hidden `.seo-title` span and the `title`
attribute on the logo image.

### Menu state classes

WordPress marks the active item in four menus. These are extracted per page and
replayed by the renderer, because `ul#navigation > li.current-menu-item` is
styled `background: #dc0000` — a visible red tab.

| page type | what gets marked |
|---|---|
| product category / tag | `current-menu-item` on the matching item in `#navigation`, `#nav_menu-4`, `.menu-responsive` |
| single product | `current-product-ancestor current-menu-parent current-product-parent` on the same three |
| static page in the footer menu | `current-menu-item page_item page-item-<id> current_page_item` in `#footer-sidebar-3` |
| homepage | `current-menu-item current_page_item` on the footer menu's "Trang chủ" |

### Breadcrumbs (`.hrm-breadcrums > #crumbs`)

`<a>Trang chủ</a> <i class="fa fa-angle-double-right"></i> … <span class="current">…</span>`
— two levels on pages and archives, three on posts and products.

---

## `page` — static pages (18)

```
article#post-<id>.post-<id>.page.type-page.status-publish.hentry
  header.entry-header > h1.entry-title
  div.entry-content            ← editorial body, carried over verbatim
  footer.entry-footer          ← empty, 0px
```

Includes the WooCommerce-driven pages, which render their shortcode output inside
`.entry-content`:

- `/gio-hang/` and `/thanh-toan/` — both render page-id-55 with the empty-cart
  state (`p.cart-empty` + `p.return-to-shop > a.button.wc-backward`). The live
  site serves identical markup for both URLs.
- `/tai-khoan/` — `#customer_login.u-columns.col2-set` with the login and register
  forms. Loads `select2.css`, which the renderer adds only for this template.
- `/lien-he/` — a two-column contact layout (`.col-xs-12` + `.col-sm-7`).

## `post` — blog articles (81)

```
article#post-<id>
  header.entry-header > h1.entry-title
  p.post-meta > span.post-date > i.fa.fa-calendar
  div.entry-content
  footer.entry-footer > span.tags-links > div.post_tags_intro + <a> tags
  div.hrm-social-share > h3 > span.share-text + ul.hrm-share (fb / g+ / twitter / linkedin / pinterest)
div#comments.comments-area > #respond.comment-respond > form#commentform
div.related-post > .related-title + .show-related > ul.related > li × 5
```

`span.share-text` runs the theme's `@keyframes my` colour pulse (700ms infinite,
`#fff` → `#1a7b1c` → `#fff`).

**`.related-post` is re-randomised on every request by the live site** — five
different articles each time. The clone captures one snapshot; the verifier hides
the block on both sides and compares only its item count.

## `post-archive` — category and tag archives (32)

```
header.entry-header > h1.page-title (+ div.taxonomy-description)
div.list-blog > div.post-listing.archive-box
  article.item-list × N
    div.post-thumbnail > a > img.attachment-blog-thumbnail
    div.entry > h2.post-box-title + p.post-meta(author/date/cats) + p + a.more-link
    div.clear
div.hrm-pagenavi > ul.page-numbers > li > (span.current | a.page-numbers | span.dots | a.next)
```

Pagination links were followed during the crawl, so every `/page/N/` exists as a
real page in the clone.

## `product` — WooCommerce single product (26)

```
#container > #content
  nav.woocommerce-breadcrumb
  div#product-<id>.product
    div.images.single-product-images
      a.woocommerce-main-image.zoom[data-rel="prettyPhoto"] > img
      div.thumbnails.columns-3 > div.item × N      ← Owl carousel, see below
    div.summary.entry-summary
      h1.product_title.entry-title
      div.price-block > p.price (del/ins) + div.counter-sale-off + schema meta
      div.extras-meta > .extra-meta.pr_tinh_trang
      form.cart > .quantity(.quantity-minus, input.qty, .quantity-plus) + button.single_add_to_cart_button
      div.product_meta > span.posted_in
      div.hrm_custom_price > button.btn-dathang[data-toggle="modal"] + #myModal.modal.fade
    div.hrm-social-share
    div.woocommerce-tabs.wc-tabs-wrapper
      ul.tabs.wc-tabs > li.description_tab + li.reviews_tab
      #tab-description.panel.entry-content        ← the product copy
      #tab-reviews.panel > #reviews
    div.fb-comments
    div.related.products                          ← randomised, like related posts
```

### Behaviours this template needs

| behaviour | detail |
|---|---|
| **Thumbnail carousel** | Owl 2: `nav:true`, `autoplay` 3000ms, hover-pause, `responsive {0:1, 500:3, 800:4, 1200:5}`. Owl adds `owl-carousel` to the container — without it `.owl-carousel .owl-item {float:left}` never applies and the thumbnails stack vertically (+199px). |
| **Product tabs** | WooCommerce hides every `.wc-tab`/`.panel` on init, then clicks the first tab (or the reviews tab when the URL points at `#reviews` / `#tab-reviews` / a comment anchor). Without this both panels render and the page is ~179px too tall. |
| **Quantity stepper** | `.quantity-plus` / `.quantity-minus` add or subtract `step`, clamped by `min`/`max`, then fire `change`. |
| **Quick-order modal** | Bootstrap 3 data API: `[data-toggle="modal"][data-target="#myModal"]` opens, `[data-dismiss="modal"]`, the backdrop and Escape close it. On open the theme copies `.us_name`/`.us_phone`/`.us_email`/`.us_address` into the hidden `ord_*` inputs. |
| **Add-to-cart width** | `hrm-custom.js` sets `button.single_add_to_cart_button` width to the measured width of `.btn-dathang`. |
| **Gallery lightbox** | `a.zoom[data-rel^="prettyPhoto"]` opens the image full-screen; closes on click or Escape. |
| **`.fb-comments`** | The Facebook plugin is not loaded, but the element still occupies a 20px line box on the live page; `overrides.css` reserves it with `min-height: 20px`. |

## `product-archive` — shop, product categories, product tags (14)

```
#container > #content
  nav.woocommerce-breadcrumb
  h1.page-title
  p.woocommerce-result-count
  form.woocommerce-ordering > select.orderby (5 options)
  div.woocommerce-loop > ul.products > li.product > .product-loop-inner
```

`.product-loop-inner` is the same card as on the homepage, so it inherits the
hover behaviour documented in `product-tab-widget.spec.md`.

## Known unavoidable differences

- `gianphoi.hunghaweb.com` is hotlinked by a few product descriptions and the
  domain no longer resolves (NXDOMAIN). Those images are broken on the live site
  too — blocked there as mixed content, 404 here — so they render as a broken
  image in both, but not pixel-identically.
- The two randomised blocks above.
