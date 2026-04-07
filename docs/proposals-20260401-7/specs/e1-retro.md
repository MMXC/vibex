# Spec: E1 - Sprint 复盘会议

## 概述
完成 Sprint 1 复盘会议，产出 `docs/retrospectives/2026-04-01.md`。

## 议程（2h）

| 时间 | 议程 | 产出 |
|------|------|------|
| 0-30min | 完成情况回顾 | 26 Epic 清单 |
| 30-60min | 做得好的实践 | ≥ 5 条 |
| 60-90min | 需改进问题 | ≥ 3 条 |
| 90-120min | 下个 Sprint 目标 | 初步方向 |

## 文档结构

```markdown
# Sprint 1 复盘 (2026-04-01)

## 完成情况
| Epic | 批次 | 工时 |
|------|------|------|

## 做得好的实践
1. ...
2. ...
3. ...
4. ...
5. ...

## 需改进的问题
1. ...
2. ...
3. ...

## 下个 Sprint 目标
- ...
```

## 验收
```typescript
test('复盘文档存在', () => {
  expect(existsSync('docs/retrospectives/2026-04-01.md')).toBe(true);
  const content = readFileSync('docs/retrospectives/2026-04-01.md', 'utf-8');
  expect(content.length).toBeGreaterThan(500);
  const goodPractices = content.match(/^\d+\. .+/gm) || [];
  expect(goodPractices.length).toBeGreaterThanOrEqual(5);
});
```
