import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from '../../src/components/ErrorBoundary.jsx';

function Boom() {
  throw new Error('render failed');
}

describe('ErrorBoundary', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows a friendly alert and reports only error info to our own server', () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Reload the page' })).toBeInTheDocument();
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/client-error');
    expect(Object.keys(JSON.parse(opts.body)).sort()).toEqual(['message', 'name', 'stack']);
  });

  it('renders children when nothing fails', () => {
    render(<ErrorBoundary><p>fine</p></ErrorBoundary>);
    expect(screen.getByText('fine')).toBeInTheDocument();
  });
});
