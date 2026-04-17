/**
 * APIEndpointCard Unit Tests
 * E1-U2
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { APIEndpointCard } from '../APIEndpointCard';
import type { APIEndpointCard as APIEndpointCardType } from '@/types/dds';

// Fixtures
const baseCard: APIEndpointCardType = {
  id: 'api-1',
  type: 'api-endpoint',
  title: 'Get User',
  method: 'GET',
  path: '/api/users/{id}',
  position: { x: 0, y: 0 },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('APIEndpointCard', () => {
  it('renders GET method badge', () => {
    render(<APIEndpointCard card={baseCard} />);
    expect(screen.getByText('GET')).toBeInTheDocument();
  });

  it('renders API path', () => {
    render(<APIEndpointCard card={baseCard} />);
    expect(screen.getByText('/api/users/{id}')).toBeInTheDocument();
  });

  it('renders POST method badge', () => {
    const postCard = { ...baseCard, method: 'POST' as const };
    render(<APIEndpointCard card={postCard} />);
    expect(screen.getByText('POST')).toBeInTheDocument();
  });

  it('renders DELETE method badge', () => {
    const delCard = { ...baseCard, method: 'DELETE' as const };
    render(<APIEndpointCard card={delCard} />);
    expect(screen.getByText('DELETE')).toBeInTheDocument();
  });

  it('renders summary when present', () => {
    const cardWithSummary = { ...baseCard, summary: 'Get user by ID' };
    render(<APIEndpointCard card={cardWithSummary} />);
    expect(screen.getByText('Get user by ID')).toBeInTheDocument();
  });

  it('renders tags when present', () => {
    const cardWithTags = { ...baseCard, tags: ['user', 'auth'] };
    render(<APIEndpointCard card={cardWithTags} />);
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('auth')).toBeInTheDocument();
  });

  it('renders parameter count badge', () => {
    const cardWithParams = {
      ...baseCard,
      parameters: [
        { name: 'id', in: 'path' as const, required: true, type: 'string' },
        { name: 'include', in: 'query' as const, required: false, type: 'string' },
      ],
    };
    render(<APIEndpointCard card={cardWithParams} />);
    expect(screen.getByText('参数 2')).toBeInTheDocument();
  });

  it('renders response status codes', () => {
    const cardWithResponses = {
      ...baseCard,
      responses: [
        { status: 200, description: 'OK' },
        { status: 404, description: 'Not Found' },
        { status: 500, description: 'Server Error' },
      ],
    };
    render(<APIEndpointCard card={cardWithResponses} />);
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('applies selected class when selected=true', () => {
    const { container } = render(<APIEndpointCard card={baseCard} selected={true} />);
    expect(container.querySelector('[class*="selected"]')).toBeInTheDocument();
  });

  it('renders without summary gracefully', () => {
    const noSummaryCard = { ...baseCard, summary: undefined };
    const { container } = render(<APIEndpointCard card={noSummaryCard} />);
    expect(container.querySelector('[class*="summary"]')).not.toBeInTheDocument();
  });

  it('renders all HTTP methods', () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'] as const;
    methods.forEach((method) => {
      const card = { ...baseCard, method };
      const { getByText } = render(<APIEndpointCard card={card} />);
      expect(getByText(method)).toBeInTheDocument();
    });
  });
});
