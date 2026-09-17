#!/usr/bin/env bash
# Full rebuild of the whole site: crawl -> extract -> assets -> render -> css.
# Re-runs are incremental (crawl and asset download skip what is already on disk).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "1/11  crawling pages"        ; node    scripts/crawl.mjs
echo "2/11  extracting homepage"   ; python3 scripts/extract.py
echo "3/11  collecting assets"     ; python3 scripts/collect-assets.py
echo "                           " ; node    scripts/download-assets.mjs
echo "4/11  extracting pages"      ; python3 scripts/extract-pages.py
echo "                           " ; python3 scripts/extract-products.py
# The news section comes from another site and the contact details from a third;
# both rewrite the records extract-pages.py just wrote, so they run before any
# rendering. fetch-news.py is separate — it only needs re-running to pull new
# posts, and it downloads several megabytes of images.
echo "5/11  rebuilding news"       ; python3 scripts/build-news.py
echo "6/11  applying contact info" ; python3 scripts/apply-contact.py
echo "7/11  indexing for search"   ; python3 scripts/build-search.py
echo "8/11  rendering clone"       ; python3 scripts/build.py
echo "                           " ; python3 scripts/build-pages.py
echo "9/11  rendering added pages" ; python3 scripts/build-custom.py
echo "                           " ; python3 scripts/build-sitemap-doc.py
echo "10/11 building stylesheets"  ; python3 scripts/build-css.py
echo "11/11 checking links"        ; node    scripts/check-links.mjs
echo "built."
