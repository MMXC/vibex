/**
 * usePageTreeData - 数据转换 Hook
 * 将页面数据转换为树形结构
 */

import { useMemo } from 'react';

export interface PageData {
  id: string;
  name: string;
  type: 'page' | 'component' | 'section';
  children?: PageData[];
  parentId?: string;
}

export interface PageTreeNode {
  id: string;
  type: 'page' | 'component' | 'section';
  name: string;
  children?: PageTreeNode[];
}

interface UsePageTreeDataOptions {
  direction?: 'TB' | 'LR';
}

export function usePageTreeData(
  pages: PageData[],
  options: UsePageTreeDataOptions = {}
): PageTreeNode[] {
  return useMemo(() => {
    if (!pages || pages.length === 0) {
      return [];
    }

    // 构建树形结构
    const buildTree = (items: PageData[], parentId?: string): PageTreeNode[] => {
      return items
        .filter(item => item.parentId === parentId)
        .map(item => ({
          id: item.id,
          type: item.type,
          name: item.name,
          children: buildTree(items, item.id),
        }));
    };

    // 找到根节点（没有 parentId 的）
    const rootItems = pages.filter(p => !p.parentId);
    
    if (rootItems.length === 0) {
      // 如果没有明确的根节点，将第一个作为根
      return pages.slice(0, 1).map(item => ({
        id: item.id,
        type: item.type,
        name: item.name,
        children: buildTree(pages, item.id).filter(c => c.id !== item.id),
      }));
    }

    return buildTree(pages);
  }, [pages]);
}

export default usePageTreeData;
