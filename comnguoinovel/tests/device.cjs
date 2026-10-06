const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const root = path.resolve(__dirname, '../..');
const server = process.argv[2];
if (!server) throw new Error('Cần URL server VBook làm tham số.');
function run(script, args, verify, extDir = 'comnguoinovel') {
  const text = execFileSync(process.execPath, ['.agents/skills/vbook-extensions/scripts/vbook.js', 'test', extDir, script, ...args, '--server', server], { cwd: root, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  const match = text.match(/\[test\] output:\n([\s\S]*?)\n\[test\] code=/);
  assert.ok(match, text);
  const result = JSON.parse(match[1]);
  assert.equal(result.code, 0, JSON.stringify(result));
  verify(result.data, result.data2);
  console.log(JSON.stringify({ script, category: extDir === 'comnguoinovel' ? 'general' : 'boylove', args, success: true, count: Array.isArray(result.data) ? result.data.length : 1, next: result.data2 }));
  return result;
}
function items(rows) {
  assert.ok(Array.isArray(rows));
  for (const row of rows) {
    assert.ok(row.name);
    assert.match(row.link, /^https:\/\/comnguoinovel\.com\/truyen\/[a-z0-9-]+$/);
    if (row.cover) assert.match(row.cover, /^https:\/\//);
  }
}
run('detail.js', ['https://comnguoinovel.com/truyen/kiem-lai'], book => { assert.equal(book.name, 'Kiếm Lai'); assert.equal(book.type, 'novel'); assert.match(book.cover, /assets\.comnguoinovel\.com/); });
run('toc.js', ['https://comnguoinovel.com/truyen/kiem-lai'], rows => {
  assert.ok(rows.length >= 557);
  assert.equal(rows[0].name, 'Chương 1: Chương 0 : Tự chương');
  assert.ok(rows[0].url.endsWith('/chuong/1'));
  const numbers = rows.map(row => Number(row.url.split('/').at(-1)));
  rows.forEach((row, i) => assert.match(row.name, new RegExp('^Chương ' + numbers[i] + '(?:\\s|:|$)', 'i')));
  assert.equal(new Set(numbers).size, numbers.length);
  assert.ok(numbers.every((n, i) => i === 0 || n > numbers[i - 1]));
});
run('search.js', ['Kiếm Lai', ''], (rows, next) => { items(rows); assert.ok(rows.some(row => row.name === 'Kiếm Lai')); assert.equal(next, ''); });
run('search.js', ['zzzzzzzzzzzzzzzzzzzzzzzz', ''], (rows, next) => { assert.equal(rows.length, 0); assert.equal(next, ''); });
run('home.js', [], rows => { assert.equal(rows.length, 3); assert.ok(rows.every(row => row.script === 'listing.js')); });
run('genre.js', [], rows => { assert.ok(rows.some(row => row.input === 'genre:tien-hiep')); assert.ok(rows.every(row => row.script === 'listing.js')); });
const first = run('listing.js', ['latest', ''], (rows, next) => { items(rows); assert.equal(rows.length, 20); assert.equal(next, '2'); });
run('listing.js', ['latest', first.data2], (rows, next) => { items(rows); assert.ok(rows.length > 0); assert.ok(rows.every(row => !first.data.some(a => a.link === row.link))); assert.equal(next, '3'); });
run('listing.js', ['top', ''], (rows, next) => { items(rows); assert.ok(rows.length > 0); assert.equal(next, '2'); });
run('listing.js', ['completed', ''], rows => { items(rows); assert.ok(rows.length > 0); assert.ok(rows.every(row => row.tag === 'Hoàn thành')); });
run('listing.js', ['genre:tien-hiep', ''], rows => { items(rows); assert.ok(rows.length > 0); });
run('explore.js', [], rows => { assert.equal(rows.length, 3); for (const section of rows) { items(section.items); assert.ok(section.items.length > 0); assert.equal(section.more.script, 'listing.js'); } });
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'comnguoinovel-bl-'));
try {
  fs.cpSync(path.join(root, 'comnguoinovel/src'), path.join(temp, 'src'), { recursive: true });
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'comnguoinovel/plugin.json'), 'utf8'));
  manifest.config.CATEGORY.default = 'boylove';
  fs.writeFileSync(path.join(temp, 'plugin.json'), JSON.stringify(manifest));
  const genres = run('genre.js', [], rows => { assert.ok(rows.length > 0); assert.ok(rows.every(row => row.input.startsWith('genre:'))); }, temp);
  const blFirst = run('listing.js', ['latest', ''], rows => { items(rows); assert.ok(rows.length > 0); }, temp);
  run('listing.js', ['latest', blFirst.data2], rows => { items(rows); assert.ok(rows.every(row => !blFirst.data.some(a => a.link === row.link))); }, temp);
  run('listing.js', [genres.data[0].input, ''], items, temp);
  run('search.js', [blFirst.data[0].name, ''], (rows, next) => { items(rows); assert.ok(rows.some(row => row.link === blFirst.data[0].link)); assert.equal(next, ''); }, temp);
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
