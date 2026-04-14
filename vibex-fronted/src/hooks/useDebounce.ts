import { useState, useEffect } from 'react';

/**
 * useDebounce — 延迟更新值，避免频繁触发副作用（如搜索请求）。
 *
 * @param value 原始值
 * @param delay 延迟毫秒数（默认 300ms）
 * @returns 延迟后的值
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
