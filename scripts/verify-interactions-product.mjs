/**
 * Drives the single-product interactions on the live site and the clone and
 * diffs the results: tabs, thumbnail carousel, quantity stepper, quick-order
 * modal, gallery lightbox.
 *
 *   node scripts/verify-interactions-product.mjs
 */
import { chromium } from 'playwright';

const SLUG = 'cua-hang/gian-phoi-4-thanh/';
const TARGETS = {
  original: 'https://thegioigianphoi.vn/' + SLUG,
  clone: 'http://127.0.0.1:8777/' + SLUG + 'index.html'
};

const css = (page, sel, props) => page.evaluate(([s, p]) => {
  const el = document.querySelector(s);
  if (!el) return 'MISSING';
  const c = getComputedStyle(el);
  return p.map(x => x + '=' + c.getPropertyValue(x)).join(' ');
}, [sel, props]);

async function checks(page) {
  const r = {};
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1500);

  /* -- gallery thumbnails: Owl markup and geometry --------------------- */
  r['thumbs owl'] = await page.evaluate(() => {
    const t = document.querySelector('.single-product-images .thumbnails');
    if (!t) return 'MISSING';
    const item = t.querySelector('.owl-item');
    const box = e => e ? [Math.round(e.getBoundingClientRect().width), Math.round(e.getBoundingClientRect().height)].join('x') : '-';
    return JSON.stringify({
      owlCarousel: t.classList.contains('owl-carousel'),
      loaded: t.classList.contains('owl-loaded'),
      items: t.querySelectorAll('.owl-item').length,
      itemFloat: item ? getComputedStyle(item).float : null,
      itemBox: box(item),
      stage: box(t.querySelector('.owl-stage')),
      navDisabled: t.querySelector('.owl-nav')?.classList.contains('disabled') ?? null,
      height: Math.round(t.getBoundingClientRect().height)
    });
  });

  /* -- tabs ------------------------------------------------------------ */
  const tabState = () => page.evaluate(() => {
    const w = document.querySelector('.woocommerce-tabs');
    if (!w) return 'MISSING';
    return JSON.stringify({
      activeLi: [...w.querySelectorAll('ul.tabs li')].map(li => li.classList.contains('active')),
      panelDisplay: [...w.querySelectorAll('.panel')].map(p => getComputedStyle(p).display),
      height: Math.round(w.getBoundingClientRect().height)
    });
  });
  r['tabs initial'] = await tabState();
  await page.click('.woocommerce-tabs ul.tabs li.reviews_tab a');
  await page.waitForTimeout(500);
  r['tabs after reviews'] = await tabState();
  await page.click('.woocommerce-tabs ul.tabs li.description_tab a');
  await page.waitForTimeout(500);
  r['tabs back to description'] = await tabState();
  r['tab a rest'] = await css(page, '.woocommerce-tabs ul.tabs li.reviews_tab a', ['background-color', 'color']);
  await page.hover('.woocommerce-tabs ul.tabs li.reviews_tab a');
  await page.waitForTimeout(400);
  r['tab a hover'] = await css(page, '.woocommerce-tabs ul.tabs li.reviews_tab a', ['background-color', 'color']);

  /* -- quantity stepper ------------------------------------------------ */
  const qty = () => page.evaluate(() => document.querySelector('.quantity input.qty')?.value ?? 'MISSING');
  r['qty initial'] = await qty();
  await page.click('.quantity .quantity-plus');
  await page.click('.quantity .quantity-plus');
  await page.waitForTimeout(250);
  r['qty after +2'] = await qty();
  await page.click('.quantity .quantity-minus');
  await page.waitForTimeout(250);
  r['qty after -1'] = await qty();
  for (let i = 0; i < 5; i++) await page.click('.quantity .quantity-minus');
  await page.waitForTimeout(250);
  r['qty clamped at min'] = await qty();

  /* -- add-to-cart button width matches the order button --------------- */
  r['button widths'] = await page.evaluate(() => {
    const a = document.querySelector('.hrm_custom_price .button.btn-dathang');
    const b = document.querySelector('button.single_add_to_cart_button');
    if (!a || !b) return 'MISSING';
    return JSON.stringify({ order: Math.round(a.getBoundingClientRect().width), cart: Math.round(b.getBoundingClientRect().width) });
  });

  /* -- quick-order modal ------------------------------------------------ */
  const modal = () => page.evaluate(() => {
    const m = document.querySelector('#myModal');
    if (!m) return 'MISSING';
    return JSON.stringify({
      display: getComputedStyle(m).display,
      inClass: m.classList.contains('in'),
      backdrops: document.querySelectorAll('.modal-backdrop').length,
      bodyOpen: document.body.classList.contains('modal-open')
    });
  });
  r['modal closed'] = await modal();
  await page.click('.btn-dathang');
  await page.waitForTimeout(700);
  r['modal open'] = await modal();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  r['modal after escape'] = await modal();

  /* -- product summary geometry ---------------------------------------- */
  r['summary'] = await page.evaluate(() => {
    const f = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.y), Math.round(b.height)]; };
    return JSON.stringify({
      images: f('.images.single-product-images'),
      summary: f('.summary.entry-summary'),
      tabs: f('.woocommerce-tabs'),
      share: f('.hrm-social-share')
    });
  });
  return r;
}

const browser = await chromium.launch();
const results = {};
for (const [name, url] of Object.entries(TARGETS)) {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  results[name] = await checks(page);
  await page.close();
}
await browser.close();

const keys = Object.keys(results.original);
let bad = 0;
for (const k of keys) {
  const a = results.original[k], b = results.clone[k];
  const same = a === b;
  if (!same) bad++;
  console.log(`${same ? 'OK  ' : 'DIFF'}  ${k}`);
  if (!same) { console.log(`        orig : ${a}`); console.log(`        clone: ${b}`); }
}
console.log(`\n${keys.length - bad}/${keys.length} product interaction checks match`);
process.exit(bad ? 1 : 0);
