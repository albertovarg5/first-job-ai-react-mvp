// Proves the two design patterns are real, by using them the way the production code does:
//  1. Dependency Injection: createDataHandler receives its database and its auth check.
//     Here both are tiny fakes, so no real database or login is needed.
//  2. Repository: createBillingStore hides every SQL query; callers only use its methods.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDataHandler } from '../server/dataHandler.js';
import { createBillingStore, grantsPremium } from '../server/billingStore.js';
import { HttpError } from '../server/http.js';
import { call } from './helpers.js';

test('DI: the data handler reads only the row of the user the injected auth returns', async () => {
  const seen = [];
  const db = { one: async (sql, params) => (seen.push(params), { data: '{"a":1}', revision: 3, updated_at: 'now' }) };
  const handler = createDataHandler({ db, requireUser: async () => ({ id: 'user-1' }) });
  const res = await call(handler, 'GET', '/');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { data: { a: 1 }, revision: 3, updatedAt: 'now' });
  assert.deepEqual(seen, [['user-1']]);
});

test('DI error handling: when the injected auth rejects, the database is never touched', async () => {
  let touched = false;
  const db = { one: async () => (touched = true) };
  const handler = createDataHandler({ db, requireUser: async () => { throw new HttpError(401, 'Sign in first', 'unauthorized'); } });
  const res = await call(handler, 'GET', '/');
  assert.equal(res.status, 401);
  assert.equal(touched, false);
});

test('Repository: the billing store runs its own SQL; callers never see a query', async () => {
  const queries = [];
  const db = { one: async (sql) => (queries.push(sql), { user_id: 'u9' }), all: async (sql) => (queries.push(sql), []) };
  const store = createBillingStore(db);
  assert.equal(await store.userOfCustomer('cus_1'), 'u9');
  assert.deepEqual(await store.subscriptionsOf('u9'), []);
  assert.equal(queries.length, 2);
  assert.ok(queries.every((q) => /SELECT/i.test(q)));
});

test('Business rule kept apart from storage: no subscription row means no Premium', () => {
  assert.equal(grantsPremium(null), false);
});
