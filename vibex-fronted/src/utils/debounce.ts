/**
 * debounce — 防抖工具函数
 * E01: ProtoPreview 实时联动
 */

type AnyFunction = (...args: never[]) => void;

/**
 * Creates a debounced version of the provided function.
 * The debounced function delays invoking `fn` until `wait` ms
 * after the last call.
 */
export function debounce<A extends unknown[], R>(
  fn: (...args: A) => R,
  wait: number
): (...args: A) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: A) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, wait);
  };
}
