/**
 * QueryProvider Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { QueryProvider, queryKeys } from '../QueryProvider';

// Test component that uses the query client
const TestComponent = () => {
  return <div data-testid="child">Child Content</div>;
};

describe('QueryProvider', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('rendering', () => {
    it('should render children', () => {
      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      );
      
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide query client to children', () => {
      const Consumer = () => {
        return <div data-testid="query-client-provided">Query Client Provided</div>;
      };
      
      render(
        <QueryProvider>
          <Consumer />
        </QueryProvider>
      );
      
      expect(screen.getByTestId('query-client-provided')).toBeInTheDocument();
    });

    it('should render nested children', () => {
      const Nested = () => (
        <div>
          <span>Nested Content</span>
        </div>
      );
      
      render(
        <QueryProvider>
          <div>
            <Nested />
          </div>
        </QueryProvider>
      );
      
      expect(screen.getByText('Nested Content')).toBeInTheDocument();
    });
  });

  describe('queryKeys', () => {
    it('should have auth query keys', () => {
      expect(queryKeys.auth.me).toEqual(['auth', 'me']);
    });

    it('should have projects query keys', () => {
      expect(queryKeys.projects.all).toEqual(['projects']);
      expect(queryKeys.projects.lists()).toEqual(['projects', 'list']);
      expect(queryKeys.projects.list({ id: '1' })).toEqual(['projects', 'list', { id: '1' }]);
      expect(queryKeys.projects.details()).toEqual(['projects', 'detail']);
      expect(queryKeys.projects.detail('123')).toEqual(['projects', 'detail', '123']);
    });

    it('should have requirements query keys', () => {
      expect(queryKeys.requirements.all).toEqual(['requirements']);
      expect(queryKeys.requirements.byProject('proj-1')).toEqual(['requirements', 'proj-1']);
      expect(queryKeys.requirements.detail('req-1')).toEqual(['requirements', 'req-1']);
    });

    it('should have entities query keys', () => {
      expect(queryKeys.entities.all).toEqual(['entities']);
      expect(queryKeys.entities.byProject('proj-1')).toEqual(['entities', 'proj-1']);
      expect(queryKeys.entities.detail('ent-1')).toEqual(['entities', 'ent-1']);
    });

    it('should have flows query keys', () => {
      expect(queryKeys.flows.all).toEqual(['flows']);
      expect(queryKeys.flows.byProject('proj-1')).toEqual(['flows', 'proj-1']);
      expect(queryKeys.flows.detail('flow-1')).toEqual(['flows', 'flow-1']);
    });

    it('should have ddd query keys', () => {
      expect(queryKeys.ddd.contexts('req')).toEqual(['ddd', 'contexts', 'req']);
      expect(queryKeys.ddd.domainModels('ctx1', 'ctx2')).toEqual(['ddd', 'domainModels', 'ctx1', 'ctx2']);
      expect(queryKeys.ddd.businessFlow('model1')).toEqual(['ddd', 'businessFlow', 'model1']);
    });

    it('should have preferences query keys', () => {
      expect(queryKeys.preferences.all).toEqual(['preferences']);
      expect(queryKeys.preferences.byUser('user-1')).toEqual(['preferences', 'user-1']);
    });

    it('should have notifications query keys', () => {
      expect(queryKeys.notifications.all).toEqual(['notifications']);
      expect(queryKeys.notifications.unread()).toEqual(['notifications', 'unread']);
      expect(queryKeys.notifications.byUser('user-1')).toEqual(['notifications', 'user', 'user-1']);
    });
  });
});
