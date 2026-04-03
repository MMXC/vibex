// @ts-nocheck
import { render, screen } from '@testing-library/react';
import { GridContainer } from '../index';

describe('GridContainer', () => {
  it('should be defined', () => {
    expect(GridContainer).toBeDefined();
  });

  it('should render children', () => {
    render(
      <GridContainer>
        <div data-testid="child">Test Content</div>
      </GridContainer>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should have default data-testid', () => {
    render(
      <GridContainer>
        <div>Content</div>
      </GridContainer>
    );
    expect(screen.getByTestId('grid-container')).toBeInTheDocument();
  });

  it('should accept custom data-testid', () => {
    render(
      <GridContainer data-testid="custom-grid">
        <div>Content</div>
      </GridContainer>
    );
    expect(screen.getByTestId('custom-grid')).toBeInTheDocument();
  });
});
