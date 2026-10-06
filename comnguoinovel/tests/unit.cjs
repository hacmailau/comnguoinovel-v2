const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const src = path.resolve(__dirname, '../src');
function context(script, overrides = {}) {
  const ctx = vm.createContext({ Response: { success: (data, data2) => ({ code: 0, data, data2 }), error: data => ({ code: 1, data }) }, ...overrides });
  ctx.load = file => vm.runInContext(fs.readFileSync(path.join(src, file), 'utf8'), ctx);
  ctx.load(script);
  return ctx;
}
function okJson(data) { return { ok: true, json: () => data }; }
const base = context('config.js');
assert.equal(base.slugify('Đạo Quỷ Dị Tiên'), 'dao-quy-di-tien');
assert.equal(base.slugify('Kiếm Lai'), 'kiem-lai');
assert.equal(base.normalizeUrl('https://old.example/truyen/kiem-lai'), 'https://comnguoinovel.com/truyen/kiem-lai');
assert.equal(base.paragraphHtml('<script>\nA & B'), '<p>&lt;script&gt;</p><p>A &amp; B</p>');
assert.throws(() => base.route('/truyen/x/chuong/no', true));
for (const status of [401, 403, 404, 410, 429, 500]) {
  const ctx = context('detail.js', { fetch: () => ({ ok: false, status, json: () => { throw new Error('Không được parse HTTP lỗi'); } }) });
  assert.equal(ctx.execute('/truyen/kiem-lai').code, 1);
}
assert.equal(context('detail.js', { fetch: () => ({ ok: true, json: () => { throw new Error('bad JSON'); } }) }).execute('/truyen/kiem-lai').code, 1);
const book = { title: 'T', slug: 't', category_type: 'boylove' };
let observed = '';
const bl = context('search.js', { CATEGORY: 'boylove', fetch: url => { observed = url; return okJson([book]); } });
assert.equal(bl.execute('T', '').code, 0);
assert.match(observed, /category_type=boylove/);
assert.equal(bl.execute('T', '2').data.length, 0);
function chapterRows(count, start = 1) {
  return Array.from({ length: count }, (_, i) => ({ title: 'Title ' + (start + i), chapter_number: start + i }));
}
function pageJson(results, page, totalResults, totalPages = Math.ceil(totalResults / 1000)) {
  return okJson({ results, page, limit: 1000, totalPages, totalResults });
}
const rows = chapterRows(1000);
let calls = 0;
const toc = context('toc.js', { fetch: url => {
  calls++;
  assert.match(url, new RegExp('limit=1000&page=' + calls + '&sortBy=chapter_number%3Aasc$'));
  return pageJson(calls === 1 ? rows.slice().reverse() : chapterRows(2, 1001).reverse(), calls, 1002);
} });
const full = toc.execute('/truyen/t');
assert.equal(full.code, 0);
assert.equal(full.data.length, 1002);
assert.equal(calls, 2);
assert.deepEqual(Array.from(full.data, row => Number(row.url.split('/').at(-1))), Array.from({ length: 1002 }, (_, i) => i + 1));
assert.equal(full.data.at(-1).name, 'Chương 1002: Title 1002');
assert.equal(full.data.at(-1).number, undefined);
let singleCalls = 0;
const single = context('toc.js', { fetch: () => {
  singleCalls++;
  return pageJson(chapterRows(557), 1, 557);
} });
assert.equal(single.execute('/truyen/kiem-lai').data.length, 557);
assert.equal(singleCalls, 1);
assert.equal(single.execute('/truyen/kiem-lai').data.length, 557);
assert.equal(singleCalls, 2, 'Each TOC load fetches fresh data');
for (const count of [0, 1000]) {
  let requests = 0;
  const edge = context('toc.js', { fetch: () => { requests++; return pageJson(chapterRows(count), 1, count); } });
  assert.equal(edge.execute('/truyen/t').data.length, count);
  assert.equal(requests, 1);
}
for (const [title, number, expected] of [
  ['Kinh Trập', 2, 'Chương 2: Kinh Trập'],
  ['Chương 557: Cuối', 557, 'Chương 557: Cuối'],
  ['Chương 0 : Tự chương', 1, 'Chương 1: Chương 0 : Tự chương'],
  ['chương 2 : Kinh Trập', 2, 'chương 2 : Kinh Trập'],
  ['Chương 2', 2, 'Chương 2'],
  ['Chương 20: Khác', 2, 'Chương 2: Chương 20: Khác'],
  ['Chương 2abc', 2, 'Chương 2: Chương 2abc'],
]) {
  const named = context('toc.js', { fetch: () => pageJson([{ title, chapter_number: String(number), is_locked: true }], 1, 1) }).execute('/truyen/t');
  assert.equal(named.code, 0);
  assert.equal(named.data[0].name, expected);
  assert.equal(named.data[0].url, 'https://comnguoinovel.com/truyen/t/chuong/' + number);
  assert.equal(named.data[0].lock, true);
  assert.equal(named.data[0].pay, false);
}
const failures = [
  { ok: false, status: 500 },
  pageJson([{ title: 'Duplicate', chapter_number: 1 }], 2, 1001),
  pageJson([], 2, 1001),
  pageJson(chapterRows(2, 1001), 2, 1002),
  pageJson(chapterRows(1, 1001), 2, 2001),
  pageJson(chapterRows(1, 1001), 1, 1001),
];
for (const last of failures) {
  let requests = 0;
  const partial = context('toc.js', { fetch: () => ++requests === 1 ? pageJson(rows, 1, 1001) : last });
  assert.equal(partial.execute('/truyen/t').code, 1);
  assert.equal(requests, 2);
}
const extraDuplicate = context('toc.js', { fetch: () => pageJson([...chapterRows(2), { title: 'Dup', chapter_number: 1 }], 1, 2) });
assert.equal(extraDuplicate.execute('/truyen/t').code, 1);
let middleCalls = 0;
const middleFailure = context('toc.js', { fetch: () => ++middleCalls === 1 ? pageJson(rows, 1, 2001) : { ok: false, status: 500 } });
assert.equal(middleFailure.execute('/truyen/t').code, 1);
assert.equal(middleCalls, 2, 'Stop at the failed middle page without returning partial data');
for (const chapter_number of [null, -1, 1.5, 'bad']) {
  assert.equal(context('toc.js', { fetch: () => pageJson([{ title: 'Invalid', chapter_number }], 1, 1) }).execute('/truyen/t').code, 1);
}
function fakeDocument(data, text, canvases) {
  const fiber = { memoizedProps: { slug: 't', chapterSlug: '2' }, memoizedState: { memoizedState: { data }, next: null } };
  const main = { '__reactFiber$test': fiber, textContent: text, querySelectorAll: selector => selector === 'canvas' ? Array.from({ length: canvases }, () => ({})) : text.split('\n').map(value => ({ textContent: value })) };
  return { querySelector: () => main };
}
const data = { chapter_number: 2, title: 'Chapter', novel_id: 'id', content: 'Canvas paragraph\nVisible paragraph' };
const reader = context('reader.js', { location: { pathname: '/truyen/t/chuong/2' }, document: fakeDocument(data, 'Visible paragraph', 1) });
assert.equal(JSON.parse(reader.probeChapter('t', 2)).state, 'ready');
assert.equal(JSON.parse(reader.probeChapter('t', 3)).state, 'wrong-page');
reader.document = fakeDocument({ ...data, chapter_number: 3 }, 'Visible paragraph', 1);
assert.equal(JSON.parse(reader.probeChapter('t', 2)).state, 'waiting');
reader.document = fakeDocument(data, 'Visible paragraph', 0);
assert.equal(JSON.parse(reader.probeChapter('t', 2)).state, 'waiting');
reader.document = fakeDocument(data, 'Bạn cần đăng nhập để đọc chương', 0);
assert.equal(JSON.parse(reader.probeChapter('t', 2)).state, 'login');
reader.document = { body: { textContent: 'Bạn cần đăng nhập để đọc chương' }, querySelector: () => null };
assert.equal(JSON.parse(reader.probeChapter('t', 2)).state, 'login');
assert.equal(reader.parseBrowserResult(JSON.stringify({ state: 'ready' })).state, 'ready');
reader.Html = { parse: () => ({ select: () => ({ size: () => 1, text: () => '{"state":"ready","content":"\\u003cp\\u003eA \\u0026 B"}' }) }) };
assert.equal(reader.parseBrowserResult('<html><body>JSON</body></html>').content, '<p>A & B');
let closed = false;
const chap = context('chap.js', { Engine: { newBrowser: () => ({ launch() {}, callJs: () => JSON.stringify({ state: 'login' }), close() { closed = true; } }) } });
assert.equal(chap.execute('/truyen/t/chuong/2').code, 1);
assert.equal(closed, true);
console.log('PASS: HTTP/JSON errors, normalization, BL filter, 1000-chapter pagination, fresh TOC, chapter names/URLs, partial TOC, duplicates, canvas source, chapter identity, login and browser cleanup.');
