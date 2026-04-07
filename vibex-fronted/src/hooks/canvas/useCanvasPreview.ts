/**
 * useCanvasPreview — Canvas component preview hook
 *
 * Reads componentNodes from componentStore and returns them
 * for JsonRenderPreview rendering.
 */
import { useComponentStore } from '@/lib/canvas/stores/componentStore';

export function useCanvasPreview() {
  const componentNodes = useComponentStore((s) => s.componentNodes);

  // Preview is available when component nodes exist
  const canPreview = componentNodes.length > 0;

  return {
    nodes: componentNodes,
    canPreview,
    isVisible: false, // controlled by UI, not here
  };
}
