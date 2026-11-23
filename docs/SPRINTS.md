# Sprints and user stories

The same list is in [jira-import.csv](jira-import.csv). **Honesty note:** the Jira project was not accessible while writing this, so sprint assignment is reconstructed from the Git history and the plan in the README (Sprint 1 = MVP, Sprint 2 = tests/responsive/CI polish, Sprint 3 = finalization). If your real Jira boards differ, trust Jira and edit these files.

| Sprint | Goal |
|---|---|
| 1 | MVP: accounts, job search, tracker, resume PDF, guest mode, deployment, architecture docs |
| 2 | Quality: component tests, mobile-first CSS, lint and PR workflow, application workspace, optional AI |
| 3 | Finalization: CI/CD on main, privacy/terms page, email verification, design-pattern evidence, docs, final testing |


## Sprint 1

### FJA-S1-1: Accounts: sign up and sign in
- **Story:** As a job seeker, I want an account so my data follows me to any device.
- **Acceptance criteria:**
  - Given valid details, sign-up creates an account and signs me in (or asks me to confirm my email).
  - A wrong password shows a clear error and never reveals whether the email exists.
  - Signing out returns me to guest data; signing in brings my data back.
- **Sprint:** 1
- **Implementation:** server/auth.js, src/pages/Auth.jsx, src/context/AuthContext.jsx
- **Testing evidence:** tests/auth.test.js, tests/security.test.js, tests/signup-ui.test.js
- **Status:** Done

### FJA-S1-2: Real job search
- **Story:** As a student, I want to search real job listings by title and location.
- **Acceptance criteria:**
  - Signed-in users get listings with title, company, location and a link.
  - Signed-out users are asked to sign in.
  - Missing key, bad key, rate limit, timeout and empty results each show a clear message; no fake jobs are ever shown.
- **Sprint:** 1
- **Implementation:** server/jobsHandler.js, src/pages/JobSearch.jsx
- **Testing evidence:** tests/jobs.test.js, tests/ui/jobSearch.spec.jsx
- **Status:** Done

### FJA-S1-3: Job tracker
- **Story:** As a job seeker, I want to track applications and their status.
- **Acceptance criteria:**
  - I can add, edit, delete and change the status of an application.
  - The same company + title + location cannot be added twice.
  - Data persists after refresh and sign-out/sign-in, and other users cannot see it.
- **Sprint:** 1
- **Implementation:** src/pages/JobTracker.jsx, server/dataHandler.js
- **Testing evidence:** tests/tracker.test.js, tests/workflow.test.js, tests/security.test.js
- **Status:** Done

### FJA-S1-4: Resume builder with PDF
- **Story:** As a first-time applicant, I want to build a resume and download it as a PDF.
- **Acceptance criteria:**
  - I can edit contact, summary, experience, education and skills.
  - Download PDF produces a multi-page-safe PDF.
  - Summaries never claim skills I did not enter.
- **Sprint:** 1
- **Implementation:** src/pages/ResumeBuilder.jsx, src/lib/ (PDF builders)
- **Testing evidence:** tests/resume.test.js, tests/features.test.js
- **Status:** Done

### FJA-S1-5: Guest mode
- **Story:** As a visitor, I want to try the app without an account.
- **Acceptance criteria:**
  - Onboarding works with no account; data is saved in my browser.
  - Creating an account can copy my guest data over.
- **Sprint:** 1
- **Implementation:** src/lib/storage.js, src/context/AppDataContext.jsx
- **Testing evidence:** tests/workflow.test.js
- **Status:** Done

### FJA-S1-6: Deploy to Vercel + Railway
- **Story:** As a student, I want the app online so my instructor can open it.
- **Acceptance criteria:**
  - Frontend opens at the Vercel URL.
  - /healthz answers ok.
  - Secrets live in host settings, not in Git.
- **Sprint:** 1
- **Implementation:** vercel.json, railway.json, docs/DEPLOY.md
- **Testing evidence:** Live check: /healthz returned ok on 2026-11-23
- **Status:** Done

### FJA-S1-7: Architecture notes and first design pattern
- **Story:** As a maintainer, I want the architecture documented.
- **Acceptance criteria:**
  - docs/ARCHITECTURE.md explains layers and a design pattern that exists in code.
- **Sprint:** 1
- **Implementation:** docs/ARCHITECTURE.md
- **Testing evidence:** tests/patterns.test.js (added in Sprint 3)
- **Status:** Done


## Sprint 2

### FJA-S2-1: Component tests
- **Story:** As a developer, I want automated component tests so UI regressions are caught.
- **Acceptance criteria:**
  - Reusable components, local state, the 404 page and Job Search loading/success/error states are tested.
  - npm test runs them.
- **Sprint:** 2
- **Implementation:** tests/ui/*.spec.jsx (Vitest + React Testing Library)
- **Testing evidence:** tests/ui/components.spec.jsx, tests/ui/jobSearch.spec.jsx
- **Status:** Done

### FJA-S2-2: Mobile-first responsive layout
- **Story:** As a phone user, I want navigation and key screens to fit my screen.
- **Acceptance criteria:**
  - Dashboard, Job Search, Tracker and Resume use mobile-first CSS.
  - No horizontal scrolling from 320px to 1400px.
- **Sprint:** 2
- **Implementation:** src/styles/global.css, src/styles/pages.css
- **Testing evidence:** Checked by hand in a browser (not automated)
- **Status:** Done

### FJA-S2-3: Linting and pull-request workflow
- **Story:** As a team member, I want lint and CI on pull requests.
- **Acceptance criteria:**
  - ESLint runs; a PR template exists; the workflow runs lint, tests and build.
- **Sprint:** 2
- **Implementation:** .github/workflows/ci.yml, eslint.config.js, PR template
- **Testing evidence:** GitHub PRs #1-#3 merged
- **Status:** Done

### FJA-S2-4: Application workspace and optional AI
- **Story:** As an applicant, I want one place per application and optional AI help.
- **Acceptance criteria:**
  - Each tracked job opens a workspace page.
  - Without an AI key every feature still works in labeled Basic mode.
  - AI errors (bad key, no credit, rate limit) show plain messages.
- **Sprint:** 2
- **Implementation:** src/pages/ApplicationWorkspace.jsx, server/aiHandler.js
- **Testing evidence:** tests/career.test.js, tests/integrations.test.js
- **Status:** Done


## Sprint 3

### FJA-S3-1: CI/CD on main
- **Story:** As a maintainer, I want every PR into main checked and main deployed automatically.
- **Acceptance criteria:**
  - The workflow runs on pull requests to main and on pushes to main.
  - Lint, tests and build must pass; a failing test turns the run red.
  - After a push to main, a job confirms the live site and /healthz respond.
- **Sprint:** 3
- **Implementation:** .github/workflows/ci.yml. Vercel and Railway deploy main through their GitHub integrations.
- **Testing evidence:** GitHub Actions run: see docs/SPRINT3_REPORT.md
- **Status:** In verification (needs the PR run on GitHub)

### FJA-S3-2: Privacy and terms page
- **Story:** As a user, I want to know what happens to my data.
- **Acceptance criteria:**
  - /privacy and /terms show a plain-language notice.
  - The landing page links to it.
  - It states that AI, payments and email only run when those services are configured.
- **Sprint:** 3
- **Implementation:** src/pages/Legal.jsx, src/App.jsx, src/pages/Landing.jsx
- **Testing evidence:** tests/ui/legal.spec.jsx
- **Status:** Done

### FJA-S3-3: Email verification
- **Story:** As the owner, I want sign-ups confirmed by email.
- **Acceptance criteria:**
  - After sign-up the app says check your email and does not sign in.
  - A valid link asks for the password then signs in; a bad link explains what to do.
- **Sprint:** 3
- **Implementation:** server/auth.js, src/pages/Auth.jsx
- **Testing evidence:** tests/signup-ui.test.js
- **Status:** Done

### FJA-S3-4: Design-pattern evidence
- **Story:** As a student, I want proof that two design patterns are real.
- **Acceptance criteria:**
  - Repository and Dependency Injection are documented with file names.
  - Tests use fakes injected through the same factories.
- **Sprint:** 3
- **Implementation:** server/billingStore.js, server/dataHandler.js, docs/ARCHITECTURE.md
- **Testing evidence:** tests/patterns.test.js
- **Status:** Done

### FJA-S3-5: Final documentation
- **Story:** As a reader, I want complete docs.
- **Acceptance criteria:**
  - README, ARCHITECTURE, SPRINTS, SPRINT3_REPORT and TROUBLESHOOTING are current.
- **Sprint:** 3
- **Implementation:** README.md, docs/*.md
- **Testing evidence:** Reviewed by hand
- **Status:** Done

### FJA-S3-6: Jira project closed and shared
- **Story:** As a student, I want my Jira project to show three finished sprints.
- **Acceptance criteria:**
  - Stories are imported, sprints 1-3 completed, instructor invited.
- **Sprint:** 3
- **Implementation:** docs/jira-import.csv; steps in docs/SPRINT3_REPORT.md
- **Testing evidence:** Not done: needs your Jira account
- **Status:** Not started (manual)
