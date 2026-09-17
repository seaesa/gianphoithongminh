# -*- coding: utf-8 -*-
"""Shared URL helpers: live URL -> local slug/path, and asset URL -> local file."""
import json, os, re
from urllib.parse import urlparse, unquote

ORIGIN = 'thegioigianphoi.vn'


def is_internal(url):
    if not url:
        return False
    u = urlparse(url)
    if u.scheme and u.scheme not in ('http', 'https'):
        return False
    if not u.netloc:
        return True
    return u.netloc.replace('www.', '') == ORIGIN


def canon(url):
    """Canonical live URL (https, no query/hash, trailing slash)."""
    u = urlparse(url if '//' in url else 'https://' + ORIGIN + url)
    path = u.path or '/'
    if not path.endswith('/'):
        path += '/'
    return 'https://' + ORIGIN + path


def page_path(url):
    """Local output path for a page, e.g. 'cua-hang/gian-phoi-4-thanh/index.html'."""
    p = unquote(urlparse(canon(url)).path).strip('/')
    if not p:
        return 'index.html'
    safe = '/'.join(
        re.sub(r'[^a-zA-Z0-9._-]+', '-', seg).strip('-') or 'x'
        for seg in p.split('/')
    )
    return safe + '/index.html'


def prefix_for(out_path):
    """Relative prefix from a generated page back to the site root."""
    depth = out_path.count('/')
    return '../' * depth


def asset_path(url):
    """Local path under assets/ for a remote asset."""
    u = urlparse(url if '//' in url else 'https://' + ORIGIN + url)
    host = u.netloc.replace('www.', '')
    p = unquote(u.path)
    if 'dmca.com' in host:
        return 'assets/img/dmca-badge.png'
    if host and host != ORIGIN:
        name = re.sub(r'[^a-zA-Z0-9._-]+', '-', host + p)
        return 'assets/external/' + name[-120:]
    if p.startswith('/wp-content/uploads/'):
        rest = p[len('/wp-content/uploads/'):]
    elif p.startswith('/wp-content/themes/hrm/'):
        return 'assets/theme/' + p[len('/wp-content/themes/hrm/'):]
    elif p.startswith('/wp-content/plugins/'):
        return 'assets/plugins/' + p[len('/wp-content/plugins/'):]
    else:
        return 'assets/misc/' + p.lstrip('/')
    return 'assets/uploads/' + rest


class Rewriter:
    """Rewrites live URLs inside extracted markup to clone-local ones."""

    def __init__(self, pages, prefix=''):
        # pages: set/dict of canonical live page URLs we actually generated
        self.pages = pages
        self.prefix = prefix

    def link(self, href):
        if not href:
            return '#'
        if href.startswith(('mailto:', 'tel:', '#', 'javascript:')):
            return href
        if not is_internal(href):
            return href
        c = canon(href)
        if c in self.pages:
            return self.prefix + page_path(c)
        return '#'

    def asset(self, src):
        if not src or src.startswith('data:'):
            return src or ''
        return self.prefix + asset_path(src)

    def srcset(self, value):
        if not value:
            return value
        out = []
        for part in value.split(','):
            bits = part.strip().split()
            if not bits:
                continue
            out.append(' '.join([self.asset(bits[0])] + bits[1:]))
        return ', '.join(out)
