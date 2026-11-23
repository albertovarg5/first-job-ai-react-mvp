# Architecture

```
Browser ──► Vercel (React + Vite, static)
               │  /api/* and /healthz are proxied (vercel.json)
               ▼
            Railway (Node.js server)  ──► PostgreSQL
               │
               ├─► JSearch (job listings)
               ├─► Anthropic (optional AI)
               └─► Stripe (payments, disabled for Sprint 1)
```

## Layers

| Layer | Where | Job |
| --- | --- | --- |
| Pages / components | `src/pages`, `src/components` | What the user sees. No business rules. |
| Context | `src/context` | Shared state (signed-in user, saved data, toasts). |
| Plain logic | `src/lib` | Resume, tracker, missions, PDF... pure functions, easy to unit test. |
| HTTP handlers | `server/*Handler.js`, `server/api.js` | Validate input, call the store, return JSON or a clear error. |
| Stores | `server/billingStore.js`, `server/db.js` | The only code that reads/writes the database. |

## Design patterns (three)

### 1. Repository (store) + 2. factory with dependency injection

**Repository.** `server/billingStore.js` hides every SQL query about subscriptions behind
small functions (`createBillingStore(db)`). The rest of the server never writes SQL for
billing, and the store never talks to Stripe. Business rules such as `grantsPremium(row)`
are separate pure functions.

**Factory + dependency injection.** Handlers are built by functions that receive what they
need instead of importing it: `createDataHandler({ db, requireUser })`,
`createBillingStore(db)`, `createApi(env, options)`.

**Why it fits:** tests pass in a throwaway in-memory database (PGlite) or fake `fetch`, so
tests never touch production, Stripe, JSearch or Anthropic. Changing the database or an
external service only changes one file.

Proof: `tests/patterns.test.js` builds `createDataHandler` with a fake `db` and fake `requireUser` (no real database or login) and calls `createBillingStore` with a fake `db`.

### 3. Strategy: job search providers

**Problem.** JSearch can be reached through two providers (OpenWeb Ninja and RapidAPI). They differ in URL, path, how the API key is sent and how paging works. Before, the jobs handler had `if (provider === ...)` branches for each difference.

**Solution.** Each provider is one *strategy* object in [server/jobProviders.js](../server/jobProviders.js) with the same interface:

| Member | Job |
| --- | --- |
| `id`, `label`, `keyHelp` | names used in messages |
| `baseUrl(env)` | where requests go |
| `headers(apiKey, env)` | how the key is sent |
| `buildUrl(params, baseUrl)` | the search URL (cursor paging vs page numbers) |
| `hasMore(rawJobs, cursor)` | whether another page probably exists |

`chooseStrategy(env)` picks one from configuration (`JSEARCH_PROVIDER`, or the shape of the key). `createJobsHandler(env, { strategy })` only calls that interface, so it has no provider-specific branches, and the JSON it returns is the same for every provider.

**Benefits.** A new provider is one new object (plus a test); the handler, validation, caching and security code do not change. Tests can inject a fake strategy ([tests/strategy.test.js](../tests/strategy.test.js)). Production behavior, credentials and error messages are unchanged.

Frontend: **Provider/Context** (`AuthContext`, `AppDataContext`,
`ToastContext`).

## Error handling

- Handlers validate input and return JSON errors with an HTTP status (400, 401, 403, 409, 429, 502...).
- Upstream failures (bad API key, rate limit, timeout, no credit) are mapped to plain-English messages.
- The frontend shows errors as toasts or banners (`ApiError` in `src/lib`) and never fakes data.
