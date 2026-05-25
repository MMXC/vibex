/**
 * AIScoreCard Tests — Sprint38 P003-E3
 */

import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIScoreCard, computeDiffScores } from './AIScoreCard';
import type { DiffResult } from '@/hooks/useAIAgent';

describe('computeDiffScores', () => {
  it('returns 3-dimension scores for empty diff', () => {
    const result = computeDiffScores({ added: 0, removed: 0, changes: [] });
    expect(result).toHaveProperty('readability');
    expect(result).toHaveProperty('complexity');
    expect(result).toHaveProperty('coverage');
    expect(result.readability).toBeGreaterThanOrEqual(1);
    expect(result.readability).toBeLessThanOrEqual(5);
  });

  it('returns higher complexity for larger diffs', () => {
    const small = computeDiffScores({
      added: 3,
      removed: 1,
      changes: [
        { type: 'add', line: 'const x = 1;', lineNumber: 1 },
        { type: 'add', line: 'const y = 2;', lineNumber: 2 },
        { type: 'remove', line: 'const z = 3;', lineNumber: 3 },
      ],
    });
    const large = computeDiffScores({
      added: 50,
      removed: 20,
      changes: Array.from({ length: 70 }, (_, i) => ({
        type: 'add' as const,
        line: `const line${i} = ${i};`,
        lineNumber: i + 1,
      })),
    });
    expect(large.complexity).toBeGreaterThan(small.complexity);
  });

  it('returns higher readability for shorter lines', () => {
    const short = computeDiffScores({
      added: 5,
      removed: 0,
      changes: Array.from({ length: 5 }, (_, i) => ({
        type: 'add' as const,
        line: 'const x = 1;',
        lineNumber: i + 1,
      })),
    });
    const long = computeDiffScores({
      added: 5,
      removed: 0,
      changes: Array.from({ length: 5 }, (_, i) => ({
        type: 'add' as const,
        line:
          'const veryLongVariableNameThatExceedsTheUsualLineLengthLimitForReadability = someVeryLongExpression.that.chain.calls.many.methods().and.creates.a.very.long.line;',
        lineNumber: i + 1,
      })),
    });
    expect(short.readability).toBeGreaterThanOrEqual(long.readability);
  });
});

describe('AIScoreCard', () => {
  const mockDiff: DiffResult = {
    added: 5,
    removed: 2,
    changes: [
      { type: 'add', line: 'const x = 1;', lineNumber: 1 },
      { type: 'add', line: 'const y = 2;', lineNumber: 2 },
      { type: 'add', line: '// comment', lineNumber: 3 },
      { type: 'remove', line: 'const z = 3;', lineNumber: 4 },
      { type: 'remove', line: 'const w = 4;', lineNumber: 5 },
    ],
  };

  it('renders score card with all three dimensions', () => {
    render(<AIScoreCard diffResult={mockDiff} />);
    expect(screen.getByTestId('ai-score-card')).toBeInTheDocument();
    expect(screen.getByTestId('score-row-可读性')).toBeInTheDocument();
    expect(screen.getByTestId('score-row-复杂度')).toBeInTheDocument();
    expect(screen.getByTestId('score-row-覆盖率')).toBeInTheDocument();
  });

  it('shows overall score', () => {
    render(<AIScoreCard diffResult={mockDiff} />);
    const overall = screen.getByTestId('score-overall');
    expect(overall.textContent).toMatch(/综合 \d\/5/);
  });

  it('has a save button', () => {
    render(<AIScoreCard diffResult={mockDiff} />);
    const btn = screen.getByTestId('score-save-btn');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('💾 保存评分');
  });

  it('save button is present and clickable', () => {
    render(<AIScoreCard diffResult={mockDiff} />);
    const btn = screen.getByTestId('score-save-btn');
    expect(btn).toBeInTheDocument();
    // Click should not throw (store action may or may not be connected in test env)
    expect(() => fireEvent.click(btn)).not.toThrow();
  });
});
