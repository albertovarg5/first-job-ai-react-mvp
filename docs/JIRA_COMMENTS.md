# Jira completion comments (FJA-12 and FJA-18)

Paste each comment into the matching Jira story **after the pull request is merged and GitHub Actions is green**. Do not mark the story Done before that.

## FJA-12: Practice interviews with AI feedback

Implemented in pull request `feat/fja-12-18-interview-strategy`.

- **Five questions per role:** `QUESTION_COUNT = 5` (`src/lib/questionBank.js`). The built-in library mixes behavioral and role-specific questions. With AI connected the questions are AI-generated (labeled "AI-generated question"); if the AI returns fewer than five or fails, `fillQuestions` completes the set from the library and each question is labeled with its real source.
- **Score, one strength, one improvement:** the AI `feedback` task now returns a whole-number score 1-10 and the server rejects replies without a valid score (`server/aiHandler.js`). The app shows exactly one strength and one improvement (`src/lib/interviewFeedback.js`, `src/components/FeedbackView.jsx`). The basic checklist also produces a score, one strength and one improvement (`src/lib/answerChecklist.js`).
- **15-second limit with fallback:** the client waits at most 15 s (`FEEDBACK_TIMEOUT_MS`) and the server aborts the model call after 14 s. On timeout, error or an unusable reply, the basic checklist feedback is used and the screen says so.
- **History:** sessions save questions, answers, scores and feedback (existing Interview History, now showing the average score). Older saved sessions without scores still load.
- **Tests:** `tests/interview.test.js` (10 tests: five mixed questions, scores, one strength/improvement, AI timeout and fallback, AI route validation, history saved and reloaded after sign-out/restart, old data) and `tests/ui/feedback.spec.jsx` (3 tests).
- **Not tested:** a real Anthropic call (all AI calls are simulated) and real-world AI latency; the 14 s server limit may make the checklist fallback more frequent with slow models.

## FJA-18: Strategy pattern for AI and job search providers

Implemented for **job search providers**. The AI side has only one provider (Anthropic), so no AI strategy was added, and the story title should be narrowed to "job search providers" or a follow-up story created if AI provider switching is wanted.

- `server/jobProviders.js`: two strategies (`openWebNinja`, `rapidApi`) with one interface (`id`, `label`, `keyHelp`, `baseUrl`, `headers`, `buildUrl`, `hasMore`) and `chooseStrategy(env)` for configuration-based selection.
- `server/jobsHandler.js` no longer has provider-specific branches; `createJobsHandler(env, { strategy })` accepts an injected strategy.
- API responses, error messages, credentials handling and caching are unchanged; the API key is never returned.
- **Tests:** `tests/strategy.test.js` (5 tests: shared interface, configuration selects the strategy, different requests from the same search, a custom strategy swapped in with the same response shape, error messages name the strategy), plus all existing `tests/jobs.test.js` tests unchanged and passing.
- **Docs:** README and `docs/ARCHITECTURE.md` explain the pattern and its benefits.
