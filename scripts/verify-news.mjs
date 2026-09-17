/**
 * Verifies the imported news section.
 *
 * These pages have no live counterpart — they carry gianphoichinhhang.com's
 * articles inside thegioigianphoi.vn's chrome — so verify-pages.mjs skips them.
 * This checks them on their own terms instead: every page loads clean, every
 * image decodes, the pagination actually walks, and nothing overflows on a
 * phone.
 *
 *   node scripts/verify-news.mjs            # needs scripts/serve.sh running
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const ROOT = 'http://127.0.0.1:8777/';
const index = JSON.parse(await fs.readFile('data/pages-index.json', 'utf8'));
const news = JSON.parse(await fs.readFile('data/news.json', 'utf8'));
const pages = index.filter(r => r.cloneOnly && r.kind !== 'page');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

let pass = 0;
const fail = [];
const ok = (cond, what) => { cond ? pass++ : fail.push(what); };

// ── every generated news page ───────────────────────────────────────────────
for (const r of pages) {
  let responses = [];
  const jsErrors = [];
  page.removeAllListeners('response');
  page.removeAllListeners('pageerror');
  page.on('response', x => { if (x.status() >= 400) responses.push(`${x.status()} ${x.url()}`); });
  page.on('pageerror', e => jsErrors.push(String(e)));

  await page.goto(ROOT + r.path, { waitUntil: 'networkidle' });
  const info = await page.evaluate(() => ({
    h1: document.querySelector('#primary h1')?.textContent.trim() || '',
    broken: [...document.images].filter(i => i.getAttribute('src') && i.complete && i.naturalWidth === 0).length,
    images: document.images.length,
    // an un-decoded HTML entity in the visible text means the import mangled it
    entities: /&[a-z]{2,8};|&#\d+;/.test(document.body.innerText),
    // `href="#"` is genuine theme markup in the share strip, the fake author
    // byline and the comment-form cancel link — anywhere else it means a link
    // the generator failed to resolve.
    deadLinks: [...document.querySelectorAll('#primary a[href="#"]')]
      .filter(a => !a.closest('.hrm-social-share, .post-meta-author, .comment-reply-title'))
      .length,
  }));

  ok(info.h1.length > 0, `${r.path}: no <h1>`);
  ok(info.broken === 0, `${r.path}: ${info.broken} broken images`);
  ok(!info.entities, `${r.path}: undecoded HTML entities in the text`);
  ok(responses.length === 0, `${r.path}: ${responses.slice(0, 2).join(', ')}`);
  ok(jsErrors.length === 0, `${r.path}: ${jsErrors[0]}`);
  ok(info.deadLinks === 0, `${r.path}: ${info.deadLinks} href="#" links in main`);
}
console.log(`${pages.length} news pages loaded`);

// ── the feed itself ─────────────────────────────────────────────────────────
const posts = index.filter(r => r.kind === 'post');
ok(posts.length === news.posts.length,
   `generated ${posts.length} post pages for ${news.posts.length} posts`);

// ── pagination actually walks ───────────────────────────────────────────────
for (const cat of ['tin-tuc', 'tu-van-gian-phoi']) {
  await page.goto(`${ROOT}category/${cat}/`, { waitUntil: 'networkidle' });

  const first = await page.evaluate(() => ({
    current: document.querySelector('.hrm-pagenavi .current')?.textContent.trim(),
    prev: document.querySelectorAll('.hrm-pagenavi .prev').length,
    next: document.querySelectorAll('.hrm-pagenavi .next').length,
    cards: document.querySelectorAll('article.item-list').length,
    titles: [...document.querySelectorAll('.post-box-title a')].map(a => a.textContent.trim()),
  }));
  ok(first.current === '1', `${cat}: page 1 is not marked current`);
  ok(first.prev === 0, `${cat}: page 1 shows a "previous" arrow`);
  ok(first.next === 1, `${cat}: page 1 has no "next" arrow`);
  ok(first.cards === 6, `${cat}: page 1 lists ${first.cards} posts, expected 6`);

  await page.locator('.hrm-pagenavi a.next').click();
  await page.waitForLoadState('networkidle');

  const second = await page.evaluate(() => ({
    url: location.pathname,
    current: document.querySelector('.hrm-pagenavi .current')?.textContent.trim(),
    prev: document.querySelectorAll('.hrm-pagenavi .prev').length,
    cards: document.querySelectorAll('article.item-list').length,
    titles: [...document.querySelectorAll('.post-box-title a')].map(a => a.textContent.trim()),
  }));
  ok(second.url.includes('/page/2/'), `${cat}: "next" did not reach page 2 (${second.url})`);
  ok(second.current === '2', `${cat}: page 2 is not marked current`);
  ok(second.prev === 1, `${cat}: page 2 has no "previous" arrow`);
  ok(second.cards > 0, `${cat}: page 2 is empty`);
  ok(!second.titles.some(t => first.titles.includes(t)),
     `${cat}: page 2 repeats a post from page 1`);

  // the whole category is covered exactly once across its pages
  const expected = news.posts.filter(p => p.category.slug === cat).length;
  ok(first.titles.length + second.titles.length === expected,
     `${cat}: ${first.titles.length + second.titles.length} posts across 2 pages, expected ${expected}`);
}

// ── a post reaches its category, its tags and its peers ─────────────────────
await page.goto(ROOT + posts[0].path, { waitUntil: 'networkidle' });
const post = await page.evaluate(() => ({
  cat: document.querySelector('.post-cats a')?.getAttribute('href') || '',
  tags: document.querySelectorAll('.tags-links a').length,
  related: document.querySelectorAll('.related-post ul.related > li').length,
  hero: !!document.querySelector('.entry-content p.post-hero img'),
  figures: document.querySelectorAll('.entry-content figure').length,
}));
ok(post.cat.includes('category/'), 'post does not link to its category');
ok(post.related > 0 && post.related <= 5, `post shows ${post.related} related items`);
ok(post.hero, 'post has no hero image');

// ── the sidebar widget follows the new feed ─────────────────────────────────
const widget = await page.evaluate(() =>
  [...document.querySelectorAll('#hrm-recent-posts-widget-2 .hrm-title')].map(a => a.textContent.trim()));
ok(widget.length === 10, `sidebar lists ${widget.length} recent posts, expected 10`);
ok(widget[0] === news.posts.slice().sort((a, b) => b.id - a.id)[0].title,
   'sidebar does not lead with the newest post');

// ── nothing overflows a phone ───────────────────────────────────────────────
await page.setViewportSize({ width: 320, height: 800 });
for (const p of [posts[0].path, 'category/tin-tuc/index.html']) {
  await page.goto(ROOT + p, { waitUntil: 'networkidle' });
  const over = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(over <= 1, `${p}: ${over}px of horizontal overflow at 320px`);
}

await browser.close();

const total = pass + fail.length;
for (const f of fail) console.log('FAIL  ' + f);
console.log(`\n${pass}/${total} news checks passed`);
process.exit(fail.length ? 1 : 0);
