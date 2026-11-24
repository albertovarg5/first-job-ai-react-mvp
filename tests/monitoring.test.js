// FJA-23: optional error tracking. Never sends personal data; never breaks the app.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEvent, createReporter, parseDsn, scrub } from '../server/errorReport.js';
import { createApi } from '../server/api.js';
import { call } from './helpers.js';

const DSN = 'https://abc123key@o1.ingest.sentry.io/42';

test('scrub removes emails, tokens, long secrets and query strings', () => {
  const out = scrub('fail for a@b.com token=abc123 sk-ant-aaaaaaaaaaaaaaaaaaaaaaaaaaaa at /x?email=a@b.com');
  assert.ok(!/a@b\.com|abc123|aaaaaaaa|email=/.test(out), out);
});

test('DSN parsing: https only, key and project required', () => {
  assert.deepEqual(parseDsn(DSN), { key: 'abc123key', url: 'https://o1.ingest.sentry.io/api/42/envelope/' });
  assert.equal(parseDsn('http://k@x.io/1'), null);
  assert.equal(parseDsn('nonsense'), null);
});

test('without SENTRY_DSN nothing is sent', async () => {
  let called = false;
  const r = createReporter({}, { fetchFn: async () => { called = true; } });
  assert.equal(r.enabled, false);
  assert.equal(await r.report(new Error('x')), false);
  assert.equal(called, false);
});

test('events carry only error info: no cookies, headers, user or request data', async () => {
  let sent;
  const r = createReporter({ SENTRY_DSN: DSN, NODE_ENV: 'production' }, { fetchFn: async (url, o) => ((sent = { url, o }), { ok: true }) });
  assert.equal(await r.report(new Error('bad input from person@example.com')), true);
  assert.equal(sent.url, 'https://o1.ingest.sentry.io/api/42/envelope/');
  const event = JSON.parse(sent.o.body.split('\n')[2]);
  assert.ok(!JSON.stringify(event).includes('person@example.com'));
  assert.ok(!('user' in event) && !('request' in event));
});

test('a failing Sentry never throws, and reports are rate limited', async () => {
  const bad = createReporter({ SENTRY_DSN: DSN }, { fetchFn: async () => { throw new Error('network'); } });
  assert.equal(await bad.report(new Error('x')), false);
  let n = 0;
  const r = createReporter({ SENTRY_DSN: DSN }, { fetchFn: async () => (n++, { ok: true }) });
  for (let i = 0; i < 50; i++) await r.report(new Error('x'));
  assert.equal(n, 30);
});

test('buildEvent keeps the stack short', () => {
  const e = buildEvent({ name: 'Error', message: 'm', stack: Array(100).fill('at f (file.js:1:1)').join('\n') }, { source: 'server' });
  assert.ok(e.extra.stack.split('\n').length <= 15);
});

test('/api/client-error: forwards browser errors, answers 204, ignores bad bodies', async () => {
  const got = [];
  const api = createApi({}, { report: async (e, source) => got.push([e, source]) });
  const ok = await call(api, 'POST', '/client-error', { name: 'TypeError', message: 'boom', stack: 's' });
  assert.equal(ok.status, 204);
  assert.deepEqual(got[0], [{ name: 'TypeError', message: 'boom', stack: 's' }, 'frontend']);
  assert.equal((await call(api, 'POST', '/client-error', '{not json')).status, 204);
  assert.equal((await call(api, 'GET', '/client-error')).status, 404);
  await api.close();
});
