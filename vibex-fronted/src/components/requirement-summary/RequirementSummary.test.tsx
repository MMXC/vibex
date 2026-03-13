import { render, screen } from '@testing-library/react';
import { RequirementSummary } from './RequirementSummary';

describe('RequirementSummary', () => {
  it('renders requirement text', () => {
    render(<RequirementSummary requirement="Test requirement" />);
    expect(screen.getByText('Test requirement')).toBeInTheDocument();
  });

  it('renders without crashing when empty', () => {
    render(<RequirementSummary requirement="" />);
    expect(document.body).toBeInTheDocument();
  });
});
