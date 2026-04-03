# Spec: E2 - 回滚 SOP + 功能开关

## 概述
建立 Epic 回滚 SOP，消除 Sprint 1 中「git revert 导致功能丢失」的问题。

## F2.1: 增量修复 SOP

### 规格
- 文档: `docs/process/ROLLBACK_SOP.md`
- 原则: 回滚 ≠ revert，是新 commit 修复问题
- 场景: ≥ 5 个（TS 错误、功能 bug、验收失败、依赖冲突、架构变更）

### 场景列表

| # | 场景 | 操作 |
|---|------|------|
| 1 | TS 错误 | 新 commit 修复类型，不 revert |
| 2 | 功能 bug | 禁用 feature flag + 新 commit 修复 |
| 3 | 验收失败 | 与 PM 对齐后新 Epic 修复 |
| 4 | 依赖冲突 | 新 commit 锁定版本或降级 |
| 5 | 架构变更回退 | 新 commit 还原架构，不删除历史 |

### 验收
```typescript
test('ROLLBACK_SOP.md contains >= 5 scenarios', () => {
  const doc = readFileSync('docs/process/ROLLBACK_SOP.md', 'utf-8');
  const scenarios = doc.match(/^### Scenario \d+/gm) || [];
  expect(scenarios.length).toBeGreaterThanOrEqual(5);
});
```

---

## F2.2: 功能开关模板

### 规格
- 命名: `process.env.NEXT_PUBLIC_FEATURE_<NAME>`
- 使用: `lib/feature-flags.ts` 统一读取
- 默认: 未定义时为 `false`

### 验收
```typescript
// lib/feature-flags.ts
test('feature flag returns boolean', () => {
  expect(typeof isFeatureEnabled('NEXT_PUBLIC_FEATURE_TEST')).toBe('boolean');
});

// 在当前 Epic 中至少使用 1 个
test('current epic uses at least one feature flag', () => {
  const sourceFiles = glob.sync('epic-impl/**/*.{ts,tsx}');
  const hasFlag = sourceFiles.some(f => 
    readFileSync(f, 'utf-8').includes('NEXT_PUBLIC_FEATURE_')
  );
  expect(hasFlag).toBe(true);
});
```

---

## F2.3: DoD 对齐机制

### 规格
- 时机: Epic kickoff 会议
- 参与者: Dev + Tester（+ PM/Architect 如需要）
- 产出: `Epic-{N}-DOD.md` 双方签字（注释形式）
- 验证: Dev 开 PR 时，PR description 必须包含 DoD checklist

### 验收
```typescript
test('Epic kickoff produces signed DoD', () => {
  const dodFile = 'docs/epic/Epic-1-DOD.md';
  expect(existsSync(dodFile)).toBe(true);
  const content = readFileSync(dodFile, 'utf-8');
  // 至少 Dev + Tester 双方确认（通过注释）
  expect(content).toMatch(/Dev:.*Confirmed/s);
  expect(content).toMatch(/Tester:.*Confirmed/s);
});

test('DoD alignment rate >= 80%', () => {
  const epics = getAllEpics();
  const aligned = epics.filter(e => e.dodSigned && e.signatures >= 2);
  expect(aligned.length / epics.length).toBeGreaterThanOrEqual(0.8);
});
```
