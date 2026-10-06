const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const assert = require('node:assert/strict');
const filename = path.resolve(__dirname, '../../.agents/skills/vbook-extensions/scripts/vbook.js');
const source = fs.readFileSync(filename, 'utf8').replace('main().catch(function (e) { die(e.message); });', '');
async function check(mode) {
  let deadline = 0;
  const http = { request(options, callback) {
    const req = new EventEmitter();
    req.write = () => {};
    req.setTimeout = value => { deadline = value; };
    req.end = () => queueMicrotask(() => {
      if (mode === 'early-close') { req.emit('close'); return; }
      const res = new EventEmitter();
      res.statusCode = 200;
      res.headers = { 'content-length': mode === 'abort' ? '100' : '2' };
      res.setEncoding = () => {};
      callback(res);
      res.emit('data', '{}');
      res.emit(mode === 'abort' ? 'aborted' : 'end');
      req.emit('close');
    });
    return req;
  } };
  const ctx = vm.createContext({ require: name => name === 'http' || name === 'https' ? http : require(name), Buffer, console, process, __dirname: path.dirname(filename) });
  vm.runInContext(source, ctx);
  const result = ctx.request('POST', 'http://localhost/extension/build', {});
  if (mode === 'complete') {
    const response = await result;
    assert.equal(response.status, 200);
    assert.equal(response.text, '{}');
  } else await assert.rejects(result, mode === 'abort' ? /aborted response.*received 2 bytes.*Content-Length 100/ : /before a complete response/);
  assert.equal(deadline, 90000);
}
(async () => {
  await check('complete');
  await check('abort');
  await check('early-close');
  console.log('PASS: CLI complete response, truncated response, early close and timeout registration.');
})().catch(error => { console.error(error); process.exitCode = 1; });
