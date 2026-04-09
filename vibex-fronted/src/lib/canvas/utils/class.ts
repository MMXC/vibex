/**
 * cx — 合并 class 字符串的工具函数
 * 过滤 falsy 值，只保留有效 class 名
 */
export function cx(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
