// FJA-12: interview practice. Five questions, a 1-10 score with one strength and one
// improvement, a 15 second AI limit with the basic checklist as fallback, and saved history.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAiHandler } from '../server/aiHandler.js';
import { createApi } from '../server/api.js';
import { openDatabase } from '../server/db.js';
import { checkAnswer } from '../src/lib/answerChecklist.js';
import { FEEDBACK_TIMEOUT_MS, getAnswerFeedback, normalizeAiFeedback, sessionAverage } from '../src/lib/interviewFeedback.js';
import { QUESTION_COUNT, buildQuestionSet, fillQuestions } from '../src/lib/questionBank.js';
import { normalizeData } from '../src/lib/storage.js';
import { call, jsonResponse, withFetch } from './helpers.js';

const quietLog = { info() {}, warn() {}, error() {} };
const cookieFrom = (res) => String(res.headers['set-cookie'] || '').split(';')[0];
const STRONG =
  'Last semester in my marketing class I led a group of four on a project. I organized weekly meetings, built a shared budget in Excel and asked our professor for feedback. As a result we finished early and got an A, and I learned to plan around deadlines.';
const WEAK = 'I am good at stuff';
const ai = (over = {}) => ({ score: 8, summary: 'Clear answer.', strengths: ['Good structure', 'Nice detail'], improvements: ['Add a number', 'Shorter'], nextStep: 'Try again', ...over });
const never = () => new Promise(() => {});

// ---- questions
test('a selected role gets exactly five questions, mixing behavioral and role-specific', () => {
  assert.equal(QUESTION_COUNT, 5);
  for (const jobTitle of ['Marketing Intern', 'Software Developer', 'Nurse Assistant', 'Cashier']) {
    for (const seed of [1, 2, 3]) {
      const { questions } = buildQuestionSet({ jobTitle, type: 'mixed', count: QUESTION_COUNT, seed });
      assert.equal(questions.length, 5, jobTitle);
      const kinds = new Set(questions.map((q) => q.category));
      assert.ok(kinds.has('behavioral') && kinds.has('technical'), `${jobTitle} mixes behavioral and role-specific`);
    }
  }
});

test('fillQuestions tops up AI questions from the library to exactly five, without duplicates', () => {
  const library = buildQuestionSet({ jobTitle: 'Analyst', type: 'mixed', count: 5, seed: 1 }).questions;
  const aiQs = [{ question: library[0].question.toUpperCase(), category: 'general', source: 'ai' }, { question: 'Why us?', category: 'general', source: 'ai' }];
  const out = fillQuestions(aiQs, library, 5);
  assert.equal(out.length, 5);
  assert.equal(new Set(out.map((q) => q.question.toLowerCase())).size, 5);
  assert.equal(out.filter((q) => q.source === 'ai').length, 2, 'AI questions stay labeled as AI');
});

// ---- score, strength, improvement (basic checklist)
test('basic feedback: a 1-10 score, one strength, one improvement; better answers score higher', () => {
  const strong = checkAnswer({ question: 'Tell me about a time you led a team.', answer: STRONG, category: 'behavioral' });
  const weak = checkAnswer({ question: 'Tell me about a time you led a team.', answer: WEAK, category: 'behavioral' });
  for (const f of [strong, weak]) {
    assert.ok(Number.isInteger(f.score) && f.score >= 1 && f.score <= 10);
    assert.equal(typeof f.strength, 'string');
    assert.equal(typeof f.improvement, 'string');
  }
  assert.ok(strong.score > weak.score);
});

// ---- AI feedback
test('AI feedback is cut to one strength and one improvement; a missing score is rejected', () => {
  const f = normalizeAiFeedback(ai({ score: 11 }), 'm');
  assert.equal(f.score, 10);
  assert.deepEqual(f.strengths, ['Good structure']);
  assert.deepEqual(f.improvements, ['Add a number']);
  assert.equal(normalizeAiFeedback(ai({ score: undefined })), null);
  assert.equal(normalizeAiFeedback(ai({ strengths: [] })), null);
});

const base = { question: 'Why this role?', answer: STRONG, category: 'behavioral', jobTitle: 'Intern', model: 'm' };

test('feedback uses the AI when it answers in time', async () => {
  const f = await getAnswerFeedback({ ...base, aiActive: true, callAi: async () => ai() });
  assert.equal(f.mode, 'ai');
  assert.equal(f.score, 8);
});

test('timeout: a slow AI falls back to the checklist, and the limit is 15 seconds', async () => {
  assert.equal(FEEDBACK_TIMEOUT_MS, 15000);
  const started = Date.now();
  const f = await getAnswerFeedback({ ...base, aiActive: true, callAi: never, timeoutMs: 50 });
  assert.ok(Date.now() - started < 1000);
  assert.equal(f.mode, 'checklist');
  assert.match(f.fallbackReason, /took longer/);
  assert.ok(f.score >= 1 && f.score <= 10);
});

test('fallback: an AI error, a reply without a score, or AI off all give checklist feedback', async () => {
  const failing = await getAnswerFeedback({ ...base, aiActive: true, callAi: async () => { throw new Error('rate limited'); } });
  assert.equal(failing.mode, 'checklist');
  assert.equal(failing.fallbackReason, 'rate limited');
  const noScore = await getAnswerFeedback({ ...base, aiActive: true, callAi: async () => ai({ score: undefined }) });
  assert.equal(noScore.mode, 'checklist');
  let called = false;
  const off = await getAnswerFeedback({ ...base, aiActive: false, callAi: async () => { called = true; } });
  assert.equal(off.mode, 'checklist');
  assert.equal(called, false);
});

test('AI route: asks for a score and rejects replies without a valid one', async () => {
  const reply = (obj) => async (url) => (String(url).includes('/v1/models') ? new Response('{}') : jsonResponse({ content: [{ type: 'text', text: JSON.stringify(obj) }] }));
  const handler = createAiHandler({ ANTHROPIC_API_KEY: 'sk-test' });
  const body = { question: 'Why?', answer: STRONG, category: 'behavioral', jobTitle: 'Intern' };
  const ok = await withFetch(reply(ai()), () => call(handler, 'POST', '/feedback', body));
  assert.equal(ok.status, 200);
  assert.equal(ok.body.score, 8);
  const missing = await withFetch(reply(ai({ score: undefined })), () => call(handler, 'POST', '/feedback', body));
  assert.equal(missing.status, 502);
  assert.equal(missing.body.code, 'bad_response');
  const outOfRange = await withFetch(reply(ai({ score: 14 })), () => call(handler, 'POST', '/feedback', body));
  assert.equal(outOfRange.status, 502);
});

// ---- history
test('history: sessions with questions, answers, scores and feedback persist and reload for the owner', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'fja-iv-'));
  const file = join(dir, 'app.db');
  try {
    const feedback = checkAnswer({ question: 'Why this role?', answer: STRONG, category: 'behavioral' });
    const session = {
      id: 'iv-1',
      jobTitle: 'Marketing Intern',
      type: 'mixed',
      startedAt: '2026-11-20T10:00:00.000Z',
      completedAt: '2026-11-20T10:20:00.000Z',
      items: [
        { question: 'Why this role?', category: 'behavioral', source: 'library', answer: STRONG, feedback },
        { question: 'Tell me about yourself.', category: 'general', source: 'ai', answer: '', feedback: null },
      ],
    };
    assert.equal(sessionAverage(session), feedback.score);

    let db = await openDatabase(file);
    let api = createApi({}, { db, log: quietLog });
    const signup = await call(api, 'POST', '/auth/signup', { email: 'iv@example.com', password: 'practice makes perfect' });
    const put = await call(api, 'PUT', '/data', { baseRevision: 0, data: { interviewSessions: [session] } }, { headers: { cookie: cookieFrom(signup) } });
    assert.equal(put.status, 200);
    await db.close();

    db = await openDatabase(file); // "restart"
    api = createApi({}, { db, log: quietLog });
    const signin = await call(api, 'POST', '/auth/signin', { email: 'iv@example.com', password: 'practice makes perfect' });
    const got = await call(api, 'GET', '/data', undefined, { headers: { cookie: cookieFrom(signin) } });
    const [saved] = normalizeData(got.body.data).interviewSessions;
    assert.equal(saved.items[0].question, 'Why this role?');
    assert.equal(saved.items[0].answer, STRONG);
    assert.equal(saved.items[0].feedback.score, feedback.score);
    assert.equal(saved.items[0].feedback.strength, feedback.strength);
    assert.equal(saved.items[1].source, 'ai');
    await db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('old saved sessions without scores still load and show no average', () => {
  const old = normalizeData({ interviewSessions: [{ id: 'old', jobTitle: 'X', items: [{ question: 'Q', answer: 'A', feedback: { mode: 'checklist', passed: 1, total: 2, checks: [] } }] }] });
  assert.equal(old.interviewSessions.length, 1);
  assert.equal(sessionAverage(old.interviewSessions[0]), null);
});
