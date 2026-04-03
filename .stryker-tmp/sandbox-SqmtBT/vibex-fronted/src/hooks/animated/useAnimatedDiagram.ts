/**
 * useAnimatedDiagram Hook
 * 
 * 提供图表入场动画和更新动画功能
 * 支持交错动画、脉冲动画、连线动画等效果
 */
// @ts-nocheck


'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface AnimationConfig {
  enterDuration: number;   // 入场动画时长 (ms)
  updateDuration: number;  // 更新动画时长 (ms)
  staggerDelay: number;    // 交错延迟 (ms)
}

const DEFAULT_CONFIG: AnimationConfig = {
  enterDuration: 300,
  updateDuration: 200,
  staggerDelay: 50,
};

export interface AnimatedItem<T> {
  item: T;
  isEntering: boolean;
  isUpdating: boolean;
  animationKey: number;
}

export function useAnimatedDiagram<T extends { id: string }>(
  items: T[],
  config: AnimationConfig = DEFAULT_CONFIG
) {
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [prevItems, setPrevItems] = useState<T[]>([]);
  const [animationKeys, setAnimationKeys] = useState<Record<string, number>>({});

  // 检测新增项 - 入场动画
  useEffect(() => {
    const prevIds = new Set(prevItems.map((i) => i.id));
    const currentIds = new Set(items.map((i) => i.id));

    // 找出新增项
    const newIds = [...currentIds].filter((id) => !prevIds.has(id));

    if (newIds.length > 0) {
      // 添加入场动画（交错效果）
      newIds.forEach((id, index) => {
        setTimeout(() => {
          setAnimatingIds((prev) => new Set([...prev, id]));

          // 动画结束后清除
          setTimeout(() => {
            setAnimatingIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }, config.enterDuration);
        }, index * config.staggerDelay);
      });
    }

    setPrevItems(items);
  }, [items, config.enterDuration, config.staggerDelay]);

  // 检测更新项 - 更新动画
  useEffect(() => {
    const prevIds = new Set(prevItems.map((i) => i.id));
    const currentIds = new Set(items.map((i) => i.id));

    // 找出更新的项（存在于两边但内容不同）
    const updatedIds = items
      .filter((item) => {
        const prevItem = prevItems.find((p) => p.id === item.id);
        if (!prevItem) return false;
        return JSON.stringify(prevItem) !== JSON.stringify(item);
      })
      .map((i) => i.id);

    if (updatedIds.length > 0) {
      updatedIds.forEach((id) => {
        setUpdatingIds((prev) => new Set([...prev, id]));
        
        // 更新动画 key 触发重新渲染
        setAnimationKeys((prev) => ({
          ...prev,
          [id]: (prev[id] || 0) + 1,
        }));

        // 动画结束后清除
        setTimeout(() => {
          setUpdatingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, config.updateDuration);
      });
    }
  }, [items, prevItems, config.updateDuration]);

  // 检查特定项是否正在动画
  const isAnimating = useCallback(
    (id: string) => {
      return animatingIds.has(id) || updatingIds.has(id);
    },
    [animatingIds, updatingIds]
  );

  // 获取入场动画状态
  const isEntering = useCallback(
    (id: string) => {
      return animatingIds.has(id);
    },
    [animatingIds]
  );

  // 获取更新动画状态
  const isUpdating = useCallback(
    (id: string) => {
      return updatingIds.has(id);
    },
    [updatingIds]
  );

  // 获取动画 key（用于触发动画重新渲染）
  const getAnimationKey = useCallback(
    (id: string) => {
      return animationKeys[id] || 0;
    },
    [animationKeys]
  );

  // 获取带有动画状态的 items
  const animatedItems = useMemo((): AnimatedItem<T>[] => {
    return items.map((item) => ({
      item,
      isEntering: isEntering(item.id),
      isUpdating: isUpdating(item.id),
      animationKey: getAnimationKey(item.id),
    }));
  }, [items, isEntering, isUpdating, getAnimationKey]);

  // 清除所有动画状态
  const clearAnimations = useCallback(() => {
    setAnimatingIds(new Set());
    setUpdatingIds(new Set());
  }, []);

  return {
    animatedItems,
    isAnimating,
    isEntering,
    isUpdating,
    getAnimationKey,
    clearAnimations,
    config,
  };
}

export default useAnimatedDiagram;
