const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const server = process.argv[2];
if (!server) throw new Error('Cần URL server VBook.');
const slug = process.argv[3] || 'kiem-lai';
const expectedCount = Number(process.argv[4] || '557');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'comnguoinovel-toc-'));
try {
  fs.cpSync(path.join(root, 'comnguoinovel/src'), path.join(temp, 'src'), { recursive: true });
  fs.copyFileSync(path.join(root, 'comnguoinovel/plugin.json'), path.join(temp, 'plugin.json'));
  const source = fs.readFileSync(path.join(temp, 'src/toc.js'), 'utf8');
  const results = [];
  for (const limit of [100, 1000]) {
    assert.ok(source.includes('limit = 1000'));
    const probe = "load('crypto.js');\n" + source.replace('limit = 1000', 'limit = ' + limit)
      .replace('function execute(url) {', 'function execute(url) { var started = new Date().getTime();')
      .replace('Response.success(chapters)', 'tocSummary(chapters, requestCount, new Date().getTime() - started)') + `
function tocSummary(chapters, requests, elapsedMs) {
    var ordered = true, namesCorrect = true, previous = -1;
    for (var i = 0; i < chapters.length; i++) {
        var number = Number(chapters[i].url.split("/").pop());
        if (number <= previous) ordered = false;
        if (!new RegExp("^Chương " + number + "(?:\\\\s|:|$)", "i").test(chapters[i].name)) namesCorrect = false;
        previous = number;
    }
    return Response.success({ count: chapters.length, requests: requests, elapsedMs: elapsedMs,
        ordered: ordered, namesCorrect: namesCorrect, sha256: CryptoJS.SHA256(JSON.stringify(chapters)).toString(),
        first: chapters[0], last: chapters[chapters.length - 1] });
}
var requestCount = 0, originalApiGet = apiGet;
apiGet = function (path) { requestCount++; return originalApiGet(path); };
`;
    fs.writeFileSync(path.join(temp, 'src/toc.js'), probe);
    const output = execFileSync(process.execPath, ['.agents/skills/vbook-extensions/scripts/vbook.js', 'test', temp, 'toc.js', 'https://comnguoinovel.com/truyen/' + slug, '--server', server], { cwd: root, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
    const match = output.match(/\[test\] output:\n([\s\S]*?)\n\[test\] code=/);
    assert.ok(match, output);
    const result = JSON.parse(match[1]);
    assert.equal(result.code, 0, JSON.stringify(result));
    const { count, requests, elapsedMs, ordered, namesCorrect, sha256, first, last } = result.data;
    assert.equal(count, expectedCount);
    assert.equal(requests, Math.max(1, Math.ceil(expectedCount / limit)));
    assert.equal(ordered, true);
    assert.equal(namesCorrect, true);
    assert.match(sha256, /^[a-f0-9]{64}$/);
    assert.ok(last.url.endsWith('/chuong/' + expectedCount));
    if (slug === 'kiem-lai') assert.equal(first.name, 'Chương 1: Chương 0 : Tự chương');
    results.push(sha256);
    console.log(JSON.stringify({ slug, limit, count, requests, elapsedMs, success: true }));
  }
  assert.deepEqual(results[0], results[1], 'Hai kích thước trang phải trả cùng mục lục.');
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
