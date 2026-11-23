// Strategy pattern for job search: providers share one interface and can be swapped.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRATEGIES, chooseStrategy, openWebNinja, rapidApi } from '../server/jobProviders.js';
import { createJobsHandler, parseSearchParams } from '../server/jobsHandler.js';
import { call, jsonResponse, withFetch } from './helpers.js';

const RAW = { job_id: 'j1', job_title: 'Intern', employer_name: 'Acme', job_apply_link: 'https://example.com/a', job_description: 'x' };

test('every strategy has the same interface', () => {
  for (const s of Object.values(STRATEGIES)) {
    for (const fn of ['baseUrl', 'headers', 'buildUrl', 'hasMore']) assert.equal(typeof s[fn], 'function', `${s.id}.${fn}`);
    assert.ok(s.id && s.label && s.keyHelp);
  }
});

test('configuration picks the strategy', () => {
  assert.equal(chooseStrategy({ JSEARCH_API_KEY: 'k', JSEARCH_PROVIDER: 'rapidapi' }), rapidApi);
  assert.equal(chooseStrategy({ JSEARCH_API_KEY: 'k', JSEARCH_PROVIDER: 'openwebninja' }), openWebNinja);
  assert.equal(chooseStrategy({ JSEARCH_API_KEY: 'k' }), openWebNinja);
});

test('strategies build different requests from the same search', () => {
  const p = parseSearchParams({ query: 'nurse', page: '2', cursor: 'abc123' });
  const a = new URL(openWebNinja.buildUrl(p, openWebNinja.baseUrl()));
  const b = new URL(rapidApi.buildUrl(p, rapidApi.baseUrl()));
  assert.equal(a.searchParams.get('cursor'), 'abc123');
  assert.equal(b.searchParams.get('page'), '2');
  assert.deepEqual(openWebNinja.headers('K'), { 'x-api-key': 'K' });
  assert.equal(rapidApi.headers('K')['X-RapidAPI-Key'], 'K');
  assert.equal(openWebNinja.hasMore([RAW], null), false);
  assert.equal(rapidApi.hasMore(new Array(10).fill(RAW)), true);
});

test('a custom strategy can be injected and the API response stays the same shape', async () => {
  const fake = {
    id: 'fake', label: 'Fake', keyHelp: 'a fake key',
    baseUrl: () => 'https://fake.example/api',
    headers: (key) => ({ 'x-fake': key }),
    buildUrl: (p, base) => `${base}/find?q=${encodeURIComponent(p.query)}`,
    hasMore: () => false,
  };
  const handler = createJobsHandler({ JSEARCH_API_KEY: 'secret' }, { strategy: fake });
  let seen;
  const res = await withFetch(
    async (url, opts) => { seen = { url, headers: opts.headers }; return jsonResponse({ status: 'OK', data: [RAW] }); },
    () => call(handler, 'GET', '/search?query=intern'),
  );
  assert.equal(seen.url, 'https://fake.example/api/find?q=intern');
  assert.equal(seen.headers['x-fake'], 'secret');
  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(res.body).sort(), ['cached', 'cursor', 'hasMore', 'jobs', 'page', 'source']);
  assert.equal(res.body.jobs[0].title, 'Intern');
  assert.ok(!JSON.stringify(res.body).includes('secret'));
});

test('an invalid-key error names the chosen strategy', async () => {
  const handler = createJobsHandler({ JSEARCH_API_KEY: 'k' }, { strategy: rapidApi });
  const res = await withFetch(async () => jsonResponse({}, 403), () => call(handler, 'GET', '/search?query=intern'));
  assert.equal(res.status, 502);
  assert.match(res.body.error, /RapidAPI/);
});
