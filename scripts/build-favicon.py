# -*- coding: utf-8 -*-
"""Draw the favicon set from the Hòa Phát mark.

The live site points `rel="shortcut icon"` straight at its logo file — a 255x198
PNG of a shield with "HÒA PHÁT" set across it, which is an unreadable smudge at
16px and gives iOS and Android nothing to work with. What survives that scale is
the three-triangle mark inside the shield, so that is what these icons carry, on
the theme's own blue (#0082c6, the same colour as the nav bar and `--gp-blue` in
shop.css).

The triangles are not redrawn by eye: the coordinates below were measured off
`assets/uploads/2017/12/logo-hoa-phat-01.png` (the white pixels inside the
shield occupy x 85–170, y 83–127), then expressed as fractions of that box.

    python3 scripts/build-favicon.py
"""
import json
import os

from PIL import Image, ImageDraw

BLUE = (0, 130, 198, 255)          # #0082c6 — the theme blue
WHITE = (255, 255, 255, 255)
SS = 8                             # supersampling factor, for clean diagonals

# the mark, as fractions of its own bounding box (w:h = 85:44)
MARK_RATIO = 44 / 85
TRIANGLES = [
    [(0.012, 0.50), (0.494, 0.50), (0.235, 0.00)],   # top left
    [(0.506, 0.50), (0.988, 0.50), (0.765, 0.00)],   # top right
    [(0.271, 1.00), (0.718, 1.00), (0.494, 0.50)],   # bottom centre
]

OUT_DIR = 'assets/img'


def icon(size, mark=0.70, radius=0.0):
    """One square icon. `mark` is the mark's width as a fraction of the canvas,
    `radius` the corner rounding (0 = a full-bleed square, which is what a
    maskable or an apple-touch icon needs)."""
    s = size * SS
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    if radius > 0:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=radius * s, fill=BLUE)
    else:
        d.rectangle([0, 0, s, s], fill=BLUE)

    mw = s * mark
    mh = mw * MARK_RATIO
    x0 = (s - mw) / 2
    y0 = (s - mh) / 2
    for tri in TRIANGLES:
        d.polygon([(x0 + u * mw, y0 + v * mh) for u, v in tri], fill=WHITE)

    return im.resize((size, size), Image.LANCZOS)


def save(im, path):
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    im.save(path)
    print(f'{path}  {im.size[0]}x{im.size[1]}  {os.path.getsize(path)} bytes')


MANIFEST = {
    'name': 'Giàn phơi quần áo thông minh Hòa Phát',
    'short_name': 'Giàn phơi Hòa Phát',
    'start_url': '/',
    'scope': '/',
    'display': 'standalone',
    'background_color': '#ffffff',
    'theme_color': '#0082c6',
    'icons': [
        {'src': '/assets/img/icon-192.png', 'sizes': '192x192',
         'type': 'image/png', 'purpose': 'any maskable'},
        {'src': '/assets/img/icon-512.png', 'sizes': '512x512',
         'type': 'image/png', 'purpose': 'any maskable'},
    ],
}


def main():
    # tab icons — rounded, so they read as a badge rather than a colour block
    save(icon(16, mark=0.82, radius=0.16), f'{OUT_DIR}/favicon-16x16.png')
    save(icon(32, mark=0.76, radius=0.18), f'{OUT_DIR}/favicon-32x32.png')

    # favicon.ico carries 16/32/48 so every browser and the Windows taskbar
    # pick a size they can draw without resampling
    ico = icon(48, mark=0.74, radius=0.18)
    ico.save('favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    print(f'favicon.ico  16/32/48  {os.path.getsize("favicon.ico")} bytes')

    # iOS rounds the corners itself, so this one must be a full square
    save(icon(180, mark=0.66), f'{OUT_DIR}/apple-touch-icon.png')

    # maskable: Android may crop to a circle, so the mark stays inside the
    # 80% safe zone
    save(icon(192, mark=0.56), f'{OUT_DIR}/icon-192.png')
    save(icon(512, mark=0.56), f'{OUT_DIR}/icon-512.png')

    with open('site.webmanifest', 'w', encoding='utf-8') as f:
        json.dump(MANIFEST, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print(f'site.webmanifest  {os.path.getsize("site.webmanifest")} bytes')


if __name__ == '__main__':
    main()
