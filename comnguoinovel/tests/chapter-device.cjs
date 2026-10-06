const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const server = process.argv[2];
if (!server) throw new Error('Cần URL server VBook.');
const chapter = process.argv[3] || '2';
const expectedCount = Number(process.argv[4] || '76');
const expectedHash = process.argv[5];
const url = 'https://comnguoinovel.com/truyen/kiem-lai/chuong/' + chapter;
const text = execFileSync(process.execPath, ['.agents/skills/vbook-extensions/scripts/vbook.js', 'test', 'comnguoinovel', 'chap.js', url, '--server', server], { cwd: path.resolve(__dirname, '../..'), encoding: 'utf8', timeout: 90000, maxBuffer: 4 * 1024 * 1024 });
const match = text.match(/\[test\] output:\n([\s\S]*?)\n\[test\] code=/);
assert.ok(match, 'Không nhận được kết quả script.');
const result = JSON.parse(match[1]);
if (result.code !== 0) {
  console.log(JSON.stringify({ chapter, success: false, error: result.data }));
  process.exitCode = 1;
} else {
  assert.equal(typeof result.data, 'string');
  const count = (result.data.match(/<p>/g) || []).length;
  assert.equal(count, expectedCount);
  const hash = crypto.createHash('sha256').update(result.data).digest('hex');
  if (expectedHash) assert.equal(hash, expectedHash, 'Nội dung khác bản Playwright đã đối chiếu.');
  console.log(JSON.stringify({ chapter, success: true, paragraphs: count, htmlChars: result.data.length, sha256: hash }));
}
