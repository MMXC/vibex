import { render, screen } from '@testing-library/react';
import { RequirementSummary } from './RequirementSummary';

describe('RequirementSummary', () => {
  it('renders requirement text', () => {
    render(<RequirementSummary requirementText="Test requirement" />);
    expect(screen.getByText('Test requirement')).toBeInTheDocument();
  });

  it('renders without crashing when empty', () => {
    render(<RequirementSummary requirementText="" />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders confirm and modify buttons', () => {
    render(<RequirementSummary requirementText="Test" />);
    expect(screen.getByText('确认')).toBeInTheDocument();
    expect(screen.getByText('修改')).toBeInTheDocument();
  });
});