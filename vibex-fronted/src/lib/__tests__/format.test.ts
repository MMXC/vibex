/**
 * format.test.ts — E2-T1: 时区安全的日期格式化工具
 */
import { formatDate, formatDateTime } from '../format';

describe('formatDate — E2-T1: 时区一致性', () => {
  it('UTC 和 CST 返回相同结果', () => {
    // UTC 12:00 = CST 20:00，但 split('T')[0] 始终返回 UTC 日期
    expect(formatDate('2026-04-04T12:00:00Z')).toBe(formatDate('2026-04-04T20:00:00+08:00'));
  });

  it('返回 YYYY-MM-DD 格式', () => {
    expect(formatDate('2026-04-04T12:00:00Z')).toBe('2026-04-04');
    expect(formatDate('2026-01-01T00:00:00Z')).toBe('2026-01-01');
    expect(formatDate('2026-12-31T23:59:59Z')).toBe('2026-12-31');
  });

  it('处理无时间部分的日期字符串', () => {
    expect(formatDate('2026-04-04')).toBe('2026-04-04');
  });
});

describe('formatDateTime — E2-T1: 日期时间格式化', () => {
  it('返回 YYYY-MM-DD HH:mm:ss 格式', () => {
    expect(formatDateTime('2026-04-04T12:30:45.123Z')).toBe('2026-04-04 12:30:45');
    expect(formatDateTime('2026-01-01T00:00:00.000Z')).toBe('2026-01-01 00:00:00');
  });
});
