/**
 * Fetches every page of the live site into .work/pages/, following pagination
 * links it finds along the way. Sitemap URLs are the seed set.
 *
 *   node scripts/crawl.mjs [--force]
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const ORIGIN = 'https://thegioigianphoi.vn';
const DIR = '.work/pages';
const FORCE = process.argv.includes('--force');

export function slugFor(url) {
  const u = new URL(url, ORIGIN);
  let p = decodeURIComponent(u.pathname).replace(/^\/|\/$/g, '');
  if (!p) return 'index';
  return p.replace(/[^a-zA-Z0-9%._-]+/g, '-').replace(/-+/g, '-').slice(0, 120);
}

export function normalise(href, base) {
  let u;
  try { u = new URL(href, base || ORIGIN); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  if (u.hostname.replace(/^www\./, '') !== 'thegioigianphoi.vn') return null;
  u.protocol = 'https:';
  u.hostname = 'thegioigianphoi.vn';
  u.hash = '';
  // drop tracking / add-to-cart / feed noise, keep real query pages out entirely
  if (u.search) return null;
  if (/\/(wp-admin|wp-json|wp-content|wp-includes|feed)(\/|$)/.test(u.pathname)) return null;
  if (/\.(jpe?g|png|gif|svg|webp|pdf|zip|css|js|xml|ico)$/i.test(u.pathname)) return null;
  if (!u.pathname.endsWith('/')) u.pathname += '/';
  return u.toString();
}

const paginationLinks = (html, base) => {
  const out = new Set();
  // only follow links that live inside a pagination container
  const blocks = html.match(/<(?:div|nav|ul)[^>]*class="[^"]*(?:pagination|page-numbers|nav-links|wp-pagenavi)[^"]*"[\s\S]{0,4000}?<\/(?:div|nav|ul)>/gi) || [];
  for (const b of blocks) {
    for (const m of b.matchAll(/href=['"]([^'"]+)['"]/g)) {
      const n = normalise(m[1], base);
      if (n) out.add(n);
    }
  }
  return [...out];
};

async function main() {
  await fs.mkdir(DIR, { recursive: true });
  const seeds = JSON.parse(await fs.readFile('.work/urls.json', 'utf8'));
  const queue = [];
  const seen = new Set();
  const push = (u) => { const n = normalise(u); if (n && !seen.has(n)) { seen.add(n); queue.push(n); } };

  push(ORIGIN + '/');
  for (const list of Object.values(seeds)) list.forEach(push);

  const manifest = {};
  let done = 0, failed = 0;

  while (queue.length) {
    const batch = queue.splice(0, 5);
    await Promise.all(batch.map(async (url) => {
      const slug = slugFor(url);
      const file = path.join(DIR, slug + '.html');
      let html;
      try {
        if (!FORCE) {
          try { html = await fs.readFile(file, 'utf8'); } catch {}
        }
        if (!html) {
          const r = await fetch(url, { headers: { 'User-Agent': UA } });
          if (!r.ok) throw new Error('HTTP ' + r.status);
          html = await r.text();
          await fs.writeFile(file, html);
        }
        const bodyClass = (html.match(/<body[^>]*class="([^"]*)"/) || [, ''])[1];
        manifest[url] = { slug, file, bodyClass, bytes: html.length };
        paginationLinks(html, url).forEach(push);
        done++;
      } catch (e) {
        failed++;
        console.error('FAIL', url, String(e.message || e));
      }
    }));
    if (done % 25 < 5) process.stdout.write(`\r  fetched ${done}, queued ${queue.length}   `);
  }

  await fs.writeFile('.work/pages.json', JSON.stringify(manifest, null, 1));
  console.log(`\ncrawled ${done} pages (${failed} failed) -> ${DIR}`);

  // template breakdown
  const kinds = {};
  for (const [url, m] of Object.entries(manifest)) {
    const c = m.bodyClass;
    const kind =
      /(^|\s)home(\s|$)/.test(c) ? 'home' :
      /single-product/.test(c) ? 'product' :
      /(post-type-archive-product|tax-product_cat|tax-product_tag|woocommerce-shop)/.test(c) ? 'product-archive' :
      /single-post|(^|\s)single(\s|$)/.test(c) ? 'post' :
      /(^|\s)(archive|category|tag)(\s|$)/.test(c) ? 'post-archive' :
      /(^|\s)page(\s|$)/.test(c) ? 'page' : 'other';
    (kinds[kind] ||= []).push(url);
    m.kind = kind;
  }
  await fs.writeFile('.work/pages.json', JSON.stringify(manifest, null, 1));
  for (const [k, v] of Object.entries(kinds)) console.log(`  ${k}: ${v.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
