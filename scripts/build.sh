#!/usr/bin/env bash
# Full rebuild of the whole site: crawl -> extract -> assets -> render -> css.
# Re-runs are incremental (crawl and asset download skip what is already on disk).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "1/12  crawling pages"        ; node    scripts/crawl.mjs
echo "2/12  extracting homepage"   ; python3 scripts/extract.py
echo "3/12  collecting assets"     ; python3 scripts/collect-assets.py
echo "                           " ; node    scripts/download-assets.mjs
echo "                           " ; python3 scripts/build-favicon.py
echo "4/12  extracting pages"      ; python3 scripts/extract-pages.py
echo "                           " ; python3 scripts/extract-products.py
# The news section comes from another site and the contact details from a third;
# both rewrite the records extract-pages.py just wrote, so they run before any
# rendering. fetch-news.py is separate — it only needs re-running to pull new
# posts, and it downloads several megabytes of images.
echo "5/12  rebuilding news"       ; python3 scripts/build-news.py
echo "6/12  applying contact info" ; python3 scripts/apply-contact.py
echo "7/12  indexing for search"   ; python3 scripts/build-search.py
echo "8/12  rendering clone"       ; python3 scripts/build.py
echo "                           " ; python3 scripts/build-pages.py
echo "9/12  rendering added pages" ; python3 scripts/build-custom.py
echo "                           " ; python3 scripts/build-sitemap-doc.py
# Links are emitted as `<dir>/index.html` and cleaned in one pass here, so a
# generator never has to know how the site is served. Must run after every
# renderer and before check-links.py sees the result.
echo "10/12 cleaning URLs"         ; python3 scripts/clean-urls.py
echo "11/12 building stylesheets"  ; python3 scripts/build-css.py
echo "12/12 checking links"        ; node    scripts/check-links.mjs
echo "built."
