import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FeedbackView from '../../src/components/FeedbackView.jsx';
import { checkAnswer } from '../../src/lib/answerChecklist.js';

describe('interview feedback display', () => {
  it('AI feedback shows the score, one strength and one improvement', () => {
    render(<FeedbackView feedback={{ mode: 'ai', score: 8, summary: 'Clear.', strengths: ['Good structure'], improvements: ['Add a number'] }} />);
    expect(screen.getByText('Score: 8/10')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Good structure')).toBeInTheDocument();
    expect(screen.getByText('Add a number')).toBeInTheDocument();
  });

  it('basic (checklist) feedback shows a score, strength and improvement, and is labeled not AI', () => {
    const feedback = checkAnswer({ question: 'Why this role?', answer: 'I like it a lot', category: 'behavioral' });
    render(<FeedbackView feedback={feedback} />);
    expect(screen.getByText(`Score: ${feedback.score}/10`)).toBeInTheDocument();
    expect(screen.getByText(feedback.strength, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/not AI/)).toBeInTheDocument();
  });

  it('older saved feedback without a score still renders', () => {
    render(<FeedbackView feedback={{ mode: 'checklist', passed: 1, total: 2, checks: [{ label: 'Length', passed: true, tip: 'ok' }] }} />);
    expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();
    expect(screen.getByText('1 of 2 checks passed')).toBeInTheDocument();
  });
});
