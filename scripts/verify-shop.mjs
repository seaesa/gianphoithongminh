/**
 * End-to-end test of the features this clone adds: add to cart, cart page,
 * checkout with both payment methods, and the quick-order modal.
 *
 *   node scripts/verify-shop.mjs
 */
import { chromium } from 'playwright';

const ROOT = 'http://127.0.0.1:8777/';
const PRODUCT = ROOT + 'cua-hang/gian-phoi-4-thanh/index.html';
const PRODUCT2 = ROOT + 'cua-hang/gian-phoi-chuong-co/index.html';

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log(`OK    ${name}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? '\n        ' + detail : ''}`); }
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));

const cart = () => page.evaluate(() => window.GPCart.items());
const count = () => page.evaluate(() => window.GPCart.count());

/* ── 1. add to cart from a product page ─────────────────────────────── */
await page.goto(PRODUCT, { waitUntil: 'load' });
await page.waitForTimeout(700);

check('GPCart is available', await page.evaluate(() => typeof window.GPCart === 'object'));
check('cart starts empty', (await count()) === 0);

await page.click('.quantity .quantity-plus');            // qty 1 -> 2
await page.click('button.single_add_to_cart_button');
await page.waitForTimeout(500);

let items = await cart();
check('add to cart stores one line', items.length === 1, JSON.stringify(items));
check('quantity respected (2)', items[0] && items[0].qty === 2, JSON.stringify(items[0]));
check('price captured', items[0] && items[0].price === 2000000, String(items[0] && items[0].price));
check('title captured', items[0] && items[0].title === 'Giàn Phơi 4 Thanh', items[0] && items[0].title);
check('toast shown', await page.isVisible('.gp-toast.is-visible'));
check('header badge shows 2', (await page.textContent('.cart-count')) === '2');

/* adding the same product again merges into the same line; the quantity box
   keeps its value, so this adds 2 more rather than 1 (WooCommerce behaviour) */
await page.click('button.single_add_to_cart_button');
await page.waitForTimeout(400);
items = await cart();
check('re-adding merges into one line', items.length === 1 && items[0].qty === 4, JSON.stringify(items));

/* ── 2. persistence across navigation ───────────────────────────────── */
await page.goto(PRODUCT2, { waitUntil: 'load' });
await page.waitForTimeout(600);
check('cart survives navigation', (await count()) === 4);
await page.click('button.single_add_to_cart_button');
await page.waitForTimeout(400);
items = await cart();
check('second product added', items.length === 2, JSON.stringify(items.map(i => i.title)));
check('header badge shows 5', (await page.textContent('.cart-count')) === '5');

/* mini-cart dropdown content */
await page.hover('.cart-header');
await page.waitForTimeout(500);
check('mini-cart lists 2 items', (await page.$$('.cart-header .cart_list .mini-cart-item')).length === 2);
check('mini-cart has a checkout link', await page.isVisible('.mini-cart-foot .button.checkout'));

/* ── 3. cart page ───────────────────────────────────────────────────── */
await page.goto(ROOT + 'gio-hang/index.html', { waitUntil: 'load' });
await page.waitForTimeout(600);

check('cart page shows rows', (await page.$$('#gpCartRows tr')).length === 2);
check('cart page hides the empty state', await page.isHidden('#gpCartEmpty'));
let total = await page.textContent('#gpCartTotal');
check('cart total = 4×2.000.000 + 1×1.750.000', total.replace(/\s/g, '') === '9,750,000₫', total);

await page.click('#gpCartRows tr:first-child [data-step="-1"]');
await page.waitForTimeout(400);
items = await cart();
check('minus button decrements', items[0].qty === 3, JSON.stringify(items[0]));

await page.fill('#gpCartRows tr:first-child .gp-qty input', '5');
await page.dispatchEvent('#gpCartRows tr:first-child .gp-qty input', 'change');
await page.waitForTimeout(400);
items = await cart();
check('typing a quantity updates the line', items[0].qty === 5, JSON.stringify(items[0]));

await page.click('#gpCartRows tr:last-child .gp-cart-remove');
await page.waitForTimeout(400);
items = await cart();
check('remove drops the line', items.length === 1, JSON.stringify(items.map(i => i.title)));

/* ── 4. checkout ────────────────────────────────────────────────────── */
await page.goto(ROOT + 'thanh-toan/index.html', { waitUntil: 'load' });
await page.waitForTimeout(600);

check('checkout shows the form', await page.isVisible('#gpCheckoutWrap'));
check('summary lists the cart', (await page.$$('#gpSummaryList li')).length === 1);
check('COD selected by default', await page.isChecked('input[name="payment"][value="cod"]'));
check('bank details hidden initially', await page.isHidden('#gpBankDetail'));

/* validation blocks an empty submit */
await page.click('#gpPlaceOrder');
await page.waitForTimeout(400);
check('empty submit is blocked', await page.isVisible('#gpCheckoutWrap'));
check('name field flagged', (await page.getAttribute('#gpName ~ .gp-error', 'class')) !== null
  && await page.evaluate(() => document.querySelector('#gpName').closest('.gp-field').classList.contains('has-error')));

/* bad phone is rejected */
await page.fill('#gpName', 'Nguyễn Văn A');
await page.fill('#gpPhone', '123');
await page.click('#gpPlaceOrder');
await page.waitForTimeout(300);
check('invalid phone rejected', await page.evaluate(() =>
  document.querySelector('#gpPhone').closest('.gp-field').classList.contains('has-error')));

/* province → ward cascade */
await page.selectOption('#gpProvince', 'Hà Nội');
await page.waitForTimeout(300);
const wardCount = (await page.$$('#gpWard option')).length;
check('wards populate for the province', wardCount === 11, `options=${wardCount}`);
check('ward select enabled', !(await page.isDisabled('#gpWard')));

/* bank transfer reveals details + confirmation */
await page.check('input[name="payment"][value="bank"]');
await page.waitForTimeout(400);
check('bank details revealed', await page.isVisible('#gpBankDetail'));
check('bank option highlighted', await page.evaluate(() =>
  document.querySelector('.gp-pay__option[data-method="bank"]').classList.contains('is-active')));
check('QR placeholder present', await page.isVisible('#gpBankDetail .gp-bank__qr svg'));
check('confirm checkbox revealed', await page.isVisible('#gpConfirmWrap'));

await page.fill('#gpPhone', '0912345678');
await page.selectOption('#gpWard', { index: 1 });
await page.fill('#gpAddress', '12 Đỗ Đức Dục, Nam Từ Liêm');
await page.click('#gpPlaceOrder');
await page.waitForTimeout(400);
check('bank order blocked until confirmed', await page.isVisible('#gpCheckoutWrap'));
check('confirmation error shown', await page.isVisible('#gpConfirmError'));

await page.check('#gpConfirm');
await page.click('#gpPlaceOrder');
await page.waitForTimeout(700);

check('order succeeds', await page.isVisible('#gpCheckoutSuccess'));
const code = (await page.textContent('#gpOrderCode')) || '';
check('order code generated', /^HP\d{6}-\d{4}$/.test(code.trim()), code);
check('method reported as bank transfer', (await page.textContent('#gpOrderMethod')).includes('chuyển khoản'));
check('cart cleared after ordering', (await count()) === 0);
check('order persisted', await page.evaluate(() =>
  JSON.parse(localStorage.getItem('gporders.v1') || '[]').length === 1));

/* ── 5. COD path ────────────────────────────────────────────────────── */
await page.goto(PRODUCT, { waitUntil: 'load' });
await page.waitForTimeout(500);
await page.click('button.single_add_to_cart_button');
await page.goto(ROOT + 'thanh-toan/index.html', { waitUntil: 'load' });
await page.waitForTimeout(600);
await page.fill('#gpName', 'Trần Thị B');
await page.fill('#gpPhone', '0987654321');
await page.selectOption('#gpProvince', 'TP. Hồ Chí Minh');
await page.waitForTimeout(250);
await page.selectOption('#gpWard', { index: 1 });
await page.fill('#gpAddress', '20 Đường 2, Thủ Đức');
await page.click('#gpPlaceOrder');
await page.waitForTimeout(700);
check('COD order succeeds', await page.isVisible('#gpCheckoutSuccess'));
check('method reported as COD', (await page.textContent('#gpOrderMethod')).includes('COD'));
check('two orders stored', await page.evaluate(() =>
  JSON.parse(localStorage.getItem('gporders.v1') || '[]').length === 2));

/* ── 6. empty-cart states ───────────────────────────────────────────── */
await page.goto(ROOT + 'gio-hang/index.html', { waitUntil: 'load' });
await page.waitForTimeout(500);
check('empty cart page shows the empty state', await page.isVisible('#gpCartEmpty'));
check('empty cart hides the table', await page.isHidden('#gpCartFilled'));
check('no badge when empty', (await page.$('.cart-count')) === null);

await page.goto(ROOT + 'thanh-toan/index.html', { waitUntil: 'load' });
await page.waitForTimeout(500);
check('empty checkout shows the empty state', await page.isVisible('#gpCheckoutEmpty'));

/* ── 7. quick-order modal ───────────────────────────────────────────── */
await page.goto(PRODUCT, { waitUntil: 'load' });
await page.waitForTimeout(600);
check('no ninja_forms shortcode left', !(await page.content()).includes('[ninja_forms'));

await page.click('.btn-dathang');
await page.waitForTimeout(600);
check('modal opens', await page.isVisible('#myModal'));
check('quick-order form rendered', await page.isVisible('#gpQuickForm'));
const quickTotal = await page.textContent('#gpQuickTotal');
check('quick-order total prefilled', quickTotal.replace(/\s/g, '') === '2,000,000₫', quickTotal);

await page.click('#gpQuickForm [data-quick-step="1"]');
await page.waitForTimeout(250);
check('quick-order total follows quantity',
  (await page.textContent('#gpQuickTotal')).replace(/\s/g, '') === '4,000,000₫');

await page.click('#gpQuickForm button[type="submit"]');
await page.waitForTimeout(400);
check('quick-order validates', await page.isVisible('#gpQuickForm'));
check('quick-order flags the name', await page.evaluate(() =>
  document.querySelector('#gpQuickName').closest('.gp-field').classList.contains('has-error')));

await page.fill('#gpQuickName', 'Lê Văn C');
await page.fill('#gpQuickPhone', '0901234567');
await page.fill('#gpQuickAddress', '146 Mễ Trì Thượng');
await page.click('#gpQuickForm button[type="submit"]');
await page.waitForTimeout(600);
check('quick-order succeeds', await page.isVisible('#gpQuickSuccess'));
check('quick-order code shown', /^HP\d{6}-\d{4}$/.test(
  ((await page.textContent('#gpQuickSuccess .gp-order-code')) || '').trim()));
check('three orders stored', await page.evaluate(() =>
  JSON.parse(localStorage.getItem('gporders.v1') || '[]').length === 3));

await page.keyboard.press('Escape');
await page.waitForTimeout(500);
check('modal closes on Escape', await page.isHidden('#myModal'));

/* ── 8. xếp ngang category page ─────────────────────────────────────── */
await page.goto(ROOT + 'danh-muc/gian-phoi-xep-ngang/index.html', { waitUntil: 'load' });
await page.waitForTimeout(600);
check('category page renders', (await page.textContent('h1.page-title')).trim() === 'GIÀN PHƠI XẾP NGANG');
const cards = (await page.$$('ul.products > li.product')).length;
check('category lists 8 products', cards === 8, `cards=${cards}`);
check('nav item highlighted', await page.evaluate(() =>
  !!document.querySelector('#navigation > li.current-menu-item a') &&
  document.querySelector('#navigation > li.current-menu-item a').textContent.includes('XẾP NGANG')));
const broken = await page.evaluate(() =>
  [...document.images]
    .filter(i => i.getAttribute('src'))           // skip the Zalo <img src=""> the live site ships
    .filter(i => i.complete && i.naturalWidth === 0)
    .map(i => i.getAttribute('src')));
check('all category images load', broken.length === 0, broken.join(' | '));
// links are extensionless now — `../cua-hang/<slug>/` (see scripts/clean-urls.py)
check('cards link to real products', await page.evaluate(() =>
  [...document.querySelectorAll('ul.products .woocommerce-LoopProduct-link')]
    .every(a => /cua-hang\/[^/]+\/$/.test(a.getAttribute('href')))));

/* ── 9. private-mode resilience ─────────────────────────────────────── */
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p2 = await ctx2.newPage();
await p2.addInitScript(() => {
  Object.defineProperty(window, 'localStorage', {
    get() { throw new DOMException('blocked'); }
  });
});
const err2 = [];
p2.on('pageerror', e => err2.push(String(e.message)));
await p2.goto(PRODUCT, { waitUntil: 'load' });
await p2.waitForTimeout(600);
await p2.click('button.single_add_to_cart_button');
await p2.waitForTimeout(400);
check('works with localStorage blocked', (await p2.evaluate(() => window.GPCart.count())) === 1,
  err2.join(' | '));
check('no page errors with storage blocked', err2.length === 0, err2.join(' | '));
await ctx2.close();

check('no JS errors anywhere', errors.length === 0, errors.join(' | '));

await browser.close();
console.log(`\n${pass}/${pass + fail} shop checks passed`);
process.exit(fail ? 1 : 0);
