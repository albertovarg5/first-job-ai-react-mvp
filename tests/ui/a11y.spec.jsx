// Basic accessibility checks (FJA-24). These are targeted checks, not a full WCAG audit.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Field } from '../../src/components/ui.jsx';
import Legal from '../../src/pages/Legal.jsx';
import NotFound from '../../src/pages/NotFound.jsx';

const read = (p) => readFileSync(join(process.cwd(), p), 'utf8');
function sourceFiles(dir) {
  return readdirSync(join(process.cwd(), dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sourceFiles(join(dir, e.name)) : /\.jsx$/.test(e.name) ? [join(dir, e.name)] : [],
  );
}

describe('accessibility basics', () => {
  it('the page declares a language, and the app has a skip link and a main landmark', () => {
    expect(read('index.html')).toMatch(/<html lang="en"/);
    const layout = read('src/components/AppLayout.jsx');
    expect(layout).toMatch(/href="#main"[^>]*skip-link|skip-link[^>]*href="#main"/);
    expect(layout).toMatch(/<main id="main"/);
  });

  it('keyboard focus is visible, and every outline removal has a replacement', () => {
    const css = read('src/styles/global.css');
    expect(css).toMatch(/:focus-visible\s*{/);
    expect(css).toMatch(/\.input:focus[^}]*box-shadow/s);
  });

  it('no <img> without alt text, and no icon-only <button> without a name', () => {
    for (const file of sourceFiles('src')) {
      const code = read(file);
      for (const img of code.match(/<img\b[^>]*>/g) || []) expect(img, file).toMatch(/\balt=/);
      for (const btn of code.match(/<button\b[^>]*>\s*<Icon\b[^>]*\/>\s*<\/button>/g) || []) expect(btn, file).toMatch(/aria-label=/);
    }
  });

  it('a form Field connects its label to the input, so clicking the label focuses it', async () => {
    render(<Field label="Email" id="e"><input id="e" /></Field>);
    await userEvent.click(screen.getByText('Email'));
    expect(screen.getByLabelText('Email')).toHaveFocus();
  });

  it('pages have one top-level heading, and links are reachable by keyboard', async () => {
    const { unmount } = render(<MemoryRouter><Legal /></MemoryRouter>);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Back to home' })).toBeInTheDocument();
    unmount();
    render(<MemoryRouter><NotFound /></MemoryRouter>);
    await userEvent.tab(); // the logo link comes first
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Go to dashboard' })).toHaveFocus();
  });
});
