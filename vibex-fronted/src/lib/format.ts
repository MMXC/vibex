/**
 * format.ts — 时区安全的日期格式化工具
 *
 * 问题: toLocaleDateString('zh-CN') 在服务端和客户端时区不同时会产生 hydration mismatch
 * 解决: 使用 toISOString() 作为基准（始终是 UTC），无论服务端/客户端在哪个时区结果一致
 */

/**
 * 格式化日期为 YYYY-MM-DD
 * @param isoString ISO 8601 格式的日期字符串
 */
export function formatDate(isoString: string): string {
  return isoString.split('T')[0]!;
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm:ss
 * @param isoString ISO 8601 格式的日期字符串
 */
export function formatDateTime(isoString: string): string {
  const [date, time] = isoString.split('T') as [string, string];
  return `${date} ${time.split('.')[0]}`;
}
