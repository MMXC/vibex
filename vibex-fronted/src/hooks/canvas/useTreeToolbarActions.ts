/**
 * useTreeToolbarActions — 获取指定类型树的 store
 *
 * E1-T2: TreeToolbar 从 body 迁移到 header
 * 提供统一的 store 访问接口，供 CanvasPage 迁移按钮时使用
 */
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import type { TreeType } from '@/lib/canvas/types';

/**
 * 根据 treeType 返回对应的 store
 * - context → contextStore
 * - flow    → flowStore
 * - component → componentStore
 */
export function useTreeToolbarActions(treeType: TreeType) {
  const contextStore = useContextStore();
  const flowStore = useFlowStore();
  const componentStore = useComponentStore();

  const store =
    treeType === 'context'
      ? contextStore
      : treeType === 'flow'
        ? flowStore
        : componentStore;

  return { store };
}
