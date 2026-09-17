/**
 * Downloads every asset referenced by the crawled pages into assets/.
 * Incremental: files already on disk are skipped. Run collect-assets.py first.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const manifest = JSON.parse(await fs.readFile('.work/assets.json', 'utf8'));

const jobs = [];
for (const [url, local] of Object.entries(manifest.map)) {
  const abs = url.startsWith('//') ? 'https:' + url
            : url.startsWith('http') ? url
            : 'https://thegioigianphoi.vn' + (url.startsWith('/') ? '' : '/') + url;
  jobs.push([abs, local]);
}
// theme stylesheet backgrounds + Font Awesome
for (const rel of manifest.css) {
  if (rel.startsWith('data:') || rel.startsWith('http')) continue;
  jobs.push(['https://thegioigianphoi.vn/wp-content/themes/hrm/' + rel, 'assets/theme/' + rel]);
}
for (const f of ['fontawesome-webfont.woff2', 'fontawesome-webfont.woff', 'fontawesome-webfont.ttf',
                 'FontAwesome.otf', 'fontawesome-webfont.eot', 'fontawesome-webfont.svg']) {
  jobs.push(['https://thegioigianphoi.vn/wp-content/themes/hrm/fonts/' + f, 'assets/fonts/' + f]);
}
jobs.push(['https://thegioigianphoi.vn/wp-content/themes/hrm/css/font-awesome.min.css', 'assets/vendor/font-awesome.min.css']);

let ok = 0, skip = 0, fail = 0;
const failures = [];

async function one([url, local]) {
  try {
    try { const st = await fs.stat(local); if (st.size > 0) { skip++; return; } } catch {}
    await fs.mkdir(path.dirname(local), { recursive: true });
    const r = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://thegioigianphoi.vn/' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    if (!buf.length) throw new Error('empty');
    await fs.writeFile(local, buf);
    ok++;
  } catch (e) { fail++; failures.push(`${url} :: ${e.message || e}`); }
}

for (let i = 0; i < jobs.length; i += 8) {
  await Promise.all(jobs.slice(i, i + 8).map(one));
  process.stdout.write(`\r  ${ok + skip + fail}/${jobs.length}   `);
}
await fs.writeFile('.work/asset-failures.txt', failures.join('\n'));
console.log(`\ndownloaded ${ok}, cached ${skip}, failed ${fail} (see .work/asset-failures.txt)`);
