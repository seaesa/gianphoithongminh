# Site map — every page in the clone

Crawled from the seven Yoast sitemaps plus the pagination links found while
crawling. The post taxonomy was then replaced wholesale with the news feed
from gianphoichinhhang.com, so the `post` and `post-archive` rows below are
generated rather than cloned — see `components/news.spec.md`.

108 pages in total: the homepage, the 105 below, and 2 page this clone adds that the live site never had.

| template | pages | output |
|---|---|---|
| `page` | 18 | static WordPress pages, incl. cart / checkout / account |
| `post` | 23 | blog articles (imported — see `components/news.spec.md`) |
| `post-archive` | 24 | category + tag archives, with working pagination (imported) |
| `product` | 26 | WooCommerce single products |
| `product-archive` | 14 | shop, product categories and product tags, with pagination |
| `home` | 1 | `index.html` |

## URLs

### page (18)

- `/bao-mat-thong-tin/` → `bao-mat-thong-tin/index.html`
- `/cau-hoi-thuong-gap/` → `cau-hoi-thuong-gap/index.html`
- `/chinh-sach-hau-mai/` → `chinh-sach-hau-mai/index.html`
- `/chinh-sach-tra-hang/` → `chinh-sach-tra-hang/index.html`
- `/gio-hang/` → `gio-hang/index.html`
- `/gioi-thieu/` → `gioi-thieu/index.html`
- `/hop-tac-voi-chung-toi/` → `hop-tac-voi-chung-toi/index.html`
- `/huong-dan-mua-hang/` → `huong-dan-mua-hang/index.html`
- `/huong-dan-thanh-toan/` → `huong-dan-thanh-toan/index.html`
- `/lien-he/` → `lien-he/index.html`  *(clone-only)*
- `/phan-nan-khieu-nai/` → `phan-nan-khieu-nai/index.html`
- `/quy-dinh-chung/` → `quy-dinh-chung/index.html`
- `/quy-dinh-doi-tra-hang/` → `quy-dinh-doi-tra-hang/index.html`
- `/tai-khoan/` → `tai-khoan/index.html`
- `/thanh-toan/` → `thanh-toan/index.html`
- `/thanh-tuu-giai-thuong/` → `thanh-tuu-giai-thuong/index.html`
- `/tuyen-dung/` → `tuyen-dung/index.html`
- `/van-chuyen-san-pham/` → `van-chuyen-san-pham/index.html`

### post (23)

- `/bao-gia-va-chi-phi-lap-dat-gian-phoi-thong-minh-moi-nhat-nam-2025/` → `bao-gia-va-chi-phi-lap-dat-gian-phoi-thong-minh-moi-nhat-nam-2025/index.html`  *(clone-only)*
- `/cach-giai-quyet-quan-ao-phoi-trong-nha-co-mui-hoi/` → `cach-giai-quyet-quan-ao-phoi-trong-nha-co-mui-hoi/index.html`  *(clone-only)*
- `/cach-nhan-biet-gian-phoi-thong-minh-chinh-hang/` → `cach-nhan-biet-gian-phoi-thong-minh-chinh-hang/index.html`  *(clone-only)*
- `/canh-bao-nguoi-dan-ve-kien-ba-khoang-o-khu-dan-cu-binh-duong-tp-hcm/` → `canh-bao-nguoi-dan-ve-kien-ba-khoang-o-khu-dan-cu-binh-duong-tp-hcm/index.html`  *(clone-only)*
- `/dich-vu-lap-dat-vach-lanh-ngan-dieu-hoa-tai-binh-duong/` → `dich-vu-lap-dat-vach-lanh-ngan-dieu-hoa-tai-binh-duong/index.html`  *(clone-only)*
- `/giai-phap-gian-phoi-thong-minh-phu-hop-cho-tung-khong-gian/` → `giai-phap-gian-phoi-thong-minh-phu-hop-cho-tung-khong-gian/index.html`  *(clone-only)*
- `/gian-phoi-thong-minh-cho-chung-cu-giai-phap-hien-dai-toi-uu-khong-gian-song-nam-2025/` → `gian-phoi-thong-minh-cho-chung-cu-giai-phap-hien-dai-toi-uu-khong-gian-song-nam-2025/index.html`  *(clone-only)*
- `/gian-phoi-thong-minh-tat-ca-nhung-dieu-ban-can-biet-truoc-khi-lap-dat/` → `gian-phoi-thong-minh-tat-ca-nhung-dieu-ban-can-biet-truoc-khi-lap-dat/index.html`  *(clone-only)*
- `/huong-dan-cach-ve-sinh-gian-phoi-thong-minh-dung-cach-hieu-qua-nhat-2025/` → `huong-dan-cach-ve-sinh-gian-phoi-thong-minh-dung-cach-hieu-qua-nhat-2025/index.html`  *(clone-only)*
- `/kinh-nghiem-chon-mua-gian-phoi-thong-minh-chinh-hang-ben-dep-gia-tot/` → `kinh-nghiem-chon-mua-gian-phoi-thong-minh-chinh-hang-ben-dep-gia-tot/index.html`  *(clone-only)*
- `/lap-dat-gian-phoi-thong-minh-chinh-hang-quan-1-tphcm/` → `lap-dat-gian-phoi-thong-minh-chinh-hang-quan-1-tphcm/index.html`  *(clone-only)*
- `/lap-dat-gian-phoi-thong-minh-chinh-hang-quan-3-tp-hcm-gia-re/` → `lap-dat-gian-phoi-thong-minh-chinh-hang-quan-3-tp-hcm-gia-re/index.html`  *(clone-only)*
- `/lap-dat-gian-phoi-thong-minh-chinh-hang-tai-binh-duong/` → `lap-dat-gian-phoi-thong-minh-chinh-hang-tai-binh-duong/index.html`  *(clone-only)*
- `/lap-dat-gian-phoi-thong-minh-chinh-hang-tai-phuong-di-an-tphcm-binh-duong-cu/` → `lap-dat-gian-phoi-thong-minh-chinh-hang-tai-phuong-di-an-tphcm-binh-duong-cu/index.html`  *(clone-only)*
- `/lap-dat-luoi-cap-ban-cong-o-quan-1-tp-hcm-giai-phap-an-toan-va-tham-my/` → `lap-dat-luoi-cap-ban-cong-o-quan-1-tp-hcm-giai-phap-an-toan-va-tham-my/index.html`  *(clone-only)*
- `/mua-mua-sai-gon-va-giai-phap-bat-che-nang-mua-cho-moi-nha/` → `mua-mua-sai-gon-va-giai-phap-bat-che-nang-mua-cho-moi-nha/index.html`  *(clone-only)*
- `/quy-trinh-lap-dat-gian-phoi-thong-minh-chuyen-nghiep/` → `quy-trinh-lap-dat-gian-phoi-thong-minh-chuyen-nghiep/index.html`  *(clone-only)*
- `/review-dich-vu-lap-dat-gian-phoi-thong-minh-tai-cu-chi-trai-nghiem-thuc-te-tu-nguoi-dung/` → `review-dich-vu-lap-dat-gian-phoi-thong-minh-tai-cu-chi-trai-nghiem-thuc-te-tu-nguoi-dung/index.html`  *(clone-only)*
- `/so-sanh-gian-phoi-thong-minh-va-gian-phoi-truyen-thong-dau-la-lua-chon-tot-hon-cho-gia-dinh-ban/` → `so-sanh-gian-phoi-thong-minh-va-gian-phoi-truyen-thong-dau-la-lua-chon-tot-hon-cho-gia-dinh-ban/index.html`  *(clone-only)*
- `/top-10-don-vi-lap-dat-gian-phoi-thong-minh-uy-tin-o-binh-duong-tphcm/` → `top-10-don-vi-lap-dat-gian-phoi-thong-minh-uy-tin-o-binh-duong-tphcm/index.html`  *(clone-only)*
- `/top-5-mau-gian-phoi-thong-minh-moi-nhat-nam-2025-tien-nghi-hien-dai-va-tiet-kiem-khong-gian/` → `top-5-mau-gian-phoi-thong-minh-moi-nhat-nam-2025-tien-nghi-hien-dai-va-tiet-kiem-khong-gian/index.html`  *(clone-only)*
- `/top-5-mau-gian-phoi-thong-minh-pho-bien-cho-nha-pho-tphcm/` → `top-5-mau-gian-phoi-thong-minh-pho-bien-cho-nha-pho-tphcm/index.html`  *(clone-only)*
- `/top-5-thuong-hieu-gian-phoi-thong-minh-uy-tin-nhat-viet-nam/` → `top-5-thuong-hieu-gian-phoi-thong-minh-uy-tin-nhat-viet-nam/index.html`  *(clone-only)*

### post-archive (24)

- `/category/tin-tuc/` → `category/tin-tuc/index.html`  *(clone-only)*
- `/category/tin-tuc/page/2/` → `category/tin-tuc/page/2/index.html`  *(clone-only)*
- `/category/tu-van-gian-phoi/` → `category/tu-van-gian-phoi/index.html`  *(clone-only)*
- `/category/tu-van-gian-phoi/page/2/` → `category/tu-van-gian-phoi/page/2/index.html`  *(clone-only)*
- `/tag/bao-duong-gian-phoi/` → `tag/bao-duong-gian-phoi/index.html`  *(clone-only)*
- `/tag/cua-luoi-chong-muoi/` → `tag/cua-luoi-chong-muoi/index.html`  *(clone-only)*
- `/tag/giai-phap-gian-phoi-thong-minh/` → `tag/giai-phap-gian-phoi-thong-minh/index.html`  *(clone-only)*
- `/tag/gian-phoi-chinh-hang/` → `tag/gian-phoi-chinh-hang/index.html`  *(clone-only)*
- `/tag/gian-phoi-chung-cu/` → `tag/gian-phoi-chung-cu/index.html`  *(clone-only)*
- `/tag/gian-phoi-dien-tu/` → `tag/gian-phoi-dien-tu/index.html`  *(clone-only)*
- `/tag/gian-phoi-inox/` → `tag/gian-phoi-inox/index.html`  *(clone-only)*
- `/tag/gian-phoi-tay-quay/` → `tag/gian-phoi-tay-quay/index.html`  *(clone-only)*
- `/tag/gian-phoi-thong-minh-2025/` → `tag/gian-phoi-thong-minh-2025/index.html`  *(clone-only)*
- `/tag/gian-phoi-thong-minh-cho-chung-cu/` → `tag/gian-phoi-thong-minh-cho-chung-cu/index.html`  *(clone-only)*
- `/tag/gian-phoi-thong-minh-gia-bao-nhieu/` → `tag/gian-phoi-thong-minh-gia-bao-nhieu/index.html`  *(clone-only)*
- `/tag/gian-phoi-thong-minh-tp-hcm/` → `tag/gian-phoi-thong-minh-tp-hcm/index.html`  *(clone-only)*
- `/tag/gian-phoi-thong-minh/` → `tag/gian-phoi-thong-minh/index.html`  *(clone-only)*
- `/tag/gian-phoi-tiet-kiem-khong-gian/` → `tag/gian-phoi-tiet-kiem-khong-gian/index.html`  *(clone-only)*
- `/tag/gian-phoi-tu-dong/` → `tag/gian-phoi-tu-dong/index.html`  *(clone-only)*
- `/tag/lap-dat-gian-phoi-thong-minh/` → `tag/lap-dat-gian-phoi-thong-minh/index.html`  *(clone-only)*
- `/tag/lap-dat-gian-phoi/` → `tag/lap-dat-gian-phoi/index.html`  *(clone-only)*
- `/tag/luoi-cap-ban-cong-binh-duong/` → `tag/luoi-cap-ban-cong-binh-duong/index.html`  *(clone-only)*
- `/tag/nen-mua-gian-phoi-loai-nao/` → `tag/nen-mua-gian-phoi-loai-nao/index.html`  *(clone-only)*
- `/tag/sua-chua-gian-phoi/` → `tag/sua-chua-gian-phoi/index.html`  *(clone-only)*

### product (26)

- `/cua-hang/ba%cc%a3t-che-nang-mua-tu%cc%a3-cuon-hoa-phat/` → `cua-hang/ba-t-che-nang-mua-tu--cuon-hoa-phat/index.html`
- `/cua-hang/dich-vu-sua-chua/` → `cua-hang/dich-vu-sua-chua/index.html`
- `/cua-hang/gian-phoi-4-thanh/` → `cua-hang/gian-phoi-4-thanh/index.html`
- `/cua-hang/gian-phoi-bam-dien/` → `cua-hang/gian-phoi-bam-dien/index.html`
- `/cua-hang/gian-phoi-cao-cap-seri-999a/` → `cua-hang/gian-phoi-cao-cap-seri-999a/index.html`
- `/cua-hang/gian-phoi-chuong-co/` → `cua-hang/gian-phoi-chuong-co/index.html`
- `/cua-hang/gian-phoi-dieu-khien-duy-loi/` → `cua-hang/gian-phoi-dieu-khien-duy-loi/index.html`
- `/cua-hang/gian-phoi-dieu-khien/` → `cua-hang/gian-phoi-dieu-khien/index.html`
- `/cua-hang/gian-phoi-inox-cma-888/` → `cua-hang/gian-phoi-inox-cma-888/index.html`
- `/cua-hang/gian-phoi-inox-series-b-01-model-2013/` → `cua-hang/gian-phoi-inox-series-b-01-model-2013/index.html`
- `/cua-hang/gian-phoi-s-20a-nhap-khau-dai-loan/` → `cua-hang/gian-phoi-s-20a-nhap-khau-dai-loan/index.html`
- `/cua-hang/gian-phoi-takashi/` → `cua-hang/gian-phoi-takashi/index.html`
- `/cua-hang/gian-phoi-thong-minh-seri-02/` → `cua-hang/gian-phoi-thong-minh-seri-02/index.html`
- `/cua-hang/gian-phoi-thong-minh-seri-888/` → `cua-hang/gian-phoi-thong-minh-seri-888/index.html`
- `/cua-hang/gian-phoi-xep-ngang-inox/` → `cua-hang/gian-phoi-xep-ngang-inox/index.html`
- `/cua-hang/gian-phoi-xep-ngang-loai/` → `cua-hang/gian-phoi-xep-ngang-loai/index.html`
- `/cua-hang/gian-phoi-xep-ngang-thanh-nhom-duy-loi/` → `cua-hang/gian-phoi-xep-ngang-thanh-nhom-duy-loi/index.html`
- `/cua-hang/gp-duy-loi-seri-01/` → `cua-hang/gp-duy-loi-seri-01/index.html`
- `/cua-hang/gp-duy-loi-seri-03/` → `cua-hang/gp-duy-loi-seri-03/index.html`
- `/cua-hang/gp-duy-loi-seri-04/` → `cua-hang/gp-duy-loi-seri-04/index.html`
- `/cua-hang/gp-duy-loi-seri-07/` → `cua-hang/gp-duy-loi-seri-07/index.html`
- `/cua-hang/gp-nhap-khau-bo-toi-k-95/` → `cua-hang/gp-nhap-khau-bo-toi-k-95/index.html`
- `/cua-hang/gp-nhap-khau-bo-toi/` → `cua-hang/gp-nhap-khau-bo-toi/index.html`
- `/cua-hang/luoi-cu%cc%89a-so%cc%89-hoa-phat/` → `cua-hang/luoi-cu-a-so--hoa-phat/index.html`
- `/cua-hang/luoi-toan-ban-cong-hoa-phat/` → `cua-hang/luoi-toan-ban-cong-hoa-phat/index.html`
- `/cua-hang/luoi-toan-cau-thang-hoa-phat/` → `cua-hang/luoi-toan-cau-thang-hoa-phat/index.html`

### product-archive (14)

- `/cua-hang/` → `cua-hang/index.html`
- `/danh-muc/gian-phoi-ban-chay-2017/` → `danh-muc/gian-phoi-ban-chay-2017/index.html`
- `/danh-muc/gian-phoi-dieu-khien/` → `danh-muc/gian-phoi-dieu-khien/index.html`
- `/danh-muc/gian-phoi-do/` → `danh-muc/gian-phoi-do/index.html`
- `/danh-muc/gian-phoi-hoa-phat/` → `danh-muc/gian-phoi-hoa-phat/index.html`
- `/danh-muc/gian-phoi-quan-ao/` → `danh-muc/gian-phoi-quan-ao/index.html`
- `/danh-muc/gian-phoi-thong-dung/` → `danh-muc/gian-phoi-thong-dung/index.html`
- `/danh-muc/gian-phoi-thong-minh/` → `danh-muc/gian-phoi-thong-minh/index.html`
- `/danh-muc/gian-phoi/` → `danh-muc/gian-phoi/index.html`
- `/danh-muc/san-pham-khac/` → `danh-muc/san-pham-khac/index.html`
- `/tu-khoa/gian-phoi-quan-ao/` → `tu-khoa/gian-phoi-quan-ao/index.html`
- `/tu-khoa/gian-phoi-thong-minh/` → `tu-khoa/gian-phoi-thong-minh/index.html`
- `/tu-khoa/gian-phoi-xep-ngang/` → `tu-khoa/gian-phoi-xep-ngang/index.html`
- `/tu-khoa/gian/` → `tu-khoa/gian/index.html`


---

## Clone-only pages

Pages this clone owns outright, so `scripts/verify-pages.mjs` skips them.
See `components/shop-features.spec.md` and `components/news.spec.md`.

| path | why |
|---|---|
| `gio-hang/index.html` | replaces the cloned page (live site only ever shows WooCommerce's empty-cart state) |
| `thanh-toan/index.html` | same; the live URL 302-redirects to the cart |
| `danh-muc/gian-phoi-xep-ngang/index.html` | the main menu links here but the live site returns **404** |
| `lien-he/index.html` | rebuilt from `data/contact.json` |
| `tim-kiem/index.html` | search results; the live box posts to WordPress |
| 23 × post, 24 × post-archive | the whole news section, imported from gianphoichinhhang.com |
