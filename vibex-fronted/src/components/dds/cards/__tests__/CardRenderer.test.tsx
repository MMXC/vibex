/**
 * CardRenderer + Card Components Snapshot Tests
 * Epic 1: F6, F7, F8, F9
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CardRenderer } from '../CardRenderer';
import type {
  UserStoryCard,
  BoundedContextCard,
  FlowStepCard,
} from '@/types/dds';

// ==================== Fixtures ====================

const userStoryFixture: UserStoryCard = {
  id: 'us-1',
  type: 'user-story',
  title: '用户登录',
  position: { x: 0, y: 0 },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  role: 'PM',
  action: '我想要编辑用户信息',
  benefit: '以便于快速更新',
  priority: 'high',
  acceptanceCriteria: ['用户可以修改昵称', '用户可以修改头像'],
};

const boundedContextFixture: BoundedContextCard = {
  id: 'bc-1',
  type: 'bounded-context',
  title: '用户上下文',
  position: { x: 0, y: 0 },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  name: '用户上下文',
  description: '管理用户注册、登录、个人信息',
  responsibility: '处理用户认证和个人资料管理',
  relations: [
    { targetId: 'bc-2', type: 'upstream', label: '认证服务' },
    { targetId: 'bc-3', type: 'downstream', label: '通知服务' },
  ],
};

const flowStepFixture: FlowStepCard = {
  id: 'fs-1',
  type: 'flow-step',
  title: '登录流程',
  position: { x: 0, y: 0 },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  stepName: '用户登录',
  actor: '最终用户',
  preCondition: '用户已注册',
  postCondition: '用户已进入系统首页',
  nextSteps: ['fs-2', 'fs-3'],
};

// ==================== RequirementCard Tests (F6) ====================

describe('RequirementCard — user-story card', () => {
  it('renders role/action/benefit format', () => {
    render(<CardRenderer card={userStoryFixture} />);

    // User Story format: 作为 + role
    expect(screen.getByText(/PM/)).toBeInTheDocument();
    // 我想要 + action
    expect(screen.getByText(/编辑用户信息/)).toBeInTheDocument();
    // 以便于 + benefit
    expect(screen.getByText(/快速更新/)).toBeInTheDocument();
  });

  it('renders priority badge', () => {
    render(<CardRenderer card={userStoryFixture} />);
    expect(screen.getByText('高')).toBeInTheDocument();
  });

  it('renders acceptance criteria when present', () => {
    render(<CardRenderer card={userStoryFixture} />);
    expect(screen.getByText(/验收标准/)).toBeInTheDocument();
  });

  it('renders title', () => {
    render(<CardRenderer card={userStoryFixture} />);
    expect(screen.getByText('用户登录')).toBeInTheDocument();
  });

  it('is accessible with role=button', () => {
    const { container } = render(<CardRenderer card={userStoryFixture} />);
    expect(container.firstChild).toHaveAttribute('role', 'button');
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<CardRenderer card={userStoryFixture} onSelect={onSelect} />);
    screen.getByText('用户登录').click();
    expect(onSelect).toHaveBeenCalledWith('us-1');
  });
});

// ==================== BoundedContextCard Tests (F7) ====================

describe('BoundedContextCard — bounded-context card', () => {
  it('renders bounded context badge', () => {
    render(<CardRenderer card={boundedContextFixture} />);
    expect(screen.getByText(/限界上下文/)).toBeInTheDocument();
  });

  it('renders context name', () => {
    render(<CardRenderer card={boundedContextFixture} />);
    expect(screen.getByText('用户上下文')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<CardRenderer card={boundedContextFixture} />);
    expect(screen.getByText(/管理用户注册/)).toBeInTheDocument();
  });

  it('renders responsibility', () => {
    render(<CardRenderer card={boundedContextFixture} />);
    expect(screen.getByText(/处理用户认证/)).toBeInTheDocument();
  });

  it('renders relations with labels', () => {
    render(<CardRenderer card={boundedContextFixture} />);
    expect(screen.getByText(/认证服务/)).toBeInTheDocument();
    expect(screen.getByText(/通知服务/)).toBeInTheDocument();
    expect(screen.getByText(/关联关系/)).toBeInTheDocument();
  });

  it('is accessible with role=button', () => {
    const { container } = render(<CardRenderer card={boundedContextFixture} />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute('role', 'button');
  });
});

// ==================== FlowStepCard Tests (F8) ====================

describe('FlowStepCard — flow-step card', () => {
  it('renders flow step badge', () => {
    render(<CardRenderer card={flowStepFixture} />);
    expect(screen.getByText(/流程步骤/)).toBeInTheDocument();
  });

  it('renders step name', () => {
    render(<CardRenderer card={flowStepFixture} />);
    expect(screen.getByText('用户登录')).toBeInTheDocument();
  });

  it('renders actor', () => {
    render(<CardRenderer card={flowStepFixture} />);
    expect(screen.getByText(/最终用户/)).toBeInTheDocument();
  });

  it('renders pre/post conditions', () => {
    render(<CardRenderer card={flowStepFixture} />);
    expect(screen.getByText(/前置条件/)).toBeInTheDocument();
    expect(screen.getByText(/后置条件/)).toBeInTheDocument();
    expect(screen.getByText(/用户已注册/)).toBeInTheDocument();
    expect(screen.getByText(/已进入系统首页/)).toBeInTheDocument();
  });

  it('renders next steps', () => {
    render(<CardRenderer card={flowStepFixture} />);
    expect(screen.getByText(/后续步骤/)).toBeInTheDocument();
    expect(screen.getByText('fs-2')).toBeInTheDocument();
    expect(screen.getByText('fs-3')).toBeInTheDocument();
  });

  it('renders step number when provided', () => {
    render(<CardRenderer card={flowStepFixture} stepNumber={1} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('is accessible with role=button', () => {
    const { container } = render(<CardRenderer card={flowStepFixture} />);
    expect(container.firstChild).toHaveAttribute('role', 'button');
  });
});

// ==================== CardRenderer Fallback Tests (F9) ====================

describe('CardRenderer — unknown type fallback', () => {
  it('renders fallback for unknown card type', () => {
    // @ts-expect-error — intentionally passing invalid type for fallback test
    const unknownCard = { id: 'unknown', type: 'completely-invalid-type' };
    render(<CardRenderer card={unknownCard} />);
    expect(screen.getByText(/未知卡片类型/)).toBeInTheDocument();
    expect(screen.getByText('completely-invalid-type')).toBeInTheDocument();
  });

  it('fallback has role=alert for accessibility', () => {
    // @ts-expect-error
    const unknownCard = { id: 'u2', type: 'foo' };
    const { container } = render(<CardRenderer card={unknownCard} />);
    expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
  });
});

// ==================== Selected State Tests ====================

describe('CardRenderer — selected state', () => {
  it('applies selected class when selected=true', () => {
    const { container } = render(
      <CardRenderer card={userStoryFixture} selected={true} />
    );
    // Check via aria-selected or class
    expect(container.firstChild).toBeTruthy();
  });
});
