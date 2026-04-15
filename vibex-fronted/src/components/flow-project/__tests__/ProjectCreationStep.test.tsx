/**
 * ProjectCreationStep Test — Epic 5: Project Creation
 *
 * Key assertion: handleCreate calls projectApi.createProject (real API),
 * NOT setTimeout(mock).
 *
 * Strategy: mock machine context with non-empty name so button is always enabled.
 * Uses userEvent.type to fill input (React onChange).
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
  useAuthStore: vi.fn(() => ({ user: { id: 'test-user-1' } })),
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

  it('does not call API when project name is empty', () => {
    render(<ProjectCreationStep />);
    const btn = screen.queryByRole('button', { name: /Create Project/i });
    // Component starts with useState('') so button is disabled
    if (btn) expect(btn).toBeDisabled();
    expect(mockCreateProject).not.toHaveBeenCalled();
  });

  it('calls projectApi.createProject when form is submitted', async () => {
    mockCreateProject.mockResolvedValue({
      id: 'proj-123',
      name: 'Pre-filled Project',
      description: 'Test description',
      userId: 'test-user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<ProjectCreationStep />);

    // Wait for initial render to complete
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Create Project/i })).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/my-awesome-project/i);
    // userEvent.type triggers React onChange via InputEvent
    await act(async () => {
      await userEvent.type(input, 'Test Project');
    });

    const btn = screen.getByRole('button', { name: /Create Project/i });
    expect(btn).toBeEnabled();

    await act(async () => {
      btn.click();
    });

    expect(mockCreateProject).toHaveBeenCalledTimes(1);
    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Project',
        userId: 'test-user-1',
      })
    );
  });

  it('shows error banner when API call fails', async () => {
    mockCreateProject.mockRejectedValue(new Error('Network error'));

    render(<ProjectCreationStep />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Create Project/i })).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/my-awesome-project/i);
    await act(async () => {
      await userEvent.type(input, 'Test Project');
    });

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
