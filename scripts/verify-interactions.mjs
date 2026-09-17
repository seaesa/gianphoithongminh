/**
 * Drives the same interactions on the live site and the clone, then diffs the
 * resulting computed styles / DOM state. Covers hover, click and scroll.
 *
 *   node scripts/verify-interactions.mjs
 */
import { chromium } from 'playwright';

const TARGETS = {
  original: 'https://thegioigianphoi.vn/',
  clone: 'http://127.0.0.1:8777/index.html'
};

const css = (page, sel, props) => page.evaluate(([s, p]) => {
  const el = document.querySelector(s);
  if (!el) return 'MISSING';
  const c = getComputedStyle(el);
  return p.map(x => x + '=' + c.getPropertyValue(x)).join(' ');
}, [sel, props]);

async function desktopChecks(page) {
  const r = {};
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1200);

  // --- header nav hover -----------------------------------------------------
  r['nav li rest'] = await css(page, '#navigation > li', ['background-color']);
  await page.hover('#navigation > li:nth-child(2) > a');
  await page.waitForTimeout(700);
  r['nav li hover'] = await css(page, '#navigation > li:nth-child(2)', ['background-color']);
  r['nav a hover'] = await css(page, '#navigation > li:nth-child(2) > a', ['color', 'border-right-color']);

  // --- cart dropdown --------------------------------------------------------
  r['cart rest'] = await css(page, '.cart-container-list', ['transform', 'height', 'background-color']);
  await page.hover('.cart-header');
  await page.waitForTimeout(600);
  r['cart hover'] = await css(page, '.cart-container-list', ['transform', 'background-color', 'padding-top', 'box-shadow']);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);

  // --- search + cart icon ---------------------------------------------------
  await page.hover('.search-submit');
  await page.waitForTimeout(600);
  r['search btn hover'] = await css(page, '.search-submit', ['background-color', 'color']);
  await page.hover('.cart-icon');
  await page.waitForTimeout(600);
  r['cart icon hover'] = await css(page, '.cart-icon', ['background-color']);

  // --- social icon in the top bar ------------------------------------------
  await page.hover('.top-header .social-media li a');
  await page.waitForTimeout(600);
  r['topbar social hover'] = await css(page, '.top-header .social-media li a', ['opacity', 'background-color', 'color']);

  // --- product card ---------------------------------------------------------
  const card = '#cat1_hrm_tab_products-4 .item-product:nth-child(1) .product-loop-inner';
  r['card rest'] = await css(page, card, ['border-top-width', 'border-top-color']);
  r['card img rest'] = await css(page, card + ' .thumb-outter img', ['transform']);
  r['card overlay rest'] = await css(page, card + ' .link-to-product', ['bottom', 'margin-bottom', 'background-color']);
  await page.hover(card + ' .thumb-outter');
  await page.waitForTimeout(800);
  r['card hover'] = await css(page, card, ['border-top-width', 'border-top-color']);
  r['card img hover'] = await css(page, card + ' .thumb-outter img', ['transform']);
  r['card overlay hover'] = await css(page, card + ' .link-to-product', ['bottom', 'margin-bottom', 'background-color']);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);

  // --- add-to-cart button (display:none in the homepage grid on both sites) --
  r['cart btn rest'] = await css(page, 'a.add_to_cart_button',
    ['display', 'background-color', 'color', 'padding-top', 'padding-left', 'font-weight', 'line-height']);

  // --- product tabs ---------------------------------------------------------
  const tabState = () => page.evaluate(() => {
    const w = document.querySelector('#hrm_tab_products-3');
    return {
      activeTab: [...w.querySelectorAll('.nav-tabs > li')].findIndex(li => li.classList.contains('active')),
      activePane: [...w.querySelectorAll('.tab-pane')].map(p => p.classList.contains('active')),
      visible: [...w.querySelectorAll('.tab-pane')].map(p => getComputedStyle(p).display),
      opacity: [...w.querySelectorAll('.tab-pane')].map(p => getComputedStyle(p).opacity)
    };
  });
  r['tabs initial'] = JSON.stringify(await tabState());
  r['tab li rest'] = await css(page, '#hrm_tab_products-3 .nav-tabs > li:nth-child(2) > a', ['background-color', 'color']);
  await page.hover('#hrm_tab_products-3 .nav-tabs > li:nth-child(2) > a');
  await page.waitForTimeout(600);
  r['tab li hover'] = await css(page, '#hrm_tab_products-3 .nav-tabs > li:nth-child(2) > a', ['background-color', 'color']);
  await page.click('#hrm_tab_products-3 .nav-tabs > li:nth-child(2) > a');
  await page.waitForTimeout(700);
  r['tabs after click 2'] = JSON.stringify(await tabState());
  await page.click('#hrm_tab_products-3 .nav-tabs > li:nth-child(3) > a');
  await page.waitForTimeout(700);
  r['tabs after click 3'] = JSON.stringify(await tabState());
  await page.click('#hrm_tab_products-3 .nav-tabs > li:nth-child(1) > a');
  await page.waitForTimeout(700);
  r['tabs back to 1'] = JSON.stringify(await tabState());

  // --- sidebar + footer links ----------------------------------------------
  await page.hover('#nav_menu-4 ul.menu > li:nth-child(2) > a');
  await page.waitForTimeout(600);
  r['sidebar link hover'] = await css(page, '#nav_menu-4 ul.menu > li:nth-child(2) > a', ['color', 'background-color', 'padding-left']);
  await page.hover('#footer-sidebar-3 ul.menu > li:nth-child(1) > a');
  await page.waitForTimeout(600);
  r['footer link hover'] = await css(page, '#footer-sidebar-3 ul.menu > li:nth-child(1) > a', ['color', 'padding-left']);
  await page.hover('.hrm-social-networks a.hrm-facebook');
  await page.waitForTimeout(600);
  r['footer social hover'] = await css(page, '.hrm-social-networks a.hrm-facebook', ['background-color']);

  // --- back to top ----------------------------------------------------------
  r['topcontrol at 0'] = await css(page, '#topcontrol', ['bottom', 'background-color']);
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(900);
  r['topcontrol scrolled'] = await css(page, '#topcontrol', ['bottom']);
  await page.hover('#topcontrol');
  await page.waitForTimeout(600);
  r['topcontrol hover'] = await css(page, '#topcontrol', ['background-color']);
  await page.click('#topcontrol');
  await page.waitForTimeout(1400);
  r['scroll after topcontrol click'] = String(await page.evaluate(() => Math.round(window.pageYOffset)));
  r['topcontrol back at 0'] = await css(page, '#topcontrol', ['bottom']);

  // --- slider ---------------------------------------------------------------
  r['slider'] = await page.evaluate(() => JSON.stringify({
    loaded: document.querySelector('.home-slider')?.classList.contains('owl-loaded'),
    items: document.querySelectorAll('.home-slider .owl-item').length,
    cloned: document.querySelectorAll('.home-slider .owl-item.cloned').length,
    active: document.querySelectorAll('.home-slider .owl-item.active').length,
    navDisabled: document.querySelector('.owl-nav')?.classList.contains('disabled'),
    dotsDisabled: document.querySelector('.owl-dots')?.classList.contains('disabled'),
    dots: document.querySelectorAll('.owl-dot').length
  }));
  return r;
}

async function mobileChecks(page) {
  const r = {};
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  const menuState = () => page.evaluate(() => ({
    panelLeft: Math.round(parseFloat(getComputedStyle(document.querySelector('.menu-responsive')).left)),
    overlayOpen: document.querySelector('.menu-responsive-overlay').classList.contains('open-mn'),
    overlayW: getComputedStyle(document.querySelector('.menu-responsive-overlay')).width,
    openBtn: getComputedStyle(document.querySelector('.menu-open')).display,
    closeBtn: getComputedStyle(document.querySelector('.menu-close-2')).display,
    navDisplay: getComputedStyle(document.querySelector('#site-navigation')).display,
    tabsDisplay: getComputedStyle(document.querySelector('.has_title ul.nav-tabs')).display
  }));

  r['menu closed'] = JSON.stringify(await menuState());
  await page.click('.menu-open');
  await page.waitForTimeout(800);
  r['menu opened'] = JSON.stringify(await menuState());
  r['menu link hover'] = await css(page, '.menu-responsive ul li a', ['color', 'font-size', 'padding-top']);
  await page.click('.menu-responsive-overlay', { position: { x: 350, y: 400 } });
  await page.waitForTimeout(800);
  r['menu closed via overlay'] = JSON.stringify(await menuState());

  await page.click('.menu-open');
  await page.waitForTimeout(800);
  await page.click('.menu-close');
  await page.waitForTimeout(800);
  r['menu closed via header'] = JSON.stringify(await menuState());

  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(900);
  r['btn-scrolled'] = String(await page.evaluate(() => document.querySelector('.menu-close-2').classList.contains('btn-scrolled')));
  r['topcontrol mobile'] = await css(page, '#topcontrol', ['bottom']);
  return r;
}

const browser = await chromium.launch();
const results = {};
for (const [name, url] of Object.entries(TARGETS)) {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  results[name] = { ...(await desktopChecks(page)), ...(await mobileChecks(page)) };
  await page.close();
}
await browser.close();

/**
 * Interactions the clone answers differently on purpose. The cart control is
 * painted in the site's primary blue rather than the theme's green
 * (components/site-fixes.spec.md §9), so its hover colour cannot match — but it
 * still has to *have* one, which is what the assertion below checks.
 */
const EXPECTED = {
  'cart icon hover': v => /background-color=rgb\(0, 102, 156\)/.test(v),
};

const keys = Object.keys(results.original);
let bad = 0;
for (const k of keys) {
  const a = results.original[k], b = results.clone[k];
  let same = a === b;
  let note = '';
  if (!same && EXPECTED[k]) {
    same = EXPECTED[k](b);
    note = same ? '  (recoloured on purpose)' : '';
  }
  if (!same) bad++;
  console.log(`${same ? 'OK  ' : 'DIFF'}  ${k}${note}`);
  if (!same) {
    console.log(`        orig : ${a}`);
    console.log(`        clone: ${b}`);
  }
}
console.log(`\n${keys.length - bad}/${keys.length} interaction checks match`);
process.exit(bad ? 1 : 0);
