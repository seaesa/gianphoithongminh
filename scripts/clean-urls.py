# -*- coding: utf-8 -*-
"""Drop `index.html` from every internal link in the generated pages.

`vercel.json` serves the site with `trailingSlash: true` and redirects any
`…/index.html` to the directory, so `/lien-he/` is the canonical URL. Linking
straight to the directory saves every visitor a 308 on every click and keeps
`.html` out of the address bar entirely.

Nothing moves on disk — the files are still `<dir>/index.html`, which is what
both Vercel and `python3 -m http.server` serve for a directory request, so the
local preview and every verifier keep working unchanged.

Run after the renderers and before `build-css.py`:

    python3 scripts/clean-urls.py
"""
import os
import re

SKIP_DIRS = {'.git', '.work', 'node_modules', 'docs', 'assets'}

# href/action only: `src` never points at a page. The path is captured up to
# the `index.html` so an absolute URL (which has a scheme) can be skipped.
LINK_RE = re.compile(r'\b(href|action)="([^"]*?)index\.html(["#?])')


def clean(html):
    def sub(m):
        attr, path, tail = m.group(1), m.group(2), m.group(3)
        if '://' in path:                     # someone else's site, leave it
            return m.group(0)
        # `href="index.html"` is this directory; `./` says so without naming it
        return f'{attr}="{path or "./"}{tail}'

    return LINK_RE.sub(sub, html)


def pages():
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith('.')]
        for name in files:
            if name.endswith('.html'):
                yield os.path.join(root, name)


def main():
    files = links = touched = 0
    for path in sorted(pages()):
        files += 1
        before = open(path, encoding='utf-8').read()
        after = clean(before)
        if after != before:
            n = len(LINK_RE.findall(before))
            open(path, 'w', encoding='utf-8').write(after)
            touched += 1
            links += n
    print(f'{links} links cleaned in {touched} of {files} pages')

    # the pages are clean; anything still naming index.html would 308
    left = 0
    for path in pages():
        left += len([m for m in LINK_RE.finditer(open(path, encoding='utf-8').read())
                     if '://' not in m.group(2)])
    print(f'{left} internal links still ending in index.html')


if __name__ == '__main__':
    main()
