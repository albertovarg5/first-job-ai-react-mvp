import { Component } from 'react';

let sent = 0;

// Sends only the error name, message and stack to our own server (never page data or user input).
// The server forwards it to Sentry when SENTRY_DSN is set; otherwise it is ignored.
export function reportError(error) {
  if (sent >= 5) return; // a render loop must not flood the server
  sent += 1;
  try {
    fetch('/api/client-error', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: error?.name, message: String(error?.message ?? error), stack: error?.stack }),
    }).catch(() => {});
  } catch {
    /* reporting must never break the app */
  }
}

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    reportError(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main role="alert" style={{ maxWidth: 480, margin: '4rem auto', padding: '0 1rem' }}>
        <h1>Something went wrong</h1>
        <p>The page hit an unexpected error. Your saved data is safe. Reload to try again.</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload the page</button>
      </main>
    );
  }
}
