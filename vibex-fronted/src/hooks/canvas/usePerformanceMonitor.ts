/**
 * usePerformanceMonitor — Canvas performance metrics hook
 * S81-E3: 画布性能监控面板
 *
 * Provides:
 * - getFPS(): current frame rate via requestAnimationFrame loop
 * - getNodeCount(): number of ReactFlow nodes
 * - getEdgeCount(): number of ReactFlow edges
 * - isMonitoring: whether monitoring is active
 * - start(): start the FPS loop
 * - stop(): stop the FPS loop
 */
import { useCallback, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';

export interface PerformanceMetrics {
  fps: number;
  nodeCount: number;
  edgeCount: number;
}

const FPS_SAMPLE_INTERVAL = 500; // ms between FPS samples

export function usePerformanceMonitor() {
  // Capture initial counts immediately — ensures metrics display without waiting for tick
  const { getNodes, getEdges } = useReactFlow();

  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => ({
    fps: 0,
    nodeCount: getNodes().length,
    edgeCount: getEdges().length,
  }));

  const rafIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastSampleTimeRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);

  const tick = useCallback((timestamp: number) => {
    if (!isRunningRef.current) return;

    frameCountRef.current += 1;
    const elapsed = timestamp - lastSampleTimeRef.current;

    if (elapsed >= FPS_SAMPLE_INTERVAL) {
      const fps = Math.round((frameCountRef.current * 1000) / elapsed);
      const nodeCount = getNodes().length;
      const edgeCount = getEdges().length;

      setMetrics({ fps, nodeCount, edgeCount });

      frameCountRef.current = 0;
      lastSampleTimeRef.current = timestamp;
    }

    rafIdRef.current = requestAnimationFrame(tick);
  }, [getNodes, getEdges]);

  const start = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    lastSampleTimeRef.current = performance.now();
    lastTimestampRef.current = performance.now();
    frameCountRef.current = 0;
    rafIdRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const getFPS = useCallback(() => metrics.fps, [metrics.fps]);
  const getNodeCount = useCallback(() => metrics.nodeCount, [metrics.nodeCount]);
  const getEdgeCount = useCallback(() => metrics.edgeCount, [metrics.edgeCount]);

  return {
    metrics,
    getFPS,
    getNodeCount,
    getEdgeCount,
    start,
    stop,
  };
}
