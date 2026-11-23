// Feedback for one interview answer: a 1-10 score, one strength and one improvement.
// AI is tried first but only for FEEDBACK_TIMEOUT_MS; if it is slow or fails, the
// built-in checklist (checkAnswer) answers instead, so the user is never left waiting.
import { checkAnswer } from './answerChecklist.js';

export const FEEDBACK_TIMEOUT_MS = 15000;

const clampScore = (n) => Math.min(10, Math.max(1, Math.round(Number(n))));
const firstText = (list) => (Array.isArray(list) ? list.find((s) => typeof s === 'string' && s.trim()) : undefined)?.trim();

// Keeps the AI reply but cuts it down to one strength and one improvement.
// Returns null when the reply has no usable score, so the caller falls back.
export function normalizeAiFeedback(res, model) {
  const score = Number(res?.score);
  const strength = firstText(res?.strengths);
  const improvement = firstText(res?.improvements);
  if (!Number.isFinite(score) || score < 1 || !strength || !improvement) return null;
  return { ...res, mode: 'ai', model, score: clampScore(score), strengths: [strength], improvements: [improvement] };
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`the AI took longer than ${Math.round(ms / 1000)} seconds`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// callAi is injected so tests can pass a fake (and so this file has no network code).
export async function getAnswerFeedback({ question, answer, category, jobTitle, aiActive, model, callAi, timeoutMs = FEEDBACK_TIMEOUT_MS }) {
  const basic = () => checkAnswer({ question, answer, category });
  if (!aiActive) return basic();
  try {
    const res = await withTimeout(callAi('feedback', { question, answer, jobTitle, category }), timeoutMs);
    const feedback = normalizeAiFeedback(res, model);
    if (!feedback) throw new Error('the AI reply had no score');
    return feedback;
  } catch (err) {
    return { ...basic(), fallbackReason: err.message };
  }
}

// Average score of the answered questions in a session (null if none have a score).
export function sessionAverage(session) {
  const scores = (session?.items || []).map((i) => i.feedback?.score).filter((s) => Number.isFinite(s));
  return scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
}
