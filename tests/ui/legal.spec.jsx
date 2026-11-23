import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Legal from '../../src/pages/Legal.jsx';

describe('privacy and terms page', () => {
  it.each(['/privacy', '/terms'])('%s shows the notice and a link home', (path) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/privacy" element={<Legal />} />
          <Route path="/terms" element={<Legal />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Privacy and terms' })).toBeInTheDocument();
    expect(screen.getByText(/never invents jobs/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
  });
});
