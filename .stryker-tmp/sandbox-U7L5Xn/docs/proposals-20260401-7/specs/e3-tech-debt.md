# Spec: E3 - 技术债清理计划

## 概述
产出 `docs/tech-debt/cleanup-plan.md`，明确技术债清理时间和责任人。

## 技术债清单

| 债务 | 预计工时 | 优先级 | 负责人 |
|------|---------|--------|--------|
| MSW 契约测试（HTTP 级别） | 4h | P1 | dev |
| canvasApi 错误处理（throw vs fallback） | 2h | P1 | dev |
| Playwright browser 环境稳定 | 1h | P2 | tester |

## 文档结构

```markdown
# 技术债清理计划

## P1 - 高优先级

### MSW 契约测试
- 问题：当前为函数级测试，非 HTTP 级别
- 工时：4h
- 负责人：dev
- 计划：下个 Sprint 第一周

### canvasApi 错误处理
- 问题：fallback 而非 throw Error
- 工时：2h
- 负责人：dev
- 计划：下个 Sprint 第一周

## P2 - 中优先级

### Playwright browser 环境
- 问题：偶发 install 失败
- 工时：1h
- 负责人：tester
- 计划：下个 Sprint 第二周
```

## 验收
```typescript
test('技术债清单每项有责任人和工时', () => {
  expect(existsSync('docs/tech-debt/cleanup-plan.md')).toBe(true);
  const content = readFileSync('docs/tech-debt/cleanup-plan.md', 'utf-8');
  // 每项债务有工时信息
  expect(content).toMatch(/工时：\d+h/);
  // 每项债务有负责人
  expect(content).toMatch(/负责人：/);
  // 有 P1 和 P2 分类
  expect(content).toMatch(/P1/);
  expect(content).toMatch(/P2/);
});
```
