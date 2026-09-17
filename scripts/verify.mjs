/**
 * Side-by-side verification: loads the live site and the clone at the same
 * viewports, then compares layout boxes, computed styles and full-page pixels.
 *
 *   node scripts/verify.mjs [--shots]
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const ORIGIN = 'https://thegioigianphoi.vn/';
const CLONE = 'http://127.0.0.1:8777/index.html';
const OUT = 'docs/design-references';
const ALL = [
  { name: 'w1920', width: 1920, height: 1080 },
  { name: 'w1366', width: 1366, height: 768 },
  { name: 'w1200', width: 1200, height: 900 },
  { name: 'w1199', width: 1199, height: 900 },
  { name: 'w992', width: 992, height: 900 },
  { name: 'w991', width: 991, height: 900 },
  { name: 'w767', width: 767, height: 1024 },
  { name: 'w650', width: 650, height: 1024 },
  { name: 'w500', width: 500, height: 900 },
  { name: 'w480', width: 480, height: 900 },
  { name: 'w375', width: 375, height: 812 },
  { name: 'w320', width: 320, height: 640 }
];
const CORE = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 }
];
const VIEWPORTS = process.argv.includes('--all') ? CORE.concat(ALL) : CORE;

const SELS = [
  '.top-header', '.top-header .container', '.top-left', '.social-media li a', '.top-right', '.top-nav li a',
  '.site-branding', '.logo', '.logo h1', '.logo img', '.top-mid-right', '.search-form', '#s', '.search-submit',
  '.cart-header', '.cart-icon', '#main-menu', '.main-menu-inner', '.navbar-header', '#site-navigation', '#navigation',
  '#navigation > li:nth-child(1)', '#navigation > li:nth-child(1) > a', '#navigation > li:nth-child(5) > a',
  '.menu-contrl', '.menu-responsive', '#content', '#content > .container', '#primary', '#secondary',
  '.home-slider-block', '.home-slider', '.owl-stage-outer', '.owl-item.active', '.owl-item.active img', '.owl-nav', '.owl-dots',
  '.opt-content-top', '.list-opt-content-top', '.list-opt-content-top p', '.text-list-opt', '.text-list-opt h6', '.text-list-opt span',
  '#hrm_tab_products-4', '.title-tab-wg', '.title-tab-wg span', '.has_title ul.nav-tabs', '.has_title ul.nav-tabs > li > a',
  '.item-product.columns-5', '.item-product.columns-4', '.product-loop-inner', '.thumb-outter', '.thumb-outter img',
  '.thumb-outter span.onsale', '.thumb-outter span.onsale span', '.link-to-product',
  '.pr-loop-footer', '.pr-loop-footer h3', '.pr-loop-footer .price del', '.pr-loop-footer .price ins', 'a.add_to_cart_button',
  '#text-2 .block-static-inner', '.block-static-inner .img', '.block-static-inner .content', '.block-static-inner .content h3',
  '.block-static-inner .content h2', '.block-static-inner .trending', '.trending-inner h3', '.trending-inner h2',
  '#nav_menu-4', '#nav_menu-4 .widget-title', '#nav_menu-4 ul.menu > li > a', '#text-8', '#text-8 .widget-title',
  '.cont-info-service p', '.list-number-info-service p', '.sp-list a',
  '#woocommerce_products-3 .widget-title', '#woocommerce_products-3 ul > li', '#woocommerce_products-3 ul > li img',
  '#woocommerce_products-3 .product-title', '#hrm-recent-posts-widget-2 .widget-title', '.hrm-recent-post', '.hrm-thumb', '.hrm-thumb img', '.hrm-title',
  '.upper-footer', '.ft-icon-block', '.hover-border-inner', '.icon-logo', '.title-icon', '.des-icon',
  '.footer-support', '.received-mail', '.received-mail .widget-title', '.hrm-social-networks a',
  '.footer-top', '.footer-widget-section-left', '.hrm-contact-widget .widget-title', '.info-item', '.info-item i', '.tit-contain',
  '#text-10 .textwidget', '#footer-sidebar-3', '#footer-sidebar-3 .widget-title', '#footer-sidebar-3 ul.menu > li > a',
  '#footer-sidebar-4', '#text-6 .textwidget', '.footer-bottom', '#topcontrol', '.hotline-phone-ring', '.hotline-phone-ring-img-circle'
];

const PROPS = ['display', 'position', 'float', 'width', 'height',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'background-color', 'color', 'font-size', 'font-weight', 'line-height', 'font-family',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-color', 'border-top-style', 'border-radius', 'box-shadow',
  'text-align', 'text-transform', 'letter-spacing', 'opacity', 'z-index', 'overflow',
  'top', 'right', 'bottom', 'left', 'transform', 'background-image'];

const probe = (SELS, PROPS) => {
  const out = {};
  for (const sel of SELS) {
    const el = document.querySelector(sel);
    if (!el) { out[sel] = null; continue; }
    const c = getComputedStyle(el), r = el.getBoundingClientRect();
    const o = { box: [r.x, r.y, r.width, r.height].map(n => Math.round(n * 10) / 10) };
    for (const p of PROPS) {
      let v = c.getPropertyValue(p);
      if (p === 'background-image' && v !== 'none') v = 'IMG:' + ((v.match(/[^/"')]+\.(png|jpe?g|gif|svg)/i) || ['?'])[0]);
      o[p] = v;
    }
    out[sel] = o;
  }
  return out;
};

const behaviours = () => {
  const r = {};
  const box = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  const css = (s, p) => { const e = document.querySelector(s); return e ? getComputedStyle(e).getPropertyValue(p) : null; };

  r.navHoverBg = (() => {
    const li = document.querySelector('#navigation > li');
    if (!li) return null;
    li.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    return getComputedStyle(li).backgroundColor;
  })();

  r.tabCount = document.querySelectorAll('[data-toggle="tab"]').length;
  r.activePanes = [...document.querySelectorAll('.tab-pane.active')].map(p => p.id);
  r.owlLoaded = !!document.querySelector('.home-slider.owl-loaded');
  r.owlItems = document.querySelectorAll('.home-slider .owl-item').length;
  r.owlNavDisabled = !!document.querySelector('.owl-nav.disabled');
  r.owlDotsDisabled = !!document.querySelector('.owl-dots.disabled');
  r.topcontrolBottom = css('#topcontrol', 'bottom');
  r.menuResponsiveLeft = css('.menu-responsive', 'left');
  r.overlayOpen = document.querySelector('.menu-responsive-overlay')?.classList.contains('open-mn') ?? null;
  r.cartListTransform = css('.cart-container-list', 'transform');
  r.productNavDisplay = css('.product-nav', 'display');
  r.navTabsDisplay = css('.has_title ul.nav-tabs', 'display');
  r.siteNavDisplay = css('#site-navigation', 'display');
  r.menuOpenBox = box('.menu-open');
  return r;
};

async function scrolledState(page) {
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => ({
    topcontrolBottom: getComputedStyle(document.querySelector('#topcontrol')).bottom,
    btnScrolled: document.querySelector('.menu-close-2')?.classList.contains('btn-scrolled') ?? null
  }));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  return r;
}

async function capture(page, url, vp) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1800);
  // freeze animations so screenshots are deterministic
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}'
    // The clone carries a different business's contact details and a different
    // news feed on purpose (data/contact.json, data/news.json), so the blocks
    // that print them cannot match the live site's text. Hide them on BOTH
    // sides — their selectors then compare equal — and measure everything else.
    + '.top-header,#hrm-contact-widget-3,#hrm-recent-posts-widget-2,'
    + '.hotline-phone-ring-wrap,.zalo-float,'
    // the live footer embeds Facebook's page plugin; the clone draws its own
    // card in the same 340x200 box (see components/site-fixes.spec.md). Match
    // `.fb-page` only: the SDK also stamps `.fb_iframe_widget` on the comments
    // box, which both sides do have to agree on.
    + '.fb-page-placeholder,.fb-page{display:none!important}' });
  await page.evaluate(async () => {
    await new Promise(res => {
      let n = 0;
      const t = setInterval(() => { window.scrollBy(0, 800); if (++n > 40) { clearInterval(t); window.scrollTo(0, 0); res(); } }, 40);
    });
  });
  await page.waitForTimeout(1200);
  const styles = await page.evaluate(([s, p]) => {
    const out = {};
    for (const sel of s) {
      const el = document.querySelector(sel);
      if (!el) { out[sel] = null; continue; }
      const c = getComputedStyle(el), r = el.getBoundingClientRect();
      const o = { box: [r.x, r.y, r.width, r.height].map(n => Math.round(n * 10) / 10) };
      for (const q of p) {
        let v = c.getPropertyValue(q);
        if (q === 'background-image' && v !== 'none') v = 'IMG:' + ((v.match(/[^/"')]+\.(png|jpe?g|gif|svg)/i) || ['?'])[0]);
        o[q] = v;
      }
      out[sel] = o;
    }
    return out;
  }, [SELS, PROPS]);
  const behav = await page.evaluate(behaviours);
  behav.scrolled = await scrolledState(page);
  const shot = await page.screenshot({ fullPage: true, scale: 'css' });
  return { styles, behav, shot };
}

const NUM = /^-?[\d.]+px$/;
function cmpStyles(a, b) {
  const diffs = [];
  for (const sel of SELS) {
    const x = a[sel], y = b[sel];
    if (!x && !y) continue;
    if (!x || !y) { diffs.push({ sel, prop: 'exists', orig: !!x, clone: !!y }); continue; }
    for (let i = 0; i < 4; i++) {
      const d = Math.abs(x.box[i] - y.box[i]);
      if (d > 1.5) diffs.push({ sel, prop: 'box[' + 'xywh'[i] + ']', orig: x.box[i], clone: y.box[i], delta: Math.round(d * 10) / 10 });
    }
    for (const p of PROPS) {
      if (x[p] === y[p]) continue;
      if (NUM.test(x[p]) && NUM.test(y[p]) && Math.abs(parseFloat(x[p]) - parseFloat(y[p])) <= 1) continue;
      diffs.push({ sel, prop: p, orig: x[p], clone: y[p] });
    }
  }
  return diffs;
}

async function pixelDiff(aBuf, bBuf, out) {
  const a = PNG.sync.read(aBuf), b = PNG.sync.read(bBuf);
  const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
  const crop = (img) => {
    const o = new PNG({ width: w, height: h });
    PNG.bitblt(img, o, 0, 0, w, h, 0, 0);
    return o;
  };
  const A = crop(a), B = crop(b);
  const diff = new PNG({ width: w, height: h });
  const n = pixelmatch(A.data, B.data, diff.data, w, h, { threshold: 0.12 });
  await fs.writeFile(out, PNG.sync.write(diff));
  return { mismatch: n / (w * h), heightOrig: a.height, heightClone: b.height, w, h };
}

const shots = process.argv.includes('--shots');
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
await fs.mkdir(OUT, { recursive: true });
const report = {};

for (const vp of VIEWPORTS) {
  process.stdout.write(`\n=== ${vp.name} (${vp.width}px) ===\n`);
  const o = await capture(page, ORIGIN, vp);
  const c = await capture(page, CLONE, vp);
  await fs.writeFile(path.join(OUT, `orig-${vp.name}.png`), o.shot);
  await fs.writeFile(path.join(OUT, `clone-${vp.name}.png`), c.shot);

  const sd = cmpStyles(o.styles, c.styles);
  const pd = await pixelDiff(o.shot, c.shot, path.join(OUT, `diff-${vp.name}.png`));

  const bd = [];
  for (const k of Object.keys(o.behav)) {
    const A = JSON.stringify(o.behav[k]), B = JSON.stringify(c.behav[k]);
    if (A !== B) bd.push({ key: k, orig: o.behav[k], clone: c.behav[k] });
  }

  report[vp.name] = { styleDiffs: sd, behaviourDiffs: bd, pixel: pd };
  console.log(`page height  orig ${pd.heightOrig}  clone ${pd.heightClone}  (Δ ${pd.heightClone - pd.heightOrig})`);
  console.log(`pixel mismatch ${(pd.mismatch * 100).toFixed(2)}%  over ${pd.w}x${pd.h}`);
  console.log(`style diffs: ${sd.length}`);
  for (const d of sd.slice(0, 60)) console.log(`   ${d.sel}  ${d.prop}:  orig=${d.orig}  clone=${d.clone}${d.delta ? '  Δ' + d.delta : ''}`);
  if (sd.length > 60) console.log(`   … ${sd.length - 60} more`);
  console.log(`behaviour diffs: ${bd.length}`);
  for (const d of bd) console.log(`   ${d.key}: orig=${JSON.stringify(d.orig)} clone=${JSON.stringify(d.clone)}`);
}

await fs.writeFile('.work/verify-report.json', JSON.stringify(report, null, 1));
await browser.close();
