/**
 * Verifies the site chrome this clone fixes rather than clones: the cart icon,
 * the footer's Facebook card, search, the two menu items added to the main nav,
 * the one-row mobile header, the Liên hệ request form, and the extensionless
 * URLs and favicon set.
 *
 *   node scripts/verify-site.mjs        # needs scripts/serve.sh running
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const ROOT = 'http://127.0.0.1:8777/';
const contact = JSON.parse(await fs.readFile('data/contact.json', 'utf8'));
const index = JSON.parse(await fs.readFile('data/search-index.json', 'utf8'));
const site = JSON.parse(await fs.readFile('data/site.json', 'utf8'));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const jsErrors = [];
page.on('pageerror', e => jsErrors.push(String(e)));

let pass = 0;
const fail = [];
const ok = (cond, what) => { cond ? pass++ : fail.push(what); };
const search = q => `${ROOT}tim-kiem/index.html?s=${encodeURIComponent(q)}`;

/* ── 1. the cart icon opens the cart ─────────────────────────────────────── */

for (const from of ['', 'cua-hang/gian-phoi-4-thanh/', 'category/tin-tuc/page/2/']) {
  await page.goto(ROOT + from, { waitUntil: 'domcontentloaded' });
  const href = await page.getAttribute('.cart-icon', 'href');
  ok(!!href && href !== '#', `${from || '/'}: cart icon still href="${href}"`);
  await page.click('.cart-icon');
  await page.waitForLoadState('domcontentloaded');
  ok(page.url().includes('/gio-hang/'), `${from || '/'}: cart icon went to ${page.url()}`);
  // the cart page it lands on has to be the working one, not the cloned shell
  ok(await page.locator('#gpCartEmpty, #gpCartFilled').count() === 2,
     `${from || '/'}: cart icon landed on a page with no cart`);
}

/* ── 2. the footer Facebook card ─────────────────────────────────────────── */

await page.goto(ROOT, { waitUntil: 'networkidle' });
const fb = await page.evaluate(() => {
  const box = document.querySelector('.fb-page-placeholder');
  const link = box && box.querySelector('a.fb-card');
  if (!link) return null;
  const b = box.getBoundingClientRect();
  const l = link.getBoundingClientRect();
  // the placeholder draws a 1px border, so compare against its content box
  return {
    href: link.getAttribute('href'),
    target: link.getAttribute('target'),
    name: (box.querySelector('.fb-card-name') || {}).textContent,
    cta: !!box.querySelector('.fb-card-cta'),
    // the card must fill the box the live page reserves for Facebook's iframe
    box: [Math.round(b.width), Math.round(b.height)],
    fills: Math.abs(l.width - box.clientWidth) < 1.5
        && Math.abs(l.height - box.clientHeight) < 1.5,
    overflows: link.scrollHeight > Math.ceil(l.height) + 1,
  };
});
ok(fb !== null, 'footer has no Facebook card');
if (fb) {
  ok(fb.href === contact.facebook, `card links to ${fb.href}, expected ${contact.facebook}`);
  ok(fb.target === '_blank', 'card does not open in a new tab');
  ok((fb.name || '').trim() === contact.facebookName, `card names "${fb.name}"`);
  ok(fb.cta, 'card has no call to action');
  ok(fb.box[0] === 340 && fb.box[1] === 200, `card box is ${fb.box.join('x')}, expected 340x200`);
  ok(fb.fills, 'card does not fill the reserved box');
  ok(!fb.overflows, 'card content overflows the reserved box');
}

/* ── 3. search ───────────────────────────────────────────────────────────── */

// the header form has to reach the results page from any depth
for (const from of ['', 'cua-hang/gian-phoi-4-thanh/', 'category/tin-tuc/page/2/']) {
  await page.goto(ROOT + from, { waitUntil: 'domcontentloaded' });
  await page.fill('#s', 'gian phoi');
  await page.press('#s', 'Enter');
  await page.waitForLoadState('networkidle');
  ok(page.url().includes('tim-kiem') && page.url().includes('s=gian+phoi'),
     `${from || '/'}: search went to ${page.url()}`);
  ok(await page.locator('#gpSearchResults article').count() > 0,
     `${from || '/'}: search returned nothing`);
  ok(await page.inputValue('#s') === 'gian phoi',
     `${from || '/'}: the box does not keep the query`);
}

// accents are optional, in both directions
for (const [q, want] of [
  ['giàn phơi xếp ngang', 'xếp ngang'],
  ['gian phoi xep ngang', 'xếp ngang'],
  ['GIAN PHOI XEP NGANG', 'xếp ngang'],
  ['điều khiển', 'Điều Khiển'],
  ['dieu khien', 'Điều Khiển'],
]) {
  await page.goto(search(q), { waitUntil: 'networkidle' });
  const first = await page.locator('#gpSearchResults .post-box-title').first().textContent();
  ok(first.toLowerCase().includes(want.toLowerCase()),
     `"${q}" ranked "${first.trim()}" first, expected something matching "${want}"`);
}

// every term has to be present — search is AND, not OR
await page.goto(search('giàn phơi khôngcótừnày'), { waitUntil: 'networkidle' });
ok(await page.locator('#gpSearchResults article').count() === 0,
   'an unmatched term still returned results');
ok(await page.locator('.gp-search-empty').count() === 1, 'no empty state for a miss');

// the summary count matches what the index can actually answer
await page.goto(search('giàn phơi'), { waitUntil: 'networkidle' });
const summary = await page.textContent('#gpSearchSummary');
const claimed = Number((summary.match(/(\d+)/) || [])[1]);
ok(claimed > 10, `search claims only ${claimed} results for "giàn phơi"`);
ok(await page.locator('#gpSearchResults article').count() === 10, 'first page is not 10 results');

// "show more" walks the rest of them
ok(await page.locator('#gpSearchMore').isVisible(), 'no "show more" button');
await page.click('#gpSearchMore button');
ok(await page.locator('#gpSearchResults article').count() === Math.min(20, claimed),
   'clicking "show more" did not append the next page');

// results link somewhere real
const hrefs = await page.locator('#gpSearchResults .post-box-title a').evaluateAll(
  els => els.map(a => a.getAttribute('href')));
ok(hrefs.every(h => h && !h.startsWith('#')), 'a result has no link');
await page.goto(new URL(hrefs[0], search('giàn phơi')).href, { waitUntil: 'domcontentloaded' });
ok(await page.locator('#primary h1').count() > 0, 'the first result leads to a page with no heading');

// matched terms are marked, and on the right characters
await page.goto(search('hoà phát'), { waitUntil: 'networkidle' });
const marks = await page.locator('#gpSearchResults mark').evaluateAll(
  els => els.map(m => m.textContent.toLowerCase()));
const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
ok(marks.length > 0, 'nothing was highlighted');
ok(marks.every(m => ['hoa', 'phat'].includes(fold(m))),
   `highlight landed on the wrong characters, e.g. ${JSON.stringify(marks.slice(0, 5))}`);

// an empty query is an invitation, not an error
await page.goto(`${ROOT}tim-kiem/index.html`, { waitUntil: 'networkidle' });
ok((await page.textContent('#gpSearchSummary')).includes('Nhập từ khoá'),
   'the bare search page does not prompt for a query');
ok(await page.locator('#gpSearchResults article').count() === 0,
   'the bare search page lists results');

// the index is inline, so the page works without a server too
ok(await page.locator('#gpSearchIndex').count() === 1, 'the search index is not inlined');
const inlined = await page.locator('#gpSearchIndex').evaluate(el => JSON.parse(el.textContent).length);
ok(inlined === index.length, `page has ${inlined} indexed pages, data/ has ${index.length}`);

/* ── 4. the two menu items added to the main nav ─────────────────────────── */

const EXTRA = site.extranav.map(i => i.text);

for (const [from, expectCurrent] of [
  ['', null],
  ['category/tin-tuc/', EXTRA[0]],
  ['category/tu-van-gian-phoi/', EXTRA[0]],
  ['lien-he/', EXTRA[1]],
  ['cua-hang/gian-phoi-4-thanh/', null],
]) {
  await page.goto(ROOT + from, { waitUntil: 'domcontentloaded' });
  const nav = await page.evaluate(() => ({
    items: [...document.querySelectorAll('#navigation > li')].map(li => li.textContent.trim()),
    hrefs: [...document.querySelectorAll('#navigation > li')].map(li => li.querySelector('a').getAttribute('href')),
    current: [...document.querySelectorAll('#navigation > li.current-menu-item')].map(li => li.textContent.trim()),
    drawer: [...document.querySelectorAll('#menu-danh-muc-san-pham > li')].map(li => li.textContent.trim()),
    // the bar was built for five items; all seven have to stay on one row
    rows: new Set([...document.querySelectorAll('#navigation > li')]
      .map(li => Math.round(li.getBoundingClientRect().top))).size,
  }));
  const label = from || '/';
  ok(nav.items.length === 5 + EXTRA.length, `${label}: nav has ${nav.items.length} items`);
  ok(EXTRA.every(t => nav.items.includes(t)), `${label}: nav is missing ${EXTRA.join(' / ')}`);
  ok(nav.drawer.join('|') === nav.items.join('|'), `${label}: the drawer menu does not match the bar`);
  ok(nav.hrefs.every(h => h && h !== '#'), `${label}: a nav item has no link`);
  ok(nav.rows === 1, `${label}: the nav bar wrapped onto ${nav.rows} rows at 1280px`);
  if (expectCurrent) {
    ok(nav.current.length === 1 && nav.current[0] === expectCurrent,
       `${label}: current item is ${JSON.stringify(nav.current)}, expected ${expectCurrent}`);
  } else {
    ok(!nav.current.some(t => EXTRA.includes(t)),
       `${label}: ${JSON.stringify(nav.current)} is marked current but should not be`);
  }
}

// the added items go where they say they go
await page.goto(ROOT, { waitUntil: 'domcontentloaded' });
for (const [i, want] of [[0, '/category/tin-tuc/'], [1, '/lien-he/']]) {
  await page.goto(ROOT, { waitUntil: 'domcontentloaded' });
  await page.click(`#navigation > li.menu-item-extra:nth-of-type(${6 + i}) a`);
  await page.waitForLoadState('domcontentloaded');
  ok(page.url().includes(want), `nav item ${EXTRA[i]} went to ${page.url()}`);
}

// the bar still fits at every width where the live site fits its five items
for (const w of [992, 1200, 1440, 1920]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(ROOT, { waitUntil: 'networkidle' });
  const rows = await page.evaluate(() => new Set([...document.querySelectorAll('#navigation > li')]
    .map(li => Math.round(li.getBoundingClientRect().top))).size);
  ok(rows === 1, `${w}px: the nav bar wrapped onto ${rows} rows`);
}

/* ── 5. search + cart on one row below 992px ─────────────────────────────── */

for (const w of [320, 360, 375, 390, 414, 480, 600, 768, 900, 991]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(ROOT, { waitUntil: 'networkidle' });
  const row = await page.evaluate(() => {
    const r = ['#s', '.search-submit', '.cart-header'].map(
      s => document.querySelector(s).getBoundingClientRect());
    // "one row" means every control shares most of its height with the others
    const overlaps = (a, b) =>
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > Math.min(a.height, b.height) * 0.6;
    return {
      oneRow: overlaps(r[0], r[1]) && overlaps(r[1], r[2]),
      // and in reading order, left to right. The theme pulls the submit button
      // 4px over the field on purpose so the two read as one control, so allow
      // that much overlap but no more.
      inOrder: r[0].right <= r[1].left + 5 && r[1].right <= r[2].left + 1,
      inside: r[2].right <= document.documentElement.clientWidth + 1 && r[0].left >= -1,
      widths: r.map(b => Math.round(b.width)),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  ok(row.oneRow, `${w}px: search field, button and cart are not on one row`);
  ok(row.inOrder, `${w}px: the three controls overlap or are out of order`);
  ok(row.inside, `${w}px: a control sits outside the viewport`);
  ok(row.widths[0] > 60, `${w}px: the search field collapsed to ${row.widths[0]}px`);
  ok(row.overflow <= 1, `${w}px: ${row.overflow}px of horizontal overflow`);
}

// typing and submitting still works from the compact header
await page.setViewportSize({ width: 360, height: 780 });
await page.goto(ROOT, { waitUntil: 'networkidle' });
await page.fill('#s', 'giàn phơi');
await page.click('.search-submit');
await page.waitForLoadState('networkidle');
ok(page.url().includes('tim-kiem'), `mobile search submitted to ${page.url()}`);
ok(await page.locator('#gpSearchResults article').count() > 0, 'mobile search returned nothing');

// and the cart icon is still a tap target, not a sliver
await page.goto(ROOT, { waitUntil: 'networkidle' });
const tap = await page.evaluate(() => {
  const b = document.querySelector('.cart-icon').getBoundingClientRect();
  return [Math.round(b.width), Math.round(b.height)];
});
ok(tap[0] >= 30 && tap[1] >= 28, `mobile cart icon is only ${tap.join('x')}`);

/* ── 6. the Liên hệ request form ─────────────────────────────────────────── */

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(ROOT + 'lien-he/', { waitUntil: 'networkidle' });

ok(await page.locator('#gpContactForm').count() === 1, 'no request form on /lien-he/');

// "form first": the form comes before the address list in document order, its
// column starts no lower, and it is the first thing inside the page body. The
// column is what is compared, not the form card — the card sits below its own
// heading and lead paragraph, which the address list does not have.
const order = await page.evaluate(() => {
  const form = document.querySelector('#gpContactForm');
  const box = document.querySelector('#address-box');
  const main = document.querySelector('.gp-contact__main');
  const aside = document.querySelector('.gp-contact__aside');
  if (!form || !box || !main || !aside) return null;
  const m = main.getBoundingClientRect(), a = aside.getBoundingClientRect();
  const content = form.closest('.entry-content');
  return {
    earlier: !!(form.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING),
    top: m.top <= a.top + 1,
    left: m.left <= a.left + 1,
    inContent: !!content,
    // nothing but the one-line intro may precede the form block
    firstBlock: content
      ? [...content.querySelectorAll('.gp-contact, #address-box, iframe')][0].className
          .includes('gp-contact')
      : false,
  };
});
ok(order && order.earlier, 'the address list comes before the form in the markup');
ok(order && order.top, 'the form column starts below the address column');
ok(order && order.left, 'the form column sits to the right of the address column');
ok(order && order.inContent, 'the form is not inside .entry-content');
ok(order && order.firstBlock, 'something else comes before the form block');

// and on a phone, where the two columns stack, the form is wholly above
await page.setViewportSize({ width: 390, height: 844 });
const stacked = await page.evaluate(() => {
  const f = document.querySelector('#gpContactForm').getBoundingClientRect();
  const b = document.querySelector('#address-box').getBoundingClientRect();
  return { above: f.bottom <= b.top + 1, oneCol: Math.abs(f.left - b.left) < 2 };
});
ok(stacked.oneCol, 'the two columns do not stack on a phone');
ok(stacked.above, 'the form is not above the address list on a phone');
await page.setViewportSize({ width: 1280, height: 900 });

// an empty submit marks every required field and focuses the first
await page.click('#gpContactSubmit');
ok(await page.locator('#gpContactName').evaluate(el => el.closest('.gp-field').classList.contains('has-error')),
  'empty name was accepted');
ok(await page.locator('#gpContactMessage').evaluate(el => el.closest('.gp-field').classList.contains('has-error')),
  'empty message was accepted');
ok(await page.evaluate(() => document.activeElement && document.activeElement.id) === 'gpContactName',
  'the first invalid field was not focused');
ok(await page.locator('#gpContactSuccess').isHidden(), 'an invalid form still confirmed');

// the optional email only has to be valid when it is filled in
await page.fill('#gpContactName', 'Trần Minh Tường');
await page.fill('#gpContactPhone', '0912 345 678');
await page.fill('#gpContactMessage', 'Ban công 2m, cần tư vấn giàn phơi điều khiển.');
await page.fill('#gpContactEmail', 'khong-phai-email');
await page.click('#gpContactSubmit');
ok(await page.locator('#gpContactEmail').evaluate(el => el.closest('.gp-field').classList.contains('has-error')),
  'a malformed email was accepted');

// a bad phone is caught too
await page.fill('#gpContactEmail', '');
await page.fill('#gpContactPhone', '12345');
await page.click('#gpContactSubmit');
ok(await page.locator('#gpContactPhone').evaluate(el => el.closest('.gp-field').classList.contains('has-error')),
  'a 5-digit phone was accepted');

// a complete request confirms with a code and is kept for the shop owner
await page.fill('#gpContactPhone', '0912 345 678');
await page.selectOption('#gpContactTopic', { index: 1 });
await page.fill('#gpContactAddress', 'Đường 48, Hiệp Bình Chánh');
await page.click('#gpContactSubmit');
await page.waitForSelector('#gpContactSuccess:not([hidden])', { timeout: 3000 }).catch(() => {});
ok(await page.locator('#gpContactSuccess').isVisible(), 'a valid request did not confirm');
ok(await page.locator('#gpContactForm').isHidden(), 'the form stayed on screen after sending');
const code = (await page.textContent('#gpContactCode') || '').trim();
ok(/^YC\d{6}-\d{4}$/.test(code), `request code is "${code}"`);

const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gprequests.v1') || '[]'));
ok(saved.length === 1, `${saved.length} requests stored, expected 1`);
ok(saved[0] && saved[0].code === code, 'the stored request has a different code');
ok(saved[0] && saved[0].phone === '0912 345 678', `stored phone is "${saved[0] && saved[0].phone}"`);
ok(saved[0] && saved[0].address === 'Đường 48, Hiệp Bình Chánh', 'the address was not stored');

// and the visitor can send another one
await page.click('#gpContactAgain');
ok(await page.locator('#gpContactForm').isVisible(), 'sending another request did not bring the form back');
ok(await page.inputValue('#gpContactName') === '', 'the form came back still filled in');
ok(await page.locator('.gp-field.has-error').count() === 0, 'error marks survived the reset');

// the page still carries the contact facts it is built from
const contactText = await page.textContent('#address-box');
for (const [label, value] of [['phone', contact.phone], ['email', contact.email],
                              ['address', contact.address], ['area', contact.area]]) {
  ok(contactText.includes(value), `/lien-he/ does not show the ${label} (${value})`);
}

/* ── 7. extensionless URLs and the favicon set ───────────────────────────── */

// vercel.json serves `<dir>/index.html` as `<dir>/`, so no page may link to a
// path ending in index.html — that would cost every click a 308
for (const path of ['', 'lien-he/', 'cua-hang/', 'category/tin-tuc/', 'gio-hang/']) {
  await page.goto(ROOT + path, { waitUntil: 'domcontentloaded' });
  const dirty = await page.evaluate(() =>
    [...document.querySelectorAll('a[href], form[action]')]
      .map(el => el.getAttribute('href') || el.getAttribute('action'))
      .filter(h => h && !/^https?:/i.test(h) && /index\.html(\?|#|$)/.test(h)));
  ok(dirty.length === 0, `/${path} still links to ${dirty[0]}`);
}

// the links themselves have to land somewhere
await page.goto(ROOT, { waitUntil: 'domcontentloaded' });
const navLinks = await page.evaluate(() =>
  [...document.querySelectorAll('#navigation > li > a')].map(a => a.href));
for (const href of navLinks) {
  const res = await page.request.get(href);
  ok(res.status() === 200, `${href} answered ${res.status()}`);
}

const icons = await page.evaluate(() => ({
  ico: document.querySelector('link[rel="icon"][href$=".ico"]')?.href || '',
  png32: document.querySelector('link[rel="icon"][sizes="32x32"]')?.href || '',
  png16: document.querySelector('link[rel="icon"][sizes="16x16"]')?.href || '',
  apple: document.querySelector('link[rel="apple-touch-icon"]')?.href || '',
  manifest: document.querySelector('link[rel="manifest"]')?.href || '',
  theme: document.querySelector('meta[name="theme-color"]')?.content || '',
}));
for (const [name, href] of Object.entries(icons)) {
  if (name === 'theme') continue;
  ok(!!href, `no ${name} link in <head>`);
  if (!href) continue;
  const res = await page.request.get(href);
  ok(res.status() === 200, `${name} (${href}) answered ${res.status()}`);
  ok((await res.body()).length > 0, `${name} is empty`);
}
ok(icons.theme === '#0082c6', `theme-color is "${icons.theme}"`);

const manifest = await (await page.request.get(icons.manifest)).json();
ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2,
  'the manifest lists fewer than two icons');
for (const i of manifest.icons || []) {
  const res = await page.request.get(ROOT.replace(/\/$/, '') + i.src);
  ok(res.status() === 200, `manifest icon ${i.src} answered ${res.status()}`);
}

// a page three levels down resolves its icons too — the prefix is per page
await page.goto(ROOT + 'category/tin-tuc/page/2/', { waitUntil: 'domcontentloaded' });
const deep = await page.evaluate(() => document.querySelector('link[rel="icon"][href$=".ico"]').href);
ok(new URL(deep).pathname === '/favicon.ico', `deep page points at ${deep}`);

ok(jsErrors.length === 0, `JS errors: ${jsErrors[0]}`);

await browser.close();

const total = pass + fail.length;
for (const f of fail) console.log('FAIL  ' + f);
console.log(`\n${pass}/${total} site checks passed`);
process.exit(fail.length ? 1 : 0);
