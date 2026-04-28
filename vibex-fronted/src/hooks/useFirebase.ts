'use client';

/**
 * useFirebase — S16-P1-1 Firebase Mock + Config
 *
 * Hook for Firebase connection with mock fallback:
 * - Tracks connection state (CONNECTED/DEGRADED/DISCONNECTED/RECONNECTING)
 * - Cold start measurement: > 500ms → fallback to local-only
 * - Exposes connection state, latency, and mock control
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FirebaseMockState } from '@/lib/firebase/firebaseMock';

export interface UseFirebaseOptions {
  /** Enable mock mode */
  mock?: boolean;
  /** Auto-connect on mount */
  autoConnect?: boolean;
  /** Cold start threshold in ms */
  coldStartThresholdMs?: number;
}

export interface UseFirebaseReturn {
  /** Current connection state */
  state: FirebaseMockState;
  /** Connection latency in ms */
  latencyMs: number;
  /** Whether using local-only fallback */
  isLocalFallback: boolean;
  /** Whether currently connecting */
  isConnecting: boolean;
  /** Error message if any */
  error: string | null;
  /** Connect to Firebase */
  connect: () => Promise<void>;
  /** Disconnect from Firebase */
  disconnect: () => void;
  /** Force reconnect */
  reconnect: () => void;
  /** Set mock state (for testing) */
  setMockState: (state: FirebaseMockState) => void;
}

const COLD_START_THRESHOLD_MS = 500;

export function useFirebase(
  options: UseFirebaseOptions = {}
): UseFirebaseReturn {
  const {
    mock = true,
    autoConnect = true,
    coldStartThresholdMs = options.coldStartThresholdMs ?? COLD_START_THRESHOLD_MS,
  } = options;

  const [state, setState] = useState<FirebaseMockState>('DISCONNECTED');
  const [latencyMs, setLatencyMs] = useState(0);
  const [isLocalFallback, setIsLocalFallback] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mockRef = useRef<unknown>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const coldStartExceededRef = useRef(false);

  const connect = useCallback(async () => {
    if (!mock) return;
    setIsConnecting(true);
    setError(null);
    try {
      const { getFirebaseMock } = await import('@/lib/firebase/firebaseMock');
      const firebaseMock = getFirebaseMock({ initialState: 'CONNECTED' });
      mockRef.current = firebaseMock;
      const coldStart = firebaseMock.measureColdStart();
      setLatencyMs(coldStart);
      coldStartExceededRef.current = coldStart > coldStartThresholdMs;
      if (coldStartExceededRef.current) {
        setIsLocalFallback(true);
      }
      unsubscribeRef.current = firebaseMock.subscribe((newState) => {
        setState(newState);
        // Only clear fallback if cold start was OK and we got CONNECTED
        if (!coldStartExceededRef.current && newState === 'CONNECTED') {
          setIsLocalFallback(false);
        }
        if (newState === 'DISCONNECTED') {
          setIsLocalFallback(true);
        }
      });
      setState(firebaseMock.getState());
      // If cold start OK, clear fallback on initial connect
      if (!coldStartExceededRef.current) {
        setIsLocalFallback(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsLocalFallback(true);
    } finally {
      setIsConnecting(false);
    }
  }, [mock, coldStartThresholdMs]);

  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    coldStartExceededRef.current = false;
    setState('DISCONNECTED');
    setIsLocalFallback(true);
    mockRef.current = null;
  }, []);

  const reconnect = useCallback(() => {
    if (mockRef.current) {
      const fm = mockRef.current as { forceReconnect: () => void };
      fm.forceReconnect();
    }
  }, []);

  const setMockState = useCallback((newState: FirebaseMockState) => {
    if (mockRef.current) {
      const fm = mockRef.current as { setState: (s: FirebaseMockState) => void };
      fm.setState(newState);
    }
  }, []);

  useEffect(() => {
    if (autoConnect && mock) {
      void connect();
    }
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      coldStartExceededRef.current = false;
    };
  }, [autoConnect, mock, connect]);

  return {
    state,
    latencyMs,
    isLocalFallback,
    isConnecting,
    error,
    connect,
    disconnect,
    reconnect,
    setMockState,
  };
}
