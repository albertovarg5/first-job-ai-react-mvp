# Sprint 3 report: requirements, testing and CI/CD

## 1. Professor requirements checklist

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Implement instructor feedback | **Blocked: no feedback file exists in the repository.** Nothing was invented. | Add the written feedback here, then fix it. |
| 2 | Finalize features + 2 design patterns | Done | Privacy/terms page added (`src/pages/Legal.jsx`); patterns in section 2 |
| 3 | Unit, integration and error-handling tests | Done | 183 Node tests + 10 Vitest tests, section 3 |
| 4 | CI on pull requests, CD on merge to main | Workflow done; **a real run must be seen on GitHub** | `.github/workflows/ci.yml`, section 4 |
| 5 | Technical documentation | Done | README, `docs/ARCHITECTURE.md`, this file, `docs/TROUBLESHOOTING.md` |
| 6 | Agile project management in Jira | **Not verifiable from here.** Stories and a Jira CSV are ready. | `docs/SPRINTS.md`, `docs/jira-import.csv`, section 5 |
| 7 | Final testing with user stories and acceptance criteria | Done | `docs/SPRINTS.md` (every story has acceptance criteria and test evidence) |
| 8 | Final Word document with 3 links | Created; the Jira link is a placeholder until you confirm it | `First_Job_AI_Final_Sprint_3_Submission.docx` |

## 2. Design patterns (both real, both tested)

1. **Repository**: `createBillingStore(db)` in [server/billingStore.js](../server/billingStore.js) owns all subscription SQL. Callers use `subscriptionsOf(userId)` and never write a query. Changing the database touches one file.
2. **Dependency Injection with factories**: `createDataHandler({ db, requireUser })` in [server/dataHandler.js](../server/dataHandler.js) and `createApi(env, options)` in [server/api.js](../server/api.js) receive what they need. Tests inject fakes ([tests/patterns.test.js](../tests/patterns.test.js)); production injects the real database and sign-in check.
3. (Frontend) **Provider/Context**: `src/context/*`.

## 3. Test results (Windows, Node 22, run from `C:\...`)

| Command | Result |
|---|---|
| `npm run lint` | no errors |
| `npm test` (Node runner) | 183 passed, 0 failed |
| `npm test` (Vitest component tests) | 10 passed, 0 failed |
| `npm run build` | succeeds (chunk-size warning only) |

Coverage by area: accounts and authorization (`auth`, `security`: wrong password, rate limits, per-user data isolation, CSRF), job search and its failures (`jobs`), tracker (`tracker`, `workflow`), resume and PDF (`resume`, `features`), billing (`billing`, `pricing`), AI errors (`integrations`, `career`), pages and routes including the 404 page (`tests/ui`, `signup-ui`), design patterns (`patterns`).

Known testing limit: responsive layout is checked by hand, not automatically.

## 4. CI/CD

- **CI** (`ci.yml`, job `check`): runs on every pull request to `main` and every push to `main`: `npm ci`, lint, tests, build. Any failing step fails the run. Make it a required check (below) so a red run blocks merging.
- **CD**: Vercel and Railway deploy `main` through their own GitHub connections, so there is no second deploy process and no secrets are stored in GitHub. After a push to `main`, job `smoke-test-production` waits up to 10 minutes for `https://first-job-ai-react-mvp.vercel.app/` and `/healthz` to answer, so a broken deploy turns the run red.
- Secrets required in GitHub: **none**.

**Manual clicks (GitHub):** repo -> Settings -> Branches -> Add branch protection rule -> branch `main` -> tick *Require a pull request before merging* and *Require status checks to pass* -> select `check`.
**Verify deploy connections:** Vercel project -> Settings -> Git: production branch is `main`. Railway service -> Settings -> Source: branch `main`.

## 5. Jira steps

1. Jira -> your project -> **Project settings -> Import** (or Jira settings -> System -> External system import -> CSV) -> upload `docs/jira-import.csv` -> map Summary, Issue Type, Description, Sprint, Status.
2. Open **Backlog**; confirm Sprint 1, 2 and 3 each contain the right stories. Fix any story whose real status differs.
3. For Sprints 1 and 2 click **Complete sprint**. Move `FJA-S3-1` to Done only after the GitHub run is green, then complete Sprint 3.
4. Project settings -> **People** -> add your instructor.
5. Copy the project URL from the browser into the Word document.
