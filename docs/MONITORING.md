# Monitoring and error tracking (FJA-23)

| Part | Status |
| --- | --- |
| Health endpoint `GET /healthz` | **Implemented** (answers `ok` after reading the database; `503 database unavailable` otherwise). Railway uses it as its health check ([railway.json](../railway.json)). Verified live: returns `ok` on the Railway backend and through Vercel. |
| Error tracking code (Sentry) | **Implemented, off until you set `SENTRY_DSN`**. Not verified against a real Sentry project. |
| External uptime monitor, 5 min, email alerts | **Manual: you must create it (steps below).** Not done by the code. |
| Railway logs and metrics | **Provided by Railway**; you must open them once to confirm (steps below). |

The Jira text says `/api/health`; the real endpoint is **`/healthz`** (no `/api` prefix). Use that everywhere.

## Which URL to monitor
Use the MVP's own backend (the one `vercel.json` forwards to):
`https://first-job-ai-react-mvp-production.up.railway.app/healthz`
Optionally add a second monitor on `https://first-job-ai-react-mvp.vercel.app/healthz`, which checks the Vercel to Railway link too.
(`first-job-ai-production.up.railway.app` also answers `ok`, but it is not the backend `vercel.json` points to, so it would not tell you if this project is down.)

## How error tracking works
- **Backend:** `server/errorReport.js`. Unhandled rejections, uncaught exceptions and request crashes are sent to Sentry.
- **Frontend:** `src/components/ErrorBoundary.jsx` catches render errors, `window` error and unhandled promise rejections. The browser sends them to our own `POST /api/client-error`, and the server forwards them. So the Sentry key never goes to the browser and no CSP change is needed.
- **No Sentry SDK** is installed: the code sends Sentry's standard event format with `fetch`, which keeps the project free of new dependencies.
- **Privacy:** only error type, a scrubbed message, a short stack (query strings removed), environment and release are sent. Emails, token-like strings and long secrets are redacted. No cookies, headers, request bodies, user ids, resumes or app data. At most 30 reports per minute; at most 5 per browser page load.
- **Limitation:** errors that a route handler catches and answers with an error response (for example an upstream API failing) are logged but not sent to Sentry.
- Tests: `tests/monitoring.test.js`, `tests/ui/errorBoundary.spec.jsx`.

## Manual setup 1: Sentry (about 5 minutes)
1. Go to sentry.io and **Sign up** (free Developer plan).
2. Create a project: **Projects -> Create Project**, platform **Node.js**, name `first-job-ai`, then **Create Project**. Skip the SDK install steps.
3. Open **Project Settings -> Client Keys (DSN)** and copy the **DSN** (starts with `https://`).
4. In Railway: your service -> **Variables -> New Variable**, name `SENTRY_DSN`, value = the DSN. Railway redeploys.
5. Check the Railway deploy log shows `Error tracking (Sentry): on`.
6. Verify: open your site, press F12 -> Console and run
   `fetch('/api/client-error',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'TestError',message:'monitoring test'})})`
   The event should appear in Sentry **Issues** within a minute. Delete it afterwards.
7. In Sentry **Alerts -> Create Alert -> Issues**, send an email on new issues (optional).

The DSN is the only variable. Keep it in Railway Variables, never in Git. Do not name it with a `VITE_` prefix.

## Manual setup 2: UptimeRobot (about 3 minutes)
1. Go to uptimerobot.com and **Register for FREE**; confirm your email.
2. Click **+ Add New Monitor** (or **+ New**).
3. Monitor Type: **HTTP(s)**. Friendly Name: `First Job AI backend`.
4. URL: `https://first-job-ai-react-mvp-production.up.railway.app/healthz`
5. Monitoring Interval: **5 minutes** (the free plan default).
6. Alert Contacts: tick your email (add it under **My Settings -> Alert Contacts** if missing).
7. Click **Create Monitor**. It should turn **Up**.
8. Verify alerts: use **Pause** is not a test; instead create a second temporary monitor with the URL ending in `/healthz-test` (answers 404), confirm the **Down** email arrives, then delete it.

## Manual check 3: Railway logs and metrics
Railway -> your project -> the backend service -> **Deployments -> View logs** (startup lines show which integrations are on, plus any `[error]` lines) and the **Metrics** tab (CPU, memory, network). Confirm both show data. If you can see them, this requirement is met.

## Debugging an incident
1. UptimeRobot email says Down -> open `/healthz`. `503 database unavailable` = check the Railway Postgres service.
2. Open Railway logs for `[error]` or `[health]` lines.
3. Check Sentry Issues for the matching error and release.
4. Fix with a pull request; CI and the production smoke test confirm the recovery.
