// Optional error tracking with Sentry, without the Sentry SDK (no extra dependency).
// Off unless SENTRY_DSN is set. It sends only: error type, a scrubbed message, a short
// stack trace with query strings removed, environment and release. Never cookies, headers,
// request bodies, user ids, emails or any app data.
const MAX_PER_MINUTE = 30;

// Removes things that could identify a person or be a secret from free text.
export function scrub(text, max = 300) {
  return String(text ?? '')
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/(bearer|token|key|password|secret)[=:\s]+\S+/gi, '$1=[redacted]')
    .replace(/[A-Za-z0-9_-]{24,}/g, '[redacted]')
    .replace(/\?[^\s)]*/g, '')
    .slice(0, max);
}

export function parseDsn(dsn) {
  try {
    const u = new URL(String(dsn).trim());
    const id = u.pathname.split('/').filter(Boolean).pop();
    if (u.protocol !== 'https:' || !u.username || !id) return null;
    return { key: u.username, url: `https://${u.host}/api/${id}/envelope/` };
  } catch {
    return null;
  }
}

export function buildEvent({ name, message, stack }, { source, env = {} }) {
  return {
    event_id: crypto.randomUUID().replaceAll('-', ''),
    timestamp: Date.now() / 1000,
    platform: 'javascript',
    level: 'error',
    environment: env.NODE_ENV || 'development',
    release: env.RAILWAY_GIT_COMMIT_SHA || env.VERCEL_GIT_COMMIT_SHA || undefined,
    tags: { source },
    exception: { values: [{ type: scrub(name || 'Error', 80), value: scrub(message) }] },
    extra: { stack: scrub(stack, 1500).split('\n').slice(0, 15).join('\n') },
  };
}

// fetchFn is injectable so tests never touch the network.
export function createReporter(env = {}, { fetchFn = globalThis.fetch } = {}) {
  const dsn = env.SENTRY_DSN ? parseDsn(env.SENTRY_DSN) : null;
  let windowStart = 0;
  let sent = 0;
  async function report(error, source = 'server') {
    if (!dsn) return false;
    const now = Date.now();
    if (now - windowStart > 60000) [windowStart, sent] = [now, 0];
    if (sent >= MAX_PER_MINUTE) return false;
    sent += 1;
    const event = buildEvent({ name: error?.name, message: error?.message ?? error, stack: error?.stack }, { source, env });
    const body = `${JSON.stringify({ event_id: event.event_id, dsn: env.SENTRY_DSN })}\n${JSON.stringify({ type: 'event' })}\n${JSON.stringify(event)}`;
    try {
      const res = await fetchFn(dsn.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-sentry-envelope', 'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${dsn.key}, sentry_client=first-job-ai/1.0` },
        body,
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false; // Error tracking must never break the app.
    }
  }
  return { enabled: Boolean(dsn), report };
}
