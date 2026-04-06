import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('proposal-tracker CLI', () => {
  it('list proposals successfully', () => {
    const output = execSync('python3 scripts/proposal-tracker.py list', {
      encoding: 'utf-8',
    });
    expect(output).toContain('Total:');
    expect(output).toContain('done');
  });

  it('filter by status', () => {
    const output = execSync('python3 scripts/proposal-tracker.py list --status done', {
      encoding: 'utf-8',
    });
    expect(output).toContain('done');
    expect(output).not.toContain('pending');
  });

  it('shows help', () => {
    const output = execSync('python3 scripts/proposal-tracker.py list', {
      encoding: 'utf-8',
    });
    expect(output).toContain('ID');
    expect(output).toContain('Status');
    expect(output).toContain('Epic');
  });
});
