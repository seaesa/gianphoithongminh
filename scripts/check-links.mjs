/**
 * Static integrity check of the generated site: every local href/src resolves,
 * and every page the live site links to exists in the clone.
 *
 *   node scripts/check-links.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const index = JSON.parse(await fs.readFile('data/pages-index.json', 'utf8'));
let customPages = [];
try {
  customPages = JSON.parse(await fs.readFile('data/custom.json', 'utf8')).pages;
} catch {}
const seen = new Set();
const pages = [{ path: 'index.html', url: 'https://thegioigianphoi.vn/' }, ...index, ...customPages]
  .filter(p => !seen.has(p.path) && seen.add(p.path));

const exists = new Map();
async function ok(p) {
  if (exists.has(p)) return exists.get(p);
  let v = false;
  try { v = (await fs.stat(p)).isFile(); } catch {}
  exists.set(p, v);
  return v;
}

const ATTR = /(?:href|src)="([^"]+)"/g;
const SRCSET = /srcset="([^"]+)"/g;

let checked = 0, missing = 0, external = 0, hashes = 0, marker = 0;
const bad = new Map();

for (const page of pages) {
  const html = await fs.readFile(page.path, 'utf8');
  const dir = path.dirname(page.path);

  if (html.includes('@@ROOT@@')) { marker++; bad.set(page.path + ' :: unresolved @@ROOT@@ marker', 1); }

  const refs = [];
  for (const m of html.matchAll(ATTR)) refs.push(m[1]);
  for (const m of html.matchAll(SRCSET)) {
    for (const part of m[1].split(',')) {
      const bits = part.trim().split(/\s+/);
      if (bits[0]) refs.push(bits[0]);
    }
  }

  for (const raw of refs) {
    const ref = raw.trim();
    if (!ref) continue;
    if (ref === '#' || ref.startsWith('#')) { hashes++; continue; }
    if (/^(https?:)?\/\//i.test(ref) || /^(mailto|tel|data|javascript):/i.test(ref)) { external++; continue; }
    checked++;
    const target = path.normalize(path.join(dir, decodeURIComponent(ref.split('#')[0].split('?')[0])));
    // links point at directories now (`/lien-he/`), which both Vercel and
    // http.server answer with the index.html inside them
    if (!(await ok(target)) && !(await ok(path.join(target, 'index.html')))) {
      missing++;
      const key = `${target}  ← ${page.path}`;
      bad.set(key, (bad.get(key) || 0) + 1);
    }
  }
}

// every live page we know about should have been generated
const generated = new Set(pages.map(p => p.path));
let ungenerated = 0;
for (const r of index) if (!generated.has(r.path)) ungenerated++;

console.log(`pages        ${pages.length}`);
console.log(`local refs   ${checked} checked, ${missing} missing`);
console.log(`external     ${external}   in-page anchors ${hashes}`);
console.log(`unresolved markers ${marker}   ungenerated pages ${ungenerated}`);
if (bad.size) {
  console.log('\nbroken:');
  for (const [k, n] of [...bad].slice(0, 40)) console.log(`  ${k}${n > 1 ? `  ×${n}` : ''}`);
  if (bad.size > 40) console.log(`  … ${bad.size - 40} more`);
}
process.exit(missing || marker || ungenerated ? 1 : 0);
