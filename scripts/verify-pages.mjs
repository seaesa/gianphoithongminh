/**
 * Verifies every generated page against its live counterpart.
 *
 *   node scripts/verify-pages.mjs              # all pages, desktop
 *   node scripts/verify-pages.mjs --kind post  # one template only
 *   node scripts/verify-pages.mjs --limit 20
 *   node scripts/verify-pages.mjs --responsive # 3 viewports, one page per template
 *   node scripts/verify-pages.mjs --url /cua-hang/gian-phoi-4-thanh/
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const CLONE_ROOT = 'http://127.0.0.1:8777/';
const args = process.argv.slice(2);
const flag = (n, d = null) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1]; };
const has = (n) => args.includes(n);

const index = JSON.parse(await fs.readFile('data/pages-index.json', 'utf8'));
index.unshift({ url: 'https://thegioigianphoi.vn/', path: 'index.html', kind: 'home', title: 'Home' });

// Pages this clone deliberately replaces or adds are not comparable with the
// live site: the shop pages (scripts/verify-shop.mjs covers those) and every
// page under the news taxonomy, whose content now comes from another source and
// is flagged `cloneOnly` in data/pages-index.json.
let custom = new Set();
try {
  custom = new Set(JSON.parse(await fs.readFile('data/custom.json', 'utf8')).pages.map(p => p.url));
} catch {}
const isClone = r => custom.has(r.url) || r.cloneOnly === true;
const skipped = index.filter(isClone);

let targets = index.filter(r => !isClone(r));
if (flag('--kind')) targets = targets.filter(r => r.kind === flag('--kind'));
if (flag('--url')) targets = targets.filter(r => r.url.includes(flag('--url')));
if (has('--responsive')) {
  const seen = new Set();
  targets = targets.filter(r => !seen.has(r.kind) && seen.add(r.kind));
}
if (flag('--limit')) targets = targets.slice(0, Number(flag('--limit')));

const VIEWPORTS = has('--responsive')
  ? [{ n: 'desktop', w: 1440, h: 900 }, { n: 'tablet', w: 768, h: 1024 }, { n: 'mobile', w: 390, h: 844 }]
  : [{ n: 'desktop', w: 1440, h: 900 }];

const PROBE = () => {
  const P = ['display', 'position', 'float', 'width', 'height', 'padding-top', 'padding-left',
    'margin-top', 'margin-left', 'background-color', 'color', 'font-size', 'font-weight',
    'line-height', 'text-align', 'border-top-width', 'border-top-color', 'overflow', 'z-index'];
  const SELS = ['#content', '#content > .container', '.hrm-breadcrums', '#crumbs', '#primary',
    'main#main', '#secondary', '#masthead', '#main-menu', '#navigation > li.current-menu-item',
    '.upper-footer', '#colophon', '.footer-top', '.footer-bottom'];
  const box = el => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(n => Math.round(n * 10) / 10); };
  const out = { height: document.documentElement.scrollHeight, sel: {}, kids: [] };
  for (const s of SELS) {
    const el = document.querySelector(s);
    if (!el) { out.sel[s] = null; continue; }
    const c = getComputedStyle(el);
    const o = { box: box(el) };
    for (const p of P) o[p] = c.getPropertyValue(p);
    out.sel[s] = o;
  }
  const main = document.querySelector('main#main');
  if (main) {
    for (const el of main.children) {
      out.kids.push({
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || '').split(' ').slice(0, 3).join(' '),
        box: box(el)
      });
    }
  }
  // image integrity: how many <img> actually decoded
  const imgs = [...document.images];
  out.images = { total: imgs.length, broken: imgs.filter(i => i.complete && i.naturalWidth === 0).length };
  // Blocks the live site randomises per request — compare their shape, not content.
  out.random = {
    relatedPosts: document.querySelectorAll('.related-post ul.related > li').length,
    relatedProducts: document.querySelectorAll('.related.products ul.products > li').length
  };
  return out;
};

async function grab(page, url, vp) {
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.addStyleTag({ content:
    '*,*::before,*::after{animation:none!important;transition:none!important}'
    // "related posts" and "related products" are re-randomised on every request,
    // so hide them on BOTH sides; their item counts are still compared.
    + '.related-post,.related.products{display:none!important}'
    // The clone carries a different business's contact details on purpose (see
    // data/contact.json), so the blocks that print them can't match the live
    // site's text. Hide them on BOTH sides and compare everything around them.
    + '.top-header,#hrm-contact-widget-3,.hotline-phone-ring-wrap,.zalo-float'
    // …the sidebar's "Tin tức mới" widget lists the replaced news feed…
    + ',#hrm-recent-posts-widget-2'
    // …and the live footer embeds Facebook's page plugin where the clone draws
    // its own card (same 340x200 box, see components/site-fixes.spec.md).
    // `.fb-page` only — the SDK also stamps `.fb_iframe_widget` on the comments
    // box further up the page, which both sides do have to match on.
    + ',.fb-page-placeholder,.fb-page'
    + '{display:none!important}' });
  await page.evaluate(async () => {
    await new Promise(res => { let n = 0; const t = setInterval(() => { window.scrollBy(0, 1000); if (++n > 60) { clearInterval(t); window.scrollTo(0, 0); res(); } }, 30); });
  });
  await page.waitForTimeout(900);
  const data = await page.evaluate(PROBE);
  const shot = await page.screenshot({ fullPage: true, scale: 'css' });
  return { data, shot };
}

const NUM = /^-?[\d.]+px$/;
function diffData(a, b) {
  const d = [];
  if (a.height !== b.height) d.push(`page height ${a.height} vs ${b.height} (Δ ${b.height - a.height})`);
  for (const s of Object.keys(a.sel)) {
    const x = a.sel[s], y = b.sel[s];
    if (!x && !y) continue;
    if (!x || !y) { d.push(`${s}: exists orig=${!!x} clone=${!!y}`); continue; }
    for (let i = 0; i < 4; i++) {
      if (Math.abs(x.box[i] - y.box[i]) > 1.5) d.push(`${s} box[${'xywh'[i]}] ${x.box[i]} vs ${y.box[i]}`);
    }
    for (const p of Object.keys(x)) {
      if (p === 'box' || x[p] === y[p]) continue;
      if (NUM.test(x[p]) && NUM.test(y[p]) && Math.abs(parseFloat(x[p]) - parseFloat(y[p])) <= 1) continue;
      d.push(`${s} ${p}: ${x[p]} vs ${y[p]}`);
    }
  }
  if (a.kids.length !== b.kids.length) d.push(`main children ${a.kids.length} vs ${b.kids.length}`);
  else for (let i = 0; i < a.kids.length; i++) {
    const x = a.kids[i], y = b.kids[i];
    if (x.tag !== y.tag || x.cls !== y.cls) { d.push(`main>${i} ${x.tag}.${x.cls} vs ${y.tag}.${y.cls}`); continue; }
    for (let k = 0; k < 4; k++) if (Math.abs(x.box[k] - y.box[k]) > 1.5) d.push(`main>${i} ${x.tag}.${x.cls} box[${'xywh'[k]}] ${x.box[k]} vs ${y.box[k]}`);
  }
  if (a.images.broken !== b.images.broken) d.push(`broken images ${a.images.broken} vs ${b.images.broken}`);
  for (const k of Object.keys(a.random)) {
    if (a.random[k] !== b.random[k]) d.push(`${k} count ${a.random[k]} vs ${b.random[k]}`);
  }
  return d;
}

function pixel(aBuf, bBuf) {
  const a = PNG.sync.read(aBuf), b = PNG.sync.read(bBuf);
  const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
  const crop = img => { const o = new PNG({ width: w, height: h }); PNG.bitblt(img, o, 0, 0, w, h, 0, 0); return o; };
  const n = pixelmatch(crop(a).data, crop(b).data, null, w, h, { threshold: 0.12 });
  return n / (w * h);
}

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
const report = [];
let fails = 0, worst = 0;

for (const vp of VIEWPORTS) {
  if (VIEWPORTS.length > 1) console.log(`\n══════ ${vp.n} (${vp.w}px) ══════`);
  for (const [i, r] of targets.entries()) {
    const label = r.url.replace('https://thegioigianphoi.vn', '') || '/';
    let line;
    try {
      const o = await grab(page, r.url, vp);
      const c = await grab(page, CLONE_ROOT + r.path, vp);
      const d = diffData(o.data, c.data);
      const px = pixel(o.shot, c.shot);
      worst = Math.max(worst, px);
      if (d.length) fails++;
      line = `${d.length ? 'DIFF' : 'OK  '}  ${(px * 100).toFixed(2).padStart(5)}%  ${r.kind.padEnd(15)} ${label}`;
      if (d.length) { line += '\n' + d.slice(0, 8).map(x => '        ' + x).join('\n'); if (d.length > 8) line += `\n        … ${d.length - 8} more`; }
      report.push({ url: r.url, kind: r.kind, diffs: d, pixel: px });
    } catch (err) {
      fails++;
      line = `ERR   ${r.kind.padEnd(15)} ${label}  ${err.message}`;
      report.push({ url: r.url, kind: r.kind, error: String(err.message) });
    }
    console.log(`[${String(i + 1).padStart(3)}/${targets.length}] ${line}`);
  }
}

await browser.close();
await fs.writeFile('.work/verify-pages-report.json', JSON.stringify(report, null, 1));
console.log(`\n${targets.length * VIEWPORTS.length - fails}/${targets.length * VIEWPORTS.length} pages clean · worst pixel diff ${(worst * 100).toFixed(2)}%`);
if (skipped.length) {
  const byKind = {};
  for (const r of skipped) byKind[r.kind] = (byKind[r.kind] || 0) + 1;
  const kinds = Object.entries(byKind).map(([k, n]) => `${n} ${k}`).join(', ');
  console.log(`(${skipped.length} clone-only pages skipped: ${kinds} — content this clone owns; see scripts/verify-shop.mjs and docs/research/components/news.spec.md)`);
}
process.exit(fails ? 1 : 0);
