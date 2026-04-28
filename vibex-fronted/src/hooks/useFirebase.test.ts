import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock BEFORE importing the hook
vi.mock('@/lib/firebase/firebaseMock', () => ({
  getFirebaseMock: vi.fn(() => ({
    getState: () => 'CONNECTED',
    subscribe: vi.fn(),
    measureColdStart: () => 10,
    setState: vi.fn(),
    forceReconnect: vi.fn(),
  })),
}));

// Import hook after mock
import { useFirebase } from './useFirebase';
import { getFirebaseMock } from '@/lib/firebase/firebaseMock';

describe('useFirebase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initial state is DISCONNECTED', () => {
    const { result } = renderHook(() => useFirebase({ autoConnect: false }));
    expect(result.current.state).toBe('DISCONNECTED');
    expect(result.current.isLocalFallback).toBe(true);
  });

  it('connects and sets state to CONNECTED', async () => {
    const mockInstance = {
      getState: () => 'CONNECTED',
      subscribe: vi.fn(),
      measureColdStart: () => 10,
      setState: vi.fn(),
      forceReconnect: vi.fn(),
    };
    (getFirebaseMock as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

    const { result } = renderHook(() =>
      useFirebase({ autoConnect: true, mock: true })
    );

    // Wait for the subscriber to be called with CONNECTED
    await waitFor(() => {
      expect(mockInstance.subscribe).toHaveBeenCalled();
    });

    // Simulate the subscriber firing with CONNECTED
    const subscriberCallback = mockInstance.subscribe.mock.calls[0][0];
    act(() => {
      subscriberCallback('CONNECTED');
    });

    await waitFor(() => {
      expect(result.current.state).toBe('CONNECTED');
      expect(result.current.isLocalFallback).toBe(false);
    });
  });

  it('disconnect sets local fallback', async () => {
    const mockInstance = {
      getState: () => 'CONNECTED',
      subscribe: vi.fn(),
      measureColdStart: () => 10,
      setState: vi.fn(),
      forceReconnect: vi.fn(),
    };
    (getFirebaseMock as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

    const { result } = renderHook(() =>
      useFirebase({ autoConnect: true, mock: true })
    );

    await waitFor(() => {
      expect(mockInstance.subscribe).toHaveBeenCalled();
    });

    const subscriberCallback = mockInstance.subscribe.mock.calls[0][0];
    act(() => {
      subscriberCallback('CONNECTED');
    });

    await waitFor(() => {
      expect(result.current.isLocalFallback).toBe(false);
    });

    act(() => {
      result.current.disconnect();
    });
    expect(result.current.isLocalFallback).toBe(true);
  });

  it('cold start > 500ms triggers local fallback', async () => {
    const mockInstance = {
      getState: () => 'CONNECTED',
      subscribe: vi.fn(),
      measureColdStart: () => 600,
      setState: vi.fn(),
      forceReconnect: vi.fn(),
    };
    (getFirebaseMock as ReturnType<typeof vi.fn>).mockReturnValue(mockInstance);

    const { result } = renderHook(() =>
      useFirebase({ autoConnect: true, mock: true })
    );

    await waitFor(() => {
      expect(mockInstance.subscribe).toHaveBeenCalled();
    });

    const subscriberCallback = mockInstance.subscribe.mock.calls[0][0];
    act(() => {
      subscriberCallback('CONNECTED');
    });

    await waitFor(() => {
      expect(result.current.isLocalFallback).toBe(true);
    });
  });
});
