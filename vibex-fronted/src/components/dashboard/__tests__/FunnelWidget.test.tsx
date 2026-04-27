/**
 * FunnelWidget — Unit tests
 * E4-US-E4.1: Funnel Analysis Widget
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FunnelWidget } from '../FunnelWidget';

const mockSteps = [
  { name: 'Canvas访问', count: 1000, rate: 1.0 },
  { name: '开始建模', count: 600, rate: 0.6 },
  { name: '提交需求', count: 300, rate: 0.3 },
  { name: '完成交付', count: 150, rate: 0.15 },
];

describe('FunnelWidget', () => {
  it('renders funnel widget container', () => {
    render(<FunnelWidget steps={mockSteps} isLoading={false} />);
    expect(screen.getByTestId('funnel-widget')).toBeInTheDocument();
  });

  it('renders all funnel step names', () => {
    render(<FunnelWidget steps={mockSteps} isLoading={false} />);
    expect(screen.getByText('Canvas访问')).toBeInTheDocument();
    expect(screen.getByText('开始建模')).toBeInTheDocument();
    expect(screen.getByText('提交需求')).toBeInTheDocument();
    expect(screen.getByText('完成交付')).toBeInTheDocument();
  });

  it('renders step counts with commas', () => {
    render(<FunnelWidget steps={mockSteps} isLoading={false} />);
    const body = document.body.textContent ?? '';
    expect(body).toContain('1,000');
    expect(body).toContain('600');
    expect(body).toContain('300');
  });

  it('renders conversion rates', () => {
    render(<FunnelWidget steps={mockSteps} isLoading={false} />);
    const body = document.body.textContent ?? '';
    expect(body).toContain('100.0%');
    expect(body).toContain('60.0%');
    expect(body).toContain('30.0%');
  });

  it('renders skeleton when loading', () => {
    render(<FunnelWidget steps={[]} isLoading={true} />);
    expect(screen.getByTestId('funnel-skeleton')).toBeInTheDocument();
  });

  it('renders empty state when no steps and not loading', () => {
    render(<FunnelWidget steps={[]} isLoading={false} />);
    expect(screen.getByTestId('funnel-widget')).toBeInTheDocument();
    expect(screen.queryByText('Canvas访问')).not.toBeInTheDocument();
  });
});
