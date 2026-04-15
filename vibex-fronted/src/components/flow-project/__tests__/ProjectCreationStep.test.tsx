/**
 * ProjectCreationStep Test — Epic 5: Project Creation
 *
 * Key assertion: handleCreate calls projectApi.createProject (real API),
 * NOT setTimeout(mock).
 *
 * Uses userEvent.type to fill input (React onChange).
 * Note: userEvent.type appends to existing value — mock machine starts with
 * non-empty name so button is always enabled. Test validates the API call.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCreationStep } from '../ProjectCreationStep';
import { projectApi } from '@/services/api/modules/project';

const mockCreateProject = vi.fn();
const mockSend = vi.fn();

vi.mock('@/services/api/modules/project', () => ({
  projectApi: { createProject: (...args: unknown[]) => mockCreateProject(...args) },
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(
    vi.fn(() => ({ user: { id: 'test-user-1' } })),
    { getState: vi.fn(() => ({ user: { id: 'test-user-1' } })) }
  ),
}));

vi.mock('@/components/flow-project/flow-container/flowMachine', () => ({
  flowMachine: { id: 'flow', initial: 'idle', states: {} },
  FlowEvent: {},
}));

vi.mock('@xstate/react', () => ({
  useMachine: () => [
    {
      value: 'collecting',
      context: {
        projectMeta: {
          name: 'Pre-filled Project',
          description: 'Test description',
          techStack: ['React'],
        },
        boundedContexts: [],
        businessFlow: [],
        selectedComponents: [],
        projectId: null,
      },
      matches: (key: string) => {
        if (key === 'creating' || key === 'done') return false;
        return true;
      },
      send: mockSend,
    },
    vi.fn(),
  ],
}));

describe('ProjectCreationStep', () => {
  beforeEach(() => { vi.clearAllMocks(); mockCreateProject.mockReset(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('does not call API on initial render', () => {
    render(<ProjectCreationStep />);
    expect(mockCreateProject).not.toHaveBeenCalled();
  });

  it('calls projectApi.createProject when button is clicked', async () => {
    mockCreateProject.mockResolvedValue({
      id: 'proj-123',
      name: 'Pre-filled Project',
      description: 'Test description',
      userId: 'test-user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<ProjectCreationStep />);

    const btn = screen.getByRole('button', { name: /Create Project/i });
    await act(async () => {
      btn.click();
    });

    // CRITICAL: verify projectApi.createProject was called (not setTimeout mock)
    expect(mockCreateProject).toHaveBeenCalledTimes(1);
    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'test-user-1',
      })
    );
  });

  it('shows error banner when API call fails', async () => {
    mockCreateProject.mockRejectedValue(new Error('Network error'));

    render(<ProjectCreationStep />);

    const btn = screen.getByRole('button', { name: /Create Project/i });
    await act(async () => {
      btn.click();
    });

    expect(mockCreateProject).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeVisible();
    });
    expect(screen.getByText(/Network error/i)).toBeVisible();
  });
});
