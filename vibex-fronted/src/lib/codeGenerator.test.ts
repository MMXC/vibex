import { describe, it, expect } from 'vitest';
import type { FlowStepProps, APIEndpointProps, StateMachineProps } from '@/types/codegen';

describe('S16-P1-2: Code Generator Real Components', () => {
  describe('FlowStepProps', () => {
    it('has all required fields', () => {
      const props: FlowStepProps = {
        stepName: 'SubmitOrder',
        actor: 'User',
        pre: 'user.isAuthenticated',
        post: 'order.isPlaced',
      };
      expect(props.stepName).toBe('SubmitOrder');
      expect(props.actor).toBe('User');
    });

    it('accepts optional stepId', () => {
      const props: FlowStepProps = {
        stepName: 'SubmitOrder',
        actor: 'User',
        pre: 'user.isAuthenticated',
        post: 'order.isPlaced',
        stepId: 'step-1',
      };
      expect(props.stepId).toBe('step-1');
    });
  });

  describe('APIEndpointProps', () => {
    it('validates all HTTP methods', () => {
      const methods: APIEndpointProps['method'][] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      for (const method of methods) {
        const props: APIEndpointProps = {
          method,
          path: '/api/test',
          summary: 'Test endpoint',
        };
        expect(props.method).toBe(method);
      }
    });

    it('accepts optional description and operationId', () => {
      const props: APIEndpointProps = {
        method: 'POST',
        path: '/api/users',
        summary: 'Create user',
        description: 'Creates a new user in the system',
        operationId: 'createUser',
      };
      expect(props.description).toBe('Creates a new user in the system');
      expect(props.operationId).toBe('createUser');
    });
  });

  describe('StateMachineProps', () => {
    it('has states and transitions', () => {
      const props: StateMachineProps = {
        states: ['idle', 'loading', 'success', 'error'],
        transitions: [
          { from: 'idle', to: 'loading', event: 'FETCH' },
          { from: 'loading', to: 'success', event: 'SUCCESS' },
          { from: 'loading', to: 'error', event: 'ERROR' },
        ],
        initialState: 'idle',
      };
      expect(props.states).toHaveLength(4);
      expect(props.transitions).toHaveLength(3);
      expect(props.initialState).toBe('idle');
    });

    it('accepts optional stateMachineId', () => {
      const props: StateMachineProps = {
        states: ['idle'],
        transitions: [],
        stateMachineId: 'order-state',
      };
      expect(props.stateMachineId).toBe('order-state');
    });

    it('accepts optional condition on transitions', () => {
      const props: StateMachineProps = {
        states: ['idle', 'pending'],
        transitions: [
          { from: 'idle', to: 'pending', event: 'SUBMIT', condition: 'hasData' },
        ],
      };
      expect(props.transitions[0].condition).toBe('hasData');
    });
  });
});
