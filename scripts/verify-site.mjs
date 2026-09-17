/**
 * Verifies the site chrome this clone fixes rather than clones: the cart icon,
 * the footer's Facebook card, and search.
 *
 *   node scripts/verify-site.mjs        # needs scripts/serve.sh running
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const ROOT = 'http://127.0.0.1:8777/';
const contact = JSON.parse(await fs.readFile('data/contact.json', 'utf8'));
const index = JSON.parse(await fs.readFile('data/search-index.json', 'utf8'));

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

ok(jsErrors.length === 0, `JS errors: ${jsErrors[0]}`);

await browser.close();

const total = pass + fail.length;
for (const f of fail) console.log('FAIL  ' + f);
console.log(`\n${pass}/${total} site checks passed`);
process.exit(fail.length ? 1 : 0);
