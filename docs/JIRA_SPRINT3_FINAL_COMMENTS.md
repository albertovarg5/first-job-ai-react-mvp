# Jira comments: FJA-22 to FJA-25

Paste after the pull request is merged and both GitHub Actions jobs (`check`, `smoke-test-production`) are green. Local results before merge: lint clean, 205 Node tests and 20 Vitest tests passed, production build succeeded (not yet verified on GitHub).

## FJA-22: Continuous deployment to Vercel and Railway
**Implemented:** `.github/workflows/ci.yml` runs `check` on pull requests and pushes to `main`; Vercel (`vercel.json`) and Railway (`railway.json`) deploy `main` through their GitHub connections; `smoke-test-production` waits for the live site and `/healthz`. The flow is in `docs/MAINTENANCE.md`.
**Evidence:** earlier merges to `main` ran `check` and `smoke-test-production` successfully (commit 40a5a98). This change adds checks for the Railway backend, API error handling, `/privacy` and the 404 screen.
**Limitations:** the Vercel and Railway production-branch settings are in their dashboards and were not read by me; confirm them once (Vercel Settings -> Git, Railway Settings -> Source).
**Status:** can be marked Done after the new run is green and you confirmed both dashboards.

## FJA-23: Basic monitoring
**Implemented:** `/healthz` (real endpoint; the story's `/api/health` does not exist) verified live. Optional Sentry error tracking for backend and frontend (`server/errorReport.js`, `src/components/ErrorBoundary.jsx`, `POST /api/client-error`), with data scrubbing and rate limits. Docs: `docs/MONITORING.md`.
**Evidence:** `tests/monitoring.test.js` (7 tests), `tests/ui/errorBoundary.spec.jsx` (2 tests).
**Limitations:** NOT verified: the UptimeRobot monitor (5 min, email alert), a real Sentry project receiving events, and Railway logs/metrics. These need your accounts.
**Status:** do NOT mark Done until you complete the steps in `docs/MONITORING.md` (UptimeRobot monitor Up and a test alert email, one Sentry test event, Railway logs and Metrics visible).

## FJA-24: End-to-end smoke test and accessibility check
**Implemented:** extended production smoke test (site, Vercel `/healthz`, Railway `/healthz`, API client-error handling, `/privacy`, 404 screen); automated basic accessibility tests in `tests/ui/a11y.spec.jsx` (language, skip link, main landmark, visible focus, image alt, icon-button names, label to input, heading and keyboard order). Audit found no missing alt text and no unnamed icon buttons.
**Evidence:** 5 accessibility tests pass locally; the workflow run must pass on GitHub.
**Limitations:** no automated color-contrast check and no screen-reader testing; this is not a full WCAG audit. The smoke test is HTTP-level, not a browser click-through.
**Status:** can be marked Done after the GitHub run is green, if the instructor accepts these limits.

## FJA-25: SDLC documentation and maintenance plan
**Implemented:** README (features, setup, architecture, three design patterns, testing, CI/CD, deployment, monitoring, troubleshooting, Sprint 1-3 summary), `docs/ARCHITECTURE.md`, `docs/SPRINTS.md`, `docs/SPRINT3_REPORT.md`, `docs/TROUBLESHOOTING.md`, `docs/MONITORING.md`, `docs/MAINTENANCE.md` (deployment flow and maintenance plan).
**Limitations:** `docs/SPRINTS.md` sprint assignments were reconstructed from Git history; Jira is the source of truth.
**Status:** can be marked Done after merge.
