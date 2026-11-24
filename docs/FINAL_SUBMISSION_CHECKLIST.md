# Final submission checklist

Audit date: 2026-11-23, on `main` at commit 365dae2. "Verified" means checked by a command, a test or a log you reported; "Needs you" means it requires your account.

## 1. Professor requirements

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Unit and integration tests | **Done** | Last full local run: 205 Node + 20 Vitest passed (README, `tests/`). Not re-run in this audit because no code changed. |
| 2 | GitHub Actions testing and deployment | **Done** | `check` and `smoke-test-production` passed on `main` (commit 365dae2, per GitHub). Vercel and Railway deploy `main` through their own GitHub links. |
| 3 | Production deployment, error handling, basic monitoring | **Mostly done, see section 3** | Live: `/healthz` returns `ok` (200); frontend 200; API refuses a foreign origin (403) and bad requests. Sentry is on (Railway log). **UptimeRobot is not set up yet.** |
| 4 | README, architecture, troubleshooting | **Done** | `README.md`, `docs/ARCHITECTURE.md`, `docs/TROUBLESHOOTING.md`, `docs/MONITORING.md`, `docs/MAINTENANCE.md` |
| 5 | Two documented design patterns | **Done (three)** | Repository, Dependency Injection, Strategy: `docs/ARCHITECTURE.md`, `tests/patterns.test.js`, `tests/strategy.test.js` |
| 6 | Three sprints in Jira | **Needs you** | Sprints 1-2 Done. Sprint 3 stories need the steps in section 5. |
| 7 | User stories and acceptance criteria verified | **Done with one production gap** | `docs/SPRINTS.md`. Gap: account sign-up is off in production (section 3). |
| 8 | Word document with 3 links | **Needs you (Jira link)** | See section 6. |

## 2. Evidence checked in this audit (production, no code changes)

| Check | Result |
|---|---|
| `GET https://first-job-ai-react-mvp-production.up.railway.app/healthz` | `ok`, HTTP 200 |
| Frontend `https://first-job-ai-react-mvp.vercel.app` and `/api/config` through Vercel | 200 |
| Job search as a guest (`/api/jobs/search?query=marketing intern`) | Returns real job listings |
| `/api/jobs/status` | `configured: true` |
| `/api/ai/status` | `connected: false`: Basic mode, as intended |
| `POST /api/client-error` from the site origin | 204. One harmless test event named `AuditTest` was sent (no user data). |
| `POST /api/client-error` from another origin | 403 (blocked) |
| `POST /api/auth/signup` | **503 `signup_unavailable`**: "Sign-up needs email to be set up" |

Not tested by me (needs a browser or your login): signing in to an existing account, resume builder, tracker and interview practice in production. You reported Interview Practice works in Basic mode.

## 3. Unresolved production issues

1. **Sign-up and password reset are off** because `RESEND_API_KEY` and `EMAIL_FROM` are not set. This is the app working as designed (it refuses to create accounts it cannot verify). I did not weaken verification. Guest mode, job search, tracker, resume and interview practice still work without an account, and existing accounts can sign in.
   **Fix with Resend (free):**
   1. resend.com -> **Sign up** (use the email you want to receive test mail on).
   2. **API Keys -> Create API Key**, permission **Sending access**, copy the key (starts with `re_`). You see it only once.
   3. Choose one:
      - **No domain (quickest):** use sender `First Job AI <onboarding@resend.dev>`. Resend then delivers only to **your own Resend sign-up email**, so only you can create an account (fine for a demo; your professor can use guest mode).
      - **With a domain you own:** Resend -> **Domains -> Add Domain**, add the DNS records it shows at your registrar, click **Verify**, then use `First Job AI <no-reply@yourdomain.com>`. Anyone can then sign up.
   4. Railway -> backend service -> **Variables**, add: `RESEND_API_KEY` = the key, `EMAIL_FROM` = the sender above, and confirm `APP_URL` = `https://first-job-ai-react-mvp.vercel.app`. Never put these in Git.
   5. After the redeploy the log should no longer warn about email. Test: sign up with your own email, open the link in the email, then try **Forgot password**.
2. **AI is in Basic mode** (`ANTHROPIC_API_KEY` not set). Intentional and documented; no paid service was enabled. Billing (Stripe) is also off.
3. **Sentry events are unverified on the Sentry side.** I cannot see your Sentry account.

## 4. Remaining external setup (in order)

1. (Optional but recommended) Resend setup above, then test sign-up.
2. **Sentry check:** sentry.io -> your project -> **Issues**. Look for `AuditTest: monitoring audit test`. If it is there, the integration is verified; delete the issue. If not after 2 minutes, re-copy the DSN into Railway `SENTRY_DSN` and redeploy.
3. **UptimeRobot:** follow `docs/MONITORING.md` (HTTP(s) monitor, URL `https://first-job-ai-react-mvp-production.up.railway.app/healthz`, interval 5 minutes, your email as alert contact). Confirm it shows **Up**. Test an alert with a temporary monitor on `.../healthz-test` (returns 404), wait for the Down email, then delete that monitor.
4. **Railway:** open **Deployments -> View logs** and the **Metrics** tab once.
5. **Dashboards:** Vercel -> Settings -> Git (production branch `main`); Railway -> Settings -> Source (branch `main`).

## 5. Jira updates

Comments are in `docs/JIRA_SPRINT3_FINAL_COMMENTS.md`.

| Story | Mark Done? |
|---|---|
| FJA-22 | **Yes** (CI green at 365dae2; deploys live), after you glance at the two dashboard branch settings |
| FJA-23 | **Not yet.** Mark Done after UptimeRobot shows Up with a tested alert, and the Sentry test issue appears |
| FJA-24 | **Yes**, noting it is a basic accessibility check, not full WCAG |
| FJA-25 | **Yes** |

Finish Jira: Backlog/board -> confirm Sprints 1 and 2 are completed -> when FJA-23 is Done, open Sprint 3 -> **Complete sprint** -> Project settings -> **People/Access** -> add your professor (or share the board link) -> copy the project URL from the browser.

## 6. Word document

`First_Job_AI_Final_Sprint_3_Submission.docx` (in the project folder, not in Git) contains your name, the project title and the GitHub and live links. Open it, replace the red line `[INSERT YOUR JIRA PROJECT LINK HERE]` with your Jira URL, make it a clickable link (select it, Ctrl+K), and save.

## 7. Ready to submit?

**Almost.** Required before submitting: UptimeRobot monitor working (FJA-23), Jira link in the Word document, Sprint 3 closed. Strongly advised: Resend, so account sign-up works in production, since a professor testing "create an account" would currently see an error.
