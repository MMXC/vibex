/**
 * API Response Unwrappers
 * 
 * 统一处理 API 响应解包，消除重复的 `as any` 类型断言
 */

/**
 * 解包可能包装在 { data: T } 中的响应
 */
export function unwrapData<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

/**
 * 解包可能包装在 { agents: T[] } 或 { data: { agents: T[] } } 中的响应
 */
export function unwrapField<T>(
  response: unknown,
  field: keyof Record<string, unknown>
): T {
  if (response && typeof response === 'object') {
    if (field in response) {
      return (response as Record<string, T>)[field as string] ?? null;
    }
    if ('data' in response) {
      const data = (response as { data: unknown }).data;
      if (data && typeof data === 'object' && field in data) {
        return (data as Record<string, T>)[field as string] ?? null;
      }
    }
  }
  return (response as T) ?? null;
}

/**
 * 解包可能包装在 { [field]: T } 中的响应，field 不存在时返回原响应
 */
export function unwrapFieldOrSelf<T>(
  response: unknown,
  field: string
): T {
  const unwrapped = unwrapField<T>(response, field as keyof Record<string, unknown>);
  if (unwrapped !== response) {
    return unwrapped;
  }
  return response as T;
}
