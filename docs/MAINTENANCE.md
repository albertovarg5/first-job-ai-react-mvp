# Deployment flow and maintenance plan

## How a change reaches production (FJA-22)
1. Create a branch from `main` and push it.
2. Open a pull request into `main`. GitHub Actions job **check** runs `npm ci`, lint, all tests and the production build ([.github/workflows/ci.yml](../.github/workflows/ci.yml)).
3. Branch protection on `main` requires that check to pass before merging.
4. Merge. Two things start automatically:
   - **Vercel** builds and publishes the React app (production branch `main`, configured in [vercel.json](../vercel.json)).
   - **Railway** deploys the Node backend (`npm start`, health check `/healthz`, [railway.json](../railway.json)).
5. The workflow job **smoke-test-production** then waits until the live site and `/healthz` answer, checks the Railway backend directly, checks the API refuses a bad request with a client error, and checks `/privacy` and the 404 screen load.

No deploy keys are stored in GitHub. One manual check you can do any time: Vercel -> Settings -> Git (production branch `main`) and Railway -> Settings -> Source (branch `main`).

## Maintenance plan
| When | Task |
| --- | --- |
| Every week | Look at Sentry Issues and the UptimeRobot dashboard; fix new errors through a pull request. |
| Every month | `npm audit`, update dependencies in a branch, run `npm test`; check the JSearch monthly allowance (`JSEARCH_MONTHLY_LIMIT`) and Anthropic credit. |
| Every month | Confirm Railway Postgres backups exist; run `npm run backup` once. |
| Before each release | `npm run lint`, `npm test`, `npm run build` locally, then a pull request. |
| After an incident | Add a test that reproduces it, fix, and write a line in [TROUBLESHOOTING.md](TROUBLESHOOTING.md). |
| Never | Commit `.env` files or API keys; rotate a key immediately if one leaks. |
