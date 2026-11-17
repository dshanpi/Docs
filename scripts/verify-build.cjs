const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const thumbnails = require('../plugins/blog-catalog/thumbnails.json');
const root = path.resolve(__dirname, '..');
const build = path.join(root, 'build');

function exists(file) {
  assert(fs.existsSync(file), 'Missing build input/output: ' + path.relative(root, file));
}
function dimensions(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  }
  assert(bytes[0] === 0xff && bytes[1] === 0xd8, 'Thumbnail must be JPEG or PNG');
  let offset = 2;
  while (offset < bytes.length) {
    assert(bytes[offset++] === 0xff, 'Invalid JPEG segment');
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    const length = bytes.readUInt16BE(offset);
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
      return [bytes.readUInt16BE(offset + 5), bytes.readUInt16BE(offset + 3)];
    }
    offset += length;
  }
  throw new Error('Cannot read thumbnail dimensions');
}

for (const [id, thumbnail] of Object.entries(thumbnails)) {
  assert(['cover','contain'].includes(thumbnail.fit), 'Invalid thumbnail fit: ' + id);
  exists(path.join(root, thumbnail.source));
  const source = path.join(root, 'static', thumbnail.src);
  exists(source);
  const [width, height] = dimensions(fs.readFileSync(source));
  assert(width >= 16 && height >= 16, 'Thumbnail is too small or corrupt: ' + id);
  assert(width <= 1200 && height <= 1200, 'Thumbnail must be optimized: ' + id);
  exists(path.join(build, thumbnail.src));
}

const routes = [
  '', 'blog', 'blog/archive', 'blog/tags', 'blog/page/2',
  'docs/DshanPi-A1/intro', 'docs/DshanPi-A1_CM5/intro',
  'docs/DshanPi-A1_CM5/Reference/Hardware',
  'docs/DshanPi-A1_CM5/QuickStart/BoardExplorer', 'cm5/explorer',
];

function resolveRoute(url) {
  const pathname = decodeURIComponent(url.split(/[?#]/)[0]);
  const base = path.join(build, pathname);
  return [base, base + '.html', path.join(base, 'index.html')]
    .find(file => fs.existsSync(file) && fs.statSync(file).isFile());
}

let checked = 0;
for (const prefix of ['', 'en/']) {
  for (const route of routes) {
    const file = resolveRoute('/' + prefix + route);
    assert(file, 'Missing route: /' + prefix + route);
    const html = fs.readFileSync(file, 'utf8');
    for (const match of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      if (match[1].startsWith('//')) continue;
      assert(resolveRoute(match[1].replaceAll('&amp;', '&')), 'Broken emitted link/asset in ' + prefix + route + ': ' + match[1]);
    }
    if (route === 'blog') {
      const main = html.match(/<main[\s>][\s\S]*?<\/main>/)?.[0] || '';
      assert(main.includes('/img/blog/'), 'Blog thumbnails are missing: ' + prefix);
      assert(!main.includes('→'), 'Blog right arrows have returned: ' + prefix);
    }
    checked++;
  }
}
exists(path.join(build, 'sitemap.xml'));
assert(fs.readdirSync(build).some(file => /^search-index.*\.json$/.test(file)), 'Chinese search index is missing');
assert(fs.readdirSync(path.join(build, 'en')).some(file => /^search-index.*\.json$/.test(file)), 'English search index is missing');
console.log('Verified ' + checked + ' entry pages, emitted links/assets, both search indexes and ' + Object.keys(thumbnails).length + ' real thumbnails.');
