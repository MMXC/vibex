# Spec: E2 - 下个 Sprint 规划

## 概述
产出 `docs/sprint-20260402/prd.md`，规划下个 Sprint 的目标和工作范围。

## 内容结构

```markdown
# Sprint 2 PRD (2026-04-02)

## 目标
...

## Epic 清单
| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
```

## 规划内容（P0-P1 优先）

| 优先级 | Epic | 工时 |
|--------|------|------|
| P0 | v0 竞品深度对标 | 8h |
| P0 | PRD 智能解析 | 12h |
| P1 | 模板市场 | 6h |
| P1 | 分享链接 | 4h |

## 验收
```typescript
test('Sprint PRD 存在且 ≥ 3 Epic', () => {
  expect(existsSync('docs/sprint-20260402/prd.md')).toBe(true);
  const content = readFileSync('docs/sprint-20260402/prd.md', 'utf-8');
  expect(content.length).toBeGreaterThan(1000);
  const epicLines = content.match(/^\| E\d+ \|/gm) || [];
  expect(epicLines.length).toBeGreaterThanOrEqual(3);
});
```
