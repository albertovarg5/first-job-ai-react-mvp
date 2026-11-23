# Debugging and troubleshooting

Common local problems are in the README ("Troubleshooting"). This page adds the checks used for deployment and CI.

| Symptom | Likely cause | What to do |
|---|---|---|
| Local tests fail with `Cannot read properties of null (reading 'useState')` | Running from a `c:\...` path (lowercase drive letter) loads React twice | Run from `C:\...` in PowerShell (CI on Linux is not affected) |
| CI is red at **lint** | ESLint error | `npm run lint`, fix the file shown |
| CI is red at **tests** | A test fails | Run `npm test` and read the first failing test name |
| CI is red at **smoke-test-production** | Vercel or Railway deploy failed or is slow | Check Vercel -> Deployments and Railway -> Deployments logs; `/healthz` must say `ok` |
| App loads but data or search fails | Backend down or `/api` rewrite wrong | Open `/healthz`; check `vercel.json` points to the Railway URL |
| Job Search says not set up | `JSEARCH_API_KEY` missing on Railway | Add it in Railway -> Variables and redeploy |
| Login does not stick | `APP_URL` or HTTPS misconfigured | `APP_URL` must be the Vercel `https://` address |

**Debug method:** reproduce, read the exact error message, check `/healthz`, read the Railway log (it prints which integrations are on and any `[config]` warning), write a failing test, fix, re-run `npm test`.

**Monitoring:** `GET /healthz` returns `ok` (used by Railway's health check and by the CI smoke test). `npm run check:production` is a read-only configuration check.
