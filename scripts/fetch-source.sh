#!/usr/bin/env bash
# Re-fetch the reference material the extractors read from (.work/).
# Nothing here is shipped — it is the input to scripts/extract.py and
# scripts/build-css.py, which produce index.html and assets/css/*.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .work
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'
B=https://thegioigianphoi.vn

get() { curl -fsSL -A "$UA" "$1" -o "$2" && echo "  $2"; }

echo "fetching reference sources…"
get "$B/"                                                        .work/home.html
get "$B/wp-content/themes/hrm/style.css"                         .work/style.css
get "$B/wp-content/themes/hrm/js/hrm-custom.js"                  .work/hrm-custom.js
get "$B/wp-content/themes/hrm/css/bootstrap.min.css"             .work/bootstrap.min.css
for f in woocommerce-layout woocommerce-smallscreen woocommerce; do
  get "$B/wp-content/plugins/woocommerce/assets/css/$f.css"      ".work/$f.css"
done
echo "done."
